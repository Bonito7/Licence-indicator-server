//+------------------------------------------------------------------+
//|                                              LicenseValidator.mqh |
//|                                  Bibliothèque de validation MQL5 |
//+------------------------------------------------------------------+
#property copyright "License System"
#property version   "1.00"
#property strict

//+------------------------------------------------------------------+
//| Configuration                                                     |
//+------------------------------------------------------------------+
// URL du serveur de validation (à modifier selon votre déploiement)
input string LICENSE_SERVER_URL = "http://localhost:3000/api/validate";

// Clé de licence (à définir dans l'indicateur)
input string LICENSE_KEY = "";

// Intervalle de vérification (en secondes)
input int VALIDATION_INTERVAL = 3600; // 1 heure par défaut

//+------------------------------------------------------------------+
//| Classe de validation de licence                                  |
//+------------------------------------------------------------------+
class CLicenseValidator
{
private:
    string m_licenseKey;
    string m_serverUrl;
    datetime m_lastValidation;
    bool m_isValid;
    string m_errorMessage;
    int m_validationInterval;
    
    // Informations du compte
    string m_accountNumber;
    string m_accountName;
    string m_serverName;
    
public:
    //+------------------------------------------------------------------+
    //| Constructeur                                                      |
    //+------------------------------------------------------------------+
    CLicenseValidator(string licenseKey, string serverUrl = "", int interval = 3600)
    {
        m_licenseKey = licenseKey;
        m_serverUrl = (serverUrl == "") ? LICENSE_SERVER_URL : serverUrl;
        m_validationInterval = interval;
        m_lastValidation = 0;
        m_isValid = false;
        m_errorMessage = "";
        
        // Récupérer les informations du compte
        m_accountNumber = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
        m_accountName = AccountInfoString(ACCOUNT_NAME);
        m_serverName = AccountInfoString(ACCOUNT_SERVER);
    }
    
    //+------------------------------------------------------------------+
    //| Valider la licence                                               |
    //+------------------------------------------------------------------+
    bool Validate(bool forceValidation = false)
    {
        // Vérifier si une validation est nécessaire
        datetime currentTime = TimeCurrent();
        
        if(!forceValidation && m_isValid && (currentTime - m_lastValidation) < m_validationInterval)
        {
            return true; // Utiliser le cache
        }
        
        // Vérifier que la clé de licence est définie
        if(m_licenseKey == "" || m_licenseKey == "VOTRE-CLE-DE-LICENCE")
        {
            m_isValid = false;
            m_errorMessage = "Clé de licence non configurée";
            Print("❌ ERREUR: Veuillez configurer votre clé de licence dans les paramètres");
            return false;
        }
        
        // Préparer les données JSON
        string jsonData = StringFormat(
            "{\"licenseKey\":\"%s\",\"accountNumber\":\"%s\",\"accountName\":\"%s\",\"serverName\":\"%s\"}",
            m_licenseKey,
            m_accountNumber,
            m_accountName,
            m_serverName
        );
        
        // Effectuer la requête HTTP
        char postData[];
        char resultData[];
        string resultHeaders;
        
        StringToCharArray(jsonData, postData, 0, StringLen(jsonData));
        
        int timeout = 5000; // 5 secondes
        int res = WebRequest(
            "POST",
            m_serverUrl,
            "Content-Type: application/json\r\n",
            timeout,
            postData,
            resultData,
            resultHeaders
        );
        
        // Vérifier la réponse
        if(res == -1)
        {
            int errorCode = GetLastError();
            m_isValid = false;
            m_errorMessage = StringFormat("Erreur de connexion au serveur (code: %d)", errorCode);
            
            if(errorCode == 4060)
            {
                Print("❌ ERREUR: L'URL '", m_serverUrl, "' n'est pas autorisée.");
                Print("📝 SOLUTION: Ajoutez cette URL dans MetaTrader:");
                Print("   Outils > Options > Expert Advisors > Autoriser WebRequest pour l'URL: ", m_serverUrl);
            }
            else
            {
                Print("❌ ERREUR: Impossible de contacter le serveur de validation");
                Print("   Code d'erreur: ", errorCode);
            }
            
            return false;
        }
        
        // Parser la réponse JSON
        string response = CharArrayToString(resultData);
        
        // Vérifier si la licence est valide
        if(StringFind(response, "\"valid\":true") >= 0)
        {
            m_isValid = true;
            m_lastValidation = currentTime;
            m_errorMessage = "";
            
            Print("✅ Licence validée avec succès pour le compte ", m_accountNumber);
            
            return true;
        }
        else
        {
            m_isValid = false;
            
            // Extraire le message d'erreur
            int messagePos = StringFind(response, "\"message\":\"");
            if(messagePos >= 0)
            {
                int startPos = messagePos + 11;
                int endPos = StringFind(response, "\"", startPos);
                if(endPos > startPos)
                {
                    m_errorMessage = StringSubstr(response, startPos, endPos - startPos);
                }
            }
            
            if(m_errorMessage == "")
            {
                m_errorMessage = "Licence invalide";
            }
            
            Print("❌ Validation échouée: ", m_errorMessage);
            
            return false;
        }
    }
    
    //+------------------------------------------------------------------+
    //| Vérifier si la licence est valide (utilise le cache)             |
    //+------------------------------------------------------------------+
    bool IsValid()
    {
        return m_isValid;
    }
    
    //+------------------------------------------------------------------+
    //| Obtenir le message d'erreur                                      |
    //+------------------------------------------------------------------+
    string GetErrorMessage()
    {
        return m_errorMessage;
    }
    
    //+------------------------------------------------------------------+
    //| Obtenir les informations du compte                               |
    //+------------------------------------------------------------------+
    string GetAccountInfo()
    {
        return StringFormat(
            "Compte: %s | Nom: %s | Serveur: %s",
            m_accountNumber,
            m_accountName,
            m_serverName
        );
    }
    
    //+------------------------------------------------------------------+
    //| Afficher un message d'erreur sur le graphique                    |
    //+------------------------------------------------------------------+
    void ShowErrorOnChart()
    {
        string objectName = "LicenseError";
        
        // Supprimer l'objet existant
        ObjectDelete(0, objectName);
        
        // Créer un label
        ObjectCreate(0, objectName, OBJ_LABEL, 0, 0, 0);
        ObjectSetInteger(0, objectName, OBJPROP_CORNER, CORNER_LEFT_TOP);
        ObjectSetInteger(0, objectName, OBJPROP_XDISTANCE, 10);
        ObjectSetInteger(0, objectName, OBJPROP_YDISTANCE, 30);
        ObjectSetInteger(0, objectName, OBJPROP_COLOR, clrRed);
        ObjectSetInteger(0, objectName, OBJPROP_FONTSIZE, 12);
        ObjectSetString(0, objectName, OBJPROP_FONT, "Arial Bold");
        
        string message = "🔒 LICENCE INVALIDE: " + m_errorMessage;
        ObjectSetString(0, objectName, OBJPROP_TEXT, message);
        
        ChartRedraw();
    }
    
    //+------------------------------------------------------------------+
    //| Supprimer le message d'erreur du graphique                       |
    //+------------------------------------------------------------------+
    void ClearErrorFromChart()
    {
        ObjectDelete(0, "LicenseError");
        ChartRedraw();
    }
};
