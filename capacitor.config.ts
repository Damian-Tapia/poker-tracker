interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: { androidScheme?: string };
}

const config: CapacitorConfig = {
  appId: 'com.pokernight.tracker',
  appName: 'Poker Night',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
