import crypto from 'crypto';

class LicenseManager {
  constructor(database) {
    this.db = database;
  }

  // Générer une clé de licence unique
  generateLicenseKey() {
    const prefix = 'MQL5';
    const randomPart = crypto.randomBytes(12).toString('hex').toUpperCase();
    
    // Format: MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
    const key = `${prefix}-${randomPart.match(/.{1,4}/g).join('-')}`;
    
    return key;
  }

  // Créer une nouvelle licence
  async createLicense(accountNumbers = [], maxAccounts = null, expiryDate = null, customKey = null) {
    // Si maxAccounts n'est pas spécifié, utiliser le nombre de comptes fournis
    const max = maxAccounts || accountNumbers.length || 1;
    
    let licenseKey;
    
    if (customKey) {
      // Utiliser la clé personnalisée
      licenseKey = customKey;
      // Vérifier si elle existe déjà
      if (await this.db.getLicense(licenseKey)) {
        throw new Error('Cette clé de licence existe déjà');
      }
    } else {
      // Générer une clé unique aléatoire
      let attempts = 0;
      do {
        licenseKey = this.generateLicenseKey();
        attempts++;
        if (attempts > 10) {
          throw new Error('Impossible de générer une clé unique');
        }
      } while (await this.db.getLicense(licenseKey));
    }

    // Créer la licence
    const licenseId = await this.db.createLicense(licenseKey, accountNumbers, max, expiryDate);
    
    return {
      id: licenseId,
      licenseKey,
      accountNumbers,
      maxAccounts: max,
      expiryDate
    };
  }

  // Valider une licence
  async validateLicense(licenseKey, accountNumber, accountName = '', serverName = '') {
    const license = await this.db.getLicense(licenseKey);
    
    // Vérifier si la licence existe
    if (!license) {
      await this.db.logValidation(licenseKey, accountNumber, accountName, serverName, false, 'Licence introuvable');
      return {
        valid: false,
        error: 'LICENSE_NOT_FOUND',
        message: 'Cette clé de licence n\'existe pas'
      };
    }

    // Vérifier si la licence est active
    if (!license.active) {
      await this.db.logValidation(licenseKey, accountNumber, accountName, serverName, false, 'Licence désactivée');
      return {
        valid: false,
        error: 'LICENSE_INACTIVE',
        message: 'Cette licence a été désactivée'
      };
    }

    // Vérifier la date d'expiration
    if (license.expiry_date) {
      const expiryDate = new Date(license.expiry_date);
      const now = new Date();
      
      if (now > expiryDate) {
        await this.db.logValidation(licenseKey, accountNumber, accountName, serverName, false, 'Licence expirée');
        return {
          valid: false,
          error: 'LICENSE_EXPIRED',
          message: `Cette licence a expiré le ${expiryDate.toLocaleDateString('fr-FR')}`
        };
      }
    }

    // Vérifier si le compte est autorisé
    const accountNumbers = license.account_numbers || [];
    const isAccountAuthorized = accountNumbers.includes(accountNumber);

    // Si le compte n'est pas dans la liste
    if (!isAccountAuthorized) {
      // STRICT MODE: On refuse l'accès si le compte n'est pas autorisé
      // Le client doit fournir son numéro de compte à l'admin pour l'ajouter manuellement
      await this.db.logValidation(licenseKey, accountNumber, accountName, serverName, false, 'Compte non autorisé (Restriction active)');
      
      return {
        valid: false,
        error: 'ACCOUNT_NOT_AUTHORIZED',
        message: `Compte ${accountNumber} non autorisé. Contactez le support pour l'activer.`,
        accountsUsed: accountNumbers
      };
    }

    // Tout est OK
    await this.db.logValidation(licenseKey, accountNumber, accountName, serverName, true, null);
    
    return {
      valid: true,
      message: 'Licence valide',
      license: {
        key: licenseKey,
        accountsUsed: accountNumbers.length,
        maxAccounts: license.max_accounts,
        expiryDate: license.expiry_date
      }
    };
  }

  // Obtenir les informations d'une licence
  async getLicenseInfo(licenseKey) {
    const license = await this.db.getLicense(licenseKey);
    if (!license) return null;

    return {
      id: license.id,
      key: license.license_key,
      accountNumbers: license.account_numbers,
      maxAccounts: license.max_accounts,
      active: license.active === 1,
      expiryDate: license.expiry_date,
      createdAt: license.created_at,
      updatedAt: license.updated_at
    };
  }

  // Lister toutes les licences
  async getAllLicenses() {
    const licenses = await this.db.getAllLicenses();
    return licenses.map(license => ({
      id: license.id,
      key: license.license_key,
      accountNumbers: license.account_numbers,
      maxAccounts: license.max_accounts,
      active: license.active === 1,
      expiryDate: license.expiry_date,
      createdAt: license.created_at,
      updatedAt: license.updated_at
    }));
  }

  // Activer/Désactiver une licence
  async toggleLicense(licenseId, active) {
    return await this.db.updateLicense(licenseId, { active });
  }

  // Supprimer une licence
  async deleteLicense(licenseId) {
    return await this.db.deleteLicense(licenseId);
  }

  // Mettre à jour une licence
  async updateLicense(licenseId, updates) {
    return await this.db.updateLicense(licenseId, updates);
  }

  // Obtenir les statistiques
  async getStatistics() {
    return await this.db.getStats();
  }

  // Obtenir les logs
  async getLogs(licenseKey = null, limit = 100) {
    if (licenseKey) {
      return await this.db.getLogsForLicense(licenseKey, limit);
    }
    return await this.db.getValidationLogs(limit);
  }
}

export default LicenseManager;
