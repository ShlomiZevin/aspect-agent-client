// Aspect Finance BI Assistant - Agent-specific configuration

// Chat History Management
const historySidebar = document.getElementById('history-sidebar');
const historyList = document.getElementById('history-list');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

// Aspect-specific thinking steps
const aspectThinkingSteps = [
  [
    "Understanding your business question",
    "Accessing financial data",
    "Analyzing metrics and trends",
    "Preparing insights",
    "Ensuring accuracy"
  ],
  [
    "Processing your query",
    "Consulting business intelligence",
    "Calculating key metrics",
    "Crafting your report"
  ],
  [
    "Evaluating your request",
    "Gathering sales and inventory data",
    "Formulating recommendations",
    "Preparing actionable insights"
  ],
  [
    "Analyzing business patterns",
    "Reviewing performance data",
    "Connecting to best practices",
    "Building your response"
  ]
];

// Initialize Aspect agent with configuration
const aspectAgent = new AgentBase({
  agentName: 'Aspect',
  storagePrefix: 'aspect_',
  //baseURL: 'http://localhost:3000', // Change to production URL when deploying
  baseURL: 'https://aspect-agent-server-1018338671074.europe-west1.run.app',
  thinkingSteps: aspectThinkingSteps,
  useKnowledgeBase: false
});

// Aspect-specific customizations (if needed)

// Logo upload functionality
const logoUpload = document.getElementById('logo-upload');
const clientLogoImg = document.getElementById('client-logo-img');
const uploadLabel = document.getElementById('upload-label');
const removeLogoBtn = document.getElementById('remove-logo-btn');

// Check if logo was previously uploaded
const savedLogoData = localStorage.getItem('aspect_client_logo_data');
if (savedLogoData) {
  clientLogoImg.src = savedLogoData;
  clientLogoImg.style.display = 'block';
  uploadLabel.style.display = 'none';
  removeLogoBtn.style.display = 'flex';
}

// Handle file selection
logoUpload.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      clientLogoImg.src = imageData;
      clientLogoImg.style.display = 'block';
      uploadLabel.style.display = 'none';
      removeLogoBtn.style.display = 'flex';
      localStorage.setItem('aspect_client_logo_data', imageData);
    };
    reader.readAsDataURL(file);
  }
});

// Handle logo removal
removeLogoBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();

  clientLogoImg.src = '';
  clientLogoImg.style.display = 'none';
  uploadLabel.style.display = 'flex';
  removeLogoBtn.style.display = 'none';
  logoUpload.value = '';

  localStorage.removeItem('aspect_client_logo_data');
});

// ===== CHAT HISTORY SETUP =====

// Welcome HTML for Aspect (used when loading empty chats)
const aspectWelcomeHtml = `
  <div class="welcome-section">
    <div class="welcome-icon">💼</div>
    <h2>Welcome to your Aspect Assistant</h2>
    <p>Ask me anything about your business metrics, sales data, inventory, and more.</p>

    <div class="quick-questions">
      <h3>Quick Questions</h3>
      <div class="questions-grid">
        <button class="quick-btn" data-question="What are my total sales this month?">
          <span class="q-icon">💰</span>
          <span class="q-text">Sales Overview</span>
        </button>
        <button class="quick-btn" data-question="Which product is selling the most?">
          <span class="q-icon">📈</span>
          <span class="q-text">Top Products</span>
        </button>
        <button class="quick-btn" data-question="Show me branch performance">
          <span class="q-icon">🏢</span>
          <span class="q-text">Branch Analysis</span>
        </button>
        <button class="quick-btn" data-question="Inventory status report">
          <span class="q-icon">📦</span>
          <span class="q-text">Inventory Check</span>
        </button>
      </div>
    </div>
  </div>
`;

// Toggle sidebar function
function toggleSidebar() {
  aspectAgent.toggleSidebar(historySidebar);
}

// Render chat history wrapper
async function renderChatHistory() {
  await aspectAgent.renderChatHistory(historyList);
}

// Switch to chat wrapper
async function switchToChat(chatId) {
  await aspectAgent.switchToChat(chatId, aspectWelcomeHtml);
}

// Set callbacks for history management
aspectAgent.setRenderChatHistoryCallback(renderChatHistory);
aspectAgent.setSwitchToChatCallback(switchToChat);

// Event listeners for sidebar
menuToggleBtn.addEventListener('click', toggleSidebar);
closeSidebarBtn.addEventListener('click', toggleSidebar);

// Override new chat button to create new chat
aspectAgent.newChatBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  aspectAgent.createNewChat();
}, true);

// Initialize app with history
async function initializeApp() {
  const currentChat = await aspectAgent.getCurrentChat();
  if (currentChat && currentChat.messages && currentChat.messages.length > 0) {
    await aspectAgent.loadChatMessages(aspectAgent.conversationId, aspectWelcomeHtml);
  }

  await renderChatHistory();
}

initializeApp();
