//+------------------------------------------------------------------+
//|              TrendCatcher Pro - DASHBOARD MULTILINGUE           |
//|                    EMA 2/9 - SIGNALS SIMPLES                    |
//+------------------------------------------------------------------+
#property copyright "TrendCatcher Pro Multilingual"
#property version   "3.0"
#property indicator_chart_window
#property indicator_buffers 4
#property indicator_plots   2

//--- Définition des propriétés des plots
#property indicator_type1   DRAW_ARROW
#property indicator_color1  clrLime
#property indicator_width1  3

#property indicator_type2   DRAW_ARROW
#property indicator_color2  clrRed
#property indicator_width2  3

// ==========================================
// 1. DÉFINITIONS TYPES (Enums & Structs)
// ==========================================

//--- Table de traduction multilingue
enum ENUM_LANGUAGE
{
   LANG_FRENCH = 0,    // Français
   LANG_ENGLISH = 1,   // English
   LANG_SPANISH = 2,   // Español
   LANG_GERMAN = 3,    // Deutsch
   LANG_ITALIAN = 4    // Italiano
};

struct SLanguageTexts
{
   string title;
   string timeframe;
   string trendStrength;
   string emaStatus;
   string distance;
   string signal;
   string strong;
   string medium;
   string weak;
   string bullish;
   string bearish;
   string analyzing;
   string buySignal;
   string sellSignal;
   string invalidLicense;
};

// ==========================================
// 2. INPUTS (Paramètres)
// ==========================================

input string            LICENSE_KEY = "TRENDCATCHER_LICENCE_VALIDATOR"; // 🔑 CLÉ DE LICENCE
input int               EMA_Fast = 2;            // Fast EMA Period
input int               EMA_Slow = 9;            // Slow EMA Period
input bool              ShowSignals = true;      // Show Signals
input bool              ShowDashboard = true;    // Show Dashboard
input ENUM_LANGUAGE     Language = LANG_FRENCH;  // Language

//--- URL Serveur de validation
// ⚠️ IMPORTANT : Mettez votre URL Render ici
//string SERVER_URL = "http://localhost:3000/api/validate"; 
string SERVER_URL = "https://licence-indicator-server.onrender.com/api/validate";

// ==========================================
// 3. CLASSE VALIDATEUR (Intégrée)
// ==========================================

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
    CLicenseValidator(string licenseKey, string serverUrl, int interval = 3600)
    {
        // Nettoyage de la clé (suppression espaces inutiles)
        string trimmedKey = licenseKey;
        StringTrimLeft(trimmedKey);
        StringTrimRight(trimmedKey);
        
        m_licenseKey = trimmedKey;
        m_serverUrl = serverUrl;
        m_validationInterval = interval;
        m_lastValidation = 0;
        m_isValid = false;
        m_errorMessage = "";
        
        m_accountNumber = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
        m_accountName = AccountInfoString(ACCOUNT_NAME);
        m_serverName = AccountInfoString(ACCOUNT_SERVER);
        
        Print("🔧 Init Validator | Key: '", m_licenseKey, "' | URL: ", m_serverUrl);
    }
    
    bool Validate(bool forceValidation = false)
    {
        datetime currentTime = TimeCurrent();
        
        if(!forceValidation && m_isValid && (currentTime - m_lastValidation) < m_validationInterval)
            return true;
        
        if(m_licenseKey == "")
        {
            m_isValid = false;
            m_errorMessage = "Clé manquante";
            return false;
        }
        
        string jsonData = StringFormat(
            "{\"licenseKey\":\"%s\",\"accountNumber\":\"%s\",\"accountName\":\"%s\",\"serverName\":\"%s\"}",
            m_licenseKey, m_accountNumber, m_accountName, m_serverName
        );
        
        char postData[];
        char resultData[];
        string resultHeaders;
        StringToCharArray(jsonData, postData, 0, StringLen(jsonData));
        
        int res = WebRequest("POST", m_serverUrl, "Content-Type: application/json\r\n", 5000, postData, resultData, resultHeaders);
        
        if(res == -1)
        {
            int errorCode = GetLastError();
            m_isValid = false;
            m_errorMessage = StringFormat("Erreur Connexion (%d)", errorCode);
            
            if(errorCode == 4060)
            {
               m_errorMessage = "URL Non Autorisée (4060)";
               Print("❌ ERREUR: URL non autorisée dans MT5. Ajoutez: ", m_serverUrl);
            }
            return false;
        }
        
        string response = CharArrayToString(resultData);
        
        if(StringFind(response, "\"valid\":true") >= 0)
        {
            m_isValid = true;
            m_lastValidation = currentTime;
            m_errorMessage = "";
            return true;
        }
        else
        {
            m_isValid = false;
            m_errorMessage = "Licence invalide";
             int msgPos = StringFind(response, "\"message\":\"");
            if(msgPos >= 0) {
                int start = msgPos + 11;
                int end = StringFind(response, "\"", start);
                if(end > start) m_errorMessage = StringSubstr(response, start, end - start);
            }
            return false;
        }
    }
    
    string GetErrorMessage() { return m_errorMessage; }
};

