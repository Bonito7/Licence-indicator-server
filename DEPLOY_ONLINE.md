# 🌍 Guide de Déploiement en Ligne (Gratuit)

Pour que votre système de licence fonctionne 24/7 et soit accessible par vos clients partout dans le monde, nous allons le mettre en ligne.

Nous allons utiliser :

1.  **MongoDB Atlas** (Base de données en ligne sécurisée)
2.  **Render.com** (Hébergement du serveur Node.js)

---

## 1. Base de Données (MongoDB Atlas)

Si vous l'avez déjà fait, passez à l'étape 2. Sinon :

1.  Allez sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register)
2.  Inscrivez-vous (gratuit).
3.  Créez un **Cluster gratuit** (Free Shared).
4.  Dans **Database Access**, créez un utilisateur (ex: `admin`) et un mot de passe.
5.  Dans **Network Access**, ajoutez l'IP `0.0.0.0/0` (pour autoriser l'accès depuis n'importe où).
6.  Cliquez sur **Connect** > **Drivers** et copiez votre "Connection String".
    - Elle ressemble à : `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
    - Remplacez `<password>` par votre vrai mot de passe.

---

## 2. Préparer le Code (GitHub)

Le moyen le plus simple de déployer est de mettre votre code sur GitHub.

1.  Créez un compte sur [github.com](https://github.com).
2.  Créez un **Nouveau Repository** (nommez-le `mql5-license-server`).
3.  Sur votre ordinateur, ouvrez un terminal dans votre dossier `Licence_indicator`.
4.  Lancez ces commandes :

```bash
# Initialiser git
git init

# Créer un fichier .gitignore pour ne pas envoyer les fichiers inutiles
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo ".vscode/" >> .gitignore

# Ajouter les fichiers
git add .

# Valider
git commit -m "Premier déploiement"

# Lier à GitHub (remplacez URL par la vôtre)
git branch -M main
git remote add origin https://github.com/VOTRE_USER/mql5-license-server.git
git push -u origin main
```

_(Si vous ne voulez pas utiliser GitHub, Render permet aussi d'upload manuellement, mais c'est moins pratique)_

---

## 3. Hébergement (Render.com)

1.  Allez sur [dashboard.render.com](https://dashboard.render.com/).
2.  Cliquez sur **New +** et choisissez **Web Service**.
3.  Connectez votre compte GitHub et choisissez votre repo `mql5-license-server`.
4.  **Configuration** :
    - **Name**: `mon-serveur-licence` (ou autre)
    - **Region**: Frankfurt (proche de l'Europe)
    - **Root Directory**: `server` (⚠️ IMPORTANT : car votre serveur est dans le sous-dossier server)
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
    - **Plan**: Free
5.  **Variables d'environnement** (Avancé > Environment Variables) - Ajoutez-en 2 :
    - `MONGODB_URI`: Collez votre lien MongoDB Atlas (celui de l'étape 1)
    - `ADMIN_SECRET`: Choisissez un mot de passe compliqué pour votre admin
6.  Cliquez sur **Create Web Service**.

---

## 4. C'est fini ! 🚀

Render va travailler 1-2 minutes. Une fois fini, vous aurez une URL du type :
`https://mon-serveur-licence.onrender.com`

### Comment l'utiliser :

1.  **Interface Admin** :
    Allez sur `https://mon-serveur-licence.onrender.com/admin/admin-multi.html`
2.  **Dans votre Indicateur MQL5** :
    Modifiez la ligne `SERVER_URL` dans votre code :

    ```cpp
    string SERVER_URL = "https://mon-serveur-licence.onrender.com/api/validate";
    ```

C'est tout ! Votre système est maintenant professionnel et mondial.
