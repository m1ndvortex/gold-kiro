const db = require('../config/database');

/**
 * Database functions for customer gold transactions
 * Handles CRUD operations and balance calculations for gold accounts
 */
class GoldTransactionDB {
    
    /**
     * Create a new gold transaction
     * @param {Object} transactionData - Transaction data
     * @param {number} transactionData.customer_id - Customer ID
     * @param {string} transactionData.transaction_date - Transaction date (YYYY-MM-DD)
     * @param {string} transactionData.transaction_type - 'debit' or 'credit'
     * @param {number} transactionData.amount_grams - Amount in grams
     * @param {string} transactionData.description - Transaction description
     * @param {number} transactionData.created_by - User ID who created the transaction
     * @returns {Promise<Object>} Created transaction with ID
     */
    static async create(transactionData) {
        const {
            customer_id,
            transaction_date,
            transaction_type,
            amount_grams,
            description,
            created_by
        } = transactionData;

        // Validate required fields
        if (!customer_id || !transaction_date || !transaction_type || 
            !amount_grams || !description || !created_by) {
            throw new Error('تمام فیلدهای الزامی باید پر شوند');
        }

        // Validate transaction type
        if (!['debit', 'credit'].includes(transaction_type)) {
            throw new Error('نوع تراکنش باید debit یا credit باشد');
        }

        // Validate amount
        if (amount_grams <= 0) {
            throw new Error('مقدار طلا باید عدد مثبت باشد');
        }

        const query = `
            INSERT INTO customer_gold_transactions 
            (customer_id, transaction_date, transaction_type, amount_grams, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        try {
            const [result] = await db.execute(query, [
                customer_id,
                transaction_date,
                transaction_type,
                amount_grams,
                description,
                created_by
            ]);

            // Return the created transaction
            return await this.getById(result.insertId);
        } catch (error) {
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new Error('مشتری یا کاربر یافت نشد');
            }
            throw error;
        }
    }

    /**
     * Get transaction by ID
     * @param {number} id - Transaction ID
     * @returns {Promise<Object|null>} Transaction data or null if not found
     */
    static async getById(id) {
        const query = `
            SELECT t.*, c.full_name as customer_name, u.username as created_by_username
            FROM customer_gold_transactions t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.id = ?
        `;

        try {
            const [rows] = await db.execute(query, [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all transactions for a customer
     * @param {number} customerId - Customer ID
     * @param {Object} options - Query options
     * @param {number} options.limit - Limit number of results
     * @param {number} options.offset - Offset for pagination
     * @param {string} options.orderBy - Order by field (default: transaction_date)
     * @param {string} options.orderDirection - Order direction (ASC/DESC, default: DESC)
     * @returns {Promise<Array>} Array of transactions
     */
    static async getByCustomer(customerId, options = {}) {
        const {
            limit = null,
            offset = 0,
            orderBy = 'transaction_date',
            orderDirection = 'DESC'
        } = options;

        let query = `
            SELECT t.*, u.username as created_by_username
            FROM customer_gold_transactions t
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.customer_id = ?
            ORDER BY t.${orderBy} ${orderDirection}, t.id ${orderDirection}
        `;

        const params = [customerId];

        if (limit) {
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }

        try {
            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a gold transaction
     * @param {number} id - Transaction ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated transaction
     */
    static async update(id, updateData) {
        const allowedFields = [
            'transaction_date',
            'transaction_type', 
            'amount_grams',
            'description'
        ];

        // Filter only allowed fields
        const filteredData = {};
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredData[key] = updateData[key];
            }
        });

        if (Object.keys(filteredData).length === 0) {
            throw new Error('هیچ فیلد قابل بروزرسانی ارسال نشده');
        }

        // Validate transaction type if provided
        if (filteredData.transaction_type && 
            !['debit', 'credit'].includes(filteredData.transaction_type)) {
            throw new Error('نوع تراکنش باید debit یا credit باشد');
        }

        // Validate amount if provided
        if (filteredData.amount_grams && filteredData.amount_grams <= 0) {
            throw new Error('مقدار طلا باید عدد مثبت باشد');
        }

        const fields = Object.keys(filteredData).map(field => `${field} = ?`).join(', ');
        const values = Object.values(filteredData);
        values.push(id);

        const query = `
            UPDATE customer_gold_transactions 
            SET ${fields}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        try {
            const [result] = await db.execute(query, values);
            
            if (result.affectedRows === 0) {
                throw new Error('تراکنش یافت نشد');
            }

            return await this.getById(id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a gold transaction
     * @param {number} id - Transaction ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        const query = 'DELETE FROM customer_gold_transactions WHERE id = ?';

        try {
            const [result] = await db.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Calculate customer's gold balance
     * @param {number} customerId - Customer ID
     * @returns {Promise<number>} Balance in grams (positive = credit, negative = debit)
     */
    static async calculateBalance(customerId) {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount_grams ELSE 0 END), 0) as total_credit,
                COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN amount_grams ELSE 0 END), 0) as total_debit
            FROM customer_gold_transactions 
            WHERE customer_id = ?
        `;

        try {
            const [rows] = await db.execute(query, [customerId]);
            const { total_credit, total_debit } = rows[0];
            
            // Balance = Credits - Debits
            // Positive = Customer has credit (بستانکار)
            // Negative = Customer has debt (بدهکار)
            return parseFloat(total_credit) - parseFloat(total_debit);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update customer's gold balance in customers table
     * @param {number} customerId - Customer ID
     * @returns {Promise<number>} Updated balance
     */
    static async updateCustomerBalance(customerId) {
        try {
            // Calculate current balance
            const balance = await this.calculateBalance(customerId);

            // Update customers table
            const updateQuery = `
                UPDATE customers 
                SET gold_balance_grams = ?
                WHERE id = ?
            `;

            await db.execute(updateQuery, [balance, customerId]);
            
            return balance;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get transaction count for a customer
     * @param {number} customerId - Customer ID
     * @returns {Promise<number>} Transaction count
     */
    static async getTransactionCount(customerId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM customer_gold_transactions 
            WHERE customer_id = ?
        `;

        try {
            const [rows] = await db.execute(query, [customerId]);
            return rows[0].count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Execute a transaction with automatic balance update
     * @param {Function} operation - Database operation to execute
     * @param {number} customerId - Customer ID for balance update
     * @returns {Promise<any>} Operation result
     */
    static async executeWithBalanceUpdate(operation, customerId) {
        try {
            // Execute the main operation
            const result = await operation();
            
            // Update customer balance
            await this.updateCustomerBalance(customerId);
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create transaction with automatic balance update
     * @param {Object} transactionData - Transaction data
     * @returns {Promise<Object>} Created transaction
     */
    static async createWithBalanceUpdate(transactionData) {
        // Validate data first
        const validation = this.validateTransactionData(transactionData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        return await this.executeWithBalanceUpdate(async () => {
            const query = `
                INSERT INTO customer_gold_transactions 
                (customer_id, transaction_date, transaction_type, amount_grams, description, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await db.execute(query, [
                transactionData.customer_id,
                transactionData.transaction_date,
                transactionData.transaction_type,
                transactionData.amount_grams,
                transactionData.description,
                transactionData.created_by
            ]);
            
            return await this.getById(result.insertId);
        }, transactionData.customer_id);
    }

    /**
     * Update transaction with automatic balance update
     * @param {number} id - Transaction ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated transaction
     */
    static async updateWithBalanceUpdate(id, updateData) {
        // First get the transaction to know which customer to update
        const existingTransaction = await this.getById(id);
        if (!existingTransaction) {
            throw new Error('تراکنش یافت نشد');
        }
        
        return await this.executeWithBalanceUpdate(async () => {
            const allowedFields = [
                'transaction_date',
                'transaction_type', 
                'amount_grams',
                'description'
            ];

            const filteredData = {};
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    filteredData[key] = updateData[key];
                }
            });

            if (Object.keys(filteredData).length === 0) {
                throw new Error('هیچ فیلد قابل بروزرسانی ارسال نشده');
            }

            const fields = Object.keys(filteredData).map(field => `${field} = ?`).join(', ');
            const values = Object.values(filteredData);
            values.push(id);

            const query = `
                UPDATE customer_gold_transactions 
                SET ${fields}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const [result] = await db.execute(query, values);
            
            if (result.affectedRows === 0) {
                throw new Error('تراکنش یافت نشد');
            }

            return await this.getById(id);
        }, existingTransaction.customer_id);
    }

    /**
     * Delete transaction with automatic balance update
     * @param {number} id - Transaction ID
     * @returns {Promise<boolean>} Success status
     */
    static async deleteWithBalanceUpdate(id) {
        // First get the transaction to know which customer to update
        const existingTransaction = await this.getById(id);
        if (!existingTransaction) {
            throw new Error('تراکنش یافت نشد');
        }
        
        return await this.executeWithBalanceUpdate(async () => {
            const [result] = await db.execute(
                'DELETE FROM customer_gold_transactions WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        }, existingTransaction.customer_id);
    }

    /**
     * Get customer's gold transaction summary
     * @param {number} customerId - Customer ID
     * @returns {Promise<Object>} Summary with balance, total credits, debits, and count
     */
    static async getCustomerSummary(customerId) {
        const query = `
            SELECT 
                COUNT(*) as transaction_count,
                COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount_grams ELSE 0 END), 0) as total_credit,
                COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN amount_grams ELSE 0 END), 0) as total_debit
            FROM customer_gold_transactions 
            WHERE customer_id = ?
        `;

        try {
            const [rows] = await db.execute(query, [customerId]);
            const { transaction_count, total_credit, total_debit } = rows[0];
            
            const balance = parseFloat(total_credit) - parseFloat(total_debit);
            
            return {
                transaction_count: parseInt(transaction_count),
                total_credit: parseFloat(total_credit),
                total_debit: parseFloat(total_debit),
                balance: balance,
                balance_status: balance > 0 ? 'credit' : balance < 0 ? 'debit' : 'balanced'
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get transactions within a date range
     * @param {number} customerId - Customer ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} Array of transactions
     */
    static async getByDateRange(customerId, startDate, endDate) {
        const query = `
            SELECT t.*, u.username as created_by_username
            FROM customer_gold_transactions t
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.customer_id = ? AND t.transaction_date BETWEEN ? AND ?
            ORDER BY t.transaction_date DESC, t.id DESC
        `;

        try {
            const [rows] = await db.execute(query, [customerId, startDate, endDate]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get balance at a specific date
     * @param {number} customerId - Customer ID
     * @param {string} date - Date (YYYY-MM-DD)
     * @returns {Promise<number>} Balance at the specified date
     */
    static async getBalanceAtDate(customerId, date) {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount_grams ELSE 0 END), 0) as total_credit,
                COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN amount_grams ELSE 0 END), 0) as total_debit
            FROM customer_gold_transactions 
            WHERE customer_id = ? AND transaction_date <= ?
        `;

        try {
            const [rows] = await db.execute(query, [customerId, date]);
            const { total_credit, total_debit } = rows[0];
            
            return parseFloat(total_credit) - parseFloat(total_debit);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all customers with gold balances
     * @returns {Promise<Array>} Array of customers with their gold balances
     */
    static async getAllCustomersWithBalances() {
        const query = `
            SELECT 
                c.id,
                c.customer_code,
                c.full_name,
                c.gold_balance_grams,
                COUNT(t.id) as transaction_count,
                MAX(t.transaction_date) as last_transaction_date
            FROM customers c
            LEFT JOIN customer_gold_transactions t ON c.id = t.customer_id
            GROUP BY c.id, c.customer_code, c.full_name, c.gold_balance_grams
            HAVING c.gold_balance_grams != 0 OR COUNT(t.id) > 0
            ORDER BY ABS(c.gold_balance_grams) DESC
        `;

        try {
            const [rows] = await db.execute(query);
            return rows.map(row => ({
                ...row,
                balance_status: row.gold_balance_grams > 0 ? 'credit' : 
                              row.gold_balance_grams < 0 ? 'debit' : 'balanced'
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Validate transaction data with enhanced error messages
     * @param {Object} transactionData - Transaction data to validate
     * @returns {Object} Validation result with isValid, errors, and field-specific errors
     */
    static validateTransactionData(transactionData) {
        const errors = [];
        const fieldErrors = {};
        
        // Validate customer_id
        if (!transactionData.customer_id) {
            const error = 'شناسه مشتری الزامی است';
            errors.push(error);
            fieldErrors.customer_id = error;
        } else if (isNaN(parseInt(transactionData.customer_id))) {
            const error = 'شناسه مشتری باید عدد باشد';
            errors.push(error);
            fieldErrors.customer_id = error;
        }
        
        // Validate transaction_date
        if (!transactionData.transaction_date) {
            const error = 'تاریخ تراکنش الزامی است';
            errors.push(error);
            fieldErrors.transaction_date = error;
        } else {
            const transactionDate = new Date(transactionData.transaction_date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            
            if (isNaN(transactionDate.getTime())) {
                const error = 'فرمت تاریخ نامعتبر است';
                errors.push(error);
                fieldErrors.transaction_date = error;
            } else if (transactionDate > today) {
                const error = 'تاریخ تراکنش نمی‌تواند از آینده باشد';
                errors.push(error);
                fieldErrors.transaction_date = error;
            } else if (transactionDate < new Date('2020-01-01')) {
                const error = 'تاریخ تراکنش خیلی قدیمی است';
                errors.push(error);
                fieldErrors.transaction_date = error;
            }
        }
        
        // Validate transaction_type
        if (!transactionData.transaction_type) {
            const error = 'نوع تراکنش الزامی است';
            errors.push(error);
            fieldErrors.transaction_type = error;
        } else if (!['debit', 'credit'].includes(transactionData.transaction_type)) {
            const error = 'نوع تراکنش باید بدهکار (debit) یا بستانکار (credit) باشد';
            errors.push(error);
            fieldErrors.transaction_type = error;
        }
        
        // Validate amount_grams
        if (!transactionData.amount_grams) {
            const error = 'مقدار طلا الزامی است';
            errors.push(error);
            fieldErrors.amount_grams = error;
        } else {
            const amount = parseFloat(transactionData.amount_grams);
            if (isNaN(amount)) {
                const error = 'مقدار طلا باید عدد باشد';
                errors.push(error);
                fieldErrors.amount_grams = error;
            } else if (amount <= 0) {
                const error = 'مقدار طلا باید عدد مثبت باشد';
                errors.push(error);
                fieldErrors.amount_grams = error;
            } else if (amount < 0.001) {
                const error = 'حداقل مقدار طلا 0.001 گرم است';
                errors.push(error);
                fieldErrors.amount_grams = error;
            } else if (amount > 10000) {
                const error = 'حداکثر مقدار طلا 10000 گرم است';
                errors.push(error);
                fieldErrors.amount_grams = error;
            }
        }
        
        // Validate description
        if (!transactionData.description) {
            const error = 'توضیحات الزامی است';
            errors.push(error);
            fieldErrors.description = error;
        } else {
            const trimmedDescription = transactionData.description.trim();
            if (trimmedDescription.length < 5) {
                const error = 'توضیحات باید حداقل 5 کاراکتر باشد';
                errors.push(error);
                fieldErrors.description = error;
            } else if (trimmedDescription.length > 500) {
                const error = 'توضیحات نباید بیشتر از 500 کاراکتر باشد';
                errors.push(error);
                fieldErrors.description = error;
            }
        }
        
        // Validate created_by
        if (!transactionData.created_by) {
            const error = 'شناسه کاربر ایجادکننده الزامی است';
            errors.push(error);
            fieldErrors.created_by = error;
        } else if (isNaN(parseInt(transactionData.created_by))) {
            const error = 'شناسه کاربر باید عدد باشد';
            errors.push(error);
            fieldErrors.created_by = error;
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            fieldErrors: fieldErrors,
            errorCount: errors.length
        };
    }

    /**
     * Validate update data for existing transaction
     * @param {Object} updateData - Data to update
     * @returns {Object} Validation result
     */
    static validateUpdateData(updateData) {
        const errors = [];
        const fieldErrors = {};
        
        // Only validate provided fields
        if (updateData.transaction_date !== undefined) {
            if (!updateData.transaction_date) {
                const error = 'تاریخ تراکنش نمی‌تواند خالی باشد';
                errors.push(error);
                fieldErrors.transaction_date = error;
            } else {
                const transactionDate = new Date(updateData.transaction_date);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                
                if (isNaN(transactionDate.getTime())) {
                    const error = 'فرمت تاریخ نامعتبر است';
                    errors.push(error);
                    fieldErrors.transaction_date = error;
                } else if (transactionDate > today) {
                    const error = 'تاریخ تراکنش نمی‌تواند از آینده باشد';
                    errors.push(error);
                    fieldErrors.transaction_date = error;
                }
            }
        }
        
        if (updateData.transaction_type !== undefined) {
            if (!updateData.transaction_type) {
                const error = 'نوع تراکنش نمی‌تواند خالی باشد';
                errors.push(error);
                fieldErrors.transaction_type = error;
            } else if (!['debit', 'credit'].includes(updateData.transaction_type)) {
                const error = 'نوع تراکنش باید بدهکار یا بستانکار باشد';
                errors.push(error);
                fieldErrors.transaction_type = error;
            }
        }
        
        if (updateData.amount_grams !== undefined) {
            if (!updateData.amount_grams) {
                const error = 'مقدار طلا نمی‌تواند خالی باشد';
                errors.push(error);
                fieldErrors.amount_grams = error;
            } else {
                const amount = parseFloat(updateData.amount_grams);
                if (isNaN(amount) || amount <= 0) {
                    const error = 'مقدار طلا باید عدد مثبت باشد';
                    errors.push(error);
                    fieldErrors.amount_grams = error;
                } else if (amount < 0.001) {
                    const error = 'حداقل مقدار طلا 0.001 گرم است';
                    errors.push(error);
                    fieldErrors.amount_grams = error;
                } else if (amount > 10000) {
                    const error = 'حداکثر مقدار طلا 10000 گرم است';
                    errors.push(error);
                    fieldErrors.amount_grams = error;
                }
            }
        }
        
        if (updateData.description !== undefined) {
            if (!updateData.description) {
                const error = 'توضیحات نمی‌تواند خالی باشد';
                errors.push(error);
                fieldErrors.description = error;
            } else {
                const trimmedDescription = updateData.description.trim();
                if (trimmedDescription.length < 5) {
                    const error = 'توضیحات باید حداقل 5 کاراکتر باشد';
                    errors.push(error);
                    fieldErrors.description = error;
                } else if (trimmedDescription.length > 500) {
                    const error = 'توضیحات نباید بیشتر از 500 کاراکتر باشد';
                    errors.push(error);
                    fieldErrors.description = error;
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            fieldErrors: fieldErrors,
            errorCount: errors.length
        };
    }
}

module.exports = GoldTransactionDB;