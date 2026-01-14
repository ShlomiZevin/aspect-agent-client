// Freeda.ai - Menopause Companion Agent

// Chat History Management
const historySidebar = document.getElementById('history-sidebar');
const historyList = document.getElementById('history-list');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

// Freeda-specific thinking steps
const freedaThinkingSteps = [
  [
    "Understanding your question with care",
    "Accessing trusted medical knowledge",
    "Considering your unique needs",
    "Preparing personalized guidance",
    "Ensuring accuracy and empathy"
  ],
  [
    "Analyzing symptom patterns",
    "Reviewing wellness research",
    "Connecting to practical solutions",
    "Crafting supportive advice"
  ],
  [
    "Processing your health query",
    "Consulting evidence-based resources",
    "Tailoring recommendations for you",
    "Preparing helpful insights"
  ],
  [
    "Evaluating your wellness question",
    "Gathering menopause expertise",
    "Formulating compassionate guidance",
    "Ensuring clarity and support"
  ]
];

// Initialize Freeda agent with configuration
const freedaAgent = new AgentBase({
  agentName: 'Freeda 2.0',
  storagePrefix: 'freeda_',
  baseURL: 'https://aspect-agent-server-1018338671074.europe-west1.run.app',
  thinkingSteps: freedaThinkingSteps,
  useKnowledgeBase: () => document.getElementById('use-kb-toggle').checked
});

// ===== CHAT HISTORY FUNCTIONS =====

// Get all chats from server (with localStorage fallback)
async function getAllChats() {
  if (!freedaAgent.userId) {
    const chatsJson = localStorage.getItem('freeda_chat_history');
    return chatsJson ? JSON.parse(chatsJson) : {};
  }

  try {
    const response = await fetch(`${freedaAgent.config.baseURL}/api/user/${freedaAgent.userId}/conversations?agentName=Freeda 2.0`);
    if (!response.ok) throw new Error('Failed to fetch conversations');

    const data = await response.json();

    const chats = {};
    data.conversations.forEach(conv => {
      chats[conv.externalId] = {
        id: conv.externalId,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messageCount
      };
    });

    return chats;
  } catch (error) {
    console.error('Error fetching chats from server, using localStorage:', error);
    const chatsJson = localStorage.getItem('freeda_chat_history');
    return chatsJson ? JSON.parse(chatsJson) : {};
  }
}

// Save all chats to localStorage (legacy support)
function saveAllChats(chats) {
  localStorage.setItem('freeda_chat_history', JSON.stringify(chats));
}

// Get current chat from server
async function getCurrentChat() {
  if (!freedaAgent.userId) {
    const chats = await getAllChats();
    return chats[freedaAgent.conversationId] || null;
  }

  try {
    const response = await fetch(`${freedaAgent.config.baseURL}/api/conversation/${freedaAgent.conversationId}/history`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      id: freedaAgent.conversationId,
      messages: data.messages.map(msg => ({
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'bot'
      }))
    };
  } catch (error) {
    console.error('Error fetching current chat:', error);
    return null;
  }
}

