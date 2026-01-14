// Freeda.ai - Script for menopause companion chat
const chatContainer = document.getElementById('chat');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const quickButtons = document.querySelectorAll('.quick-btn');
const fileUploadBtn = document.getElementById('file-upload-btn');
const fileInput = document.getElementById('file-input');

// Chat History Management
const historySidebar = document.getElementById('history-sidebar');
const historyList = document.getElementById('history-list');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

// Generate or retrieve conversation ID
let conversationId = localStorage.getItem('freeda_current_conversation_id') || crypto.randomUUID();
localStorage.setItem('freeda_current_conversation_id', conversationId);

// User ID management
let userId = localStorage.getItem('freeda_user_id');

let loadingMessageEl = null;
let thinkingContainerEl = null;
let hasStartedChat = false;
const newChatBtn = document.getElementById('new-chat-btn');

//const baseURL = 'https://general-flex-1-dot-aspect-agents.oa.r.appspot.com';
const baseURL = 'https://aspect-agent-server-1018338671074.europe-west1.run.app';
//const baseURL = 'https://general-node-db-drizzle-1-dot-aspect-agents.oa.r.appspot.com';

// Initialize user ID
async function initializeUserId() {
  if (!userId) {
    try {
      const response = await fetch(`${baseURL}/api/user/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const data = await response.json();
      userId = data.userId;
      localStorage.setItem('freeda_user_id', userId);
      console.log('✅ User ID created:', userId);
    } catch (error) {
      console.error('❌ Error creating user ID:', error);
      // Continue without userId (anonymous)
    }
  } else {
    console.log('✅ Using existing user ID:', userId);
  }
}

// Initialize on page load
initializeUserId();

// ===== CHAT HISTORY FUNCTIONS =====

// Get all chats from server (with localStorage fallback)
async function getAllChats() {
  if (!userId) {
    // Fallback to localStorage if no userId
    const chatsJson = localStorage.getItem('freeda_chat_history');
    return chatsJson ? JSON.parse(chatsJson) : {};
  }

  try {
    const response = await fetch(`${baseURL}/api/user/${userId}/conversations?agentName=Freeda 2.0`);
    if (!response.ok) throw new Error('Failed to fetch conversations');

    const data = await response.json();

    // Convert server format to our local format
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
  if (!userId) {
    const chats = await getAllChats();
    return chats[conversationId] || null;
  }

  try {
    const response = await fetch(`${baseURL}/api/conversation/${conversationId}/history`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      id: conversationId,
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
  if (!userId) {
    // Fallback to localStorage
    const chats = await getAllChats();
    if (chats[conversationId]) {
      chats[conversationId].title = title;
      chats[conversationId].updatedAt = new Date().toISOString();
      saveAllChats(chats);
    }
    return;
  }

  try {
    await fetch(`${baseURL}/api/conversation/${conversationId}`, {
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

  if (userId) {
    // Load from server
    try {
      const response = await fetch(`${baseURL}/api/conversation/${chatId}/history`);
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
    // Load from localStorage
    const chats = await getAllChats();
    chat = chats[chatId];
  }

  if (!chat) return;

  // Clear current chat
  chatContainer.innerHTML = '';

  // If no messages, show welcome screen
  if (!chat.messages || chat.messages.length === 0) {
    chatContainer.innerHTML = `
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
            <button class="quick-btn" data-question="What exercises are good for menopause?">
              <span class="q-icon">🧘‍♀️</span>
              <span class="q-text">Exercise Guide</span>
            </button>
            <button class="quick-btn" data-question="How do I handle mood changes?">
              <span class="q-icon">💝</span>
              <span class="q-text">Emotional Wellness</span>
            </button>
            <button class="quick-btn" data-question="Tell me about hormone therapy options">
              <span class="q-icon">💊</span>
              <span class="q-text">Hormone Therapy</span>
            </button>
            <button class="quick-btn" data-question="How can I maintain bone health?">
              <span class="q-icon">🦴</span>
              <span class="q-text">Bone Health</span>
            </button>
            <button class="quick-btn" data-question="What about skin and hair changes?">
              <span class="q-icon">✨</span>
              <span class="q-text">Skin & Hair Care</span>
            </button>
            <button class="quick-btn" data-question="How can I manage weight during menopause?">
              <span class="q-icon">⚖️</span>
              <span class="q-text">Weight Management</span>
            </button>
            <button class="quick-btn" data-question="What are natural remedies for menopause?">
              <span class="q-icon">🌿</span>
              <span class="q-text">Natural Remedies</span>
            </button>
            <button class="quick-btn" data-question="How do I talk to my doctor about menopause?">
              <span class="q-icon">👩‍⚕️</span>
              <span class="q-text">Doctor Conversations</span>
            </button>
          </div>
        </div>
      </div>
    `;
    hasStartedChat = false;
    newChatBtn.style.display = 'none';

    // Re-attach quick button listeners
    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-question');
        sendMessage(question);
      });
    });
  } else {
    // Load existing messages
    hasStartedChat = true;
    newChatBtn.style.display = 'flex';

    chat.messages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.classList.add('message', msg.sender);

      if (msg.sender === 'bot') {
        msgEl.innerHTML = formatMessage(msg.text);
      } else {
        msgEl.innerText = msg.text;
      }

      chatContainer.appendChild(msgEl);
    });
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Switch to a different chat
async function switchToChat(chatId) {
  // Switch conversation ID
  conversationId = chatId;
  localStorage.setItem('freeda_current_conversation_id', chatId);

  // Load new chat
  await loadChatMessages(chatId);
  await renderChatHistory();
}

// Create a new chat
function createNewChat() {
  // Create new conversation ID
  conversationId = crypto.randomUUID();
  localStorage.setItem('freeda_current_conversation_id', conversationId);

  // Clear chat and show welcome
  location.reload();
}

// Delete a chat
async function deleteChat(chatId, event) {
  event.stopPropagation();

  if (userId) {
    // Delete from server
    try {
      await fetch(`${baseURL}/api/conversation/${chatId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  } else {
    // Delete from localStorage
    const chats = await getAllChats();
    delete chats[chatId];
    saveAllChats(chats);
  }

  // If deleting current chat, create a new one
  if (chatId === conversationId) {
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
    if (chat.id === conversationId) {
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

// Mockup thinking steps - varied based on query type
const thinkingStepsPool = [
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

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');
const htmlElement = document.documentElement;

// Load saved theme (default to light for a softer experience)
const savedTheme = localStorage.getItem('freeda_theme') || 'light';
if (savedTheme === 'dark') {
  htmlElement.setAttribute('data-theme', 'dark');
  sunIcon.style.display = 'none';
  moonIcon.style.display = 'block';
}

themeToggle.addEventListener('click', () => {
  const currentTheme = htmlElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  htmlElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('freeda_theme', newTheme);

  if (newTheme === 'light') {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
});

// Format text with markdown-like styling
const formatMessage = (text) => {
  // Convert **bold** to <strong>
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Convert ### headers to <h3>
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');

  // Convert ## headers to <h2>
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');

  // Convert - bullet points to <li>
  const lines = text.split('\n');
  let inList = false;
  let formattedLines = [];

  lines.forEach(line => {
    const bulletMatch = line.match(/^[\s]*[-•]\s+(.+)$/);
    if (bulletMatch) {
      if (!inList) {
        formattedLines.push('<ul>');
        inList = true;
      }
      formattedLines.push(`<li>${bulletMatch[1]}</li>`);
    } else {
      if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }
      formattedLines.push(line);
    }
  });

  if (inList) {
    formattedLines.push('</ul>');
  }

  text = formattedLines.join('\n');

  // Convert numbered lists
  text = text.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="numbered-item"><span class="number">$1.</span><span>$2</span></div>');

  return text;
};

// Add message to chat
const addMessage = async (text, sender = 'bot') => {
  // Remove welcome section on first message
  if (!hasStartedChat) {
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
      welcomeSection.style.opacity = '0';
      setTimeout(() => welcomeSection.remove(), 300);
    }
    hasStartedChat = true;
    // Show the "New Chat" button when chat starts
    newChatBtn.style.display = 'flex';

    // Update conversation title after first user message
    if (sender === 'user' && userId) {
      const title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
      await updateConversationTitle(title);
      await renderChatHistory();
    }
  }

  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  if (sender === 'bot') {
    msg.innerHTML = formatMessage(text);
  } else {
    msg.innerText = text;
  }

  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return msg;
};

// Show typing indicator
const showTypingIndicator = () => {
  loadingMessageEl = document.createElement('div');
  loadingMessageEl.classList.add('message', 'bot');
  loadingMessageEl.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  chatContainer.appendChild(loadingMessageEl);
  chatContainer.scrollTop = chatContainer.scrollHeight;
};

// Remove typing indicator
const removeTypingIndicator = () => {
  if (loadingMessageEl) {
    chatContainer.removeChild(loadingMessageEl);
    loadingMessageEl = null;
  }
};

// Show thinking indicator
const showThinkingIndicator = () => {
  // Remove welcome section on first message if needed
  if (!hasStartedChat) {
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
      welcomeSection.style.opacity = '0';
      setTimeout(() => welcomeSection.remove(), 300);
    }
    hasStartedChat = true;
    newChatBtn.style.display = 'flex';
  }

  // Select random thinking steps
  const steps = thinkingStepsPool[Math.floor(Math.random() * thinkingStepsPool.length)];

  thinkingContainerEl = document.createElement('div');
  thinkingContainerEl.classList.add('thinking-container');
  thinkingContainerEl.innerHTML = `
    <div class="thinking-header">
      <svg class="thinking-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
      <span>Thinking...</span>
      <svg class="thinking-toggle expanded" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    <div class="thinking-steps">
      ${steps.map(step => `<div class="thinking-step">${step}</div>`).join('')}
    </div>
  `;

  chatContainer.appendChild(thinkingContainerEl);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Add click handler for toggle - use event delegation to persist after completion
  const header = thinkingContainerEl.querySelector('.thinking-header');
  header.addEventListener('click', function() {
    const container = this.closest('.thinking-container');
    const toggle = container.querySelector('.thinking-toggle');
    container.classList.toggle('thinking-collapsed');
    toggle.classList.toggle('expanded');
  });
};

// Complete thinking indicator (mark as done, collapse it)
const completeThinkingIndicator = () => {
  if (thinkingContainerEl) {
    thinkingContainerEl.classList.add('thinking-completed', 'thinking-collapsed');

    const header = thinkingContainerEl.querySelector('.thinking-header span');
    if (header) header.textContent = 'View thinking process';

    const toggle = thinkingContainerEl.querySelector('.thinking-toggle');
    if (toggle) toggle.classList.remove('expanded');

    // Clear reference so we can show a new thinking indicator for next message
    thinkingContainerEl = null;
  }
};

// Send message to server with streaming
const sendMessage = async (messageText) => {
  addMessage(messageText, 'user');
  input.value = '';

  // Show thinking indicator
  showThinkingIndicator();

  try {
    const useKB = document.getElementById('use-kb-toggle').checked;
    const url = baseURL + '/api/finance-assistant/stream';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        conversationId: conversationId,
        useKnowledgeBase: useKB,
        userId: userId, // Include user ID
        agentName: 'Freeda 2.0' // Specify agent name
      })
    });

    if (!res.ok) {
      throw new Error('Network response was not ok');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let botMessage = null;
    let hasReceivedContent = false;

    const processChunk = async () => {
      const { done, value } = await reader.read();
      if (done) return;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines from buffer
      const lines = buffer.split('\n');
      // Keep last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              // First content received - complete thinking and create message
              if (!hasReceivedContent) {
                completeThinkingIndicator();
                botMessage = document.createElement('div');
                botMessage.classList.add('message', 'bot');
                chatContainer.appendChild(botMessage);
                hasReceivedContent = true;
              }

              fullText += parsed.chunk;
              botMessage.textContent = fullText;
              chatContainer.scrollTop = chatContainer.scrollHeight;
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      // Continue processing next chunk
      await processChunk();
    };

    await processChunk();

    // Apply formatting after all chunks received
    if (botMessage) {
      botMessage.innerHTML = formatMessage(fullText);
    }
  } catch (err) {
    completeThinkingIndicator();
    addMessage("I'm sorry, I'm having trouble connecting right now. Please try again in a moment.", 'bot');
    console.error('Error:', err);
  }
};

// Form submit handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userText = input.value.trim();
  if (!userText) return;
  sendMessage(userText);
});

