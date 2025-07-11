// Main JavaScript file for Gold Shop Management System

// Persian number formatting
function formatPersianNumber(num) {
    if (num === null || num === undefined) return '';
    return new Intl.NumberFormat('fa-IR').format(num);
}

// Convert English numbers to Persian
function toPersianDigits(str) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit)]);
}

// Convert Persian numbers to English
function toEnglishDigits(str) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/[۰-۹]/g, (digit) => persianDigits.indexOf(digit).toString());
}

// Loading spinner
function showLoading(element) {
    if (element) {
        element.innerHTML = '<span class="loading"></span> در حال بارگذاری...';
        element.disabled = true;
    }
}

function hideLoading(element, originalText) {
    if (element) {
        element.innerHTML = originalText;
        element.disabled = false;
    }
}

// Confirmation dialog
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; float: left; cursor: pointer;">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 300px;
    `;
    document.body.appendChild(container);
    return container;
}

// Form validation helpers
function validateRequired(element, message) {
    if (!element.value.trim()) {
        showFieldError(element, message);
        return false;
    }
    clearFieldError(element);
    return true;
}

function validateNumber(element, message) {
    if (isNaN(parseFloat(element.value)) || !isFinite(element.value)) {
        showFieldError(element, message);
        return false;
    }
    clearFieldError(element);
    return true;
}

function showFieldError(element, message) {
    clearFieldError(element);
    element.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 5px;';
    
    element.parentElement.appendChild(errorDiv);
}

function clearFieldError(element) {
    element.classList.remove('error');
    const existingError = element.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Auto-save functionality
function autoSave(formId, endpoint) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            const formData = new FormData(form);
            
            fetch(endpoint, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('تغییرات ذخیره شد', 'success');
                }
            })
            .catch(error => {
                console.error('Auto-save error:', error);
            });
        });
    });
}

// Print functionality
function printElement(elementId) {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;
    
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    location.reload(); // Reload to restore functionality
}

// Search functionality
function setupTableSearch(tableId, searchInputId) {
    const searchInput = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);
    
    if (!searchInput || !table) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const text = row.textContent.toLowerCase();
            
            if (text.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// File upload preview
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 5px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add Persian number formatting to all number inputs
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value) {
                this.dataset.originalValue = this.value;
            }
        });
    });
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    });
    
    // Add hover effects to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Export functions for use in other scripts
window.goldShop = {
    formatPersianNumber,
    toPersianDigits,
    toEnglishDigits,
    showLoading,
    hideLoading,
    confirmAction,
    showToast,
    validateRequired,
    validateNumber,
    autoSave,
    printElement,
    setupTableSearch,
    setupImagePreview
}; 