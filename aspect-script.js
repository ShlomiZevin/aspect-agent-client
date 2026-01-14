// Aspect Finance BI Assistant - Agent-specific configuration

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
  baseURL: 'http://localhost:3000', // Change to production URL when deploying
  //baseURL: 'https://aspect-agent-server-1018338671074.europe-west1.run.app',
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