// Quick question buttons
quickButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const question = btn.getAttribute('data-question');
    sendMessage(question);
  });
});

// New Chat button functionality
newChatBtn.addEventListener('click', () => {
  createNewChat();
});

// File upload functionality
fileUploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  // Process each file one by one
  for (const file of files) {
    // Show upload status for this file
    const uploadStatus = addMessage(`📄 Uploading "${file.name}" to knowledge base...`, 'bot');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const url = baseURL + '/api/kb/upload';

      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const result = await res.json();

      // Update status message for this file
      uploadStatus.innerHTML = formatMessage(`✅ **File uploaded successfully!**\n\nFile: ${result.fileName}\nStatus: ${result.status}\nFile ID: ${result.fileId}`);

    } catch (err) {
      uploadStatus.innerHTML = formatMessage(`❌ **Upload failed**\n\nSorry, there was an error uploading "${file.name}". Please try again.`);
      console.error('Upload error:', err);
    }
  }

  // Clear file input
  fileInput.value = '';
});

// Initialize app
async function initializeApp() {
  // Focus input
  input.focus();

  // Load current chat if it exists
  const currentChat = await getCurrentChat();
  if (currentChat && currentChat.messages && currentChat.messages.length > 0) {
    await loadChatMessages(conversationId);
  }

  // Render chat history
  await renderChatHistory();
}

// Start the app
initializeApp();
