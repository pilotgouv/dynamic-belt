export interface FinancialData {
    revenue_gross: number;
    revenue_net_estimated: number;
    ad_spend_total: number;
    profit_estimated: number;
    margin_percentage: number;
    roas_real: number;
    previous_period: {
        revenue_gross: number;
        profit_estimated: number;
    };
}

export interface MonthlyData {
    name: string;
    revenue: number;
    spend: number;
    profit: number;
}

export interface ChannelPerformance {
    channel: string; // 'Google Ads', 'Meta', 'TikTok', 'Email', 'Organic'
    spend: number;
    revenue: number;
    roas: number;
}

// Mock Data Storage
export const MOCK_FINANCIALS: FinancialData = {
    revenue_gross: 124500,
    revenue_net_estimated: 108300,
    ad_spend_total: 32150,
    profit_estimated: 45200,
    margin_percentage: 36.3,
    roas_real: 3.87,
    previous_period: {
        revenue_gross: 110600,
        profit_estimated: 41700
    }
};

export const MOCK_MONTHLY_DATA: MonthlyData[] = [
    { name: 'Jan', revenue: 40000, spend: 12000, profit: 15000 },
    { name: 'Fév', revenue: 35000, spend: 11000, profit: 12000 },
    { name: 'Mar', revenue: 55000, spend: 18000, profit: 18000 },
    { name: 'Avr', revenue: 48000, spend: 15000, profit: 16000 },
    { name: 'Mai', revenue: 65000, spend: 20000, profit: 24000 },
    { name: 'Juin', revenue: 85000, spend: 24000, profit: 32000 },
    { name: 'Juil', revenue: 124500, spend: 32150, profit: 45200 },
];

export const MOCK_CHANNELS: ChannelPerformance[] = [
    { channel: 'Meta Ads', spend: 15400, revenue: 58000, roas: 3.76 },
    { channel: 'Google Ads', spend: 12500, revenue: 42000, roas: 3.36 },
    { channel: 'TikTok Ads', spend: 4250, revenue: 14500, roas: 3.41 },
    { channel: 'Emailing', spend: 500, revenue: 8500, roas: 17.0 },
];

export const MOCK_ADS_PERFORMANCE = [
    { platform: 'Meta Ads', campaigns: 5, clicks: 12500, cpc: 1.23, ctr: 1.8, conversions: 450, cost: 15400, roas: 3.76, status: 'active' },
    { platform: 'Google Ads', campaigns: 3, clicks: 8900, cpc: 1.40, ctr: 4.5, conversions: 320, cost: 12500, roas: 3.36, status: 'active' },
    { platform: 'TikTok Ads', campaigns: 2, clicks: 15000, cpc: 0.28, ctr: 0.9, conversions: 110, cost: 4250, roas: 3.41, status: 'warning' },
];

export const MOCK_TRAFFIC_SOURCES = [
    { name: 'Direct', sessions: 12000, conversionRate: 3.2 },
    { name: 'Social (Organic)', sessions: 8500, conversionRate: 1.5 },
    { name: 'Social (Paid)', sessions: 25000, conversionRate: 2.1 },
    { name: 'Search (Organic)', sessions: 15400, conversionRate: 2.8 },
    { name: 'Search (Paid)', sessions: 11000, conversionRate: 3.5 },
    { name: 'Email', sessions: 4500, conversionRate: 4.8 },
];

export const MOCK_ADS_TREND = [
    { name: 'Lun', spend: 1200, roas: 3.2 },
    { name: 'Mar', spend: 1100, roas: 3.5 },
    { name: 'Mer', spend: 1400, roas: 3.1 },
    { name: 'Jeu', spend: 1300, roas: 3.8 },
    { name: 'Ven', spend: 1800, roas: 4.2 },
    { name: 'Sam', spend: 2200, roas: 3.9 },
    { name: 'Dim', spend: 2100, roas: 4.1 },
];

export interface Product {
    id: string;
    name: string;
    sku: string;
    sales: number;
    revenue: number;
    adSpend: number;
    margin: number;
    status: 'hero' | 'toxic' | 'sleeper' | 'normal';
    trend: number;
    aiAction: string;
}