// ==========================================
// 4. VARIABLES GLOBALES
// ==========================================

//--- Buffers
double BuyBuffer[];
double SellBuffer[];
double FastEMA[];
double SlowEMA[];

//--- Handles
int fastEMA, slowEMA;

//--- Variables pour le tableau de bord
string dashboardPrefix = "Dashboard_";
color bgColor = C'30,30,40'; // Couleur de fond sombre
int dashboardWidth = 260;
int dashboardHeight = 190;
bool isLicenseValid = false; // Variable Globale Licence

CLicenseValidator* licenseValidator; // Pointeur validateur
SLanguageTexts texts;
ENUM_LANGUAGE currentLanguage;

// ==========================================
// 5. FONCTIONS
// ==========================================

//+------------------------------------------------------------------+
//| Initialise les textes selon la langue                           |
//+------------------------------------------------------------------+
void InitLanguageTexts(ENUM_LANGUAGE lang)
{
   currentLanguage = lang;
   
   switch(lang)
   {
      case LANG_FRENCH: // Français
         texts.title = "🚀 TRENDCATCHER PRO\n📊 EMA " + IntegerToString(EMA_Fast) + "/" + IntegerToString(EMA_Slow);
         texts.timeframe = "⏰ Periode: ";
         texts.trendStrength = "📈 Force Tendance: ";
         texts.emaStatus = "🔄 EMA Status: ";
         texts.distance = "📏 Distance: ";
         texts.signal = "🎯 Dernier Signal: ";
         texts.strong = "🟢 FORTE";
         texts.medium = "🟡 MOYENNE";
         texts.weak = "🔴 FAIBLE";
         texts.bullish = "🟢 HAUSSIER";
         texts.bearish = "🔴 BAISSIER";
         texts.analyzing = "Analyse...";
         texts.buySignal = "ACHAT";
         texts.sellSignal = "VENTE";
         texts.invalidLicense = "🔒 LICENCE INVALIDE\nContactez vendeur";
         break;
         
      case LANG_ENGLISH: // English
         texts.title = "🚀 TRENDCATCHER PRO\n📊 EMA " + IntegerToString(EMA_Fast) + "/" + IntegerToString(EMA_Slow);
         texts.timeframe = "⏰ Timeframe: ";
         texts.trendStrength = "📈 Trend Strength: ";
         texts.emaStatus = "🔄 EMA Status: ";
         texts.distance = "📏 Distance: ";
         texts.signal = "🎯 Last Signal: ";
         texts.strong = "🟢 STRONG";
         texts.medium = "🟡 MEDIUM";
         texts.weak = "🔴 WEAK";
         texts.bullish = "🟢 BULLISH";
         texts.bearish = "🔴 BEARISH";
         texts.analyzing = "Analyzing...";
         texts.buySignal = "BUY";
         texts.sellSignal = "SELL";
         texts.invalidLicense = "🔒 INVALID LICENSE\nContact seller";
         break;
         
      default: // Autres langues par défaut
         texts.title = "🚀 TRENDCATCHER PRO\n📊 EMA " + IntegerToString(EMA_Fast) + "/" + IntegerToString(EMA_Slow);
         texts.timeframe = "⏰ Timeframe: ";
         texts.trendStrength = "📈 Trend Strength: ";
         texts.emaStatus = "🔄 EMA Status: ";
         texts.distance = "📏 Distance: ";
         texts.signal = "🎯 Last Signal: ";
         texts.strong = "🟢 STRONG";
         texts.medium = "🟡 MEDIUM";
         texts.weak = "🔴 WEAK";
         texts.bullish = "🟢 BULLISH";
         texts.bearish = "🔴 BEARISH";
         texts.analyzing = "Analyzing...";
         texts.buySignal = "BUY";
         texts.sellSignal = "SELL";
         texts.invalidLicense = "🔒 INVALID LICENSE";
         break;
   }
}

