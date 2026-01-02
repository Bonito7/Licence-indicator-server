import LicenseDatabase from './database-mongo.js';
import LicenseManager from './license-manager.js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de la licence fixe pour votre produit
const FIXED_LICENSE_KEY = "MQL5-INDICATOR-PROD-2024-V1";

async function initializeLicense() {
    console.log('🔧 Initialisation de la licence...');
    
    const db = new LicenseDatabase();
    const licenseManager = new LicenseManager(db);
    
    // Attendre la connexion MongoDB
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        // Vérifier si la licence existe déjà
        const existing = await db.getLicense(FIXED_LICENSE_KEY);
        
        if (existing) {
            console.log('✅ La licence existe déjà:');
            console.log(`   Clé: ${FIXED_LICENSE_KEY}`);
            console.log(`   Comptes autorisés: ${existing.account_numbers.length}`);
            console.log(`   Max comptes: ${existing.max_accounts}`);
        } else {
            // Créer la licence fixe
            console.log('📝 Création de la licence fixe...');
            
            // Créer directement dans la base de données
            await db.createLicense(
                FIXED_LICENSE_KEY,
                [], // Aucun compte au départ
                999, // Nombre illimité de comptes
                null // Pas d'expiration
            );
            
            console.log('✅ Licence créée avec succès!');
            console.log(`   Clé: ${FIXED_LICENSE_KEY}`);
            console.log('   Cette clé doit être utilisée dans votre indicateur MQL5');
        }
        
        console.log('\n📋 Instructions:');
        console.log('1. Utilisez cette clé dans votre code MQL5:');
        console.log(`   string LICENSE_KEY = "${FIXED_LICENSE_KEY}";`);
        console.log('2. Ouvrez l\'interface admin pour gérer les comptes autorisés');
        console.log('3. Ajoutez les numéros de compte de vos clients');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
    
    process.exit(0);
}

initializeLicense();
