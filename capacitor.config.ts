import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jhonathan.estoqueapae', // 🆔 ID único do app (padrão: domínio invertido)
  appName: 'Estoque APAE',            // Nome exibido no app/pwa
  webDir: 'dist',                     // Onde está a build do frontend

  server: {
    // Se estiver rodando localmente ou via hospedagem própria, comente ou remova a URL
    // url: 'http://10.40.1.6:8080', // exemplo para ambiente local
    cleartext: true
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;

