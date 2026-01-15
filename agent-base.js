/**
 * Base Agent Script - Shared functionality for all agents
 * This provides common infrastructure for streaming chat, user management, and UI updates
 *
 * Agents that extend this should provide a configuration object with:
 * - agentName: string (e.g., "Freeda 2.0", "Aspect")
 * - storagePrefix: string (e.g., "freeda_", "aspect_")
 * - baseURL: string (server URL)
 * - thinkingSteps: array of arrays (different thinking step options)
 * - useKnowledgeBase: boolean or function (whether to use KB)
 */

class AgentBase {
  constructor(config) {
    this.config = {
      agentName: config.agentName || 'Agent',
      storagePrefix: config.storagePrefix || 'agent_',
      baseURL: config.baseURL || 'https://aspect-agent-server-1018338671074.europe-west1.run.app',
      thinkingSteps: config.thinkingSteps || [[
        "Processing your request",
        "Analyzing information",
        "Preparing response",
        "Ensuring accuracy"
      ]],
      useKnowledgeBase: config.useKnowledgeBase !== undefined ? config.useKnowledgeBase : false,
      ...config
    };

    // DOM elements
    this.chatContainer = document.getElementById('chat');
    this.form = document.getElementById('chat-form');
    this.input = document.getElementById('user-input');
    this.quickButtons = document.querySelectorAll('.quick-btn');
    this.newChatBtn = document.getElementById('new-chat-btn');
    this.themeToggle = document.getElementById('theme-toggle');
    this.sunIcon = document.querySelector('.sun-icon');
    this.moonIcon = document.querySelector('.moon-icon');

    // State
    this.conversationId = localStorage.getItem(`${this.config.storagePrefix}current_conversation_id`) || crypto.randomUUID();
    localStorage.setItem(`${this.config.storagePrefix}current_conversation_id`, this.conversationId);

    this.userId = localStorage.getItem(`${this.config.storagePrefix}user_id`);
    this.loadingMessageEl = null;
    this.thinkingContainerEl = null;
    this.hasStartedChat = false;

    // Initialize
    this.initializeUserId();
    this.setupEventListeners();
    this.loadTheme();
  }

  // ===== USER MANAGEMENT =====

