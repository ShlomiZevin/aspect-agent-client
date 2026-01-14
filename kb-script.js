// Knowledge Base Manager - Client-side Script with Real API Integration

// API Configuration
const baseURL = 'https://aspect-agent-server-1018338671074.europe-west1.run.app';
//const baseURL = 'http://localhost:3000'; // Uncomment for local development
const AGENT_NAME = 'Freeda 2.0';

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

// Load saved theme
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  sunIcon.style.display = 'none';
  moonIcon.style.display = 'block';
}

themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
});

// Back to chat button
document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = 'freeda.html';
});

// Data storage
let knowledgeBases = [];
let selectedKB = null;

// Loading indicator
let loadingOverlay = null;

// DOM elements
const kbList = document.getElementById('kb-list');
const kbDetailsSection = document.getElementById('kb-details-section');
const kbSection = document.querySelector('.kb-section');
const filesTableBody = document.getElementById('files-table-body');
const emptyState = document.getElementById('empty-state');
const backToListBtn = document.getElementById('back-to-list-btn');
const uploadFileBtn = document.getElementById('upload-file-btn');
const fileInput = document.getElementById('file-input');
const uploadModal = document.getElementById('upload-modal');
const createKBModal = document.getElementById('create-kb-modal');
const createKBBtn = document.getElementById('create-kb-btn');

// Initialize the page
loadKnowledgeBases();

// ========== API FUNCTIONS ==========

// Load knowledge bases from server
async function loadKnowledgeBases() {
  try {
    showLoading('Loading knowledge bases...');
    const response = await fetch(`${baseURL}/api/kb/list/${AGENT_NAME}`);

    if (!response.ok) {
      throw new Error(`Failed to load knowledge bases: ${response.statusText}`);
    }

    const data = await response.json();
    knowledgeBases = data.knowledgeBases;

    hideLoading();
    renderKnowledgeBases();
  } catch (error) {
    console.error('Error loading knowledge bases:', error);
    hideLoading();
    showNotification('Failed to load knowledge bases: ' + error.message, 'error');
  }
}

// Load files for a specific knowledge base
async function loadKBFiles(kbId) {
  try {
    showLoading('Loading files...');
    const response = await fetch(`${baseURL}/api/kb/${kbId}/files`);

    if (!response.ok) {
      throw new Error(`Failed to load files: ${response.statusText}`);
    }

    const data = await response.json();
    selectedKB.files = data.files;

    hideLoading();
    renderFiles();
  } catch (error) {
    console.error('Error loading files:', error);
    hideLoading();
    showNotification('Failed to load files: ' + error.message, 'error');
  }
}

