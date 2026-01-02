import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LicenseDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, 'licenses.json');
    this.logsPath = path.join(__dirname, 'logs.json');
    this.initDatabase();
  }

  initDatabase() {
    // Créer le fichier de licences s'il n'existe pas
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify({ licenses: [], nextId: 1 }, null, 2));
    }
    
    // Créer le fichier de logs s'il n'existe pas
    if (!fs.existsSync(this.logsPath)) {
      fs.writeFileSync(this.logsPath, JSON.stringify({ logs: [], nextId: 1 }, null, 2));
    }
  }

  readData() {
    const data = fs.readFileSync(this.dbPath, 'utf8');
    return JSON.parse(data);
  }

  writeData(data) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
  }

  readLogs() {
    const data = fs.readFileSync(this.logsPath, 'utf8');
    return JSON.parse(data);
  }

  writeLogs(data) {
    fs.writeFileSync(this.logsPath, JSON.stringify(data, null, 2));
  }

  // Créer une nouvelle licence
  createLicense(licenseKey, accountNumbers, maxAccounts = 1, expiryDate = null) {
    const data = this.readData();
    
    const license = {
      id: data.nextId++,
      license_key: licenseKey,
      account_numbers: accountNumbers,
      max_accounts: maxAccounts,
      expiry_date: expiryDate,
      active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    data.licenses.push(license);
    this.writeData(data);
    
    return license.id;
  }

  // Récupérer une licence par clé
  getLicense(licenseKey) {
    const data = this.readData();
    return data.licenses.find(l => l.license_key === licenseKey);
  }

  // Récupérer toutes les licences
  getAllLicenses() {
    const data = this.readData();
    return data.licenses;
  }

  // Mettre à jour une licence
  updateLicense(id, updates) {
    const data = this.readData();
    const index = data.licenses.findIndex(l => l.id === id);
    
    if (index === -1) return null;
    
    if (updates.accountNumbers !== undefined) {
      data.licenses[index].account_numbers = updates.accountNumbers;
    }
    if (updates.maxAccounts !== undefined) {
      data.licenses[index].max_accounts = updates.maxAccounts;
    }
    if (updates.expiryDate !== undefined) {
      data.licenses[index].expiry_date = updates.expiryDate;
    }
    if (updates.active !== undefined) {
      data.licenses[index].active = updates.active ? 1 : 0;
    }
    
    data.licenses[index].updated_at = new Date().toISOString();
    
    this.writeData(data);
    return data.licenses[index];
  }

  // Supprimer une licence
  deleteLicense(id) {
    const data = this.readData();
    const index = data.licenses.findIndex(l => l.id === id);
    
    if (index === -1) return false;
    
    data.licenses.splice(index, 1);
    this.writeData(data);
    return true;
  }

  // Ajouter un compte à une licence
  addAccountToLicense(licenseKey, accountNumber) {
    const license = this.getLicense(licenseKey);
    if (!license) return false;
    
    if (!license.account_numbers.includes(accountNumber)) {
      license.account_numbers.push(accountNumber);
      this.updateLicense(license.id, { accountNumbers: license.account_numbers });
    }
    
    return true;
  }

  // Logger une validation
  logValidation(licenseKey, accountNumber, accountName, serverName, success, errorMessage = null) {
    const logsData = this.readLogs();
    
    const log = {
      id: logsData.nextId++,
      license_key: licenseKey,
      account_number: accountNumber,
      account_name: accountName,
      server_name: serverName,
      success: success ? 1 : 0,
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    };
    
    logsData.logs.push(log);
    this.writeLogs(logsData);
    
    return log.id;
  }

  // Récupérer les logs de validation
  getValidationLogs(limit = 100) {
    const logsData = this.readLogs();
    return logsData.logs.slice(-limit).reverse();
  }

  // Récupérer les logs pour une licence spécifique
  getLogsForLicense(licenseKey, limit = 50) {
    const logsData = this.readLogs();
    const filtered = logsData.logs.filter(l => l.license_key === licenseKey);
    return filtered.slice(-limit).reverse();
  }

  // Statistiques
  getStats() {
    const data = this.readData();
    const logsData = this.readLogs();
    
    const totalLicenses = data.licenses.length;
    const activeLicenses = data.licenses.filter(l => l.active === 1).length;
    const totalValidations = logsData.logs.length;
    const successfulValidations = logsData.logs.filter(l => l.success === 1).length;
    
    return {
      totalLicenses,
      activeLicenses,
      totalValidations,
      successfulValidations,
      successRate: totalValidations > 0 ? (successfulValidations / totalValidations * 100).toFixed(2) : 0
    };
  }

  close() {
    // Rien à faire pour JSON
  }
}

export default LicenseDatabase;
