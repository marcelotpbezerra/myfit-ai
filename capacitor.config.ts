import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.myfit.ai',
    appName: 'MyFit.ai',
    webDir: 'out',
    server: {
        url: 'https://fitness.marcelotpbezerra.com.br',
        hostname: 'fitness.marcelotpbezerra.com.br',
        androidScheme: 'https'
    },
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
};

export default config;