// Render all knowledge bases
function renderKnowledgeBases() {
  kbList.innerHTML = '';

  if (knowledgeBases.length === 0) {
    kbList.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; display: block;">
        <div class="empty-icon">📚</div>
        <h3>No knowledge bases yet</h3>
        <p>Create your first knowledge base to get started</p>
      </div>
    `;
    return;
  }

  knowledgeBases.forEach(kb => {
    const kbCard = document.createElement('div');
    kbCard.className = 'kb-card';
    kbCard.onclick = () => selectKnowledgeBase(kb.id);

    kbCard.innerHTML = `
      <div class="kb-card-header">
        <div class="kb-card-icon">📚</div>
        <button class="kb-card-menu" onclick="event.stopPropagation(); showKBMenu('${kb.id}')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </div>
      <div class="kb-card-name">${kb.name}</div>
      <div class="kb-card-id">${kb.vectorStoreId}</div>
      <div class="kb-card-stats">
        <div class="kb-stat">
          <div class="kb-stat-value">${kb.fileCount || 0}</div>
          <div class="kb-stat-label">Files</div>
        </div>
        <div class="kb-stat">
          <div class="kb-stat-value">${formatBytes(kb.totalSize || 0)}</div>
          <div class="kb-stat-label">Total Size</div>
        </div>
      </div>
    `;

    kbList.appendChild(kbCard);
  });
}

// Select a knowledge base to view details
function selectKnowledgeBase(kbId) {
  selectedKB = knowledgeBases.find(kb => kb.id === kbId);
  if (!selectedKB) return;

  // Update UI
  document.getElementById('kb-detail-name').textContent = selectedKB.name;
  document.getElementById('kb-detail-id').textContent = `Vector Store ID: ${selectedKB.vectorStoreId}`;

  // Show details, hide list
  kbSection.style.display = 'none';
  kbDetailsSection.style.display = 'block';

  // Load files from server
  loadKBFiles(kbId);
}

// Render files for selected knowledge base
function renderFiles() {
  if (!selectedKB || !selectedKB.files || selectedKB.files.length === 0) {
    filesTableBody.parentElement.parentElement.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  filesTableBody.parentElement.parentElement.style.display = 'block';
  emptyState.style.display = 'none';
  filesTableBody.innerHTML = '';

  selectedKB.files.forEach(file => {
    const row = document.createElement('tr');

    const fileIcon = getFileIcon(file.fileName);
    const formattedSize = formatBytes(file.fileSize);
    const formattedDate = formatDate(file.createdAt);

    row.innerHTML = `
      <td>
        <div class="file-name">
          <span class="file-icon">${fileIcon}</span>
          <span>${file.fileName}</span>
        </div>
      </td>
      <td>
        <div class="file-tags">
          ${(file.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </td>
      <td><span class="file-size">${formattedSize}</span></td>
      <td><span class="file-date">${formattedDate}</span></td>
      <td>
        <div class="file-actions">
          <button class="icon-btn" onclick="downloadFile('${file.openaiFileId}')" title="Download">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button class="icon-btn delete" onclick="deleteFile('${file.openaiFileId}')" title="Delete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    `;

    filesTableBody.appendChild(row);
  });
}

// Back to list button
backToListBtn.addEventListener('click', () => {
  selectedKB = null;
  kbDetailsSection.style.display = 'none';
  kbSection.style.display = 'block';
});

// Upload modal handlers
uploadFileBtn.addEventListener('click', () => {
  uploadModal.style.display = 'flex';
});

document.getElementById('modal-close').addEventListener('click', () => {
  uploadModal.style.display = 'none';
  resetUploadModal();
});

document.getElementById('cancel-upload').addEventListener('click', () => {
  uploadModal.style.display = 'none';
  resetUploadModal();
});

// Create KB modal handlers
createKBBtn.addEventListener('click', () => {
  createKBModal.style.display = 'flex';
});

document.getElementById('create-kb-modal-close').addEventListener('click', () => {
  createKBModal.style.display = 'none';
  resetCreateKBModal();
});

document.getElementById('cancel-create-kb').addEventListener('click', () => {
  createKBModal.style.display = 'none';
  resetCreateKBModal();
});

document.getElementById('confirm-create-kb').addEventListener('click', async () => {
  const name = document.getElementById('kb-name').value.trim();
  const description = document.getElementById('kb-description').value.trim();

  if (!name) {
    alert('Please enter a knowledge base name');
    return;
  }

  try {
    showLoading('Creating knowledge base...');

    const response = await fetch(`${baseURL}/api/kb/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentName: AGENT_NAME,
        name,
        description
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create knowledge base');
    }

    const data = await response.json();

    hideLoading();
    createKBModal.style.display = 'none';
    resetCreateKBModal();

    showNotification('Knowledge base created successfully!', 'success');

    // Reload knowledge bases
    await loadKnowledgeBases();
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    hideLoading();
    showNotification('Failed to create knowledge base: ' + error.message, 'error');
  }
});

// File upload area
const uploadArea = document.getElementById('upload-area');
const selectedFilesDiv = document.getElementById('selected-files');
const selectedFilesList = document.getElementById('selected-files-list');
let filesToUpload = [];

uploadArea.addEventListener('click', () => {
  fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');

  const files = Array.from(e.dataTransfer.files);
  handleFileSelection(files);
});

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  handleFileSelection(files);
});

function handleFileSelection(files) {
  filesToUpload = files;

  if (files.length > 0) {
    selectedFilesDiv.style.display = 'block';
    selectedFilesList.innerHTML = '';

    // Check for duplicates to show warnings
    const existingFiles = selectedKB ? (selectedKB.files || []) : [];

    files.forEach((file, index) => {
      // Check if this file has conflicts
      const nameMatch = existingFiles.find(ef => ef.fileName === file.name);
      const sizeMatch = existingFiles.find(ef => ef.fileSize === file.size && ef.fileName !== file.name);

      let warningBadge = '';
      if (nameMatch) {
        warningBadge = '<span class="duplicate-badge same-name" title="File with same name exists">⚠️ Same Name</span>';
      } else if (sizeMatch) {
        warningBadge = '<span class="duplicate-badge same-size" title="File with same size exists">⚠️ Same Size</span>';
      }

      const fileItem = document.createElement('div');
      fileItem.className = 'selected-file-item';
      fileItem.innerHTML = `
        <div class="selected-file-info">
          <span class="file-icon">${getFileIcon(file.name)}</span>
          <div>
            <div class="selected-file-name">${file.name}</div>
            <div class="selected-file-size">${formatBytes(file.size)} ${warningBadge}</div>
          </div>
        </div>
        <button class="remove-file-btn" onclick="removeFile(${index})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
      selectedFilesList.appendChild(fileItem);
    });
  } else {
    selectedFilesDiv.style.display = 'none';
  }
}

function removeFile(index) {
  filesToUpload = Array.from(filesToUpload).filter((_, i) => i !== index);
  handleFileSelection(filesToUpload);
}

document.getElementById('confirm-upload').addEventListener('click', async () => {
  if (!selectedKB) return;
  if (filesToUpload.length === 0) {
    alert('Please select files to upload');
    return;
  }

  // Check for duplicate files
  const existingFiles = selectedKB.files || [];
  const duplicates = {
    sameName: [],
    sameSize: []
  };

  for (const file of filesToUpload) {
    // Check for exact name match
    const nameMatch = existingFiles.find(ef => ef.fileName === file.name);
    if (nameMatch) {
      duplicates.sameName.push(file.name);
    }

    // Check for same size (different name)
    const sizeMatch = existingFiles.find(ef => ef.fileSize === file.size && ef.fileName !== file.name);
    if (sizeMatch) {
      duplicates.sameSize.push(`${file.name} (${formatBytes(file.size)})`);
    }
  }

  // Show warning if duplicates found
  if (duplicates.sameName.length > 0 || duplicates.sameSize.length > 0) {
    let warningMsg = 'Warning: Duplicate files detected!\n\n';

    if (duplicates.sameName.length > 0) {
      warningMsg += `${duplicates.sameName.length} file(s) with same name already exist.\n`;
    }

    if (duplicates.sameSize.length > 0) {
      warningMsg += `${duplicates.sameSize.length} file(s) with same size already exist.\n`;
    }

    warningMsg += '\nDo you want to upload anyway?';

    if (!confirm(warningMsg)) {
      return;
    }
  }

  const tags = document.getElementById('file-tags').value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag !== '');

  try {
    const fileCount = filesToUpload.length; // Store count before clearing
    showLoading(`Uploading ${fileCount} file(s)...`);

    // Upload files one by one
    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tags', JSON.stringify(tags));

      const response = await fetch(`${baseURL}/api/kb/${selectedKB.id}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to upload ${file.name}`);
      }
    }

    hideLoading();
    uploadModal.style.display = 'none';
    resetUploadModal();

    showNotification(`${fileCount} file(s) uploaded successfully!`, 'success');

    // Reload files
    await loadKBFiles(selectedKB.id);
    await loadKnowledgeBases();
  } catch (error) {
    console.error('Error uploading files:', error);
    hideLoading();
    showNotification('Failed to upload files: ' + error.message, 'error');
  }
});

