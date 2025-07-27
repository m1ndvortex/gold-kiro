/**
 * Gold Account Management JavaScript
 * Handles gold transaction forms, validation, and Persian date conversion
 */

class GoldAccountManager {
    constructor(customerId) {
        this.customerId = customerId;
        this.currentEditingTransactionId = null;
        this.loadingStates = new Set();
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeDatePicker();
        this.initializeBalanceDisplay();
        this.setupPeriodicUpdates();
        this.initializeNetworkMonitor();
        this.initializeErrorRecovery();
    }

    // Initialize network connection monitoring
    initializeNetworkMonitor() {
        // Create network status indicator
        this.createNetworkStatusIndicator();
        
        // Monitor online/offline events
        window.addEventListener('online', () => {
            this.updateNetworkStatus(true);
            this.showSuccess('اتصال اینترنت برقرار شد', 3000);
            // Retry failed operations
            this.retryFailedOperations();
        });
        
        window.addEventListener('offline', () => {
            this.updateNetworkStatus(false);
            this.showError('اتصال اینترنت قطع شده است', 0); // Don't auto-hide
        });
        
        // Initial status
        this.updateNetworkStatus(navigator.onLine);
    }

    createNetworkStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'networkStatus';
        indicator.className = 'network-status';
        indicator.style.display = 'none'; // Initially hidden
        document.body.appendChild(indicator);
    }

    updateNetworkStatus(isOnline) {
        const indicator = document.getElementById('networkStatus');
        if (!indicator) return;
        
        if (isOnline) {
            indicator.className = 'network-status online';
            indicator.innerHTML = '<i class="fas fa-wifi"></i> آنلاین';
            // Hide after 3 seconds if online
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        } else {
            indicator.className = 'network-status offline';
            indicator.innerHTML = '<i class="fas fa-wifi-slash"></i> آفلاین';
            indicator.style.display = 'block';
        }
    }

    // Initialize error recovery mechanisms
    initializeErrorRecovery() {
        this.failedOperations = [];
        
        // Set up periodic retry for failed operations
        setInterval(() => {
            if (navigator.onLine && this.failedOperations.length > 0) {
                this.retryFailedOperations();
            }
        }, 30000); // Retry every 30 seconds
    }

    // Store failed operations for retry
    storeFailedOperation(operation) {
        this.failedOperations.push({
            ...operation,
            timestamp: Date.now(),
            retryCount: 0
        });
        
        // Limit stored operations
        if (this.failedOperations.length > 10) {
            this.failedOperations.shift();
        }
    }

    // Retry failed operations when connection is restored
    async retryFailedOperations() {
        if (this.failedOperations.length === 0) return;
        
        console.log('Retrying failed operations:', this.failedOperations.length);
        
        const operationsToRetry = [...this.failedOperations];
        this.failedOperations = [];
        
        for (const operation of operationsToRetry) {
            if (operation.retryCount >= 3) continue; // Max 3 retries
            
            try {
                await this.executeOperation(operation);
                console.log('Successfully retried operation:', operation.type);
            } catch (error) {
                operation.retryCount++;
                if (operation.retryCount < 3) {
                    this.failedOperations.push(operation);
                }
                console.error('Failed to retry operation:', operation.type, error);
            }
        }
    }

    // Execute stored operation
    async executeOperation(operation) {
        switch (operation.type) {
            case 'add':
                return await this.addTransaction(operation.data);
            case 'update':
                return await this.updateTransaction(operation.transactionId, operation.data);
            case 'delete':
                return await this.deleteTransaction(operation.transactionId);
            default:
                throw new Error('Unknown operation type');
        }
    }

    initializeBalanceDisplay() {
        // Initialize balance display on page load
        this.updateBalanceDisplay();
    }

    setupPeriodicUpdates() {
        // Optional: Set up periodic balance updates (every 30 seconds)
        // This can be useful if multiple users are working on the same customer
        if (window.goldAccountAutoRefresh !== false) {
            setInterval(() => {
                // Only update if not currently performing operations
                if (this.loadingStates.size === 0) {
                    this.updateBalanceDisplay();
                }
            }, 30000);
        }
    }

    // Utility method to get current customer balance from UI
    getCurrentBalance() {
        const balanceElement = document.querySelector('.gold-balance-display .balance-amount');
        if (!balanceElement) return 0;
        
        const balanceText = balanceElement.textContent || '0';
        const balance = parseFloat(balanceText) || 0;
        
        // Check if it's negative (debt)
        const statusElement = document.querySelector('.gold-balance-display .balance-status');
        const isDebt = statusElement && statusElement.textContent.includes('بدهکار');
        
        return isDebt ? -balance : balance;
    }

    // Method to validate transaction before submission
    validateTransactionData(data) {
        const errors = [];
        
        if (!data.transaction_date) {
            errors.push('تاریخ الزامی است');
        }
        
        if (!data.transaction_type || !['debit', 'credit'].includes(data.transaction_type)) {
            errors.push('نوع تراکنش نامعتبر است');
        }
        
        if (!data.amount_grams || data.amount_grams <= 0) {
            errors.push('مقدار باید عدد مثبت باشد');
        }
        
        if (!data.description || data.description.trim().length < 5) {
            errors.push('توضیحات باید حداقل 5 کاراکتر باشد');
        }
        
        return errors;
    }

    // Enhanced form submission with validation
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();
        
        // Additional server-side validation
        const validationErrors = this.validateTransactionData(formData);
        if (validationErrors.length > 0) {
            this.showError('❌ خطاهای اعتبارسنجی:\n' + validationErrors.join('\n'));
            return;
        }

        this.setLoadingState(true);

        if (this.currentEditingTransactionId) {
            await this.updateTransaction(this.currentEditingTransactionId, formData);
        } else {
            await this.addTransaction(formData);
        }
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('goldTransactionForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Modal close events
        const modal = document.getElementById('goldTransactionModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closeModal();
            }
            
            // Ctrl+N to add new transaction (when not in modal)
            if (e.ctrlKey && e.key === 'n' && !this.isModalOpen()) {
                e.preventDefault();
                this.showAddModal();
            }
            
            // Ctrl+S to save form (when in modal)
            if (e.ctrlKey && e.key === 's' && this.isModalOpen()) {
                e.preventDefault();
                const form = document.getElementById('goldTransactionForm');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });

        // Real-time validation
        this.bindRealTimeValidation();
    }

    bindRealTimeValidation() {
        const fields = ['transactionDate', 'transactionType', 'amountGrams', 'description'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldId));
                field.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });
    }

    initializeDatePicker() {
        const dateInput = document.getElementById('transactionDate');
        if (dateInput) {
            // Add Persian date input mask
            dateInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d]/g, '');
                if (value.length >= 4) {
                    value = value.substring(0, 4) + '/' + value.substring(4);
                }
                if (value.length >= 7) {
                    value = value.substring(0, 7) + '/' + value.substring(7, 9);
                }
                e.target.value = value;
            });

            // Set today's date as default
            this.setTodayDate();
        }
    }

    showAddModal() {
        this.currentEditingTransactionId = null;
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-plus"></i> افزودن تراکنش طلا';
        }
        this.resetForm();
        this.setTodayDate();
        this.updateSubmitButtonText();
        this.showModal();
    }

    showEditModal(transactionId, transactionData) {
        this.currentEditingTransactionId = transactionId;
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> ویرایش تراکنش طلا';
        }
        this.fillForm(transactionData);
        this.updateSubmitButtonText();
        this.showModal();
    }

    async editTransaction(transactionId) {
        this.setOperationLoading('fetch', true);
        
        try {
            const response = await this.makeRequest(`/customers/${this.customerId}/gold-transactions/${transactionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success && result.transaction) {
                this.showEditModal(transactionId, result.transaction);
            } else {
                this.showError('❌ خطا در دریافت اطلاعات تراکنش: ' + (result.message || 'تراکنش یافت نشد'));
            }
        } catch (error) {
            console.error('Error fetching transaction:', error);
            this.handleError(error, 'دریافت اطلاعات تراکنش');
        } finally {
            this.setOperationLoading('fetch', false);
        }
    }

    showModal() {
        const modal = document.getElementById('goldTransactionModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('gold-modal');
            // Focus on first input
            setTimeout(() => {
                const firstInput = modal.querySelector('input, select, textarea');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    closeModal() {
        const modal = document.getElementById('goldTransactionModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('gold-modal');
        }
        this.currentEditingTransactionId = null;
        this.clearAllErrors();
        
        // Clear all loading states when closing modal
        this.clearAllLoadingStates();
    }

    // Force clear all loading states
    clearAllLoadingStates() {
        console.log('Clearing all loading states');
        this.loadingStates.clear();
        this.updateUILoadingState();
        
        // Force remove loading classes from all elements
        const loadingElements = document.querySelectorAll('.loading, .gold-loading');
        loadingElements.forEach(element => {
            element.classList.remove('loading', 'gold-loading');
        });
        
        // Reset all buttons to normal state
        const buttons = document.querySelectorAll('.gold-form-btn, .gold-action-btn');
        buttons.forEach(button => {
            button.disabled = false;
            button.classList.remove('loading');
        });
        
        // Reset submit button specifically
        const submitBtn = document.querySelector('.gold-form-btn.primary');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            const icon = this.currentEditingTransactionId ? 'fa-edit' : 'fa-save';
            const text = this.currentEditingTransactionId ? 'بروزرسانی تراکنش' : 'ذخیره تراکنش';
            submitBtn.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
        }
    }

    isModalOpen() {
        const modal = document.getElementById('goldTransactionModal');
        return modal && modal.style.display === 'flex';
    }

    resetForm() {
        const form = document.getElementById('goldTransactionForm');
        if (form) {
            form.reset();
            this.clearAllErrors();
        }
    }

    fillForm(data) {
        document.getElementById('transactionDate').value = this.convertToDisplayDate(data.transaction_date);
        document.getElementById('transactionType').value = data.transaction_type;
        document.getElementById('amountGrams').value = data.amount_grams;
        document.getElementById('description').value = data.description;
    }



    getFormData() {
        const data = {
            transaction_date: document.getElementById('transactionDate').value,
            transaction_type: document.getElementById('transactionType').value,
            amount_grams: parseFloat(document.getElementById('amountGrams').value),
            description: document.getElementById('description').value.trim()
        };

        // Convert Persian date to Gregorian for backend
        const gregorianDate = this.convertPersianToGregorian(data.transaction_date);
        if (gregorianDate) {
            data.transaction_date = gregorianDate.toISOString().split('T')[0];
        }

        return data;
    }

    async addTransaction(data) {
        console.log('Starting addTransaction');
        this.setOperationLoading('add', true);
        
        try {
            const response = await this.makeRequest(`/customers/${this.customerId}/gold-transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('✅ تراکنش طلا با موفقیت ثبت شد');
                this.closeModal();
                
                // Refresh data
                await this.refreshTransactionList();
                await this.updateBalanceDisplay();
            } else {
                this.showError('❌ خطا در ثبت تراکنش: ' + result.message);
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            this.handleError(error, 'ثبت تراکنش');
        } finally {
            console.log('Finishing addTransaction, clearing loading state');
            this.setOperationLoading('add', false);
            
            // Force clear loading state after a delay
            setTimeout(() => {
                this.loadingStates.clear();
                this.updateUILoadingState();
            }, 200);
        }
    }

    async updateTransaction(transactionId, data) {
        console.log('Starting updateTransaction');
        this.setOperationLoading('update', true);
        
        try {
            const response = await this.makeRequest(`/customers/${this.customerId}/gold-transactions/${transactionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('✅ تراکنش طلا با موفقیت بروزرسانی شد');
                this.closeModal();
                await this.refreshTransactionList();
                await this.updateBalanceDisplay();
            } else {
                this.showError('❌ خطا در بروزرسانی تراکنش: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            this.handleError(error, 'بروزرسانی تراکنش');
        } finally {
            console.log('Finishing updateTransaction, clearing loading state');
            this.setOperationLoading('update', false);
            
            // Force clear loading state after a delay
            setTimeout(() => {
                this.loadingStates.clear();
                this.updateUILoadingState();
            }, 200);
        }
    }

    async deleteTransaction(transactionId) {
        if (!this.showConfirmDialog('آیا از حذف این تراکنش طلا اطمینان دارید؟')) {
            return;
        }

        this.setOperationLoading('delete', true);
        
        try {
            const response = await this.makeRequest(`/customers/${this.customerId}/gold-transactions/${transactionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('✅ تراکنش طلا با موفقیت حذف شد');
                await this.refreshTransactionList();
                this.updateBalanceDisplay();
            } else {
                this.showError('❌ خطا در حذف تراکنش: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.handleError(error, 'حذف تراکنش');
        } finally {
            this.setOperationLoading('delete', false);
        }
    }

    // Validation Methods
    validateForm() {
        this.clearAllErrors();
        let isValid = true;

        // Validate date
        if (!this.validateField('transactionDate')) isValid = false;
        
        // Validate transaction type
        if (!this.validateField('transactionType')) isValid = false;
        
        // Validate amount
        if (!this.validateField('amountGrams')) isValid = false;
        
        // Validate description
        if (!this.validateField('description')) isValid = false;

        return isValid;
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return true;

        let isValid = true;
        let errorMessage = '';

        switch (fieldId) {
            case 'transactionDate':
                const dateValue = field.value.trim();
                if (!dateValue) {
                    errorMessage = 'تاریخ الزامی است';
                    isValid = false;
                } else if (!this.isValidPersianDate(dateValue)) {
                    errorMessage = 'فرمت تاریخ صحیح نیست (مثال: 1403/01/15)';
                    isValid = false;
                } else {
                    const gregorianDate = this.convertPersianToGregorian(dateValue);
                    if (!gregorianDate || gregorianDate > new Date()) {
                        errorMessage = 'تاریخ نمی‌تواند از آینده باشد';
                        isValid = false;
                    }
                }
                break;

            case 'transactionType':
                if (!field.value) {
                    errorMessage = 'نوع تراکنش الزامی است';
                    isValid = false;
                }
                break;

            case 'amountGrams':
                const amountValue = parseFloat(field.value);
                if (!field.value || isNaN(amountValue) || amountValue <= 0) {
                    errorMessage = 'مقدار باید عدد مثبت باشد';
                    isValid = false;
                } else if (amountValue < 0.001) {
                    errorMessage = 'حداقل مقدار 0.001 گرم است';
                    isValid = false;
                }
                break;

            case 'description':
                const descValue = field.value.trim();
                if (!descValue) {
                    errorMessage = 'توضیحات الزامی است';
                    isValid = false;
                } else if (descValue.length < 5) {
                    errorMessage = 'توضیحات باید حداقل 5 کاراکتر باشد';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(fieldId, errorMessage);
        } else {
            this.clearFieldError(fieldId);
        }

        return isValid;
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        const formGroup = field.closest('.gold-form-group');
        if (!formGroup) return;
        
        formGroup.classList.add('has-error');
        field.classList.add('error');
        
        // Add shake animation for better UX
        field.classList.add('shake');
        setTimeout(() => field.classList.remove('shake'), 500);
        
        let errorDiv = formGroup.querySelector('.gold-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'gold-error-message';
            errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span class="error-text"></span>';
            formGroup.appendChild(errorDiv);
        }
        
        const errorText = errorDiv.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        } else {
            errorDiv.textContent = message;
        }
        
        errorDiv.style.display = 'block';
        
        // Auto-hide error after 5 seconds if field gets focus
        field.addEventListener('focus', () => {
            setTimeout(() => {
                if (!field.classList.contains('error')) {
                    this.clearFieldError(fieldId);
                }
            }, 5000);
        }, { once: true });
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.gold-form-group');
        
        formGroup.classList.remove('has-error');
        field.classList.remove('error');
        const errorDiv = formGroup.querySelector('.gold-error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    clearAllErrors() {
        const errorGroups = document.querySelectorAll('.gold-form-group.has-error');
        errorGroups.forEach(group => {
            group.classList.remove('has-error');
            const field = group.querySelector('.gold-form-control');
            if (field) field.classList.remove('error');
            const errorMsg = group.querySelector('.gold-error-message');
            if (errorMsg) {
                errorMsg.style.display = 'none';
            }
        });
    }

    // Persian Date Methods
    setTodayDate() {
        const today = new Date();
        const persianDate = this.convertToPersianDate(today);
        const dateInput = document.getElementById('transactionDate');
        if (dateInput) {
            dateInput.value = persianDate;
            console.log('تاریخ امروز (شمسی):', persianDate);
        }
    }

    convertToPersianDate(date) {
        // Simple but accurate Persian date conversion
        // Using approximation: Persian year = Gregorian year - 621/622
        const gYear = date.getFullYear();
        const gMonth = date.getMonth() + 1;
        const gDay = date.getDate();
        
        // Approximate Persian year (will be adjusted)
        let pYear = gYear - 621;
        
        // Create Persian new year date for this year
        let persianNewYear = new Date(gYear, 2, 21); // March 21st approximation
        
        // Adjust for leap years and exact new year date
        if (date < persianNewYear) {
            pYear--;
            persianNewYear = new Date(gYear - 1, 2, 21);
        }
        
        // Calculate days since Persian new year
        const daysSinceNewYear = Math.floor((date - persianNewYear) / (1000 * 60 * 60 * 24)) + 1;
        
        let pMonth, pDay;
        
        if (daysSinceNewYear <= 186) {
            // First 6 months (31 days each)
            pMonth = Math.ceil(daysSinceNewYear / 31);
            pDay = daysSinceNewYear - (pMonth - 1) * 31;
        } else {
            // Last 6 months
            const remainingDays = daysSinceNewYear - 186;
            if (remainingDays <= 150) { // Months 7-11 (30 days each)
                pMonth = 6 + Math.ceil(remainingDays / 30);
                pDay = remainingDays - (pMonth - 7) * 30;
            } else { // Month 12
                pMonth = 12;
                pDay = remainingDays - 150;
            }
        }
        
        // Ensure valid day
        if (pDay <= 0) {
            pMonth--;
            if (pMonth <= 0) {
                pMonth = 12;
                pYear--;
            }
            pDay = (pMonth <= 6) ? 31 : (pMonth < 12 ? 30 : 29);
        }
        
        const year = String(pYear).padStart(4, '0');
        const month = String(pMonth).padStart(2, '0');
        const day = String(pDay).padStart(2, '0');
        
        return `${year}/${month}/${day}`;
    }

    convertPersianToGregorian(persianDateStr) {
        try {
            const parts = persianDateStr.split('/');
            if (parts.length !== 3) return null;
            
            const pYear = parseInt(parts[0]);
            const pMonth = parseInt(parts[1]);
            const pDay = parseInt(parts[2]);
            
            // Validate Persian date ranges
            if (pYear < 1 || pMonth < 1 || pMonth > 12 || pDay < 1 || pDay > 31) {
                return null;
            }
            
            // Approximate Gregorian year
            const gYear = pYear + 621;
            
            // Persian new year is approximately March 21st
            const persianNewYear = new Date(gYear, 2, 21); // March 21st
            
            // Calculate days to add
            let daysToAdd = 0;
            
            // Add days for complete months
            for (let m = 1; m < pMonth; m++) {
                if (m <= 6) {
                    daysToAdd += 31; // First 6 months have 31 days
                } else {
                    daysToAdd += 30; // Next 5 months have 30 days
                }
            }
            
            // Add days in current month
            daysToAdd += pDay - 1;
            
            // Create the Gregorian date
            const gregorianDate = new Date(persianNewYear);
            gregorianDate.setDate(gregorianDate.getDate() + daysToAdd);
            
            return gregorianDate;
        } catch (error) {
            console.error('Error converting Persian date:', error);
            return null;
        }
    }

    convertToDisplayDate(dateStr) {
        // Convert from backend date format to display format
        if (!dateStr) return '';
        
        try {
            const date = new Date(dateStr);
            return this.convertToPersianDate(date);
        } catch (error) {
            return dateStr;
        }
    }

    isValidPersianDate(dateStr) {
        const regex = /^\d{4}\/\d{2}\/\d{2}$/;
        if (!regex.test(dateStr)) return false;
        
        const parts = dateStr.split('/');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        
        // Basic range validation
        if (year < 1300 || year > 1500 || month < 1 || month > 12 || day < 1) {
            return false;
        }
        
        // Persian calendar specific validation
        if (month <= 6 && day > 31) return false; // First 6 months have 31 days
        if (month > 6 && month <= 11 && day > 30) return false; // Months 7-11 have 30 days
        if (month === 12 && day > 29) {
            // Month 12 (Esfand) has 29 days in normal years, 30 in leap years
            const isLeapYear = this.isPersianLeapYear(year);
            if (!isLeapYear || day > 30) return false;
        }
        
        return true;
    }

    isPersianLeapYear(year) {
        // Persian leap year calculation
        const breaks = [
            -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
            1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
        ];
        
        const gy = year + 1595;
        let leap = -14;
        let jp = breaks[0];
        
        let jump = 0;
        for (let j = 1; j <= 19; j++) {
            const jm = breaks[j];
            jump = jm - jp;
            if (year < jm) break;
            leap += Math.floor(jump / 33) * 8 + Math.floor(((jump % 33) + 3) / 4);
            jp = jm;
        }
        
        let n = year - jp;
        if (n < jump) {
            leap += Math.floor(n / 33) * 8 + Math.floor(((n % 33) + 3) / 4);
            if ((jump % 33) === 4 && (jump - n) === 4) leap++;
        }
        
        return (leap + 4) % 33 < 5;
    }

    // Enhanced Network Request Handler with Retry Logic and Better Error Handling
    async makeRequest(url, options, retryCount = 0) {
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[${requestId}] Making request to ${url}, attempt ${retryCount + 1}`);
        
        // Check connection status before making request
        if (!navigator.onLine) {
            throw new Error('اتصال اینترنت برقرار نیست');
        }
        
        // Add timeout to options
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const requestOptions = {
            ...options,
            signal: controller.signal
        };
        
        try {
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            
            console.log(`[${requestId}] Response status: ${response.status}`);
            
            if (!response.ok) {
                // Try to get error details from response
                let errorData = null;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Response is not JSON
                }
                
                // Retry on server errors (5xx)
                if (response.status >= 500 && retryCount < this.maxRetries) {
                    console.log(`[${requestId}] Server error, retrying in ${1000 * (retryCount + 1)}ms`);
                    await this.delay(1000 * (retryCount + 1)); // Exponential backoff
                    return this.makeRequest(url, options, retryCount + 1);
                }
                
                // Create detailed error message
                let errorMessage = `خطای HTTP ${response.status}`;
                if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                } else if (response.status === 400) {
                    errorMessage = 'اطلاعات ارسالی نامعتبر است';
                } else if (response.status === 401) {
                    errorMessage = 'لطفاً دوباره وارد شوید';
                } else if (response.status === 403) {
                    errorMessage = 'دسترسی غیرمجاز';
                } else if (response.status === 404) {
                    errorMessage = 'اطلاعات درخواستی یافت نشد';
                } else if (response.status === 429) {
                    errorMessage = 'تعداد درخواست‌ها بیش از حد مجاز است';
                } else if (response.status >= 500) {
                    errorMessage = 'خطای سرور - لطفاً دوباره تلاش کنید';
                }
                
                const error = new Error(errorMessage);
                error.status = response.status;
                error.errorData = errorData;
                error.requestId = requestId;
                throw error;
            }
            
            console.log(`[${requestId}] Request successful`);
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.log(`[${requestId}] Request timeout`);
                throw new Error('درخواست بیش از حد انتظار طول کشید');
            }
            
            // Retry on network errors
            if (retryCount < this.maxRetries && this.isNetworkError(error)) {
                console.log(`[${requestId}] Network error, retrying in ${1000 * (retryCount + 1)}ms:`, error.message);
                await this.delay(1000 * (retryCount + 1));
                return this.makeRequest(url, options, retryCount + 1);
            }
            
            console.error(`[${requestId}] Request failed:`, error);
            throw error;
        }
    }

    isNetworkError(error) {
        return error.name === 'TypeError' || 
               error.name === 'NetworkError' ||
               error.message.includes('Failed to fetch') ||
               error.message.includes('Network request failed') ||
               error.message.includes('ERR_NETWORK') ||
               error.message.includes('ERR_INTERNET_DISCONNECTED') ||
               error.code === 'NETWORK_ERROR';
    }

    // Enhanced error handling method
    handleError(error, operation) {
        console.error(`Error in ${operation}:`, error);
        
        let userMessage = `خطا در ${operation}`;
        let errorType = 'unknown';
        
        if (error.status) {
            errorType = `http_${error.status}`;
            
            if (error.status === 401) {
                userMessage = 'جلسه کاری شما منقضی شده است. لطفاً دوباره وارد شوید';
                // Redirect to login after a delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else if (error.status === 403) {
                userMessage = 'شما مجوز انجام این عملیات را ندارید';
            } else if (error.status === 404) {
                userMessage = 'اطلاعات مورد نظر یافت نشد';
            } else if (error.status === 429) {
                userMessage = 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید';
            } else if (error.status >= 500) {
                userMessage = 'خطای سرور رخ داده است. لطفاً دوباره تلاش کنید';
            }
        } else if (this.isNetworkError(error)) {
            errorType = 'network';
            userMessage = 'خطا در اتصال به شبکه. لطفاً اتصال اینترنت خود را بررسی کنید';
        } else if (error.message.includes('timeout') || error.message.includes('طول کشید')) {
            errorType = 'timeout';
            userMessage = 'درخواست بیش از حد انتظار طول کشید. لطفاً دوباره تلاش کنید';
        } else if (error.message) {
            userMessage = error.message;
        }
        
        // Show error to user
        this.showError(`❌ ${userMessage}`);
        
        // Log error details for debugging
        this.logError({
            operation,
            error: error.message,
            errorType,
            status: error.status,
            requestId: error.requestId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }

    // Error logging method
    logError(errorDetails) {
        // Store error in localStorage for debugging
        try {
            const errors = JSON.parse(localStorage.getItem('goldAccountErrors') || '[]');
            errors.push(errorDetails);
            
            // Keep only last 50 errors
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }
            
            localStorage.setItem('goldAccountErrors', JSON.stringify(errors));
        } catch (e) {
            console.warn('Could not store error in localStorage:', e);
        }
        
        // Send error to server for logging (optional)
        if (window.goldAccountConfig && window.goldAccountConfig.enableErrorReporting) {
            this.sendErrorToServer(errorDetails);
        }
    }

    // Send error to server for centralized logging
    async sendErrorToServer(errorDetails) {
        try {
            await fetch('/api/log-client-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    component: 'gold-account',
                    error: errorDetails
                })
            });
        } catch (e) {
            // Silently fail - don't show error to user for logging failures
            console.warn('Could not send error to server:', e);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Enhanced Loading State Management
    setOperationLoading(operation, loading) {
        if (loading) {
            this.loadingStates.add(operation);
        } else {
            this.loadingStates.delete(operation);
        }
        
        this.updateUILoadingState();
        
        // Force UI update after a short delay to ensure state is cleared
        if (!loading) {
            setTimeout(() => {
                this.updateUILoadingState();
            }, 100);
        }
    }

    updateSubmitButtonText() {
        const submitBtn = document.querySelector('.gold-form-btn.primary');
        if (submitBtn) {
            const icon = this.currentEditingTransactionId ? 'fa-edit' : 'fa-save';
            const text = this.currentEditingTransactionId ? 'بروزرسانی تراکنش' : 'ذخیره تراکنش';
            submitBtn.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
        }
    }

    updateUILoadingState() {
        const isLoading = this.loadingStates.size > 0;
        const form = document.getElementById('goldTransactionForm');
        const submitBtn = form?.querySelector('.gold-form-btn.primary');
        const addBtn = document.querySelector('.gold-action-btn.add');
        
        console.log('Updating UI loading state:', { isLoading, loadingStates: Array.from(this.loadingStates) });
        
        // Update form loading state
        if (form) {
            if (isLoading) {
                form.classList.add('gold-loading');
            } else {
                form.classList.remove('gold-loading');
            }
        }
        
        // Update submit button
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            if (isLoading) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال پردازش...';
                submitBtn.classList.add('loading');
            } else {
                submitBtn.classList.remove('loading');
                const icon = this.currentEditingTransactionId ? 'fa-edit' : 'fa-save';
                const text = this.currentEditingTransactionId ? 'بروزرسانی تراکنش' : 'ذخیره تراکنش';
                submitBtn.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
            }
        }
        
        // Update add button
        if (addBtn) {
            addBtn.disabled = isLoading;
            if (isLoading) {
                addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال پردازش...';
                addBtn.classList.add('loading');
            } else {
                addBtn.classList.remove('loading');
                addBtn.innerHTML = '<i class="fas fa-plus"></i> افزودن تراکنش طلا';
            }
        }
        
        // Update action buttons in transaction list
        const actionButtons = document.querySelectorAll('.gold-action-buttons .gold-action-btn');
        actionButtons.forEach(btn => {
            btn.disabled = isLoading;
            if (isLoading) {
                btn.classList.add('loading');
            } else {
                btn.classList.remove('loading');
            }
        });
    }

    // Real-time Balance Update
    async updateBalanceDisplay() {
        try {
            const response = await this.makeRequest(`/customers/${this.customerId}/gold-balance`);
            const result = await response.json();
            
            if (result.success) {
                this.renderBalanceDisplay(result.balance);
            }
        } catch (error) {
            console.error('Error updating balance:', error);
            // Don't show error to user for balance updates as it's not critical
        }
    }

    renderBalanceDisplay(balance) {
        const balanceElement = document.querySelector('.gold-balance-display');
        if (!balanceElement) return;
        
        const balanceValue = parseFloat(balance) || 0;
        let balanceClass = 'neutral';
        let balanceText = 'تسویه';
        let balanceIcon = '⚖️';
        
        if (balanceValue > 0) {
            balanceClass = 'positive';
            balanceText = 'بستانکار';
            balanceIcon = '💰';
        } else if (balanceValue < 0) {
            balanceClass = 'negative';
            balanceText = 'بدهکار';
            balanceIcon = '⚠️';
        }
        
        balanceElement.className = `gold-balance-display ${balanceClass}`;
        balanceElement.innerHTML = `
            <div class="gold-balance-icon">${balanceIcon}</div>
            <div class="gold-balance-amount">${Math.abs(balanceValue).toFixed(3)}</div>
            <div class="gold-balance-unit">گرم</div>
            <div class="gold-balance-status">${balanceText}</div>
        `;
    }

    // Enhanced success message display
    showSuccess(message, duration = 5000) {
        this.showMessage(message, 'success', duration);
    }

    // Enhanced error message display
    showError(message, duration = 8000) {
        this.showMessage(message, 'error', duration);
    }

    // Generic message display method
    showMessage(message, type = 'info', duration = 5000) {
        // Remove existing messages of the same type
        const existingMessages = document.querySelectorAll(`.gold-message.${type}`);
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `gold-message ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle';
        
        messageDiv.innerHTML = `
            <div class="gold-message-content">
                <i class="fas ${icon}"></i>
                <span class="message-text">${message}</span>
                <button class="gold-message-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add to page
        const container = document.querySelector('.gold-account-section') || document.body;
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.classList.add('fade-out');
                    setTimeout(() => messageDiv.remove(), 300);
                }
            }, duration);
        }
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Enhanced Transaction List Refresh
    async refreshTransactionList() {
        const transactionContainer = document.querySelector('.gold-transactions-list');
        if (!transactionContainer) {
            // Fallback to full page refresh if container not found
            this.refreshPage();
            return;
        }
        
        try {
            const response = await this.makeRequest(`/customers/${this.customerId}/gold-transactions`);
            const result = await response.json();
            
            if (result.success) {
                this.renderTransactionList(result.transactions);
            } else {
                throw new Error(result.message || 'خطا در دریافت لیست تراکنش‌ها');
            }
        } catch (error) {
            console.error('Error refreshing transaction list:', error);
            this.handleError(error, 'بروزرسانی لیست تراکنش‌ها');
            // Fallback to page refresh on critical error
            if (error.status >= 500 || this.isNetworkError(error)) {
                setTimeout(() => this.refreshPage(), 2000);
            }
        }
    }

    renderTransactionList(transactions) {
        const container = document.querySelector('.gold-transactions-list');
        if (!container) return;
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="gold-no-data">
                            هیچ تراکنش طلایی ثبت نشده است
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${this.convertToDisplayDate(transaction.transaction_date)}</td>
                <td>
                    <span class="gold-transaction-type ${transaction.transaction_type}">
                        <i class="fas fa-${transaction.transaction_type === 'credit' ? 'arrow-up' : 'arrow-down'}"></i>
                        ${transaction.transaction_type === 'credit' ? 'بستانکار' : 'بدهکار'}
                    </span>
                </td>
                <td>
                    <span class="gold-amount ${transaction.transaction_type === 'credit' ? 'positive' : 'negative'}">
                        ${transaction.transaction_type === 'credit' ? '+' : '-'}
                        ${parseFloat(transaction.amount_grams).toFixed(3)}
                    </span>
                </td>
                <td>${transaction.description}</td>
                <td>${transaction.created_by_username || '-'}</td>
                <td>
                    <div class="gold-action-buttons">
                        <button class="gold-action-btn edit" onclick="editGoldTransaction(${transaction.id})">
                            <i class="fas fa-edit"></i>
                            ویرایش
                        </button>
                        <button class="gold-action-btn delete" onclick="deleteGoldTransaction(${transaction.id})">
                            <i class="fas fa-trash"></i>
                            حذف
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Optimistic UI Updates
    optimisticAddTransaction(transactionData) {
        const container = document.querySelector('.gold-transactions-list tbody');
        if (!container) return null;
        
        // Create temporary transaction row
        const tempRow = document.createElement('tr');
        tempRow.className = 'optimistic-update';
        tempRow.innerHTML = `
            <td>${transactionData.transaction_date}</td>
            <td>
                <span class="transaction-type ${transactionData.transaction_type}">
                    ${transactionData.transaction_type === 'debit' ? 'بدهکار' : 'بستانکار'}
                </span>
            </td>
            <td class="amount">${parseFloat(transactionData.amount_grams).toFixed(3)} گرم</td>
            <td class="description">${transactionData.description}</td>
            <td class="actions">
                <i class="fas fa-spinner fa-spin"></i>
            </td>
        `;
        
        // Add to top of list
        container.insertBefore(tempRow, container.firstChild);
        
        return tempRow;
    }

    optimisticUpdateBalance(transactionData) {
        const balanceElement = document.querySelector('.gold-balance-display');
        if (!balanceElement) return;
        
        // Get current balance
        const currentBalanceText = balanceElement.querySelector('.balance-amount')?.textContent || '0';
        const currentBalance = parseFloat(currentBalanceText) || 0;
        
        // Calculate new balance
        const amount = parseFloat(transactionData.amount_grams);
        const multiplier = transactionData.transaction_type === 'credit' ? 1 : -1;
        const newBalance = currentBalance + (amount * multiplier);
        
        // Update display
        this.renderBalanceDisplay(newBalance);
        
        // Add visual indicator that this is optimistic
        balanceElement.classList.add('optimistic-update');
    }

    revertOptimisticUpdates() {
        // Remove optimistic transaction rows
        const optimisticRows = document.querySelectorAll('.optimistic-update');
        optimisticRows.forEach(row => row.remove());
        
        // Remove optimistic class from balance
        const balanceElement = document.querySelector('.gold-balance-display');
        if (balanceElement) {
            balanceElement.classList.remove('optimistic-update');
        }
    }

    // Enhanced Error Handling
    handleError(error, operation) {
        console.error(`Error in ${operation}:`, error);
        
        // Revert optimistic updates on error
        this.revertOptimisticUpdates();
        
        let errorMessage = `❌ خطا در ${operation}`;
        
        if (error.message === 'No internet connection') {
            errorMessage += ': اتصال به اینترنت برقرار نیست.';
        } else if (this.isNetworkError(error)) {
            errorMessage += ': مشکل در اتصال به شبکه. لطفاً اتصال اینترنت خود را بررسی کنید.';
        } else if (error.message.includes('HTTP 500')) {
            errorMessage += ': خطای سرور. لطفاً دوباره تلاش کنید.';
        } else if (error.message.includes('HTTP 401')) {
            errorMessage += ': دسترسی غیرمجاز. لطفاً دوباره وارد شوید.';
        } else if (error.message.includes('HTTP 403')) {
            errorMessage += ': عدم دسترسی کافی.';
        } else if (error.message.includes('HTTP 404')) {
            errorMessage += ': اطلاعات مورد نظر یافت نشد.';
        } else {
            errorMessage += ': ' + (error.message || 'خطای نامشخص');
        }
        
        this.showError(errorMessage);
    }

    // Enhanced UI Helper Methods
    setLoadingState(loading) {
        // Backward compatibility - delegate to new method
        this.setOperationLoading('form', loading);
    }

    showConfirmDialog(message) {
        // Enhanced confirmation dialog - can be replaced with custom modal later
        return confirm(message);
    }

    updateSubmitButtonText() {
        const submitBtn = document.querySelector('#goldTransactionForm .btn-primary');
        if (submitBtn) {
            submitBtn.textContent = this.currentEditingTransactionId ? 'بروزرسانی تراکنش' : 'ذخیره تراکنش';
        }
    }

    // Enhanced Notification System
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Try to use existing notification system if available
        if (typeof showNotification === 'function') {
            showNotification(message, type);
            return;
        }
        
        // Create custom notification
        this.createNotification(message, type);
    }

    createNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.gold-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `gold-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add styles if not already present
        this.addNotificationStyles();
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    addNotificationStyles() {
        if (document.querySelector('#gold-notification-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'gold-notification-styles';
        styles.textContent = `
            .gold-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease;
                direction: rtl;
            }
            
            .gold-notification.show {
                transform: translateX(0);
            }
            
            .gold-notification.success {
                border-left: 4px solid #28a745;
            }
            
            .gold-notification.error {
                border-left: 4px solid #dc3545;
            }
            
            .gold-notification.warning {
                border-left: 4px solid #ffc107;
            }
            
            .notification-content {
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-content i:first-child {
                font-size: 18px;
            }
            
            .gold-notification.success .notification-content i:first-child {
                color: #28a745;
            }
            
            .gold-notification.error .notification-content i:first-child {
                color: #dc3545;
            }
            
            .gold-notification.warning .notification-content i:first-child {
                color: #ffc107;
            }
            
            .notification-content span {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: #6c757d;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .notification-close:hover {
                background-color: #f8f9fa;
            }
            
            /* Optimistic Update Styles */
            .optimistic-update {
                opacity: 0.7;
                background-color: #f8f9fa;
            }
            
            .gold-balance-display.optimistic-update {
                position: relative;
            }
            
            .gold-balance-display.optimistic-update::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%);
                animation: shimmer 1.5s infinite;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            /* Loading States */
            .loading {
                pointer-events: none;
                opacity: 0.7;
            }
            
            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `;
        
        document.head.appendChild(styles);
    }

    refreshPage() {
        setTimeout(() => {
            location.reload();
        }, 500);
    }
}

// Global functions for backward compatibility
let goldAccountManager;

function showAddGoldTransactionModal() {
    if (goldAccountManager) {
        goldAccountManager.showAddModal();
    }
}

function editGoldTransaction(transactionId) {
    if (goldAccountManager) {
        goldAccountManager.editTransaction(transactionId);
    }
}

function deleteGoldTransaction(transactionId) {
    if (goldAccountManager) {
        goldAccountManager.deleteTransaction(transactionId);
    }
}

function closeGoldTransactionModal() {
    if (goldAccountManager) {
        goldAccountManager.closeModal();
    }
}

function setTodayDate() {
    if (goldAccountManager) {
        goldAccountManager.setTodayDate();
    }
}

// Connection Status Monitoring
class ConnectionMonitor {
    constructor(goldAccountManager) {
        this.goldAccountManager = goldAccountManager;
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.goldAccountManager.showSuccess('✅ اتصال به اینترنت برقرار شد');
            // Refresh data when connection is restored
            this.goldAccountManager.updateBalanceDisplay();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.goldAccountManager.showError('⚠️ اتصال به اینترنت قطع شده است');
        });
    }

    isConnected() {
        return this.isOnline;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Get customer ID from the page (assuming it's available in a data attribute or global variable)
    const customerId = window.customerId || document.querySelector('[data-customer-id]')?.dataset.customerId;
    
    if (customerId) {
        goldAccountManager = new GoldAccountManager(customerId);
        
        // Initialize connection monitoring
        const connectionMonitor = new ConnectionMonitor(goldAccountManager);
        goldAccountManager.connectionMonitor = connectionMonitor;
    }
});