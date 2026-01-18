import React from 'react';

export const BrandIcon = ({ provider, size = 24 }: { provider: string, size?: number }) => {
    // Keep Amazon Ads as SVG (User Request)
    if (provider === 'AMAZON_ADS') {
        return (
            <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <title>Amazon Ads</title>
                <rect width="32" height="32" rx="4" fill="#232f3e" />
                <path d="M7 18c6 5 13 4 19 0" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    let src = '';
    switch (provider) {
        case 'WOOCOMMERCE': src = '/brand/woocommerce.png'; break;
        case 'SHOPIFY': src = '/brand/shopify.png'; break;
        case 'AMAZON_SELLER': src = '/brand/amazon_seller.png'; break; // Note: This might be wide
        case 'META_ADS': src = '/brand/meta_ads.png'; break;
        case 'GOOGLE_ADS': src = '/brand/google_ads.png'; break;
        case 'TIKTOK_ADS': src = '/brand/tiktok_ads.jpg'; break;
        case 'GA4': src = '/brand/ga4.png'; break;
        default: return (
            <div style={{ width: size, height: size, background: '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size * 0.5, color: '#666' }}>
                {provider ? provider.substring(0, 2) : '?'}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={provider}
            style={{
                width: size,
                height: size,
                objectFit: 'contain',
                // Optional: add slight rounding for better aesthetics if images are square
                borderRadius: (provider === 'TIKTOK_ADS' || provider === 'META_ADS') ? '50%' : '0'
            }}
        />
    );
};
