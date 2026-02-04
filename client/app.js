// API Base URL
const API_BASE_URL = 'http://localhost:8081';

// DOM Elements
const dataForm = document.getElementById('dataForm');
const contentInput = document.getElementById('content');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const viewAllBtn = document.getElementById('viewAllBtn');
const dataContainer = document.getElementById('dataContainer');
const totalCount = document.getElementById('totalCount');
const loadingIndicator = document.getElementById('loadingIndicator');
const paginationNav = document.getElementById('paginationNav');
const paginationList = document.getElementById('paginationList');

// Modal Elements
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editId = document.getElementById('editId');
const editContent = document.getElementById('editContent');
const saveEditBtn = document.getElementById('saveEditBtn');

// State
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadData(currentPage);
    
    // Event listeners
    dataForm.addEventListener('submit', handleFormSubmit);
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    refreshBtn.addEventListener('click', () => loadData(currentPage));
    viewAllBtn.addEventListener('click', () => {
        currentSearch = '';
        searchInput.value = '';
        loadData(1);
    });
    saveEditBtn.addEventListener('click', handleEditSave);
    
    // Initialize Bootstrap modal
    const bsEditModal = new bootstrap.Modal(editModal);
});

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const content = contentInput.value.trim();
    if (!content) {
        showAlert('Please enter some content', 'danger');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/api/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            contentInput.value = '';
            showAlert('Entry saved successfully!', 'success');
            loadData(currentPage); // Refresh the list
        } else {
            showAlert(result.error || 'Failed to save entry', 'danger');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'danger');
    } finally {
        showLoading(false);
    }
}

// Load data with pagination
async function loadData(page = 1) {
    showLoading(true);
    
    try {
        let url = `${API_BASE_URL}/api/data?page=${page}&limit=10`;
        if (currentSearch) {
            url = `${API_BASE_URL}/api/search?q=${encodeURIComponent(currentSearch)}&page=${page}&limit=10`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (response.ok) {
            displayData(result.data);
            updatePagination(result.pagination);
        } else {
            showAlert(result.error || 'Failed to load data', 'danger');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'danger');
    } finally {
        showLoading(false);
    }
}

// Display data in the container
function displayData(data) {
    if (!data || data.length === 0) {
        dataContainer.innerHTML = '<div class="alert alert-info">No data found.</div>';
        totalCount.textContent = '0';
        return;
    }
    
    totalCount.textContent = data.length;
    
    const html = data.map(item => `
        <div class="data-item fade-in ${currentSearch ? 'search-result' : ''}">
            <div class="item-header">
                <span class="item-id">#${item.id}</span>
                <span class="item-date">${formatDate(item.timestamp)}</span>
            </div>
            <div class="item-content">
                ${highlightSearchTerms(item.content, currentSearch)}
            </div>
            <div class="item-actions">
                <button class="btn btn-sm btn-outline-primary btn-icon" onclick="editItem(${item.id}, '${escapeHtml(item.content)}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger btn-icon" onclick="deleteItem(${item.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    dataContainer.innerHTML = html;
}

// Update pagination controls
function updatePagination(pagination) {
    currentPage = pagination.currentPage;
    totalPages = pagination.totalPages || 1;
    
    if (totalPages <= 1) {
        paginationNav.style.display = 'none';
        return;
    }
    
    paginationNav.style.display = 'block';
    
    let paginationHtml = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHtml += `<li class="page-item">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        paginationHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHtml += `<li class="page-item">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>`;
    }
    
    paginationList.innerHTML = paginationHtml;
}

// Change page
function changePage(page) {
    loadData(page);
}

// Handle search
async function handleSearch() {
    currentSearch = searchInput.value.trim();
    if (!currentSearch) {
        loadData(1);
        return;
    }
    
    loadData(1);
}

// Edit item
function editItem(id, content) {
    editId.value = id;
    editContent.value = content;
    
    const modal = bootstrap.Modal.getInstance(editModal) || new bootstrap.Modal(editModal);
    modal.show();
}

// Handle edit save
async function handleEditSave() {
    const id = editId.value;
    const content = editContent.value.trim();
    
    if (!content) {
        showAlert('Please enter content', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/data/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(editModal);
            modal.hide();
            showAlert('Entry updated successfully!', 'success');
            loadData(currentPage);
        } else {
            showAlert(result.error || 'Failed to update entry', 'danger');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'danger');
    }
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/data/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Entry deleted successfully!', 'success');
            loadData(currentPage);
        } else {
            showAlert(result.error || 'Failed to delete entry', 'danger');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'danger');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function highlightSearchTerms(text, searchTerm) {
    if (!searchTerm) return escapeHtml(text);
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="highlight">$1</mark>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert-fixed');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show alert-fixed`;
    alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function showLoading(show) {
    if (show) {
        loadingIndicator.style.display = 'block';
        dataContainer.style.opacity = '0.5';
    } else {
        loadingIndicator.style.display = 'none';
        dataContainer.style.opacity = '1';
    }
}

// Expose functions to global scope for inline event handlers
window.editItem = editItem;
window.deleteItem = deleteItem;
window.changePage = changePage;