# 🚀 Guide de Déploiement

Ce guide vous explique comment déployer le serveur de validation de licences sur différentes plateformes.

## Option 1 : Hébergement Gratuit (Railway)

Railway offre un hébergement gratuit avec HTTPS automatique, parfait pour débuter.

### Étapes

1. **Créer un compte** sur [Railway.app](https://railway.app/)

2. **Préparer le projet**

Créez un fichier `Procfile` à la racine du dossier `server` :

```
web: node server.js
```

3. **Déployer**

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
cd server
railway init

# Déployer
railway up
```

4. **Configurer les variables d'environnement**

Dans le dashboard Railway :

- Settings > Variables
- Ajoutez :
  - `ADMIN_SECRET` : votre clé secrète
  - `NODE_ENV` : production

5. **Obtenir l'URL**

Railway génère automatiquement une URL HTTPS comme :

```
https://votre-projet.up.railway.app
```

### Configuration MongoDB

Ajoutez la variable d'environnement MongoDB :

- `MONGODB_URI` : URL de connexion MongoDB Atlas (voir ci-dessous)

**MongoDB Atlas (Gratuit)** :

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur et autorisez les connexions (0.0.0.0/0)
4. Copiez l'URI de connexion dans Railway

---

## Option 2 : Hébergement Gratuit (Vercel)

Vercel est excellent pour les API Node.js avec HTTPS automatique.

### Étapes

1. **Installer Vercel CLI**

```bash
npm install -g vercel
```

2. **Créer `vercel.json`** dans le dossier `server` :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Déployer**

```bash
cd server
vercel
```

Suivez les instructions à l'écran.

4. **Configurer les variables**

```bash
vercel env add ADMIN_SECRET
```

5. **URL de production**

Vercel génère une URL comme :

```
https://votre-projet.vercel.app
```

### Configuration MongoDB

Ajoutez la variable d'environnement :

```bash
vercel env add MONGODB_URI
```

Utilisez MongoDB Atlas (gratuit) comme base de données cloud.

---

## Option 3 : VPS (Recommandé pour Production)

Un VPS vous donne un contrôle total et une base de données persistante.

### Fournisseurs recommandés

- **Contabo** - ~5€/mois
- **DigitalOcean** - ~6$/mois
- **Hetzner** - ~5€/mois
- **OVH** - ~5€/mois

### Étapes (Ubuntu 22.04)

#### 1. Connexion SSH

```bash
ssh root@votre-ip-serveur
```

#### 2. Installation de Node.js

```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Vérifier
node --version
npm --version
```

#### 3. Installation de PM2 (gestionnaire de processus)

```bash
npm install -g pm2
```

#### 4. Transférer les fichiers

```bash
# Sur votre machine locale
scp -r server root@votre-ip:/root/license-server
```

Ou utilisez Git :

```bash
# Sur le serveur
cd /root
git clone votre-repo.git license-server
cd license-server/server
```

#### 5. Configuration

```bash
cd /root/license-server/server

# Installer les dépendances
npm install --production

# Créer le fichier .env
nano .env
```

Contenu du `.env` :

```env
MONGODB_URI=mongodb://localhost:27017/mql5_licenses
# Ou MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mql5_licenses

PORT=3000
ADMIN_SECRET=votre_cle_super_securisee
NODE_ENV=production
```

#### 6. Démarrer avec PM2

```bash
# Démarrer le serveur
pm2 start server.js --name license-server

# Configurer le démarrage automatique
pm2 startup
pm2 save

# Vérifier le statut
pm2 status
```

#### 7. Configuration du pare-feu

```bash
# Autoriser SSH, HTTP et HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

#### 8. Installer Nginx (reverse proxy)

```bash
apt install -y nginx

# Créer la configuration
nano /etc/nginx/sites-available/license-server
```

Contenu :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer :

```bash
ln -s /etc/nginx/sites-available/license-server /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 9. Installer SSL avec Let's Encrypt

```bash
# Installer Certbot
apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL
certbot --nginx -d votre-domaine.com

# Renouvellement automatique (déjà configuré)
certbot renew --dry-run
```

#### 10. Vérification

Visitez `https://votre-domaine.com` - vous devriez voir :

```json
{
  "message": "Serveur de validation de licences MQL5",
  "version": "1.0.0",
  "status": "online"
}
```

### Maintenance

```bash
# Voir les logs
pm2 logs license-server

# Redémarrer
pm2 restart license-server

# Arrêter
pm2 stop license-server

# Mettre à jour le code
cd /root/license-server/server
git pull
npm install
pm2 restart license-server
```

---

## Configuration DNS

Pour utiliser un nom de domaine :

1. **Acheter un domaine** (Namecheap, Gandi, OVH, etc.)

2. **Configurer les DNS** :

   - Type : `A`
   - Nom : `@` (ou `api` pour un sous-domaine)
   - Valeur : IP de votre serveur
   - TTL : 3600

3. **Attendre la propagation** (5-30 minutes)

---

## Sécurité

### Recommandations importantes

1. **Changez ADMIN_SECRET** - Utilisez une valeur longue et aléatoire
2. **Utilisez HTTPS** - Obligatoire en production
3. **Limitez les accès SSH** - Utilisez des clés SSH au lieu de mots de passe
4. **Mettez à jour régulièrement** - `apt update && apt upgrade`
5. **Surveillez les logs** - Vérifiez régulièrement avec `pm2 logs`
6. **Sauvegardez MongoDB** - Utilisez `mongodump` ou les sauvegardes automatiques d'Atlas

### Sauvegardes MongoDB

#### Option A : MongoDB Atlas (Automatique)

MongoDB Atlas effectue des sauvegardes automatiques quotidiennes (même sur le plan gratuit).

#### Option B : MongoDB Local (VPS)

```bash
# Créer un script de sauvegarde
nano /root/backup-mongodb.sh
```

Contenu :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db mql5_licenses --out /root/backups/mongodb_$DATE
# Garder seulement les 30 dernières sauvegardes
ls -td /root/backups/mongodb_* | tail -n +31 | xargs rm -rf
```

Rendre exécutable et planifier :

```bash
chmod +x /root/backup-mongodb.sh
mkdir -p /root/backups

# Ajouter au crontab (tous les jours à 3h du matin)
crontab -e
# Ajouter : 0 3 * * * /root/backup-mongodb.sh
```

---

## Installation MongoDB (VPS)

Si vous hébergez sur VPS et voulez MongoDB local :

```bash
# Importer la clé GPG MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Ajouter le dépôt MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Installer MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Démarrer MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Vérifier
sudo systemctl status mongod
```

**Recommandation** : Utilisez MongoDB Atlas (gratuit) plutôt qu'une installation locale pour plus de simplicité.

---

## Monitoring

### Avec PM2 (VPS)

```bash
# Interface web de monitoring
pm2 install pm2-server-monit
```

### Avec UptimeRobot (gratuit)

1. Créez un compte sur [UptimeRobot](https://uptimerobot.com/)
2. Ajoutez un monitor HTTP(s) pour votre URL
3. Recevez des alertes par email si le serveur est down

---

## Troubleshooting

### Le serveur ne démarre pas

```bash
# Vérifier les logs
pm2 logs license-server

# Vérifier le port
netstat -tulpn | grep 3000
```

### Erreur de connexion MongoDB

```bash
# Vérifier la connexion MongoDB
cd /root/license-server/server
cat .env | grep MONGODB_URI

# Tester la connexion
node -e "import('mongoose').then(m => m.default.connect(process.env.MONGODB_URI).then(() => console.log('OK')).catch(e => console.error(e)))"
```

### Problème SSL

```bash
# Renouveler le certificat
certbot renew --force-renewal
systemctl restart nginx
```

---

## Coûts estimés

| Solution                | Coût/mois | HTTPS | Base de données    |
| ----------------------- | --------- | ----- | ------------------ |
| Railway + MongoDB Atlas | 0€        | ✅    | ✅ (Atlas gratuit) |
| Vercel + MongoDB Atlas  | 0€        | ✅    | ✅ (Atlas gratuit) |
| VPS + MongoDB Atlas     | ~5€       | ✅    | ✅ (Atlas gratuit) |
| VPS + MongoDB local     | ~5€       | ✅    | ✅ (auto-hébergé)  |

---

**Bon déploiement ! 🚀**
