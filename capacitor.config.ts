import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.myfit.ai',
    appName: 'MyFit.ai',
    webDir: 'public',
    server: {
        url: 'https://fitness.marcelotpbezerra.com.br/',
        cleartext: true
    }
};

export default config;
