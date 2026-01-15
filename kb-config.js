// Knowledge Base Configuration
// This file is agent-specific and should be replaced during deployment

const KB_CONFIG = {
  // Agent configuration
  agentName: 'Freeda 2.0',
  agentDisplayName: 'Freeda.ai',

  // URLs
  baseURL: 'https://aspect-agent-server-1018338671074.europe-west1.run.app',
  // baseURL: 'http://localhost:3000', // Uncomment for local development
  chatPageUrl: 'freeda.html',

  // Branding
  logoSrc: 'img/freeda-logo.png',
  logoAlt: 'Freeda Logo',
  pageTitle: 'Knowledge Base Management - Freeda.ai',
  headerTitle: 'Knowledge Base',
  headerTitleAccent: ' Manager',
  headerSubtitle: 'Manage your vector stores and documents',

  // Styling
  stylesFile: 'kb-styles.css',
  storagePrefix: 'freeda_'
};

// Export for use in kb-script.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KB_CONFIG;
}