  async initializeUserId() {
    if (!this.userId) {
      try {
        const response = await fetch(`${this.config.baseURL}/api/user/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to create user');
        }

        const data = await response.json();
        this.userId = data.userId;
        localStorage.setItem(`${this.config.storagePrefix}user_id`, this.userId);
        console.log('✅ User ID created:', this.userId);
      } catch (error) {
        console.error('❌ Error creating user ID:', error);
      }
    } else {
      console.log('✅ Using existing user ID:', this.userId);
    }
  }

  // ===== THEME MANAGEMENT =====

  loadTheme() {
    const savedTheme = localStorage.getItem(`${this.config.storagePrefix}theme`) || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.sunIcon.style.display = 'none';
      this.moonIcon.style.display = 'block';
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(`${this.config.storagePrefix}theme`, newTheme);

    if (newTheme === 'light') {
      this.sunIcon.style.display = 'block';
      this.moonIcon.style.display = 'none';
    } else {
      this.sunIcon.style.display = 'none';
      this.moonIcon.style.display = 'block';
    }
  }

  // ===== MESSAGE FORMATTING =====

  formatMessage(text) {
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
  }

  // ===== MESSAGE UI =====

  addMessage(text, sender = 'bot') {
    // Remove welcome section on first message
    if (!this.hasStartedChat) {
      const welcomeSection = document.querySelector('.welcome-section');
      if (welcomeSection) {
        welcomeSection.style.opacity = '0';
        setTimeout(() => welcomeSection.remove(), 300);
      }
      this.hasStartedChat = true;
      this.newChatBtn.style.display = 'flex';
    }

    const msg = document.createElement('div');
    msg.classList.add('message', sender);

    if (sender === 'bot') {
      msg.innerHTML = this.formatMessage(text);
    } else {
      msg.innerText = text;
    }

    this.chatContainer.appendChild(msg);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    return msg;
  }

  // ===== THINKING INDICATOR =====

  showThinkingIndicator() {
    // Remove welcome section on first message if needed
    if (!this.hasStartedChat) {
      const welcomeSection = document.querySelector('.welcome-section');
      if (welcomeSection) {
        welcomeSection.style.opacity = '0';
        setTimeout(() => welcomeSection.remove(), 300);
      }
      this.hasStartedChat = true;
      this.newChatBtn.style.display = 'flex';
    }

    // Select random thinking steps
    const steps = this.config.thinkingSteps[Math.floor(Math.random() * this.config.thinkingSteps.length)];

    this.thinkingContainerEl = document.createElement('div');
    this.thinkingContainerEl.classList.add('thinking-container');
    this.thinkingContainerEl.innerHTML = `
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

    this.chatContainer.appendChild(this.thinkingContainerEl);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;

    // Add click handler for toggle
    const header = this.thinkingContainerEl.querySelector('.thinking-header');
    header.addEventListener('click', function() {
      const container = this.closest('.thinking-container');
      const toggle = container.querySelector('.thinking-toggle');
      container.classList.toggle('thinking-collapsed');
      toggle.classList.toggle('expanded');
    });
  }

  completeThinkingIndicator() {
    if (this.thinkingContainerEl) {
      this.thinkingContainerEl.classList.add('thinking-completed', 'thinking-collapsed');

      const header = this.thinkingContainerEl.querySelector('.thinking-header span');
      if (header) header.textContent = 'View thinking process';

      const toggle = this.thinkingContainerEl.querySelector('.thinking-toggle');
      if (toggle) toggle.classList.remove('expanded');

      this.thinkingContainerEl = null;
    }
  }

  // ===== STREAMING MESSAGE =====

  async sendMessage(messageText) {
    this.addMessage(messageText, 'user');
    this.input.value = '';

    // Show thinking indicator
    this.showThinkingIndicator();

    try {
      const useKB = typeof this.config.useKnowledgeBase === 'function'
        ? this.config.useKnowledgeBase()
        : this.config.useKnowledgeBase;

      const url = this.config.baseURL + '/api/finance-assistant/stream';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: this.conversationId,
          useKnowledgeBase: useKB,
          userId: this.userId,
          agentName: this.config.agentName
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

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
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
                if (!hasReceivedContent) {
                  this.completeThinkingIndicator();
                  botMessage = document.createElement('div');
                  botMessage.classList.add('message', 'bot');
                  this.chatContainer.appendChild(botMessage);
                  hasReceivedContent = true;
                }

                fullText += parsed.chunk;
                botMessage.textContent = fullText;
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }

        await processChunk();
      };

      await processChunk();

      if (botMessage) {
        botMessage.innerHTML = this.formatMessage(fullText);
      }
    } catch (err) {
      this.completeThinkingIndicator();
      this.addMessage("Sorry, there was an error processing your request. Please try again.", 'bot');
      console.error('Error:', err);
    }
  }

  // ===== EVENT LISTENERS =====

  setupEventListeners() {
    // Form submit
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userText = this.input.value.trim();
      if (!userText) return;
      this.sendMessage(userText);
    });