// Save/update conversation title on server
async function updateConversationTitle(title) {
  if (!freedaAgent.userId) {
    const chats = await getAllChats();
    if (chats[freedaAgent.conversationId]) {
      chats[freedaAgent.conversationId].title = title;
      chats[freedaAgent.conversationId].updatedAt = new Date().toISOString();
      saveAllChats(chats);
    }
    return;
  }

  try {
    await fetch(`${freedaAgent.config.baseURL}/api/conversation/${freedaAgent.conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
  } catch (error) {
    console.error('Error updating conversation title:', error);
  }
}

// Load chat messages into the UI
async function loadChatMessages(chatId) {
  let chat;

  if (freedaAgent.userId) {
    try {
      const response = await fetch(`${freedaAgent.config.baseURL}/api/conversation/${chatId}/history`);
      if (response.ok) {
        const data = await response.json();
        chat = {
          id: chatId,
          messages: data.messages.map(msg => ({
            text: msg.content,
            sender: msg.role === 'user' ? 'user' : 'bot'
          }))
        };
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  } else {
    const chats = await getAllChats();
    chat = chats[chatId];
  }

  if (!chat) return;

  freedaAgent.chatContainer.innerHTML = '';

  if (!chat.messages || chat.messages.length === 0) {
    // Show welcome screen
    freedaAgent.chatContainer.innerHTML = `
      <div class="welcome-section">
        <div class="welcome-icon">🌸</div>
        <h2>Welcome to Freeda</h2>
        <p>I'm here to support you through your menopause journey with understanding, knowledge, and care.</p>
        <div class="quick-questions">
          <h3>How can I help you today?</h3>
          <div class="questions-grid">
            <button class="quick-btn" data-question="What are the common symptoms of menopause?">
              <span class="q-icon">🌡️</span>
              <span class="q-text">Common Symptoms</span>
            </button>
            <button class="quick-btn" data-question="How can I manage hot flashes?">
              <span class="q-icon">💨</span>
              <span class="q-text">Hot Flash Relief</span>
            </button>
            <button class="quick-btn" data-question="What foods should I eat during menopause?">
              <span class="q-icon">🥗</span>
              <span class="q-text">Nutrition Tips</span>
            </button>
            <button class="quick-btn" data-question="How can I improve my sleep?">
              <span class="q-icon">😴</span>
              <span class="q-text">Better Sleep</span>
            </button>
          </div>
        </div>
      </div>
    `;
    freedaAgent.hasStartedChat = false;
    freedaAgent.newChatBtn.style.display = 'none';

    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-question');
        freedaAgent.sendMessage(question);
      });
    });
  } else {
    freedaAgent.hasStartedChat = true;
    freedaAgent.newChatBtn.style.display = 'flex';

    chat.messages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.classList.add('message', msg.sender);

      if (msg.sender === 'bot') {
        msgEl.innerHTML = freedaAgent.formatMessage(msg.text);
      } else {
        msgEl.innerText = msg.text;
      }

      freedaAgent.chatContainer.appendChild(msgEl);
    });
  }

  freedaAgent.chatContainer.scrollTop = freedaAgent.chatContainer.scrollHeight;
}

// Switch to a different chat
async function switchToChat(chatId) {
  freedaAgent.conversationId = chatId;
  localStorage.setItem('freeda_current_conversation_id', chatId);

  await loadChatMessages(chatId);
  await renderChatHistory();
}

// Create a new chat
function createNewChat() {
  freedaAgent.conversationId = crypto.randomUUID();
  localStorage.setItem('freeda_current_conversation_id', freedaAgent.conversationId);
  location.reload();
}

// Delete a chat
async function deleteChat(chatId, event) {
  event.stopPropagation();

  if (freedaAgent.userId) {
    try {
      await fetch(`${freedaAgent.config.baseURL}/api/conversation/${chatId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  } else {
    const chats = await getAllChats();
    delete chats[chatId];
    saveAllChats(chats);
  }

  if (chatId === freedaAgent.conversationId) {
    createNewChat();
  } else {
    await renderChatHistory();
  }
}

// Format date for display
function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// Render chat history in sidebar
async function renderChatHistory() {
  const chats = await getAllChats();
  const chatArray = Object.values(chats).sort((a, b) =>
    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );

  historyList.innerHTML = '';

  if (chatArray.length === 0) {
    historyList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 14px;">No chat history yet</div>';
    return;
  }

  chatArray.forEach(chat => {
    const item = document.createElement('div');
    item.classList.add('history-item');
    if (chat.id === freedaAgent.conversationId) {
      item.classList.add('active');
    }

    item.innerHTML = `
      <div class="history-item-title">${chat.title}</div>
      <div class="history-item-date">${formatDate(chat.updatedAt || chat.createdAt)}</div>
      <button class="history-item-delete" onclick="deleteChat('${chat.id}', event)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;

    item.addEventListener('click', () => switchToChat(chat.id));
    historyList.appendChild(item);
  });
}

// Toggle sidebar
function toggleSidebar() {
  historySidebar.classList.toggle('hidden');
}

// Event listeners for sidebar
menuToggleBtn.addEventListener('click', toggleSidebar);
closeSidebarBtn.addEventListener('click', toggleSidebar);

// Make deleteChat available globally
window.deleteChat = deleteChat;

// Override new chat button to use Freeda's function
freedaAgent.newChatBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  createNewChat();
}, true);

// File upload functionality (Freeda-specific)
const fileUploadBtn = document.getElementById('file-upload-btn');
const fileInput = document.getElementById('file-input');

if (fileUploadBtn && fileInput) {
  fileUploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const uploadStatus = freedaAgent.addMessage(`📄 Uploading "${file.name}" to knowledge base...`, 'bot');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const url = freedaAgent.config.baseURL + '/api/kb/upload';

        const res = await fetch(url, {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error('Upload failed');
        }

        const result = await res.json();

        uploadStatus.innerHTML = freedaAgent.formatMessage(`✅ **File uploaded successfully!**\n\nFile: ${result.fileName}\nStatus: ${result.status}\nFile ID: ${result.fileId}`);

      } catch (err) {
        uploadStatus.innerHTML = freedaAgent.formatMessage(`❌ **Upload failed**\n\nSorry, there was an error uploading "${file.name}". Please try again.`);
        console.error('Upload error:', err);
      }
    }

    fileInput.value = '';
  });
}

// Initialize app
async function initializeApp() {
  const currentChat = await getCurrentChat();
  if (currentChat && currentChat.messages && currentChat.messages.length > 0) {
    await loadChatMessages(freedaAgent.conversationId);
  }

  await renderChatHistory();
}

initializeApp();
