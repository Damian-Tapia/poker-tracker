interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: { androidScheme?: string; url?: string };
}

const config: CapacitorConfig = {
  appId: 'com.pokernight.tracker',
  appName: 'Poker Night',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // url: 'https://tu-servidor.com',  // descomentar cuando tengas la URL del servidor
  },
};

export default config;