export const MOCK_PRODUCTS: Product[] = [
    { id: '1', name: 'Montre Chrono Silver', sku: 'MCS-001', sales: 450, revenue: 67500, adSpend: 12000, margin: 42, status: 'hero', trend: 15, aiAction: 'Scaler Budget' },
    { id: '2', name: 'Bracelet Cuir Vintage', sku: 'BCV-023', sales: 210, revenue: 10500, adSpend: 2000, margin: 55, status: 'normal', trend: 5, aiAction: 'Maintenir' },
    { id: '3', name: 'Coffret Cadeau Homme', sku: 'CCH-009', sales: 85, revenue: 12750, adSpend: 8500, margin: 12, status: 'toxic', trend: -10, aiAction: 'Couper Pub' },
    { id: '4', name: 'Porte-cartes Slim', sku: 'PCS-012', sales: 120, revenue: 6000, adSpend: 800, margin: 60, status: 'sleeper', trend: 2, aiAction: 'Optimiser SEO' },
    { id: '5', name: 'Lunettes Aviator', sku: 'LAV-005', sales: 340, revenue: 27200, adSpend: 8900, margin: 38, status: 'hero', trend: 12, aiAction: 'Scaler Budget' },
];

export interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    category: 'finance' | 'ads' | 'product';
    message: string;
    timestamp: string;
    isRead: boolean;
}

export const MOCK_ALERTS: Alert[] = [
    { id: '1', type: 'critical', category: 'product', message: 'Le produit "Coffret Cadeau Homme" est déficitaire ce matin. ROAS < 1.2.', timestamp: 'Il y a 30 min', isRead: false },
    { id: '2', type: 'warning', category: 'ads', message: 'Hausse du CPC global de +15% sur Google Ads.', timestamp: 'Il y a 2h', isRead: false },
    { id: '3', type: 'info', category: 'finance', message: 'Virement Shopify de 4,250€ reçu.', timestamp: 'Hier', isRead: true },
    { id: '4', type: 'info', category: 'product', message: '"Montre Chrono Silver" passe en top des ventes.', timestamp: 'Hier', isRead: true },
];

export const MOCK_TIMELINE = [
    { id: '1', date: '14 Jan 2026', type: 'milestone', title: 'Record de Chiffre d\'Affaires', description: 'Le CA journalier a dépassé 15,000€ pour la première fois.', impact: '+15k€' },
    { id: '2', date: '12 Jan 2026', type: 'decision', title: 'Arrêt Campagne TikTok', description: 'Coupure de la campagne "Test Hiver" suite à un ROAS < 1.5.', impact: 'Dépenses -400€/j' },
    { id: '3', date: '10 Jan 2026', type: 'external', title: 'Soldes d\'Hiver', description: 'Début officiel de la période des soldes.', impact: 'Trafic +45%' },
    { id: '4', date: '05 Jan 2026', type: 'decision', title: 'Hausse Budget Google Ads', description: 'Augmentation du budget sur les mots-clés "Montres Homme".', impact: 'Dépenses +250€/j' },
    { id: '5', date: '01 Jan 2026', type: 'milestone', title: 'Lancement Nouvelle Collection', description: 'Mise en ligne de la collection "Vintage 2026".', impact: 'Nouveau Produit' },
];

export const MOCK_USER_SETTINGS = {
    name: 'Marc Vicario',
    email: 'marc@dynamicbelt.com',
    plan: 'Premium',
    currency: 'EUR',
    language: 'Français',
    notifications: {
        email: true,
        push: true,
        weeklyReport: true
    }
};

export const getFinancialAdvice = (data: FinancialData): string => {
    if (data.margin_percentage < 20) {
        return "Alerte : Votre marge est dangereusement basse. Vérifiez vos coûts d'acquisition publicitaire immédiatement.";
    }
    if (data.roas_real < 3) {
        return "Attention : Votre ROAS global est sous la barre des 3.0. Vos campagnes manquent de rentabilité.";
    }
    return "Excellente performance. Votre marge de " + data.margin_percentage + "% est saine. Augmentez le budget sur Meta Ads pour scaler.";
};