    // Quick buttons
    this.quickButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-question');
        this.sendMessage(question);
      });
    });

    // New chat button
    this.newChatBtn.addEventListener('click', () => {
      this.createNewChat();
    });

    // Theme toggle
    this.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Focus input
    this.input.focus();
  }

  // ===== CHAT MANAGEMENT =====

  createNewChat() {
    const messages = this.chatContainer.querySelectorAll('.message, .thinking-container');
    messages.forEach(msg => msg.remove());

    this.hasStartedChat = false;
    this.newChatBtn.style.display = 'none';

    this.conversationId = crypto.randomUUID();
    localStorage.setItem(`${this.config.storagePrefix}current_conversation_id`, this.conversationId);
    location.reload();
  }

  // ===== HISTORY MANAGEMENT =====

  // Get all chats from server (with localStorage fallback)
  async getAllChats() {
    if (!this.userId) {
      const chatsJson = localStorage.getItem(`${this.config.storagePrefix}chat_history`);
      return chatsJson ? JSON.parse(chatsJson) : {};
    }

    try {
      const response = await fetch(`${this.config.baseURL}/api/user/${this.userId}/conversations?agentName=${encodeURIComponent(this.config.agentName)}`);
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
      const chatsJson = localStorage.getItem(`${this.config.storagePrefix}chat_history`);
      return chatsJson ? JSON.parse(chatsJson) : {};
    }
  }

  // Save all chats to localStorage (legacy support)
  saveAllChats(chats) {
    localStorage.setItem(`${this.config.storagePrefix}chat_history`, JSON.stringify(chats));
  }

  // Get current chat from server
  async getCurrentChat() {
    if (!this.userId) {
      const chats = await this.getAllChats();
      return chats[this.conversationId] || null;
    }

    try {
      const response = await fetch(`${this.config.baseURL}/api/conversation/${this.conversationId}/history`);
      if (!response.ok) return null;

      const data = await response.json();
      return {
        id: this.conversationId,
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
  async updateConversationTitle(title) {
    if (!this.userId) {
      const chats = await this.getAllChats();
      if (chats[this.conversationId]) {
        chats[this.conversationId].title = title;
        chats[this.conversationId].updatedAt = new Date().toISOString();
        this.saveAllChats(chats);
      }
      return;
    }

    try {
      await fetch(`${this.config.baseURL}/api/conversation/${this.conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  }

  // Load chat messages into the UI
  async loadChatMessages(chatId, welcomeHtml) {
    let chat;

    if (this.userId) {
      try {
        const response = await fetch(`${this.config.baseURL}/api/conversation/${chatId}/history`);
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
      const chats = await this.getAllChats();
      chat = chats[chatId];
    }

    if (!chat) return;

    this.chatContainer.innerHTML = '';

    if (!chat.messages || chat.messages.length === 0) {
      // Show welcome screen - use provided HTML or default
      if (welcomeHtml) {
        this.chatContainer.innerHTML = welcomeHtml;
      }
      this.hasStartedChat = false;
      this.newChatBtn.style.display = 'none';

      // Re-attach quick button listeners
      document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const question = btn.getAttribute('data-question');
          this.sendMessage(question);
        });
      });
    } else {
      this.hasStartedChat = true;
      this.newChatBtn.style.display = 'flex';

      chat.messages.forEach(msg => {
        const msgEl = document.createElement('div');
        msgEl.classList.add('message', msg.sender);

        if (msg.sender === 'bot') {
          msgEl.innerHTML = this.formatMessage(msg.text);
        } else {
          msgEl.innerText = msg.text;
        }

        this.chatContainer.appendChild(msgEl);
      });
    }

    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  // Switch to a different chat
  async switchToChat(chatId, welcomeHtml) {
    this.conversationId = chatId;
    localStorage.setItem(`${this.config.storagePrefix}current_conversation_id`, chatId);

    await this.loadChatMessages(chatId, welcomeHtml);
    if (this.renderChatHistoryCallback) {
      await this.renderChatHistoryCallback();
    }
  }

  // Delete a chat
  async deleteChat(chatId, event) {
    if (event) {
      event.stopPropagation();
    }

    if (this.userId) {
      try {
        await fetch(`${this.config.baseURL}/api/conversation/${chatId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    } else {
      const chats = await this.getAllChats();
      delete chats[chatId];
      this.saveAllChats(chats);
    }

    if (chatId === this.conversationId) {
      this.createNewChat();
    } else if (this.renderChatHistoryCallback) {
      await this.renderChatHistoryCallback();
    }
  }

  // Format date for display
  formatDate(isoString) {
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
  async renderChatHistory(historyListEl) {
    const chats = await this.getAllChats();
    const chatArray = Object.values(chats).sort((a, b) =>
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );

    historyListEl.innerHTML = '';

    if (chatArray.length === 0) {
      historyListEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 14px;">No chat history yet</div>';
      return;
    }

    const self = this;
    chatArray.forEach(chat => {
      const item = document.createElement('div');
      item.classList.add('history-item');
      if (chat.id === this.conversationId) {
        item.classList.add('active');
      }

      item.innerHTML = `
        <div class="history-item-title">${chat.title || 'New Conversation'}</div>
        <div class="history-item-date">${this.formatDate(chat.updatedAt || chat.createdAt)}</div>
        <button class="history-item-delete" title="Delete conversation">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;

      // Add click handler for switching chats
      item.addEventListener('click', () => {
        if (self.switchToChatCallback) {
          self.switchToChatCallback(chat.id);
        }
      });

      // Add click handler for delete button
      const deleteBtn = item.querySelector('.history-item-delete');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        self.deleteChat(chat.id, e);
      });

      historyListEl.appendChild(item);
    });
  }

  // Toggle sidebar visibility
  toggleSidebar(sidebarEl) {
    sidebarEl.classList.toggle('hidden');
  }

  // Set callback for rendering chat history (used by agent-specific code)
  setRenderChatHistoryCallback(callback) {
    this.renderChatHistoryCallback = callback;
  }

  // Set callback for switching chats (used by agent-specific code)
  setSwitchToChatCallback(callback) {
    this.switchToChatCallback = callback;
  }
}

// Export for use in agent-specific scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgentBase;
}
