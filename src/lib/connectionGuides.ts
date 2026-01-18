export const CONNECTION_GUIDES: Record<string, any> = {
    WOOCOMMERCE: {
        title: "WooCommerce",
        category: "Vente / Marketplace",
        role: "Import commandes, produits et attribution.",
        time: "5-10 min",
        prerequisites: ["Admin WordPress", "WooCommerce installé"],
        steps: [
            "Ouvrir WP Admin → WooCommerce → Réglages → Avancé → REST API",
            "Cliquer 'Ajouter une clé'",
            "Utilisateur : un compte Admin",
            "Permissions : 'Lecture/Écriture'",
            "Générer la clé et copier : Consumer Key & Consumer Secret",
            "Renseigner dans PILOT : URL du site, Consumer Key, Consumer Secret",
            "Cliquer 'Tester la connexion'",
            "Lancer 'UPDATE' dans Connexions"
        ],
        fields: ["Store URL", "Consumer Key", "Consumer Secret"],
        troubleshooting: [
            "401/Forbidden : Vérifier permissions Lecture/Écriture",
            "0 commande : Vérifier qu'il y a des commandes sur la période",
            "Toujours 'Other' : Woo Order Attribution manquant ?"
        ],
        links: [
            { label: "Docs Woo REST API", url: "https://woocommerce.github.io/woocommerce-rest-api-docs/" }
        ]
    },
    SHOPIFY: {
        title: "Shopify",
        category: "Vente / Marketplace",
        role: "Import commandes, produits et attribution.",
        time: "5-10 min",
        prerequisites: ["Admin Shopify", "Créer une Custom App"],
        steps: [
            "Shopify Admin → Settings → Apps and sales channels",
            "'Develop apps' → 'Create an app' (Nom: PILOT)",
            "Configurer Admin API Scopes : read_orders, read_products, read_customers",
            "Install app",
            "Récupérer : Admin API access token",
            "Renseigner dans PILOT : Shop domain (ex: boutique.myshopify.com) & Token",
            "Tester + UPDATE"
        ],
        fields: ["Shop Domain", "Access Token"],
        troubleshooting: [
            "401 : Token invalide ou app non installée",
            "Permissions missing : Vérifier les scopes"
        ],
        links: [
            { label: "Shopify Admin Apps", url: "https://admin.shopify.com/store/" }
        ]
    },
    AMAZON_SELLER: {
        title: "Amazon Seller",
        category: "Vente / Marketplace",
        role: "Import ventes et commandes Amazon.",
        time: "10-15 min",
        prerequisites: ["Compte Seller Central Admin", "Accès SP-API"],
        steps: [
            "Seller Central → User Permissions : Vérifier accès",
            "Accéder zone développeur SP-API",
            "Créer/autoriser une application SP-API",
            "Récupérer : Seller ID, LWA Client ID/Secret, Refresh Token",
            "Renseigner les clés exactes dans PILOT",
            "Tester + UPDATE"
        ],
        fields: ["Seller ID", "LWA Client ID", "LWA Client Secret", "Refresh Token"],
        troubleshooting: [
            "Erreur autorisation : Vérifier droits Reports/Orders",
            "Aucune vente : Vérifier Marketplace ID (EU vs NA)"
        ],
        links: [
            { label: "Seller Central", url: "https://sellercentral.amazon.com/" }
        ]
    },
    GOOGLE_ADS: {
        title: "Google Ads",
        category: "Marketing (Ads)",
        role: "Dépenses, campagnes, ROAS, CPC.",
        time: "5 min",
        prerequisites: ["Compte Admin/Standard", "Google Cloud Project"],
        steps: [
            "Google Cloud Console → Créer projet PILOT → Activer Google Ads API",
            "OAuth consent screen : External",
            "Créer identifiants OAuth (Client ID / Secret)",
            "Dans PILOT : Renseigner Customer ID & Tokens",
            "Tester + UPDATE"
        ],
        fields: ["Customer ID", "Access Token", "Refresh Token"],
        troubleshooting: [
            "Access denied : Compte non autorisé",
            "No data : Mauvais Customer ID ou pas de dépenses"
        ],
        links: [
            { label: "Google Cloud Console", url: "https://console.cloud.google.com/" },
            { label: "Google Ads", url: "https://ads.google.com/" }
        ]
    },
    META_ADS: {
        title: "Meta Ads",
        category: "Marketing (Ads)",
        role: "Dépenses Meta, campagnes, attribution.",
        time: "5 min",
        prerequisites: ["Admin Business Manager", "App Meta Developers"],
        steps: [
            "Meta Business Settings : Trouver Ad Account ID",
            "Meta Developers : Créer app + Marketing API",
            "Générer Token (ou utiliser OAuth Pilot)",
            "Renseigner Ad Account ID et Token dans PILOT",
            "Tester + UPDATE"
        ],
        fields: ["Ad Account ID", "Access Token"],
        troubleshooting: [
            "Permissions : Manque ads_read",
            "No data : Mauvais compte publicitaire"
        ],
        links: [
            { label: "Meta Business Suite", url: "https://business.facebook.com/" }
        ]
    },
    TIKTOK_ADS: {
        title: "TikTok Ads",
        category: "Marketing (Ads)",
        role: "Dépenses TikTok, campagnes.",
        time: "5 min",
        prerequisites: ["Admin TikTok Ads", "Developer App"],
        steps: [
            "TikTok Ads Manager : Récupérer Advertiser ID",
            "TikTok Developers : Créer app",
            "Renseigner Advertiser ID et Token dans PILOT",
            "Tester + UPDATE"
        ],
        fields: ["Advertiser ID", "Access Token"],
        troubleshooting: [
            "Redirect URI : Vérifier config OAuth",
            "No data : Mauvais Advertiser ID"
        ],
        links: [
            { label: "TikTok Ads Manager", url: "https://ads.tiktok.com/" }
        ]
    },
    GA4: {
        title: "Google Analytics 4",
        category: "Data / Analytics",
        role: "Sessions, sources réelles, attribution.",
        time: "5 min",
        prerequisites: ["Accès GA4", "Google Cloud Project (Data API)"],
        steps: [
            "Google Analytics → Admin → Property Settings → ID de propriété",
            "Google Cloud : Activer GA Data API",
            "Renseigner Property ID dans PILOT",
            "Tester + UPDATE"
        ],
        fields: ["Property ID", "Service Account Auth"],
        troubleshooting: [
            "Sessions vide : Mauvais Property ID ou permissions",
            "Sources bizarres : Vérifier collecte GA4"
        ],
        links: [
            { label: "Google Analytics", url: "https://analytics.google.com/" }
        ]
    }
};
