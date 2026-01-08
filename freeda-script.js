// Freeda.ai - Script for menopause companion chat
const chatContainer = document.getElementById('chat');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const quickButtons = document.querySelectorAll('.quick-btn');
const fileUploadBtn = document.getElementById('file-upload-btn');
const fileInput = document.getElementById('file-input');

// Generate or retrieve conversation ID
const conversationId = localStorage.getItem('freeda_conversation_id') || crypto.randomUUID();
localStorage.setItem('freeda_conversation_id', conversationId);

let loadingMessageEl = null;
let thinkingContainerEl = null;
let hasStartedChat = false;
const newChatBtn = document.getElementById('new-chat-btn');

//const baseURL = 'https://general-flex-dot-aspect-agents.oa.r.appspot.com';
const baseURL = 'http://localhost:3000';

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
    const url = baseURL + '/api/finance-assistant/stream';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        conversationId: conversationId
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

// Focus input on load
input.focus();
