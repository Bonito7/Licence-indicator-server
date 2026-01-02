import mongoose from 'mongoose';

// Schéma pour les licences
const licenseSchema = new mongoose.Schema({
  license_key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  account_numbers: {
    type: [String],
    default: []
  },
  max_accounts: {
    type: Number,
    required: true,
    default: 1
  },
  expiry_date: {
    type: Date,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Schéma pour les logs de validation
const validationLogSchema = new mongoose.Schema({
  license_key: {
    type: String,
    required: true,
    index: true
  },
  account_number: {
    type: String,
    required: true
  },
  account_name: {
    type: String,
    default: ''
  },
  server_name: {
    type: String,
    default: ''
  },
  success: {
    type: Boolean,
    required: true
  },
  error_message: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

// Modèles
const License = mongoose.model('License', licenseSchema);
const ValidationLog = mongoose.model('ValidationLog', validationLogSchema);

class LicenseDatabase {
  constructor() {
    this.connected = false;
    this.connectToDatabase();
  }

  async connectToDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mql5_licenses';
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      this.connected = true;
      console.log('✅ Connecté à MongoDB');
      console.log(`📦 Base de données: ${mongoose.connection.name}`);
    } catch (error) {
      console.error('❌ Erreur de connexion MongoDB:', error.message);
      console.error('⚠️  Le serveur continuera avec une connexion limitée');
      this.connected = false;
    }
  }

  // Créer une nouvelle licence
  async createLicense(licenseKey, accountNumbers, maxAccounts = 1, expiryDate = null) {
    try {
      const license = new License({
        license_key: licenseKey,
        account_numbers: accountNumbers,
        max_accounts: maxAccounts,
        expiry_date: expiryDate,
        active: true
      });
      
      await license.save();
      return license._id;
    } catch (error) {
      console.error('Erreur création licence:', error);
      throw error;
    }
  }

  // Récupérer une licence par clé
  async getLicense(licenseKey) {
    try {
      const license = await License.findOne({ license_key: licenseKey }).lean();
      if (!license) return null;
      
      // Convertir le format pour compatibilité avec l'ancien code
      return {
        id: license._id.toString(),
        license_key: license.license_key,
        account_numbers: license.account_numbers,
        max_accounts: license.max_accounts,
        expiry_date: license.expiry_date,
        active: license.active ? 1 : 0,
        created_at: license.created_at,
        updated_at: license.updated_at
      };
    } catch (error) {
      console.error('Erreur récupération licence:', error);
      return null;
    }
  }

  // Récupérer toutes les licences
  async getAllLicenses() {
    try {
      const licenses = await License.find().lean();
      
      return licenses.map(license => ({
        id: license._id.toString(),
        license_key: license.license_key,
        account_numbers: license.account_numbers,
        max_accounts: license.max_accounts,
        expiry_date: license.expiry_date,
        active: license.active ? 1 : 0,
        created_at: license.created_at,
        updated_at: license.updated_at
      }));
    } catch (error) {
      console.error('Erreur récupération licences:', error);
      return [];
    }
  }

  // Mettre à jour une licence
  async updateLicense(id, updates) {
    try {
      const updateData = {};
      
      if (updates.accountNumbers !== undefined) {
        updateData.account_numbers = updates.accountNumbers;
      }
      if (updates.maxAccounts !== undefined) {
        updateData.max_accounts = updates.maxAccounts;
      }
      if (updates.expiryDate !== undefined) {
        updateData.expiry_date = updates.expiryDate;
      }
      if (updates.active !== undefined) {
        updateData.active = updates.active;
      }
      
      const license = await License.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).lean();
      
      if (!license) return null;
      
      return {
        id: license._id.toString(),
        license_key: license.license_key,
        account_numbers: license.account_numbers,
        max_accounts: license.max_accounts,
        expiry_date: license.expiry_date,
        active: license.active ? 1 : 0,
        created_at: license.created_at,
        updated_at: license.updated_at
      };
    } catch (error) {
      console.error('Erreur mise à jour licence:', error);
      return null;
    }
  }

  // Supprimer une licence
  async deleteLicense(id) {
    try {
      const result = await License.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error('Erreur suppression licence:', error);
      return false;
    }
  }

  // Ajouter un compte à une licence
  async addAccountToLicense(licenseKey, accountNumber) {
    try {
      const license = await License.findOne({ license_key: licenseKey });
      if (!license) return false;
      
      if (!license.account_numbers.includes(accountNumber)) {
        license.account_numbers.push(accountNumber);
        await license.save();
      }
      
      return true;
    } catch (error) {
      console.error('Erreur ajout compte:', error);
      return false;
    }
  }

  // Logger une validation
  async logValidation(licenseKey, accountNumber, accountName, serverName, success, errorMessage = null) {
    try {
      const log = new ValidationLog({
        license_key: licenseKey,
        account_number: accountNumber,
        account_name: accountName,
        server_name: serverName,
        success: success,
        error_message: errorMessage
      });
      
      await log.save();
      return log._id;
    } catch (error) {
      console.error('Erreur log validation:', error);
      return null;
    }
  }

  // Récupérer les logs de validation
  async getValidationLogs(limit = 100) {
    try {
      const logs = await ValidationLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      return logs.map(log => ({
        id: log._id.toString(),
        license_key: log.license_key,
        account_number: log.account_number,
        account_name: log.account_name,
        server_name: log.server_name,
        success: log.success ? 1 : 0,
        error_message: log.error_message,
        timestamp: log.timestamp
      }));
    } catch (error) {
      console.error('Erreur récupération logs:', error);
      return [];
    }
  }

  // Récupérer les logs pour une licence spécifique
  async getLogsForLicense(licenseKey, limit = 50) {
    try {
      const logs = await ValidationLog.find({ license_key: licenseKey })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      return logs.map(log => ({
        id: log._id.toString(),
        license_key: log.license_key,
        account_number: log.account_number,
        account_name: log.account_name,
        server_name: log.server_name,
        success: log.success ? 1 : 0,
        error_message: log.error_message,
        timestamp: log.timestamp
      }));
    } catch (error) {
      console.error('Erreur récupération logs licence:', error);
      return [];
    }
  }

  // Statistiques
  async getStats() {
    try {
      const totalLicenses = await License.countDocuments();
      const activeLicenses = await License.countDocuments({ active: true });
      const totalValidations = await ValidationLog.countDocuments();
      const successfulValidations = await ValidationLog.countDocuments({ success: true });
      
      return {
        totalLicenses,
        activeLicenses,
        totalValidations,
        successfulValidations,
        successRate: totalValidations > 0 
          ? ((successfulValidations / totalValidations) * 100).toFixed(2) 
          : 0
      };
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      return {
        totalLicenses: 0,
        activeLicenses: 0,
        totalValidations: 0,
        successfulValidations: 0,
        successRate: 0
      };
    }
  }

  close() {
    mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

export default LicenseDatabase;
