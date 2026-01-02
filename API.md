# 📡 Documentation API - Système de Licence MQL5

## Base URL

```
http://localhost:3000/api
```

En production, remplacez par votre URL de serveur.

## Authentification

Les endpoints admin nécessitent l'en-tête suivant :

```
X-Admin-Secret: votre_cle_secrete
```

## Endpoints

### 🔓 Public

#### Valider une licence

Utilisé par les indicateurs MQL5 pour vérifier la validité d'une licence.

**Endpoint** : `POST /api/validate`

**Headers** :

```
Content-Type: application/json
```

**Body** :

```json
{
  "licenseKey": "MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
  "accountNumber": "12345678",
  "accountName": "Nom du compte",
  "serverName": "Broker-Server"
}
```

**Réponse succès** :

```json
{
  "valid": true,
  "message": "Licence valide",
  "license": {
    "key": "MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
    "accountsUsed": 1,
    "maxAccounts": 3,
    "expiryDate": "2025-12-31"
  }
}
```

**Réponse échec** :

```json
{
  "valid": false,
  "error": "LICENSE_NOT_FOUND",
  "message": "Cette clé de licence n'existe pas"
}
```

**Codes d'erreur** :

- `LICENSE_NOT_FOUND` - Clé de licence inexistante
- `LICENSE_INACTIVE` - Licence désactivée
- `LICENSE_EXPIRED` - Licence expirée
- `MAX_ACCOUNTS_REACHED` - Limite de comptes atteinte
- `MISSING_PARAMETERS` - Paramètres manquants

---

### 🔒 Admin

Tous les endpoints suivants nécessitent l'authentification admin.

#### Obtenir toutes les licences

**Endpoint** : `GET /api/licenses`

**Headers** :

```
X-Admin-Secret: votre_cle_secrete
```

**Réponse** :

```json
{
  "success": true,
  "licenses": [
    {
      "id": 1,
      "key": "MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
      "accountNumbers": ["12345", "67890"],
      "maxAccounts": 3,
      "active": true,
      "expiryDate": "2025-12-31",
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    }
  ]
}
```

---

#### Obtenir une licence spécifique

**Endpoint** : `GET /api/licenses/:key`

**Paramètres** :

- `key` - Clé de licence

**Headers** :

```
X-Admin-Secret: votre_cle_secrete
```

**Réponse** :

```json
{
  "success": true,
  "license": {
    "id": 1,
    "key": "MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
    "accountNumbers": ["12345"],
    "maxAccounts": 1,
    "active": true,
    "expiryDate": null,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  }
}
```

---

#### Créer une licence

**Endpoint** : `POST /api/licenses`

**Headers** :

```
Content-Type: application/json
X-Admin-Secret: votre_cle_secrete
```

**Body** :

```json
{
  "accountNumbers": ["12345", "67890"],
  "maxAccounts": 3,
  "expiryDate": "2025-12-31"
}
```

**Paramètres** :

- `accountNumbers` (array, optionnel) - Liste des comptes autorisés
- `maxAccounts` (number, optionnel) - Nombre max de comptes (défaut: 1)
- `expiryDate` (string, optionnel) - Date d'expiration au format ISO

**Réponse** :

```json
{
  "success": true,
  "license": {
    "id": 1,
    "licenseKey": "MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
    "accountNumbers": ["12345", "67890"],
    "maxAccounts": 3,
    "expiryDate": "2025-12-31"
  }
}
```

---

#### Modifier une licence

**Endpoint** : `PUT /api/licenses/:id`

**Paramètres** :

- `id` - ID de la licence

**Headers** :

```
Content-Type: application/json
X-Admin-Secret: votre_cle_secrete
```

**Body** :

```json
{
  "accountNumbers": ["12345", "67890", "11111"],
  "maxAccounts": 5,
  "expiryDate": "2026-12-31",
  "active": true
}
```

**Tous les champs sont optionnels**

**Réponse** :

```json
{
  "success": true,
  "message": "Licence mise à jour"
}
```

