// Freeda.ai - Script for menopause companion chat
const chatContainer = document.getElementById('chat');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const quickButtons = document.querySelectorAll('.quick-btn');

// Generate or retrieve conversation ID
const conversationId = localStorage.getItem('freeda_conversation_id') || crypto.randomUUID();
localStorage.setItem('freeda_conversation_id', conversationId);

let loadingMessageEl = null;
let hasStartedChat = false;
const newChatBtn = document.getElementById('new-chat-btn');

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
const addMessage = (text, sender = 'bot') => {
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

// Send message to server
const sendMessage = async (messageText) => {
  addMessage(messageText, 'user');
  input.value = '';
  showTypingIndicator();

  try {
    const res = await fetch('http://localhost:3000/api/finance-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        conversationId: conversationId
      })
    });

    const data = await res.json();
    removeTypingIndicator();
    addMessage(data.reply, 'bot');
  } catch (err) {
    removeTypingIndicator();
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
  // Clear all messages
  const messages = chatContainer.querySelectorAll('.message');
  messages.forEach(msg => msg.remove());

  // Reset conversation
  hasStartedChat = false;
  newChatBtn.style.display = 'none';

  // Generate new conversation ID
  const newConversationId = crypto.randomUUID();
  localStorage.setItem('freeda_conversation_id', newConversationId);
  location.reload(); // Reload to show welcome screen
});

// Focus input on load
input.focus();