function resetUploadModal() {
  filesToUpload = [];
  fileInput.value = '';
  document.getElementById('file-tags').value = '';
  selectedFilesDiv.style.display = 'none';
  selectedFilesList.innerHTML = '';
}

function resetCreateKBModal() {
  document.getElementById('kb-name').value = '';
  document.getElementById('kb-description').value = '';
}

// File actions
function downloadFile(fileId) {
  // Download functionality not implemented yet
  showNotification('Download feature coming soon', 'info');
  console.log('Downloading file:', fileId);
}

async function deleteFile(fileId) {
  if (!selectedKB) return;

  if (!confirm('Are you sure you want to delete this file?')) {
    return;
  }

  try {
    showLoading('Deleting file...');

    const response = await fetch(`${baseURL}/api/kb/${selectedKB.id}/files/${fileId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete file');
    }

    hideLoading();
    showNotification('File deleted successfully', 'success');

    // Reload files
    await loadKBFiles(selectedKB.id);
    await loadKnowledgeBases();
  } catch (error) {
    console.error('Error deleting file:', error);
    hideLoading();
    showNotification('Failed to delete file: ' + error.message, 'error');
  }
}

function showKBMenu(kbId) {
  // Mock menu - could be implemented with a dropdown
  console.log('Show menu for KB:', kbId);
  alert('KB menu not yet implemented (mock)');
}

// Utility functions
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const iconMap = {
    'pdf': '📄',
    'doc': '📝',
    'docx': '📝',
    'txt': '📃',
    'csv': '📊',
    'json': '📋',
    'xlsx': '📊',
    'xls': '📊'
  };
  return iconMap[ext] || '📎';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();

  // Set both dates to midnight for accurate day comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = nowOnly - dateOnly;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

function showNotification(message, type = 'info') {
  // Simple notification - could be enhanced with a toast component
  alert(message);
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Loading indicator functions
function showLoading(message = 'Loading...') {
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      color: white;
      font-size: 18px;
      font-weight: 600;
    `;
    document.body.appendChild(loadingOverlay);
  }
  loadingOverlay.textContent = message;
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

// Close modals when clicking outside
uploadModal.addEventListener('click', (e) => {
  if (e.target === uploadModal) {
    uploadModal.style.display = 'none';
    resetUploadModal();
  }
});

createKBModal.addEventListener('click', (e) => {
  if (e.target === createKBModal) {
    createKBModal.style.display = 'none';
    resetCreateKBModal();
  }
});
