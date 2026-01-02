//+------------------------------------------------------------------+
//|                                          ProtectedIndicator.mq5   |
//|                              Exemple d'indicateur protégé par licence |
//+------------------------------------------------------------------+
#property copyright "Votre Nom"
#property link      "https://www.votresite.com"
#property version   "1.00"
#property indicator_chart_window
#property indicator_buffers 1
#property indicator_plots   1

//--- plot Label
#property indicator_label1  "Signal"
#property indicator_type1   DRAW_ARROW
#property indicator_color1  clrGreen
#property indicator_style1  STYLE_SOLID
#property indicator_width1  2

//+------------------------------------------------------------------+
//| Inclure la bibliothèque de validation                            |
//+------------------------------------------------------------------+
#include <LicenseValidator.mqh>

//+------------------------------------------------------------------+
//| Paramètres de l'indicateur                                       |
//+------------------------------------------------------------------+
input string LICENSE_KEY = "VOTRE-CLE-DE-LICENCE"; // Clé de licence
input string SERVER_URL = "http://localhost:3000/api/validate"; // URL du serveur
input int VALIDATION_CHECK_INTERVAL = 3600; // Intervalle de vérification (secondes)

//--- Paramètres de l'indicateur (exemple)
input int FastMA = 12;  // Période MA rapide
input int SlowMA = 26;  // Période MA lente

//+------------------------------------------------------------------+
//| Variables globales                                                |
//+------------------------------------------------------------------+
double SignalBuffer[];
CLicenseValidator* licenseValidator;
datetime lastValidationCheck = 0;
bool isLicenseValid = false;

//+------------------------------------------------------------------+
//| Fonction d'initialisation                                        |
//+------------------------------------------------------------------+
int OnInit()
{
    //--- Créer le validateur de licence
    licenseValidator = new CLicenseValidator(LICENSE_KEY, SERVER_URL, VALIDATION_CHECK_INTERVAL);
    
    //--- Valider la licence au démarrage
    Print("🔐 Vérification de la licence...");
    Print("📋 ", licenseValidator.GetAccountInfo());
    
    isLicenseValid = licenseValidator.Validate(true);
    
    if(!isLicenseValid)
    {
        Print("❌ ÉCHEC DE LA VALIDATION DE LICENCE");
        Print("   Raison: ", licenseValidator.GetErrorMessage());
        licenseValidator.ShowErrorOnChart();
        
        // Afficher un message d'alerte
        Alert("⚠️ Licence invalide: ", licenseValidator.GetErrorMessage());
        
        return(INIT_FAILED);
    }
    
    Print("✅ Licence validée avec succès!");
    licenseValidator.ClearErrorFromChart();
    
    //--- Configuration de l'indicateur
    SetIndexBuffer(0, SignalBuffer, INDICATOR_DATA);
    PlotIndexSetInteger(0, PLOT_ARROW, 159);
    
    IndicatorSetString(INDICATOR_SHORTNAME, "Protected Indicator");
    IndicatorSetInteger(INDICATOR_DIGITS, _Digits);
    
    ArraySetAsSeries(SignalBuffer, true);
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Fonction de désinitialisation                                    |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    //--- Nettoyer
    if(licenseValidator != NULL)
    {
        licenseValidator.ClearErrorFromChart();
        delete licenseValidator;
    }
    
    Comment("");
}

//+------------------------------------------------------------------+
//| Fonction de calcul                                               |
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
    //--- Vérifier périodiquement la licence
    datetime currentTime = TimeCurrent();
    if(currentTime - lastValidationCheck > VALIDATION_CHECK_INTERVAL)
    {
        Print("🔄 Vérification périodique de la licence...");
        
        isLicenseValid = licenseValidator.Validate(false);
        lastValidationCheck = currentTime;
        
        if(!isLicenseValid)
        {
            Print("❌ La licence n'est plus valide: ", licenseValidator.GetErrorMessage());
            licenseValidator.ShowErrorOnChart();
            
            // Arrêter le calcul
            return(0);
        }
    }
    
    //--- Si la licence n'est pas valide, ne rien calculer
    if(!isLicenseValid)
    {
        return(0);
    }
    
    //--- Votre logique d'indicateur ici
    //--- Ceci est juste un exemple simple
    
    ArraySetAsSeries(close, true);
    ArraySetAsSeries(time, true);
    
    int limit = rates_total - prev_calculated;
    if(limit > 1)
    {
        limit = rates_total - 2;
        ArrayInitialize(SignalBuffer, EMPTY_VALUE);
    }
    
    //--- Exemple: Calcul simple de croisement de moyennes mobiles
    for(int i = limit; i >= 0 && !IsStopped(); i--)
    {
        double fastMA = 0, slowMA = 0;
        
        // Calculer les moyennes mobiles
        for(int j = 0; j < FastMA; j++)
            fastMA += close[i + j];
        fastMA /= FastMA;
        
        for(int j = 0; j < SlowMA; j++)
            slowMA += close[i + j];
        slowMA /= SlowMA;
        
        // Signal de croisement
        if(i < rates_total - SlowMA - 1)
        {
            double prevFastMA = 0, prevSlowMA = 0;
            
            for(int j = 0; j < FastMA; j++)
                prevFastMA += close[i + 1 + j];
            prevFastMA /= FastMA;
            
            for(int j = 0; j < SlowMA; j++)
                prevSlowMA += close[i + 1 + j];
            prevSlowMA /= SlowMA;
            
            // Croisement haussier
            if(fastMA > slowMA && prevFastMA <= prevSlowMA)
            {
                SignalBuffer[i] = low[i] - (10 * _Point);
            }
        }
    }
    
    //--- Afficher les informations sur le graphique
    string info = StringFormat(
        "✅ Licence valide | Compte: %d | FastMA: %d | SlowMA: %d",
        AccountInfoInteger(ACCOUNT_LOGIN),
        FastMA,
        SlowMA
    );
    Comment(info);
    
    return(rates_total);
}
