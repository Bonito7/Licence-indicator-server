import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import LicenseDatabase from './database-mongo.js';
import LicenseManager from './license-manager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir l'interface Admin de manière statique (plus simple pour le déploiement)
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir les fichiers du dossier parent "admin"
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Rediriger / vers /admin/admin-multi.html par commodité
app.get('/', (req, res) => {
  res.redirect('/admin/admin-multi.html');
});

// Initialiser la base de données et le gestionnaire de licences
const db = new LicenseDatabase();
const licenseManager = new LicenseManager(db);

// Middleware d'authentification pour les routes admin
const authenticateAdmin = (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'];
  
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  
  next();
};

// ==================== ROUTES PUBLIQUES ====================

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'Serveur de validation de licences MQL5',
    version: '1.0.0',
    status: 'online'
  });
});

// Valider une licence (utilisé par l'indicateur MQL5)
app.post('/api/validate', async (req, res) => {
  const { licenseKey, accountNumber, accountName, serverName } = req.body;
  
  if (!licenseKey || !accountNumber) {
    return res.status(400).json({
      valid: false,
      error: 'MISSING_PARAMETERS',
      message: 'Clé de licence et numéro de compte requis'
    });
  }

  try {
    const result = await licenseManager.validateLicense(
      licenseKey,
      accountNumber.toString(),
      accountName || '',
      serverName || ''
    );

    res.json(result);
  } catch (error) {
    console.error('Erreur validation:', error);
    res.status(500).json({ valid: false, error: 'SERVER_ERROR', message: 'Erreur interne du serveur' });
  }
});

// ==================== ROUTES ADMIN ====================

// Obtenir toutes les licences
app.get('/api/licenses', authenticateAdmin, async (req, res) => {
  try {
    const licenses = await licenseManager.getAllLicenses();
    res.json({ success: true, licenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir une licence spécifique
app.get('/api/licenses/:key', authenticateAdmin, async (req, res) => {
  try {
    const license = await licenseManager.getLicenseInfo(req.params.key);
    
    if (!license) {
      return res.status(404).json({ success: false, error: 'Licence introuvable' });
    }
    
    res.json({ success: true, license });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Créer une nouvelle licence
app.post('/api/licenses', authenticateAdmin, async (req, res) => {
  try {
    const { accountNumbers = [], maxAccounts, expiryDate, customKey } = req.body;
    
    // Convertir les numéros de compte en strings
    const accountNumbersStr = accountNumbers.map(num => num.toString());
    
    const license = await licenseManager.createLicense(
      accountNumbersStr,
      maxAccounts,
      expiryDate,
      customKey // Passer la clé personnalisée
    );
    
    res.status(201).json({ success: true, license });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mettre à jour une licence
app.put('/api/licenses/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    
    if (req.body.accountNumbers !== undefined) {
      updates.accountNumbers = req.body.accountNumbers.map(num => num.toString());
    }
    if (req.body.maxAccounts !== undefined) {
      updates.maxAccounts = req.body.maxAccounts;
    }
    if (req.body.expiryDate !== undefined) {
      updates.expiryDate = req.body.expiryDate;
    }
    if (req.body.active !== undefined) {
      updates.active = req.body.active;
    }
    
    await licenseManager.updateLicense(id, updates);
    
    res.json({ success: true, message: 'Licence mise à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Supprimer une licence
app.delete('/api/licenses/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await licenseManager.deleteLicense(id);
    
    res.json({ success: true, message: 'Licence supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir les statistiques
app.get('/api/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await licenseManager.getStatistics();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir les logs de validation
app.get('/api/logs', authenticateAdmin, async (req, res) => {
  try {
    const { licenseKey, limit } = req.query;
    const logs = await licenseManager.getLogs(licenseKey, parseInt(limit) || 100);
    
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur de licences démarré sur le port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  db.close();
  process.exit(0);
});