---

#### Supprimer une licence

**Endpoint** : `DELETE /api/licenses/:id`

**Paramètres** :

- `id` - ID de la licence

**Headers** :

```
X-Admin-Secret: votre_cle_secrete
```

**Réponse** :

```json
{
  "success": true,
  "message": "Licence supprimée"
}
```

---

#### Obtenir les statistiques

**Endpoint** : `GET /api/stats`

**Headers** :

```
X-Admin-Secret: votre_cle_secrete
```

**Réponse** :

```json
{
  "success": true,
  "stats": {
    "totalLicenses": 10,
    "activeLicenses": 8,
    "totalValidations": 1523,
    "successfulValidations": 1498,
    "successRate": "98.36"
  }
}
```

---

#### Obtenir les logs de validation

**Endpoint** : `GET /api/logs`

**Query Parameters** :

- `licenseKey` (optionnel) - Filtrer par clé de licence
- `limit` (optionnel) - Nombre de logs à retourner (défaut: 100)

**Headers** :

```
X-Admin-Secret: votre_cle_secrete
```

**Exemple** :

```
GET /api/logs?licenseKey=MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX&limit=50
```

**Réponse** :

```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "license_key": "MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
      "account_number": "12345",
      "account_name": "Compte Demo",
      "server_name": "Broker-Server",
      "success": 1,
      "error_message": null,
      "timestamp": "2026-01-01T12:00:00.000Z"
    }
  ]
}
```

---

## Exemples d'utilisation

### cURL

#### Valider une licence

```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
    "accountNumber": "12345",
    "accountName": "Mon Compte",
    "serverName": "Broker-Server"
  }'
```

#### Créer une licence

```bash
curl -X POST http://localhost:3000/api/licenses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: votre_cle_secrete" \
  -d '{
    "accountNumbers": [],
    "maxAccounts": 1,
    "expiryDate": null
  }'
```

#### Lister les licences

```bash
curl -X GET http://localhost:3000/api/licenses \
  -H "X-Admin-Secret: votre_cle_secrete"
```

### JavaScript (Fetch)

```javascript
// Valider une licence
const response = await fetch("http://localhost:3000/api/validate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    licenseKey: "MQL5-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
    accountNumber: "12345",
    accountName: "Mon Compte",
    serverName: "Broker-Server",
  }),
});

const result = await response.json();
console.log(result);
```

### MQL5

```mql5
// Préparer les données
string jsonData = StringFormat(
    "{\"licenseKey\":\"%s\",\"accountNumber\":\"%s\",\"accountName\":\"%s\",\"serverName\":\"%s\"}",
    LICENSE_KEY,
    IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)),
    AccountInfoString(ACCOUNT_NAME),
    AccountInfoString(ACCOUNT_SERVER)
);

// Convertir en tableau de caractères
char postData[];
char resultData[];
string resultHeaders;
StringToCharArray(jsonData, postData, 0, StringLen(jsonData));

// Effectuer la requête
int res = WebRequest(
    "POST",
    "http://localhost:3000/api/validate",
    "Content-Type: application/json\r\n",
    5000,
    postData,
    resultData,
    resultHeaders
);

// Parser la réponse
string response = CharArrayToString(resultData);
Print(response);
```

---

## Codes de statut HTTP

- `200` - Succès
- `201` - Créé (nouvelle licence)
- `400` - Requête invalide
- `401` - Non autorisé (clé admin invalide)
- `404` - Non trouvé
- `500` - Erreur serveur

---

## Notes importantes

1. **Sécurité** : En production, utilisez toujours HTTPS
2. **Rate Limiting** : Considérez l'ajout de limites de taux pour éviter les abus
3. **Cache** : Les indicateurs MQL5 utilisent un cache local pour réduire les requêtes
4. **Logs** : Les logs sont automatiquement créés pour chaque validation

---

## Support

Pour toute question sur l'API, consultez le README.md principal ou les exemples fournis.
