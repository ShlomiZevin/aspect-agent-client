// Knowledge Base Configuration - Aspect
// This file configures the KB manager for Aspect agent

const KB_CONFIG = {
  // Agent configuration
  agentName: 'Aspect',
  agentDisplayName: 'Aspect Insight',

  // URLs
  baseURL: 'https://aspect-agent-server-1018338671074.europe-west1.run.app',
  // baseURL: 'http://localhost:3000', // Uncomment for local development
  chatPageUrl: 'aspect.html',

  // Branding
  logoSrc: 'img/aspect-logo-regular.png',
  logoAlt: 'Aspect Logo',
  pageTitle: 'Knowledge Base Management - Aspect Insight',
  headerTitle: 'Knowledge Base',
  headerTitleAccent: ' Manager',
  headerSubtitle: 'Manage your business intelligence documents',

  // Styling
  stylesFile: 'aspect-kb-styles.css',
  storagePrefix: 'aspect_'
};

// Export for use in kb-script.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KB_CONFIG;
}
