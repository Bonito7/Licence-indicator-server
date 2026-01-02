# 🔐 Système de Licence pour Indicateurs MQL5

Un système complet de protection par licence pour vos indicateurs MetaTrader 5, avec validation serveur, gestion multi-comptes et interface d'administration moderne.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Déploiement](#déploiement)
- [FAQ](#faq)

## ✨ Fonctionnalités

- ✅ **Validation serveur** - Protection robuste via API REST
- ✅ **Licences mono et multi-comptes** - Flexibilité totale
- ✅ **Auto-assignation** - Les comptes s'ajoutent automatiquement jusqu'à la limite
- ✅ **Dates d'expiration** - Contrôle temporel des licences
- ✅ **Interface admin moderne** - Gestion facile via navigateur web
- ✅ **Logs de validation** - Suivi complet de l'utilisation
- ✅ **Cache intelligent** - Réduit les requêtes réseau
- ✅ **Messages d'erreur clairs** - Facilite le support client

## 🏗️ Architecture

```
┌─────────────────┐
│  Indicateur MQL5│
│  (Client)       │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Serveur Node.js│
│  (Validation)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Base MongoDB   │◄────►│  Interface Admin│
│  (Licences)     │      │  (Web)          │
└─────────────────┘      └─────────────────┘
```

## 📦 Installation

### 1. Prérequis

- **Node.js** (version 18 ou supérieure) - [Télécharger](https://nodejs.org/)
- **MongoDB** - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratuit) ou installation locale
- **MetaTrader 5** - [Télécharger](https://www.metatrader5.com/)
- **Git** (optionnel) - Pour cloner le projet

### 2. Installation du serveur

```bash
# Naviguer vers le dossier serveur
cd server

# Installer les dépendances
npm install

# Créer le fichier de configuration
copy .env.example .env
```

### 3. Configuration MongoDB

#### Option A : MongoDB Atlas (Gratuit - Recommandé)

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur de base de données
4. Autorisez votre adresse IP (ou 0.0.0.0/0 pour tous)
5. Récupérez votre URI de connexion

#### Option B : MongoDB Local

```bash
# Installation sur Windows avec Chocolatey
choco install mongodb

# Ou téléchargez depuis https://www.mongodb.com/try/download/community
```

### 4. Configuration du serveur

Éditez le fichier `server/.env` :

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mql5_licenses

# Ou MongoDB local
# MONGODB_URI=mongodb://localhost:27017/mql5_licenses

PORT=3000
ADMIN_SECRET=votre_cle_secrete_super_securisee
NODE_ENV=development
```

⚠️ **IMPORTANT** :

- Changez `ADMIN_SECRET` par une valeur unique et sécurisée !
- Remplacez `username`, `password` et `cluster` par vos identifiants MongoDB Atlas

### 4. Démarrer le serveur

```bash
# En mode développement
npm run dev

# En mode production
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 🚀 Utilisation

### Interface Admin

1. Ouvrez `admin/index.html` dans votre navigateur
2. Connectez-vous avec votre `ADMIN_SECRET`
3. Créez des licences selon vos besoins

#### Créer une licence mono-compte

- **Numéros de compte** : Laissez vide
- **Nombre max de comptes** : 1
- **Date d'expiration** : Optionnel

Le premier compte qui utilisera cette licence sera automatiquement autorisé.

#### Créer une licence multi-comptes

- **Numéros de compte** : Laissez vide ou spécifiez des comptes
- **Nombre max de comptes** : 3 (ou le nombre souhaité)
- **Date d'expiration** : Optionnel

Les comptes s'ajouteront automatiquement jusqu'à la limite.

### Intégrer dans votre indicateur

1. **Copiez la bibliothèque** `Include/LicenseValidator.mqh` dans votre dossier `MQL5/Include/`

2. **Modifiez votre indicateur** :

```mql5
#include <LicenseValidator.mqh>

// Paramètres
input string LICENSE_KEY = "VOTRE-CLE-DE-LICENCE";
input string SERVER_URL = "https://votre-serveur.com/api/validate";

// Variable globale
CLicenseValidator* licenseValidator;

int OnInit()
{
    // Créer et valider
    licenseValidator = new CLicenseValidator(LICENSE_KEY, SERVER_URL);

    if(!licenseValidator.Validate(true))
    {
        Print("Licence invalide: ", licenseValidator.GetErrorMessage());
        licenseValidator.ShowErrorOnChart();
        return INIT_FAILED;
    }

    // Votre code d'initialisation...
    return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
    if(licenseValidator != NULL)
    {
        delete licenseValidator;
    }
}
```

3. **Autorisez l'URL dans MetaTrader** :
   - Outils > Options > Expert Advisors
   - Cochez "Autoriser WebRequest pour les URL suivantes"
   - Ajoutez : `https://votre-serveur.com/api/validate`

### Distribuer votre indicateur

1. **Compilez** votre indicateur dans MetaEditor
2. **Créez une licence** via l'interface admin
3. **Envoyez au client** :
   - Le fichier `.ex5` compilé
   - La clé de licence
   - L'URL du serveur (si différente)
   - Instructions pour autoriser l'URL

## 🌐 Déploiement

### Option 1 : Hébergement gratuit (Vercel/Railway)

Consultez [DEPLOYMENT.md](DEPLOYMENT.md) pour les instructions détaillées.

**Avantages** :

- ✅ Gratuit
- ✅ HTTPS automatique
- ✅ Déploiement facile

**Limitations** :

- ⚠️ Limites de requêtes
- ⚠️ Nécessite MongoDB Atlas ou autre service MongoDB cloud

### Option 2 : VPS (Recommandé pour production)

**Avantages** :

- ✅ Contrôle total
- ✅ MongoDB persistant et performant
- ✅ Pas de limites

**Coût** : ~5-10€/mois

Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour la configuration VPS.

## 📊 API Endpoints

Consultez [API.md](API.md) pour la documentation complète de l'API.

### Endpoints principaux

- `POST /api/validate` - Valider une licence (public)
- `GET /api/licenses` - Liste des licences (admin)
- `POST /api/licenses` - Créer une licence (admin)
- `PUT /api/licenses/:id` - Modifier une licence (admin)
- `DELETE /api/licenses/:id` - Supprimer une licence (admin)
- `GET /api/stats` - Statistiques (admin)
- `GET /api/logs` - Logs de validation (admin)

## ❓ FAQ

### Comment fonctionne l'auto-assignation ?

Quand un compte non autorisé utilise une licence :

- Si le nombre de comptes < limite : le compte est ajouté automatiquement ✅
- Si le nombre de comptes = limite : accès refusé ❌

### Puis-je changer le nombre de comptes après création ?

Oui ! Utilisez l'interface admin pour modifier `maxAccounts` à tout moment.

### Que se passe-t-il si le serveur est hors ligne ?

L'indicateur utilise un cache. Si la dernière validation était réussie et récente (< 1 heure par défaut), l'indicateur continue de fonctionner.

### Comment désactiver temporairement une licence ?

Dans l'interface admin, cliquez sur l'icône 🔒 pour désactiver/réactiver.

### Les clés de licence sont-elles sécurisées ?

Oui :

- Générées aléatoirement (cryptographiquement sûr)
- Format : `MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`
- Uniques garanties

### Comment voir qui utilise mes licences ?

Consultez l'onglet "Logs de validation" dans l'interface admin. Vous verrez :

- Date/heure de chaque validation
- Numéro de compte
- Serveur du broker
- Succès/échec

## 🛠️ Support

### Problèmes courants

**"L'URL n'est pas autorisée" (erreur 4060)**

- Solution : Autorisez l'URL dans MetaTrader (voir section Utilisation)

**"Impossible de contacter le serveur"**

- Vérifiez que le serveur est démarré
- Vérifiez l'URL dans les paramètres
- Vérifiez votre connexion internet

**"Clé secrète invalide" (interface admin)**

- Vérifiez que vous utilisez la bonne valeur de `ADMIN_SECRET`
- Vérifiez le fichier `.env` du serveur

## 📝 Licence

Ce système est fourni tel quel. Vous êtes libre de l'utiliser et de le modifier pour vos besoins.

## 🤝 Contribution

N'hésitez pas à améliorer ce système et à partager vos modifications !

---

**Bon trading ! 📈**
