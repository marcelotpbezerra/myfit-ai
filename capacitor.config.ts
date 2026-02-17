import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.myfit.ai',
    appName: 'MyFit.ai',
    webDir: 'out',
    server: {
        hostname: 'fitness.marcelotpbezerra.com.br',
        androidScheme: 'https'
    }
};

export default config;
