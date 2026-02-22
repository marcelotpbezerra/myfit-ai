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
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    plugins: {
        LocalNotifications: {
            smallIcon: "res://drawable/ic_stat_icon_config_sample", // Placeholder
            iconColor: "#3b82f6",
            sound: "beep.wav",
        },
        // Preparação para Google Health Connect
        HealthConnect: {
            readPermissions: ["sleep", "steps", "heart_rate"],
            writePermissions: []
        }
    }
};

export default config;