//+------------------------------------------------------------------+
//| Custom indicator initialization function                         |
//+------------------------------------------------------------------+
int OnInit()
{
   // Initialiser les textes selon la langue
   InitLanguageTexts(Language);
   
   // --- VÉRIFICATION LICENCE (AJOUTÉ) ---
   licenseValidator = new CLicenseValidator(LICENSE_KEY, SERVER_URL);
   isLicenseValid = licenseValidator.Validate(true);
   
   if(!isLicenseValid)
   {
      string msg = texts.invalidLicense + "\n" + licenseValidator.GetErrorMessage();
      Alert(msg);
      // On continue mais sans calculs
   }
   // ------------------------------------
   
   // Set buffers
   SetIndexBuffer(0, BuyBuffer, INDICATOR_DATA);
   SetIndexBuffer(1, SellBuffer, INDICATOR_DATA);
   SetIndexBuffer(2, FastEMA, INDICATOR_CALCULATIONS);
   SetIndexBuffer(3, SlowEMA, INDICATOR_CALCULATIONS);
   
   // Set plot properties
   PlotIndexSetInteger(0, PLOT_DRAW_TYPE, DRAW_ARROW);
   PlotIndexSetInteger(0, PLOT_ARROW, 233);
   PlotIndexSetInteger(0, PLOT_ARROW_SHIFT, 0);
   PlotIndexSetDouble(0, PLOT_EMPTY_VALUE, EMPTY_VALUE);
   PlotIndexSetString(0, PLOT_LABEL, texts.buySignal);
   
   PlotIndexSetInteger(1, PLOT_DRAW_TYPE, DRAW_ARROW);
   PlotIndexSetInteger(1, PLOT_ARROW, 234);
   PlotIndexSetInteger(1, PLOT_ARROW_SHIFT, 0);
   PlotIndexSetDouble(1, PLOT_EMPTY_VALUE, EMPTY_VALUE);
   PlotIndexSetString(1, PLOT_LABEL, texts.sellSignal);
   
   // Create EMA handles
   fastEMA = iMA(_Symbol, PERIOD_CURRENT, EMA_Fast, 0, MODE_EMA, PRICE_CLOSE);
   slowEMA = iMA(_Symbol, PERIOD_CURRENT, EMA_Slow, 0, MODE_EMA, PRICE_CLOSE);
   
   if(fastEMA == INVALID_HANDLE || slowEMA == INVALID_HANDLE)
   {
      Print("Failed to create EMA handles");
      return INIT_FAILED;
   }
   
   // Créer le tableau de bord si activé
   if(ShowDashboard) 
   {
      CreateDashboard();
      EventSetTimer(1); 
   }
   
   if(isLicenseValid) Print("✅ TrendCatcher Validated. Language: ", EnumToString(Language));
   else Print("❌ License Invalid");
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Création du tableau de bord                                     |
//+------------------------------------------------------------------+
void CreateDashboard()
{
   DeleteDashboard();
   
   // Gestion affichage si licence invalide
   color bg = isLicenseValid ? bgColor : C'80,30,30'; // Fond rouge si invalide
   string title = isLicenseValid ? texts.title : texts.invalidLicense;
   
   // Fond du tableau de bord
   string bgName = dashboardPrefix + "BG";
   ObjectCreate(0, bgName, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   ObjectSetInteger(0, bgName, OBJPROP_XDISTANCE, 10);
   ObjectSetInteger(0, bgName, OBJPROP_YDISTANCE, 20);
   ObjectSetInteger(0, bgName, OBJPROP_XSIZE, dashboardWidth);
   ObjectSetInteger(0, bgName, OBJPROP_YSIZE, dashboardHeight);
   ObjectSetInteger(0, bgName, OBJPROP_BGCOLOR, bg);
   ObjectSetInteger(0, bgName, OBJPROP_BORDER_TYPE, BORDER_FLAT);
   ObjectSetInteger(0, bgName, OBJPROP_BORDER_COLOR, clrSilver);
   ObjectSetInteger(0, bgName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(0, bgName, OBJPROP_SELECTABLE, false);
   
   // Titre
   CreateLabel("Title", 15, 25, title, isLicenseValid ? clrGold : clrWhite, 10);
   
   // Si licence invalide, on arrête là
   if(!isLicenseValid)
   {
       string errorReason = "Erreur inconnue";
       if(CheckPointer(licenseValidator) != POINTER_INVALID)
           errorReason = licenseValidator.GetErrorMessage();
           
       CreateLabel("Info", 15, 75, "❌ " + errorReason, clrWhite, 8);
       CreateLabel("Info2", 15, 95, "Compte: " + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)), clrSilver, 8);
       ChartRedraw();
       return;
   }
   
   // Labels d'information
   CreateLabel("TF", 15, 55, texts.timeframe, clrCyan, 9);
   CreateLabel("Trend", 15, 75, texts.trendStrength, clrWhite, 9);
   CreateLabel("EMA", 15, 95, texts.emaStatus, clrWhite, 9);
   CreateLabel("Dist", 15, 115, texts.distance, clrLightBlue, 9);
   CreateLabel("Signal", 15, 135, texts.signal, clrLightGray, 9);
   CreateLabel("Values", 15, 155, "", clrWhite, 9);
   
   ChartRedraw();
}

//+------------------------------------------------------------------+
//| Créer un label                                                  |
//+------------------------------------------------------------------+
void CreateLabel(string name, int x, int y, string text, color clr, int size)
{
   string objName = dashboardPrefix + name;
   ObjectCreate(0, objName, OBJ_LABEL, 0, 0, 0);
   ObjectSetInteger(0, objName, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, objName, OBJPROP_YDISTANCE, y);
   ObjectSetString(0, objName, OBJPROP_TEXT, text);
   ObjectSetInteger(0, objName, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, objName, OBJPROP_FONTSIZE, size);
   ObjectSetString(0, objName, OBJPROP_FONT, "Arial");
   ObjectSetInteger(0, objName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(0, objName, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| Mettre à jour le tableau de bord                                |
//+------------------------------------------------------------------+
void UpdateDashboard()
{
   if(!ShowDashboard) return;
   if(!isLicenseValid) return; // Ne pas update si invalide
   
   double fastArray[], slowArray[];
   ArraySetAsSeries(fastArray, true);
   ArraySetAsSeries(slowArray, true);
   
   // Copier les dernières valeurs
   if(CopyBuffer(fastEMA, 0, 0, 2, fastArray) < 2) return;
   if(CopyBuffer(slowEMA, 0, 0, 2, slowArray) < 2) return;
   
   double fastNow = fastArray[0];
   double slowNow = slowArray[0];
   
   // Calculer la distance entre les EMA
   double distance = 0;
   if(slowNow != 0)
      distance = MathAbs(fastNow - slowNow) / slowNow * 100;
   
   // Déterminer la force de la tendance
   string trendStrength;
   color trendColor;
   if(distance > 0.15)
   {
      trendStrength = texts.strong;
      trendColor = clrLimeGreen;
   }
   else if(distance > 0.08)
   {
      trendStrength = texts.medium;
      trendColor = clrYellow;
   }
   else
   {
      trendStrength = texts.weak;
      trendColor = clrRed;
   }
   
   // Déterminer le statut EMA
   string emaStatus;
   color emaColor;
   if(fastNow > slowNow)
   {
      emaStatus = texts.bullish;
      emaColor = clrLimeGreen;
   }
   else
   {
      emaStatus = texts.bearish;
      emaColor = clrRed;
   }
   
   // Obtenir le timeframe
   string tf;
   switch(_Period)
   {
      case PERIOD_M1: tf = "M1"; break;
      case PERIOD_M5: tf = "M5"; break;
      case PERIOD_M15: tf = "M15"; break;
      case PERIOD_M30: tf = "M30"; break;
      case PERIOD_H1: tf = "H1"; break;
      case PERIOD_H4: tf = "H4"; break;
      case PERIOD_D1: tf = "D1"; break;
      case PERIOD_W1: tf = "W1"; break;
      case PERIOD_MN1: tf = "MN1"; break;
      default: tf = "TF " + IntegerToString(_Period);
   }
   
   // Chercher le dernier signal
   string lastSignal = texts.analyzing;
   color signalColor = clrLightGray;
   
   for(int i = 100; i >= 0; i--)
   {
      if(BuyBuffer[i] != EMPTY_VALUE && BuyBuffer[i] != 0)
      {
         lastSignal = texts.buySignal + " ✓";
         signalColor = clrLime;
         break;
      }
      if(SellBuffer[i] != EMPTY_VALUE && SellBuffer[i] != 0)
      {
         lastSignal = texts.sellSignal + " ✓";
         signalColor = clrRed;
         break;
      }
   }
   
   // Mettre à jour les labels
   ObjectSetString(0, dashboardPrefix + "TF", OBJPROP_TEXT, texts.timeframe + tf);
   
   ObjectSetString(0, dashboardPrefix + "Trend", OBJPROP_TEXT, texts.trendStrength + trendStrength);
   ObjectSetInteger(0, dashboardPrefix + "Trend", OBJPROP_COLOR, trendColor);
   
   ObjectSetString(0, dashboardPrefix + "EMA", OBJPROP_TEXT, texts.emaStatus + emaStatus);
   ObjectSetInteger(0, dashboardPrefix + "EMA", OBJPROP_COLOR, emaColor);
   
   ObjectSetString(0, dashboardPrefix + "Dist", OBJPROP_TEXT, texts.distance + DoubleToString(distance, 2) + "%");
   
   ObjectSetString(0, dashboardPrefix + "Signal", OBJPROP_TEXT, texts.signal + lastSignal);
   ObjectSetInteger(0, dashboardPrefix + "Signal", OBJPROP_COLOR, signalColor);
   
   // Afficher les valeurs actuelles des EMA
   ObjectSetString(0, dashboardPrefix + "Values", OBJPROP_TEXT, 
                  "EMA" + IntegerToString(EMA_Fast) + ": " + DoubleToString(fastNow, 5) + 
                  " | EMA" + IntegerToString(EMA_Slow) + ": " + DoubleToString(slowNow, 5));
   
   ChartRedraw();
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   static int tick = 0;
   tick++;
   
   if(isLicenseValid) UpdateDashboard();
   
   // Revérifier licence toutes les heures (3600s)
   if(tick % 3600 == 0 && licenseValidator != NULL)
   {
       if(!licenseValidator.Validate(false))
       {
           isLicenseValid = false;
           CreateDashboard(); // Passage au rouge
       }
   }
}

//+------------------------------------------------------------------+
//| Custom indicator iteration function                              |
//+------------------------------------------------------------------+
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
{
   // --- PROTECTION ---
   if(!isLicenseValid) return 0;
   // ------------------
   
   // Check if we have enough data
   if(rates_total < MathMax(EMA_Fast, EMA_Slow) + 10)
      return 0;
   
   // Calculate start position
   int start;
   if(prev_calculated == 0)
   {
      start = MathMax(EMA_Fast, EMA_Slow);
      // Initialize buffers
      for(int i = 0; i < start; i++)
      {
         BuyBuffer[i] = EMPTY_VALUE;
         SellBuffer[i] = EMPTY_VALUE;
      }
   }
   else
   {
      start = prev_calculated - 1;
   }
   
   // Copy EMA values
   if(CopyBuffer(fastEMA, 0, 0, rates_total, FastEMA) <= 0) return 0;
   if(CopyBuffer(slowEMA, 0, 0, rates_total, SlowEMA) <= 0) return 0;
   
   // Main calculation loop
   for(int i = start; i < rates_total && !IsStopped(); i++)
   {
      // Reset signals
      BuyBuffer[i] = EMPTY_VALUE;
      SellBuffer[i] = EMPTY_VALUE;
      
      if(!ShowSignals) continue;
      
      // Get current values
      double fastNow = FastEMA[i];
      double slowNow = SlowEMA[i];
      
      // Get previous values (ensure we have them)
      if(i > 0)
      {
         double fastPrev = FastEMA[i-1];
         double slowPrev = SlowEMA[i-1];
         
         // Check for crossover
         if(fastPrev < slowPrev && fastNow > slowNow)
         {
            // Buy signal - EMA fast crosses above EMA slow
            BuyBuffer[i] = low[i] - 10 * _Point;
         }
         else if(fastPrev > slowPrev && fastNow < slowNow)
         {
            // Sell signal - EMA fast crosses below EMA slow
            SellBuffer[i] = high[i] + 10 * _Point;
         }
      }
   }
   
   return rates_total;
}

//+------------------------------------------------------------------+
//| Deinitialization function                                        |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   DeleteDashboard();
   
   if(CheckPointer(licenseValidator) != POINTER_INVALID)
      delete licenseValidator;
}

//+------------------------------------------------------------------+
//| Supprimer le tableau de bord                                    |
//+------------------------------------------------------------------+
void DeleteDashboard()
{
   int total = ObjectsTotal(0);
   for(int i = total - 1; i >= 0; i--)
   {
      string name = ObjectName(0, i);
      if(StringFind(name, dashboardPrefix) == 0)
         ObjectDelete(0, name);
   }
}
