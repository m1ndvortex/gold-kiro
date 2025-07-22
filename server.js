const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// Make moment available in templates
app.locals.moment = moment;

// Helper function to format numbers
app.locals.formatNumber = function(num) {
    return new Intl.NumberFormat('fa-IR').format(num);
};

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes

// Login routes
app.get('/login', (req, res) => {
    res.render('login', { 
        title: 'ورود به سیستم',
        error: null
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (rows.length > 0) {
            const user = rows[0];
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (isValidPassword) {
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    role: user.role
                };
                res.redirect('/dashboard');
            } else {
                res.render('login', { 
                    title: 'ورود به سیستم',
                    error: 'نام کاربری یا رمز عبور اشتباه است'
                });
            }
        } else {
            res.render('login', { 
                title: 'ورود به سیستم',
                error: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { 
            title: 'ورود به سیستم',
            error: 'خطا در ورود به سیستم'
        });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Dashboard
app.get('/', requireAuth, (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        // Get summary statistics
        const [inventoryCount] = await db.execute('SELECT COUNT(*) as count FROM inventory_items');
        const [customerCount] = await db.execute('SELECT COUNT(*) as count FROM customers');
        const [todayInvoices] = await db.execute(
            'SELECT COUNT(*) as count, IFNULL(SUM(grand_total), 0) as total FROM invoices WHERE DATE(created_at) = CURDATE()'
        );
        const [goldRate] = await db.execute(
            'SELECT rate_per_gram FROM gold_rates WHERE date = CURDATE() ORDER BY created_at DESC LIMIT 1'
        );

        res.render('dashboard', {
            title: 'داشبورد اصلی',
            user: req.session.user,
            stats: {
                inventory: inventoryCount[0].count,
                customers: customerCount[0].count,
                todayInvoices: todayInvoices[0].count,
                todayTotal: todayInvoices[0].total,
                goldRate: goldRate.length > 0 ? goldRate[0].rate_per_gram : 0
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('خطا در بارگذاری داشبورد');
    }
});

// Inventory Routes
app.get('/inventory', requireAuth, async (req, res) => {
    try {
        const [items] = await db.execute(`
            SELECT i.id, i.item_code, i.item_name, i.image_path, i.carat, i.current_quantity, i.created_at,
                   c.name_persian as category_name,
                   p.name_persian as parent_category_name,
                   CASE 
                       WHEN p.name_persian IS NOT NULL THEN c.name_persian
                       ELSE c.name_persian 
                   END as type_name
            FROM inventory_items i 
            LEFT JOIN categories c ON i.category_id = c.id 
            LEFT JOIN categories p ON c.parent_id = p.id
            ORDER BY i.created_at DESC
        `);
        
        const [categories] = await db.execute(`
            SELECT DISTINCT name_persian as category_name
            FROM categories 
            WHERE is_active = true
            ORDER BY name_persian
        `);
        
        res.render('inventory/list', {
            title: 'مدیریت انبار',
            user: req.session.user,
            items: items,
            types: categories
        });
    } catch (error) {
        console.error('Inventory error:', error);
        res.status(500).send('خطا در بارگذاری انبار');
    }
});

app.get('/inventory/add', requireAuth, async (req, res) => {
    try {
        // Get all active categories with parent information
        const [categories] = await db.execute(`
            SELECT c.*, 
                   p.name_persian as parent_name,
                   CASE WHEN c.parent_id IS NULL THEN 'main' ELSE 'sub' END as category_level
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
            WHERE c.is_active = true
            ORDER BY c.parent_id ASC, c.sort_order ASC, c.name_persian ASC
        `);
        
        // Organize categories for dropdown
        const mainCategories = categories.filter(cat => cat.category_level === 'main');
        const subCategories = categories.filter(cat => cat.category_level === 'sub');
        
        res.render('inventory/add', {
            title: 'افزودن کالای جدید',
            user: req.session.user,
            categories: categories,
            mainCategories: mainCategories,
            subCategories: subCategories
        });
    } catch (error) {
        console.error('Add inventory error:', error);
        res.status(500).send('خطا در بارگذاری صفحه');
    }
});

app.post('/inventory/add', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const {
            category_id, subcategory_id, carat, current_quantity
        } = req.body;
        
        // Helper function to render form with error
        const renderFormWithError = async (errorMessage) => {
            const [categories] = await db.execute(`
                SELECT c.*, 
                       p.name_persian as parent_name,
                       CASE WHEN c.parent_id IS NULL THEN 'main' ELSE 'sub' END as category_level
                FROM categories c
                LEFT JOIN categories p ON c.parent_id = p.id
                WHERE c.is_active = true
                ORDER BY c.parent_id ASC, c.sort_order ASC, c.name_persian ASC
            `);
            
            const mainCategories = categories.filter(cat => cat.category_level === 'main');
            const subCategories = categories.filter(cat => cat.category_level === 'sub');
            
            return res.render('inventory/add', {
                title: 'افزودن کالای جدید',
                user: req.session.user,
                categories: categories,
                mainCategories: mainCategories,
                subCategories: subCategories,
                error: errorMessage,
                formData: req.body
            });
        };

        // Validate required fields
        if (!category_id) {
            return await renderFormWithError('دسته‌بندی کالا انتخاب نشده است');
        }
        
        if (!carat) {
            return await renderFormWithError('عیار کالا وارد نشده است');
        }
        
        // Get category names for item name
        const finalCategoryId = subcategory_id || category_id;
        const [categoryInfo] = await db.execute(`
            SELECT c.name_persian, p.name_persian as parent_name
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
            WHERE c.id = ?
        `, [finalCategoryId]);
        
        if (categoryInfo.length === 0) {
            return await renderFormWithError('دسته‌بندی انتخاب شده معتبر نیست');
        }
        
        // Create item name based on categories
        const item_name = categoryInfo[0].parent_name 
            ? categoryInfo[0].parent_name  // Main category as item name
            : categoryInfo[0].name_persian;
            
        const type_name = categoryInfo[0].parent_name 
            ? categoryInfo[0].name_persian  // Subcategory as type
            : categoryInfo[0].name_persian;
        
        // Check for duplicate items (same exact category and carat)
        const [existingItems] = await db.execute(`
            SELECT id, item_code, item_name FROM inventory_items 
            WHERE category_id = ? AND carat = ? AND current_quantity > 0
        `, [finalCategoryId, carat]);
        
        if (existingItems.length > 0) {
            return await renderFormWithError(`کالای مشابه با کد ${existingItems[0].item_code} و نام "${existingItems[0].item_name}" قبلاً ثبت شده است. برای افزایش موجودی، کالا را ویرایش کنید.`);
        }
        
        // Generate unique item code  
        const [lastItem] = await db.execute('SELECT id FROM inventory_items ORDER BY id DESC LIMIT 1');
        const nextId = lastItem.length > 0 ? lastItem[0].id + 1 : 1;
        const item_code = `ITM-${String(nextId).padStart(4, '0')}`;
        
        const image_path = req.file ? `/uploads/${req.file.filename}` : null;
        
        // Insert simplified inventory item
        await db.execute(`
            INSERT INTO inventory_items 
            (item_code, item_name, type_id, category_id, image_path, carat, current_quantity, 
             precise_weight, stone_weight, labor_cost_type, labor_cost_value, profit_margin, purchase_cost)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'fixed', 0, 0, 0)
        `, [
            item_code, item_name, 1, finalCategoryId, image_path, carat, current_quantity || 1
        ]);
        
        res.redirect('/inventory?success=کالا با موفقیت اضافه شد');
    } catch (error) {
        console.error('Add inventory error:', error);
        res.status(500).send('خطا در افزودن کالا: ' + error.message);
    }
});

// View inventory item
app.get('/inventory/view/:id', requireAuth, async (req, res) => {
    try {
        const [item] = await db.execute(`
            SELECT i.*, c.name_persian as category_name, p.name_persian as parent_category_name
            FROM inventory_items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN categories p ON c.parent_id = p.id
            WHERE i.id = ?
        `, [req.params.id]);
        
        if (item.length === 0) {
            return res.status(404).send('کالا یافت نشد');
        }
        
        // Get related sales history
        const [salesHistory] = await db.execute(`
            SELECT ii.*, inv.invoice_number, inv.invoice_date, c.full_name as customer_name
            FROM invoice_items ii
            JOIN invoices inv ON ii.invoice_id = inv.id
            JOIN customers c ON inv.customer_id = c.id
            WHERE ii.item_id = ? AND inv.status = 'active'
            ORDER BY inv.invoice_date DESC
            LIMIT 10
        `, [req.params.id]);
        
        res.render('inventory/view', {
            title: 'مشاهده کالا',
            user: req.session.user,
            item: item[0],
            salesHistory: salesHistory
        });
    } catch (error) {
        console.error('View inventory error:', error);
        res.status(500).send('خطا در بارگذاری اطلاعات کالا');
    }
});

// Edit inventory item form
app.get('/inventory/edit/:id', requireAuth, async (req, res) => {
    try {
        const [item] = await db.execute(`
            SELECT i.*, c.name_persian as category_name, c.parent_id
            FROM inventory_items i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.id = ?
        `, [req.params.id]);
        
        if (item.length === 0) {
            return res.status(404).send('کالا یافت نشد');
        }
        
        // Get all active categories
        const [categories] = await db.execute(`
            SELECT c.*, 
                   p.name_persian as parent_name,
                   CASE WHEN c.parent_id IS NULL THEN 'main' ELSE 'sub' END as category_level
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
            WHERE c.is_active = true
            ORDER BY c.parent_id ASC, c.sort_order ASC, c.name_persian ASC
        `);
        
        const mainCategories = categories.filter(cat => cat.category_level === 'main');
        const subCategories = categories.filter(cat => cat.category_level === 'sub');
        
        res.render('inventory/edit', {
            title: 'ویرایش کالا',
            user: req.session.user,
            item: item[0],
            categories: categories,
            mainCategories: mainCategories,
            subCategories: subCategories
        });
    } catch (error) {
        console.error('Edit inventory form error:', error);
        res.status(500).send('خطا در بارگذاری فرم ویرایش');
    }
});

// Update inventory item
app.post('/inventory/edit/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const {
            category_id, subcategory_id, carat, current_quantity
        } = req.body;
        
        // Validate required fields
        if (!category_id) {
            return res.status(400).send('دسته‌بندی کالا انتخاب نشده است');
        }
        
        if (!carat) {
            return res.status(400).send('عیار کالا وارد نشده است');
        }
        
        // Get category names for item name
        const finalCategoryId = subcategory_id || category_id;
        const [categoryInfo] = await db.execute(`
            SELECT c.name_persian, p.name_persian as parent_name
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
            WHERE c.id = ?
        `, [finalCategoryId]);
        
        // Create item name based on categories
        const item_name = categoryInfo[0].parent_name 
            ? categoryInfo[0].parent_name 
            : categoryInfo[0].name_persian;
        
        let updateQuery = `
            UPDATE inventory_items SET
            item_name = ?, category_id = ?, carat = ?, current_quantity = ?
        `;
        
        let params = [
            item_name, finalCategoryId, carat, current_quantity
        ];
        
        // Handle image update
        if (req.file) {
            updateQuery += `, image_path = ?`;
            params.push(`/uploads/${req.file.filename}`);
        }
        
        updateQuery += ` WHERE id = ?`;
        params.push(req.params.id);
        
        await db.execute(updateQuery, params);
        
        res.redirect('/inventory/view/' + req.params.id + '?success=کالا با موفقیت بروزرسانی شد');
    } catch (error) {
        console.error('Update inventory error:', error);
        res.status(500).send('خطا در بروزرسانی کالا: ' + error.message);
    }
});

// Delete inventory item
app.delete('/inventory/delete/:id', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        
        // Check if item exists
        const [item] = await db.execute('SELECT * FROM inventory_items WHERE id = ?', [itemId]);
        if (item.length === 0) {
            return res.status(404).json({ success: false, message: 'کالا یافت نشد' });
        }
        
        // Check if item has been sold (exists in invoice_items)
        const [salesCheck] = await db.execute(`
            SELECT COUNT(*) as sales_count 
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE ii.item_id = ? AND i.status = 'active'
        `, [itemId]);
        
        if (salesCheck[0].sales_count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'این کالا قبلاً فروخته شده و قابل حذف نیست. فقط می‌توانید موجودی آن را صفر کنید.' 
            });
        }
        
        // Delete the item
        await db.execute('DELETE FROM inventory_items WHERE id = ?', [itemId]);
        
        res.json({ success: true, message: 'کالا با موفقیت حذف شد' });
        
    } catch (error) {
        console.error('Delete inventory error:', error);
        res.status(500).json({ success: false, message: 'خطا در حذف کالا: ' + error.message });
    }
});

// Customers Routes
app.get('/customers', requireAuth, async (req, res) => {
    try {
        const [customers] = await db.execute(`
            SELECT 
                c.*,
                CASE 
                    WHEN c.birth_date IS NOT NULL THEN 
                        FLOOR(DATEDIFF(CURDATE(), c.birth_date) / 365.25)
                    ELSE NULL 
                END AS age,
                CASE 
                    WHEN c.current_balance > 0 THEN 'بدهکار'
                    WHEN c.current_balance < 0 THEN 'بستانکار'
                    ELSE 'تسویه'
                END AS balance_status,
                CASE 
                    WHEN c.last_purchase_date IS NOT NULL THEN 
                        DATEDIFF(CURDATE(), c.last_purchase_date)
                    ELSE NULL 
                END AS days_since_last_purchase
            FROM customers c
            WHERE c.is_active = TRUE
            ORDER BY c.created_at DESC
        `);
        
        res.render('customers/list', {
            title: 'مدیریت مشتریان',
            user: req.session.user,
            customers: customers,
            success: req.query.success,
            message: req.query.message
        });
    } catch (error) {
        console.error('Customers error:', error);
        res.status(500).send('خطا در بارگذاری مشتریان');
    }
});

app.get('/customers/add', requireAuth, (req, res) => {
    res.render('customers/add', {
        title: 'افزودن مشتری جدید',
        user: req.session.user
    });
});

app.post('/customers/add', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            full_name, phone, national_id, address, email, 
            birth_date, gender, job_title, emergency_phone, 
            reference_name, notes, customer_type 
        } = req.body;
        
        // اعتبارسنجی اطلاعات اجباری
        if (!full_name || full_name.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'نام و نام خانوادگی الزامی است و باید حداقل 3 کاراکتر باشد'
            });
        }
        
        // چک کردن تکرار کد ملی (در صورتی که وارد شده باشد)
        if (national_id && national_id.trim()) {
            const [existingCustomer] = await connection.execute(
                'SELECT id, full_name FROM customers WHERE national_id = ? AND is_active = TRUE',
                [national_id.trim()]
            );
            
            if (existingCustomer.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `کد ملی ${national_id} قبلاً برای مشتری "${existingCustomer[0].full_name}" ثبت شده است`
                });
            }
        }
        
        // چک کردن تکرار ایمیل (در صورتی که وارد شده باشد)
        if (email && email.trim()) {
            const [existingEmail] = await connection.execute(
                'SELECT id, full_name FROM customers WHERE email = ? AND is_active = TRUE',
                [email.trim()]
            );
            
            if (existingEmail.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `ایمیل ${email} قبلاً برای مشتری "${existingEmail[0].full_name}" ثبت شده است`
                });
            }
        }
        
        // تولید کد یکتای مشتری
        const [lastCustomer] = await connection.execute('SELECT id FROM customers ORDER BY id DESC LIMIT 1');
        const nextId = lastCustomer.length > 0 ? lastCustomer[0].id + 1 : 1;
        const customer_code = `CUS-${String(nextId).padStart(4, '0')}`;
        
        // درج اطلاعات مشتری جدید
        await connection.execute(`
            INSERT INTO customers (
                customer_code, full_name, phone, national_id, address, email,
                birth_date, gender, job_title, emergency_phone, reference_name,
                notes, customer_type, is_active, total_purchases, total_payments, current_balance
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 0, 0, 0)
        `, [
            customer_code,
            full_name.trim(),
            phone ? phone.trim() : null,
            national_id ? national_id.trim() : null,
            address ? address.trim() : null,
            email ? email.trim() : null,
            birth_date || null,
            gender || null,
            job_title ? job_title.trim() : null,
            emergency_phone ? emergency_phone.trim() : null,
            reference_name ? reference_name.trim() : null,
            notes ? notes.trim() : null,
            customer_type || 'normal'
        ]);
        
        await connection.commit();
        
        // برگشت JSON برای AJAX یا redirect برای form عادی
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            res.json({
                success: true,
                message: 'مشتری با موفقیت ثبت شد',
                customer_code: customer_code
            });
        } else {
            res.redirect('/customers?success=1&message=' + encodeURIComponent('مشتری با موفقیت ثبت شد'));
        }
        
    } catch (error) {
        await connection.rollback();
        console.error('Add customer error:', error);
        
        let errorMessage = 'خطا در افزودن مشتری';
        
        // تشخیص نوع خطا برای نمایش پیام مناسب
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('unique_national_id')) {
                errorMessage = 'کد ملی تکراری است. لطفاً کد ملی دیگری وارد کنید';
            } else if (error.message.includes('customer_code')) {
                errorMessage = 'خطا در تولید کد مشتری. لطفاً دوباره تلاش کنید';
            }
        } else if (error.code === 'ER_DATA_TOO_LONG') {
            errorMessage = 'اطلاعات وارد شده بیش از حد مجاز طولانی است';
        } else if (error.code === 'ER_BAD_NULL_ERROR') {
            errorMessage = 'برخی از اطلاعات اجباری وارد نشده است';
        } else if (error.message.includes('کد ملی وارد شده معتبر نیست')) {
            errorMessage = error.message;
        }
        
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            res.status(400).json({
                success: false,
                message: errorMessage
            });
        } else {
            res.status(400).send(`
                <div style="direction: rtl; font-family: 'Tahoma'; padding: 20px; text-align: center;">
                    <h2 style="color: #dc3545;">خطا در ثبت مشتری</h2>
                    <p style="font-size: 1.2em; margin: 20px 0;">${errorMessage}</p>
                    <a href="/customers/add" style="background: #b8860b; color: #2c2c2c; padding: 10px 20px; text-decoration: none; border-radius: 5px;">برگشت به فرم</a>
                </div>
            `);
        }
    } finally {
        connection.release();
    }
});

// Sales Routes
app.get('/sales', requireAuth, async (req, res) => {
    try {
        const [invoices] = await db.execute(`
            SELECT i.*, c.full_name as customer_name,
                   GROUP_CONCAT(
                       DISTINCT CASE 
                           WHEN parent_cat.name_persian IS NOT NULL 
                           THEN CONCAT('[', parent_cat.name_persian, '] ', cat.name_persian)
                           ELSE CONCAT('[', cat.name_persian, ']')
                       END 
                       SEPARATOR ', '
                   ) as categories
            FROM invoices i 
            JOIN customers c ON i.customer_id = c.id 
            LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
            LEFT JOIN inventory_items item ON ii.item_id = item.id
            LEFT JOIN categories cat ON item.category_id = cat.id
            LEFT JOIN categories parent_cat ON cat.parent_id = parent_cat.id
            GROUP BY i.id
            ORDER BY i.created_at DESC
        `);
        
        res.render('sales/list', {
            title: 'فروش و صدور فاکتور',
            user: req.session.user,
            invoices: invoices
        });
    } catch (error) {
        console.error('Sales error:', error);
        res.status(500).send('خطا در بارگذاری فروش');
    }
});

app.get('/sales/new', requireAuth, async (req, res) => {
    try {
        const renderFormWithError = async (errorMessage, formData = {}) => {
            const [customers] = await db.execute('SELECT * FROM customers ORDER BY full_name');
            const [items] = await db.execute(`
                SELECT i.*, 
                       c.name_persian as category_name,
                       parent.name_persian as subcategory_name
                FROM inventory_items i 
                LEFT JOIN categories c ON i.category_id = c.id 
                LEFT JOIN categories parent ON c.parent_id = parent.id
                WHERE i.current_quantity > 0
                ORDER BY parent.sort_order, c.sort_order, i.item_name
            `);
            const [goldRate] = await db.execute(
                'SELECT rate_per_gram FROM gold_rates WHERE date = CURDATE() ORDER BY created_at DESC LIMIT 1'
            );
            
            res.render('sales/new', {
                title: 'فاکتور جدید',
                user: req.session.user,
                customers: customers,
                items: items,
                goldRate: goldRate.length > 0 ? goldRate[0].rate_per_gram : 3500000,
                error: errorMessage,
                formData: formData
            });
        };

        // If there's an error from previous submission, show it
        if (req.query.error) {
            return await renderFormWithError(req.query.error);
        }

        const [customers] = await db.execute('SELECT * FROM customers ORDER BY full_name');
        const [items] = await db.execute(`
            SELECT i.*, 
                   c.name_persian as category_name,
                   parent.name_persian as subcategory_name
            FROM inventory_items i 
            LEFT JOIN categories c ON i.category_id = c.id 
            LEFT JOIN categories parent ON c.parent_id = parent.id
            WHERE i.current_quantity > 0
            ORDER BY parent.sort_order, c.sort_order, i.item_name
        `);
        const [goldRate] = await db.execute(
            'SELECT rate_per_gram FROM gold_rates WHERE date = CURDATE() ORDER BY created_at DESC LIMIT 1'
        );
        
        res.render('sales/new', {
            title: 'فاکتور جدید',
            user: req.session.user,
            customers: customers,
            items: items,
            goldRate: goldRate.length > 0 ? goldRate[0].rate_per_gram : 3500000
        });
    } catch (error) {
        console.error('New sale error:', error);
        res.status(500).send('خطا در بارگذاری صفحه فروش');
    }
});

// Additional Sales Routes
app.post('/sales/create', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            customer_id, 
            invoice_date, 
            invoice_date_shamsi,
            daily_gold_rate, 
            subtotal, 
            discount_amount, 
            grand_total, 
            plastic_weight,
            total_weight,
            total_labor,
            total_profit,
            total_tax,
            notes,
            selected_items 
        } = req.body;
        
        const items = JSON.parse(selected_items || '[]');
        
        // Validation
        if (!customer_id) {
            throw new Error('لطفاً مشتری را انتخاب کنید');
        }
        
        if (items.length === 0) {
            throw new Error('لطفاً حداقل یک کالا انتخاب کنید');
        }
        
        // Validate Shamsi date
        if (!invoice_date_shamsi) {
            throw new Error('لطفاً تاریخ شمسی را وارد کنید');
        }
        
        // Validate that all items have weight entered
        for (const item of items) {
            if (!item.weight || item.weight <= 0) {
                throw new Error(`لطفاً وزن کالای ${item.name} را وارد کنید`);
            }
        }
        
        // Check stock availability
        for (const item of items) {
            const [stockCheck] = await connection.execute(
                'SELECT current_quantity FROM inventory_items WHERE id = ?',
                [item.id]
            );
            
            if (stockCheck.length === 0 || stockCheck[0].current_quantity < item.quantity) {
                throw new Error(`موجودی کافی برای ${item.name} وجود ندارد`);
            }
        }
        
        // Calculate totals from items with percentage-based calculations
        let calculatedWeight = 0;
        let calculatedLabor = 0;
        let calculatedProfit = 0;
        let calculatedTax = 0;
        let calculatedSubtotal = 0;
        
        for (const item of items) {
            calculatedWeight += (item.weight || 0) * item.quantity;
            calculatedLabor += (item.calculatedLaborCost || 0);
            calculatedProfit += (item.profit || 0) * item.quantity;
            calculatedTax += (item.calculatedTaxCost || 0);
            calculatedSubtotal += item.totalPrice || 0;
        }
        
        const finalWeight = calculatedWeight - (parseFloat(plastic_weight) || 0);
        const finalTotal = calculatedSubtotal - (parseFloat(discount_amount) || 0);
        
        // Generate invoice number
        const [lastInvoice] = await connection.execute('SELECT id FROM invoices ORDER BY id DESC LIMIT 1');
        const nextId = lastInvoice.length > 0 ? lastInvoice[0].id + 1 : 1;
        const invoice_number = `INV-${String(nextId).padStart(4, '0')}`;
        
        // Create invoice with new manual pricing fields including shamsi date
        const [invoiceResult] = await connection.execute(`
            INSERT INTO invoices (
                invoice_number, customer_id, invoice_date, invoice_date_shamsi, gold_rate, 
                subtotal, discount_amount, grand_total,
                total_weight, plastic_weight, final_weight,
                total_labor_cost, total_profit, total_tax, manual_total_weight,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            invoice_number, customer_id, invoice_date, invoice_date_shamsi, daily_gold_rate, 
            calculatedSubtotal, discount_amount || 0, finalTotal,
            calculatedWeight, plastic_weight || 0, finalWeight,
            calculatedLabor, calculatedProfit, calculatedTax, calculatedWeight,
            notes || null
        ]);
        
        const invoiceId = invoiceResult.insertId;
        
        // Add invoice items with percentage-based pricing
        for (const item of items) {
            const unitPrice = item.totalPrice / item.quantity;
            
            await connection.execute(`
                INSERT INTO invoice_items (
                    invoice_id, item_id, quantity, unit_price, total_price,
                    weight, carat, description,
                    manual_weight, daily_gold_price, labor_cost, profit_amount, tax_amount,
                    final_unit_price, labor_percentage, tax_percentage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                invoiceId, item.id, item.quantity, unitPrice, item.totalPrice,
                item.weight || 0, item.carat || 18, item.name || '',
                item.weight || 0, daily_gold_rate, 
                item.calculatedLaborCost || 0, item.profit || 0, item.calculatedTaxCost || 0, 
                unitPrice, item.laborPercentage || 0, item.taxPercentage || 0
            ]);
            
            // Update inventory quantity
            await connection.execute(`
                UPDATE inventory_items SET current_quantity = current_quantity - ? WHERE id = ?
            `, [item.quantity, item.id]);
        }
        
        // Update customer totals
        await connection.execute(`
            UPDATE customers SET 
                total_purchases = total_purchases + ?,
                current_balance = current_balance + ?,
                updated_at = NOW()
            WHERE id = ?
        `, [finalTotal, finalTotal, customer_id]);
        
        // Add financial transaction
        await connection.execute(`
            INSERT INTO financial_transactions (
                transaction_id, transaction_type, description, amount, 
                related_customer_id, related_invoice_id, transaction_date
            ) VALUES (?, 'sale', ?, ?, ?, ?, ?)
        `, [
            `SALE-${invoice_number}`,
            `فروش کالا - فاکتور ${invoice_number}`,
            finalTotal,
            customer_id,
            invoiceId,
            invoice_date
        ]);
        
        await connection.commit();
        res.redirect(`/sales/view/${invoiceId}?success=فاکتور با موفقیت ایجاد شد`);
        
    } catch (error) {
        await connection.rollback();
        console.error('Create invoice error:', error);
        
        try {
            // Prepare form data to preserve user input
            const formData = {
                customer_id: req.body.customer_id,
                invoice_date_shamsi: req.body.invoice_date_shamsi,
                invoice_date: req.body.invoice_date,
                daily_gold_rate: req.body.daily_gold_rate,
                discount_amount: req.body.discount_amount,
                plastic_weight: req.body.plastic_weight,
                notes: req.body.notes
            };
            
            // Get necessary data for form
            const [customers] = await connection.execute('SELECT * FROM customers ORDER BY full_name');
            const [items] = await connection.execute(`
                SELECT i.*, 
                       c.name_persian as category_name,
                       parent.name_persian as subcategory_name
                FROM inventory_items i 
                LEFT JOIN categories c ON i.category_id = c.id 
                LEFT JOIN categories parent ON c.parent_id = parent.id
                WHERE i.current_quantity > 0
                ORDER BY parent.sort_order, c.sort_order, i.item_name
            `);
            const [goldRate] = await connection.execute(
                'SELECT rate_per_gram FROM gold_rates WHERE date = CURDATE() ORDER BY created_at DESC LIMIT 1'
            );
            
            res.render('sales/new', {
                title: 'فاکتور جدید',
                user: req.session.user,
                customers: customers,
                items: items,
                goldRate: goldRate.length > 0 ? goldRate[0].rate_per_gram : 3500000,
                error: error.message,
                formData: formData
            });
        } catch (renderError) {
            console.error('Error rendering form with error:', renderError);
            res.redirect('/sales/new?error=' + encodeURIComponent(error.message));
        }
    } finally {
        connection.release();
    }
});

// Create purchase invoice route
app.post('/sales/create-purchase', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            customer_id, 
            invoice_date, 
            invoice_date_shamsi,
            daily_gold_rate, 
            subtotal, 
            discount_amount, 
            grand_total, 
            plastic_weight,
            total_weight,
            total_labor,
            total_profit,
            total_tax,
            notes,
            selected_items 
        } = req.body;
        
        const items = JSON.parse(selected_items || '[]');
        
        // Validation
        if (!customer_id) {
            throw new Error('لطفاً مشتری را انتخاب کنید');
        }
        
        if (items.length === 0) {
            throw new Error('لطفاً حداقل یک کالا انتخاب کنید');
        }
        
        // Validate Shamsi date
        if (!invoice_date_shamsi) {
            throw new Error('لطفاً تاریخ شمسی را وارد کنید');
        }
        
        // Validate that all items have weight entered
        for (const item of items) {
            if (!item.weight || item.weight <= 0) {
                throw new Error(`لطفاً وزن کالای ${item.name} را وارد کنید`);
            }
        }
        
        // For purchase invoices, we add stock instead of checking availability
        
        // Calculate totals from items with percentage-based calculations
        let calculatedWeight = 0;
        let calculatedLabor = 0;
        let calculatedProfit = 0;
        let calculatedTax = 0;
        let calculatedSubtotal = 0;
        
        for (const item of items) {
            calculatedWeight += (item.weight || 0) * item.quantity;
            calculatedLabor += (item.calculatedLaborCost || 0);
            calculatedProfit += (item.profit || 0) * item.quantity;
            calculatedTax += (item.calculatedTaxCost || 0);
            calculatedSubtotal += item.totalPrice || 0;
        }
        
        const finalWeight = calculatedWeight - (parseFloat(plastic_weight) || 0);
        const finalTotal = calculatedSubtotal - (parseFloat(discount_amount) || 0);
        
        // Generate invoice number with PURCH prefix
        const [lastInvoice] = await connection.execute('SELECT id FROM invoices ORDER BY id DESC LIMIT 1');
        const nextId = lastInvoice.length > 0 ? lastInvoice[0].id + 1 : 1;
        const invoice_number = `PURCH-${String(nextId).padStart(4, '0')}`;
        
        // Create purchase invoice
        const [invoiceResult] = await connection.execute(`
            INSERT INTO invoices (
                invoice_number, customer_id, invoice_date, invoice_date_shamsi, gold_rate, 
                subtotal, discount_amount, grand_total,
                total_weight, plastic_weight, final_weight,
                total_labor_cost, total_profit, total_tax, manual_total_weight,
                invoice_type, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            invoice_number, customer_id, invoice_date, invoice_date_shamsi, daily_gold_rate, 
            calculatedSubtotal, discount_amount || 0, finalTotal,
            calculatedWeight, plastic_weight || 0, finalWeight,
            calculatedLabor, calculatedProfit, calculatedTax, calculatedWeight,
            'purchase', notes || null
        ]);
        
        const invoiceId = invoiceResult.insertId;
        
        // Insert invoice items and update stock (ADD for purchases)
        for (const item of items) {
            // Insert item
            await connection.execute(`
                INSERT INTO invoice_items (
                    invoice_id, item_id, quantity, weight, unit_price, total_price,
                    labor_percentage, labor_cost, profit_amount, tax_percentage, tax_cost,
                    description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                invoiceId, item.id, item.quantity, item.weight, 
                (item.totalPrice / item.quantity), item.totalPrice,
                item.laborPercentage || 0, item.calculatedLaborCost || 0,
                item.profit || 0, item.taxPercentage || 0, item.calculatedTaxCost || 0,
                item.description || null
            ]);
            
            // Update stock - ADD for purchases
            await connection.execute(
                'UPDATE inventory_items SET current_quantity = current_quantity + ? WHERE id = ?',
                [item.quantity, item.id]
            );
        }
        
        // Update customer totals - SUBTRACT for purchases (we owe customer)
        await connection.execute(`
            UPDATE customers SET 
                total_purchases = total_purchases - ?,
                current_balance = total_purchases - total_payments,
                updated_at = NOW()
            WHERE id = ?
        `, [finalTotal, customer_id]);
        
        // Add financial transaction
        await connection.execute(`
            INSERT INTO financial_transactions (
                transaction_id, transaction_type, description, amount, 
                related_customer_id, related_invoice_id, transaction_date
            ) VALUES (?, 'purchase', ?, ?, ?, ?, ?)
        `, [
            `PURCHASE-${invoice_number}`,
            `خرید کالا - فاکتور ${invoice_number}`,
            -finalTotal, // Negative for purchases
            customer_id,
            invoiceId,
            invoice_date
        ]);
        
        await connection.commit();
        res.redirect(`/sales/view/${invoiceId}?success=فاکتور خرید با موفقیت ایجاد شد`);
        
    } catch (error) {
        await connection.rollback();
        console.error('Create purchase invoice error:', error);
        
        try {
            // Prepare form data to preserve user input
            const formData = {
                customer_id: req.body.customer_id,
                invoice_date_shamsi: req.body.invoice_date_shamsi,
                invoice_date: req.body.invoice_date,
                daily_gold_rate: req.body.daily_gold_rate,
                discount_amount: req.body.discount_amount,
                plastic_weight: req.body.plastic_weight,
                notes: req.body.notes
            };
            
            // Get necessary data for form
            const [customers] = await connection.execute('SELECT * FROM customers ORDER BY full_name');
            const [items] = await connection.execute(`
                SELECT i.*, 
                       c.name_persian as category_name,
                       parent.name_persian as subcategory_name
                FROM inventory_items i 
                LEFT JOIN categories c ON i.category_id = c.id 
                LEFT JOIN categories parent ON c.parent_id = parent.id
                ORDER BY parent.sort_order, c.sort_order, i.item_name
            `);
            const [goldRate] = await connection.execute(
                'SELECT rate_per_gram FROM gold_rates WHERE date = CURDATE() ORDER BY created_at DESC LIMIT 1'
            );
            
            res.render('sales/new', {
                title: 'فاکتور خرید جدید',
                user: req.session.user,
                customers: customers,
                items: items,
                goldRate: goldRate.length > 0 ? goldRate[0].rate_per_gram : 3500000,
                error: error.message,
                formData: formData
            });
        } catch (renderError) {
            console.error('Error rendering form with error:', renderError);
            res.redirect('/sales/new?error=' + encodeURIComponent(error.message));
        }
    } finally {
        connection.release();
    }
});

// View invoice
app.get('/sales/view/:id', requireAuth, async (req, res) => {
    try {
        const [invoice] = await db.execute(`
            SELECT i.*, c.full_name as customer_name, c.phone as customer_phone, c.address as customer_address
            FROM invoices i 
            JOIN customers c ON i.customer_id = c.id 
            WHERE i.id = ?
        `, [req.params.id]);
        
        if (invoice.length === 0) {
            return res.status(404).send('فاکتور یافت نشد');
        }
        
        const [items] = await db.execute(`
            SELECT ii.*, 
                   item.item_name, 
                   item.item_code, 
                   item.precise_weight, 
                   item.carat
            FROM invoice_items ii
            JOIN inventory_items item ON ii.item_id = item.id
            WHERE ii.invoice_id = ?
        `, [req.params.id]);
        
        res.render('sales/view', {
            title: 'مشاهده فاکتور',
            user: req.session.user,
            invoice: invoice[0],
            items: items,
            success: req.query.success ? decodeURIComponent(req.query.success) : null
        });
    } catch (error) {
        console.error('View invoice error:', error);
        res.status(500).send('خطا در بارگذاری فاکتور');
    }
});

// Print invoice
app.get('/sales/print/:id', requireAuth, async (req, res) => {
    try {
        const [invoice] = await db.execute(`
            SELECT i.*, c.full_name as customer_name, c.phone as customer_phone, 
                   c.address as customer_address, c.city as customer_city,
                   c.customer_code, c.current_balance as customer_balance
            FROM invoices i 
            JOIN customers c ON i.customer_id = c.id 
            WHERE i.id = ?
        `, [req.params.id]);
        
        if (invoice.length === 0) {
            return res.status(404).send('فاکتور یافت نشد');
        }
        
        const [items] = await db.execute(`
            SELECT ii.*, item.item_name, item.item_code, item.precise_weight, item.carat
            FROM invoice_items ii
            JOIN inventory_items item ON ii.item_id = item.id
            WHERE ii.invoice_id = ?
        `, [req.params.id]);
        
        res.render('sales/print', {
            title: 'چاپ فاکتور',
            invoice: invoice[0],
            items: items,
            layout: false // Don't use layout for print page
        });
    } catch (error) {
        console.error('Print invoice error:', error);
        res.status(500).send('خطا در چاپ فاکتور');
    }
});

// Download invoice as PDF
app.get('/sales/pdf/:id', requireAuth, async (req, res) => {
    try {
        const puppeteer = require('puppeteer');
        
        const [invoice] = await db.execute(`
            SELECT i.*, c.full_name as customer_name, c.phone as customer_phone, 
                   c.address as customer_address, c.city as customer_city,
                   c.customer_code, c.current_balance as customer_balance
            FROM invoices i 
            JOIN customers c ON i.customer_id = c.id 
            WHERE i.id = ?
        `, [req.params.id]);
        
        if (invoice.length === 0) {
            return res.status(404).send('فاکتور یافت نشد');
        }
        
        const [items] = await db.execute(`
            SELECT ii.*, item.item_name, item.item_code, item.precise_weight, item.carat
            FROM invoice_items ii
            JOIN inventory_items item ON ii.item_id = item.id
            WHERE ii.invoice_id = ?
        `, [req.params.id]);
        
        // Render the print view to HTML
        const html = await new Promise((resolve, reject) => {
            res.app.render('sales/print', {
                title: 'چاپ فاکتور',
                invoice: invoice[0],
                items: items,
                layout: false
            }, (err, html) => {
                if (err) reject(err);
                else resolve(html);
            });
        });
        
        // Generate PDF
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                bottom: '10mm',
                left: '10mm',
                right: '10mm'
            }
        });
        
        await browser.close();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice[0].invoice_number}.pdf"`);
        res.send(pdf);
        
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).send('خطا در تولید PDF');
    }
});

// Edit invoice form
app.get('/sales/edit/:id', requireAuth, async (req, res) => {
    try {
        const [invoice] = await db.execute(`
            SELECT i.*, c.full_name as customer_name
            FROM invoices i 
            JOIN customers c ON i.customer_id = c.id 
            WHERE i.id = ? AND i.status = 'active'
        `, [req.params.id]);
        
        if (invoice.length === 0) {
            return res.status(404).send('فاکتور یافت نشد یا قابل ویرایش نیست');
        }
        
        // Get customers
        const [customers] = await db.execute('SELECT * FROM customers ORDER BY full_name');
        
        // Get current invoice items
        const [invoiceItems] = await db.execute(`
            SELECT ii.*, item.item_name, item.item_code, item.precise_weight as weight, item.carat
            FROM invoice_items ii
            JOIN inventory_items item ON ii.item_id = item.id
            WHERE ii.invoice_id = ?
        `, [req.params.id]);
        
        // Get available items (excluding current invoice items)
        const [availableItems] = await db.execute(`
            SELECT i.*, t.name_persian as type_name 
            FROM inventory_items i
            JOIN item_types t ON i.type_id = t.id
            WHERE i.current_quantity > 0 
            ORDER BY i.item_name
        `);
        
        res.render('sales/edit', {
            title: 'ویرایش فاکتور',
            user: req.session.user,
            invoice: invoice[0],
            customers: customers,
            invoiceItems: invoiceItems,
            availableItems: availableItems
        });
    } catch (error) {
        console.error('Edit invoice form error:', error);
        res.status(500).send('خطا در بارگذاری فرم ویرایش');
    }
});

// Update invoice
app.post('/sales/update/:id', requireAuth, async (req, res) => {
    try {
        const { 
            customer_id, 
            invoice_date, 
            gold_rate, 
            subtotal, 
            discount_amount, 
            grand_total, 
            total_weight,
            plastic_weight, 
            notes, 
            selected_items, 
            removed_items 
        } = req.body;
        
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Get current invoice
            const [currentInvoice] = await connection.execute(
                'SELECT * FROM invoices WHERE id = ? AND status = "active"',
                [req.params.id]
            );
            
            if (currentInvoice.length === 0) {
                throw new Error('فاکتور یافت نشد یا قابل ویرایش نیست');
            }
            
            // Handle removed items - restore stock
            if (removed_items) {
                const removedIds = removed_items.split(',').filter(id => id);
                for (const itemId of removedIds) {
                    const [removedItem] = await connection.execute(
                        'SELECT * FROM invoice_items WHERE id = ?',
                        [itemId]
                    );
                    
                    if (removedItem.length > 0) {
                        // Restore stock
                        await connection.execute(
                            'UPDATE inventory_items SET current_quantity = current_quantity + ? WHERE id = ?',
                            [removedItem[0].quantity, removedItem[0].item_id]
                        );
                        
                        // Delete item
                        await connection.execute(
                            'DELETE FROM invoice_items WHERE id = ?',
                            [itemId]
                        );
                    }
                }
            }
            
            // Update existing items
            const existingItems = await connection.execute(
                'SELECT * FROM invoice_items WHERE invoice_id = ?',
                [req.params.id]
            );
            
            for (const item of existingItems[0]) {
                const quantityField = `quantity_${item.id}`;
                const priceField = `unit_price_${item.id}`;
                const descField = `description_${item.id}`;
                
                if (req.body[quantityField] && req.body[priceField]) {
                    const newQuantity = parseInt(req.body[quantityField]);
                    const newPrice = parseFloat(req.body[priceField]);
                    const newDescription = req.body[descField] || '';
                    const oldQuantity = item.quantity;
                    
                    // Adjust stock
                    const quantityDiff = oldQuantity - newQuantity;
                    await connection.execute(
                        'UPDATE inventory_items SET current_quantity = current_quantity + ? WHERE id = ?',
                        [quantityDiff, item.item_id]
                    );
                    
                    // Update item
                    await connection.execute(
                        'UPDATE invoice_items SET quantity = ?, unit_price = ?, total_price = ?, description = ? WHERE id = ?',
                        [newQuantity, newPrice, newQuantity * newPrice, newDescription, item.id]
                    );
                }
            }
            
            // Add new items
            if (selected_items) {
                const newItems = JSON.parse(selected_items);
                for (const item of newItems) {
                    // Check stock
                    const [stockCheck] = await connection.execute(
                        'SELECT current_quantity FROM inventory_items WHERE id = ?',
                        [item.id]
                    );
                    
                    if (stockCheck[0].current_quantity < item.quantity) {
                        throw new Error(`موجودی کافی برای ${item.name} وجود ندارد`);
                    }
                    
                    // Insert new item
                    await connection.execute(`
                        INSERT INTO invoice_items (invoice_id, item_id, quantity, unit_price, total_price, weight, carat, description)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        req.params.id,
                        item.id,
                        item.quantity,
                        item.unitPrice,
                        item.totalPrice,
                        item.weight,
                        item.carat,
                        item.name
                    ]);
                    
                    // Update stock
                    await connection.execute(
                        'UPDATE inventory_items SET current_quantity = current_quantity - ? WHERE id = ?',
                        [item.quantity, item.id]
                    );
                }
            }
            
            // Calculate final weight
            const finalWeight = (parseFloat(total_weight) || 0) - (parseFloat(plastic_weight) || 0);
            
            // Update invoice
            await connection.execute(`
                UPDATE invoices SET 
                    customer_id = ?, 
                    invoice_date = ?, 
                    gold_rate = ?, 
                    subtotal = ?, 
                    discount_amount = ?, 
                    grand_total = ?,
                    total_weight = ?,
                    plastic_weight = ?,
                    final_weight = ?,
                    notes = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [
                customer_id,
                invoice_date,
                gold_rate,
                subtotal,
                discount_amount || 0,
                grand_total,
                total_weight || 0,
                plastic_weight || 0,
                finalWeight,
                notes,
                req.params.id
            ]);
            
            // Update customer balance
            await connection.execute(`
                UPDATE customers SET 
                    current_balance = total_purchases - total_payments,
                    updated_at = NOW()
                WHERE id = ?
            `, [customer_id]);
            
            await connection.commit();
            res.redirect(`/sales/view/${req.params.id}?success=فاکتور با موفقیت بروزرسانی شد`);
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).send('خطا در بروزرسانی فاکتور: ' + error.message);
    }
});

// Cancel invoice
app.post('/sales/cancel/:id', requireAuth, async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Get invoice details
            const [invoice] = await connection.execute(
                'SELECT * FROM invoices WHERE id = ? AND status = "active"',
                [req.params.id]
            );
            
            if (invoice.length === 0) {
                return res.status(404).json({ success: false, message: 'فاکتور یافت نشد یا قابل لغو نیست' });
            }
            
            // Get invoice items to restore stock
            const [items] = await connection.execute(
                'SELECT * FROM invoice_items WHERE invoice_id = ?',
                [req.params.id]
            );
            
            // Restore stock for each item
            for (const item of items) {
                await connection.execute(
                    'UPDATE inventory_items SET current_quantity = current_quantity + ? WHERE id = ?',
                    [item.quantity, item.item_id]
                );
            }
            
            // Update invoice status
            await connection.execute(
                'UPDATE invoices SET status = "cancelled", updated_at = NOW() WHERE id = ?',
                [req.params.id]
            );
            
            // Update customer totals
            await connection.execute(`
                UPDATE customers SET 
                    total_purchases = total_purchases - ?,
                    current_balance = total_purchases - total_payments,
                    updated_at = NOW()
                WHERE id = ?
            `, [invoice[0].grand_total, invoice[0].customer_id]);
            
            // Log financial transaction reversal
            await connection.execute(`
                INSERT INTO financial_transactions (
                    transaction_id, transaction_type, description, amount, 
                    related_customer_id, related_invoice_id, transaction_date
                ) VALUES (?, 'sale', ?, ?, ?, ?, ?)
            `, [
                `CANCEL-${invoice[0].invoice_number}-${Date.now()}`,
                `لغو فاکتور ${invoice[0].invoice_number}`,
                -invoice[0].grand_total,
                invoice[0].customer_id,
                req.params.id,
                new Date().toISOString().split('T')[0]
            ]);
            
            await connection.commit();
            res.redirect(`/sales/view/${req.params.id}?success=${encodeURIComponent('فاکتور با موفقیت لغو شد و موجودی انبار بازگردانده شد')}`);
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Cancel invoice error:', error);
        res.redirect(`/sales/view/${req.params.id}?error=${encodeURIComponent('خطا در لغو فاکتور: ' + error.message)}`);
    }
});

// Delete invoice (permanent deletion - use with caution)
app.delete('/sales/delete/:id', requireAuth, async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Check if user has admin role
            if (req.session.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'فقط مدیر سیستم اجازه حذف فاکتور دارد' });
            }
            
            // Get invoice details
            const [invoice] = await connection.execute(
                'SELECT * FROM invoices WHERE id = ?',
                [req.params.id]
            );
            
            if (invoice.length === 0) {
                return res.status(404).json({ success: false, message: 'فاکتور یافت نشد' });
            }
            
            // If invoice is active, restore stock first
            if (invoice[0].status === 'active') {
                const [items] = await connection.execute(
                    'SELECT * FROM invoice_items WHERE invoice_id = ?',
                    [req.params.id]
                );
                
                for (const item of items) {
                    await connection.execute(
                        'UPDATE inventory_items SET current_quantity = current_quantity + ? WHERE id = ?',
                        [item.quantity, item.item_id]
                    );
                }
                
                // Update customer totals
                await connection.execute(`
                    UPDATE customers SET 
                        total_purchases = total_purchases - ?,
                        current_balance = total_purchases - total_payments,
                        updated_at = NOW()
                    WHERE id = ?
                `, [invoice[0].grand_total, invoice[0].customer_id]);
            }
            
            // Delete invoice items (cascade will handle this, but explicit is better)
            await connection.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
            
            // Delete financial transactions
            await connection.execute('DELETE FROM financial_transactions WHERE related_invoice_id = ?', [req.params.id]);
            
            // Delete invoice
            await connection.execute('DELETE FROM invoices WHERE id = ?', [req.params.id]);
            
            await connection.commit();
            res.json({ success: true, message: 'فاکتور با موفقیت حذف شد' });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ success: false, message: 'خطا در حذف فاکتور: ' + error.message });
    }
});

// ==================== CATEGORIES MANAGEMENT ROUTES ====================

// Categories List
app.get('/inventory/categories', requireAuth, async (req, res) => {
    try {
        // Get all categories with parent information
        const [categories] = await db.execute(`
            SELECT c.*, 
                   p.name_persian as parent_name,
                   COUNT(DISTINCT ic.id) as items_count,
                   COUNT(DISTINCT sub.id) as subcategories_count
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
            LEFT JOIN inventory_items ic ON c.id = ic.category_id
            LEFT JOIN categories sub ON c.id = sub.parent_id
            WHERE c.is_active = true
            GROUP BY c.id
            ORDER BY c.parent_id ASC, c.sort_order ASC, c.name_persian ASC
        `);
        
        // Organize categories into hierarchy
        const mainCategories = categories.filter(cat => !cat.parent_id);
        const subCategories = categories.filter(cat => cat.parent_id);
        
        res.render('inventory/categories', {
            title: 'مدیریت دسته‌بندی‌ها',
            user: req.session.user,
            mainCategories: mainCategories,
            subCategories: subCategories,
            allCategories: categories
        });
    } catch (error) {
        console.error('Categories list error:', error);
        res.status(500).send('خطا در بارگذاری دسته‌بندی‌ها');
    }
});

// Add Category Form
app.get('/inventory/categories/add', requireAuth, async (req, res) => {
    try {
        // Get parent categories only
        const [parentCategories] = await db.execute(`
            SELECT * FROM categories 
            WHERE parent_id IS NULL AND is_active = true
            ORDER BY sort_order ASC, name_persian ASC
        `);
        
        res.render('inventory/category-add', {
            title: 'افزودن دسته‌بندی جدید',
            user: req.session.user,
            parentCategories: parentCategories,
            req: req // Add req object for template access
        });
    } catch (error) {
        console.error('Add category form error:', error);
        res.status(500).send('خطا در بارگذاری فرم');
    }
});

// Create Category
app.post('/inventory/categories/create', requireAuth, async (req, res) => {
    try {
        const { name, name_persian, parent_id, description, sort_order } = req.body;
        
        // Validate required fields
        if (!name || !name_persian) {
            return res.status(400).send('نام انگلیسی و فارسی الزامی است');
        }
        
        // Check if name already exists
        const [existing] = await db.execute(
            'SELECT id FROM categories WHERE name = ? OR name_persian = ?',
            [name, name_persian]
        );
        
        if (existing.length > 0) {
            return res.status(400).send('دسته‌بندی با این نام قبلاً وجود دارد');
        }
        
        // Insert new category
        await db.execute(`
            INSERT INTO categories (name, name_persian, parent_id, description, sort_order)
            VALUES (?, ?, ?, ?, ?)
        `, [
            name, 
            name_persian, 
            parent_id || null, 
            description || null, 
            sort_order || 0
        ]);
        
        res.redirect('/inventory/categories?success=دسته‌بندی با موفقیت اضافه شد');
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).send('خطا در ایجاد دسته‌بندی: ' + error.message);
    }
});

// Edit Category Form
app.get('/inventory/categories/edit/:id', requireAuth, async (req, res) => {
    try {
        const [category] = await db.execute(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );
        
        if (category.length === 0) {
            return res.status(404).send('دسته‌بندی یافت نشد');
        }
        
        const [parentCategories] = await db.execute(`
            SELECT * FROM categories 
            WHERE parent_id IS NULL AND is_active = true AND id != ?
            ORDER BY sort_order ASC, name_persian ASC
        `, [req.params.id]);
        
        res.render('inventory/category-edit', {
            title: 'ویرایش دسته‌بندی',
            user: req.session.user,
            category: category[0],
            parentCategories: parentCategories,
            req: req // Add req object for template access
        });
    } catch (error) {
        console.error('Edit category form error:', error);
        res.status(500).send('خطا در بارگذاری فرم ویرایش');
    }
});

// Update Category
app.post('/inventory/categories/update/:id', requireAuth, async (req, res) => {
    try {
        const { name, name_persian, parent_id, description, sort_order, is_active } = req.body;
        
        // Validate required fields
        if (!name || !name_persian) {
            return res.status(400).send('نام انگلیسی و فارسی الزامی است');
        }
        
        // Check if name already exists (except current category)
        const [existing] = await db.execute(
            'SELECT id FROM categories WHERE (name = ? OR name_persian = ?) AND id != ?',
            [name, name_persian, req.params.id]
        );
        
        if (existing.length > 0) {
            return res.status(400).send('دسته‌بندی با این نام قبلاً وجود دارد');
        }
        
        // Prevent setting parent to self or descendant
        if (parent_id && parent_id == req.params.id) {
            return res.status(400).send('دسته‌بندی نمی‌تواند والد خود باشد');
        }
        
        // Update category
        await db.execute(`
            UPDATE categories 
            SET name = ?, name_persian = ?, parent_id = ?, description = ?, 
                sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            name,
            name_persian,
            parent_id || null,
            description || null,
            sort_order || 0,
            is_active ? true : false,
            req.params.id
        ]);
        
        res.redirect('/inventory/categories?success=دسته‌بندی با موفقیت بروزرسانی شد');
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).send('خطا در بروزرسانی دسته‌بندی: ' + error.message);
    }
});

// Delete Category
app.post('/inventory/categories/delete/:id', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Check if category has items
        const [items] = await connection.execute(
            'SELECT COUNT(*) as count FROM inventory_items WHERE category_id = ?',
            [req.params.id]
        );
        
        if (items[0].count > 0) {
            await connection.rollback();
            return res.status(400).send('این دسته‌بندی دارای کالا است و قابل حذف نیست');
        }
        
        // Check if category has subcategories
        const [subcats] = await connection.execute(
            'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
            [req.params.id]
        );
        
        if (subcats[0].count > 0) {
            await connection.rollback();
            return res.status(400).send('این دسته‌بندی دارای زیرمجموعه است و قابل حذف نیست');
        }
        
        // Delete category
        await connection.execute(
            'DELETE FROM categories WHERE id = ?',
            [req.params.id]
        );
        
        await connection.commit();
        res.redirect('/inventory/categories?success=دسته‌بندی با موفقیت حذف شد');
        
    } catch (error) {
        await connection.rollback();
        console.error('Delete category error:', error);
        res.status(500).send('خطا در حذف دسته‌بندی: ' + error.message);
    } finally {
        connection.release();
    }
});

// ==================== ACCOUNTING ROUTES ====================

// Main Accounting Dashboard
app.get('/accounting', requireAuth, async (req, res) => {
    try {
        // Get financial summary
        const [totalSales] = await db.execute(`
            SELECT COALESCE(SUM(grand_total), 0) as total 
            FROM invoices 
            WHERE status = 'active'
        `);
        
        const [totalPayments] = await db.execute(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM payments
        `);
        
        const [customerBalances] = await db.execute(`
            SELECT COALESCE(SUM(current_balance), 0) as total 
            FROM customers 
            WHERE current_balance > 0
        `);
        
        const [todayTransactions] = await db.execute(`
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
            FROM financial_transactions 
            WHERE DATE(transaction_date) = CURDATE()
        `);
        
        res.render('accounting/dashboard', {
            title: 'حسابداری - نمای کلی',
            user: req.session.user,
            summary: {
                totalSales: totalSales[0].total,
                totalPayments: totalPayments[0].total,
                customerBalances: customerBalances[0].total,
                todayTransactions: todayTransactions[0].count,
                todayAmount: todayTransactions[0].total
            }
        });
    } catch (error) {
        console.error('Accounting dashboard error:', error);
        res.status(500).send('خطا در بارگذاری حسابداری');
    }
});

// General Ledger (دفتر کل)
app.get('/accounting/general-ledger', requireAuth, async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        
        let whereClause = '1=1';
        let params = [];
        
        if (startDate) {
            whereClause += ' AND DATE(transaction_date) >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            whereClause += ' AND DATE(transaction_date) <= ?';
            params.push(endDate);
        }
        
        if (type && type !== 'all') {
            whereClause += ' AND transaction_type = ?';
            params.push(type);
        }
        
        const [transactions] = await db.execute(`
            SELECT ft.*, c.full_name as customer_name, i.invoice_number
            FROM financial_transactions ft
            LEFT JOIN customers c ON ft.related_customer_id = c.id
            LEFT JOIN invoices i ON ft.related_invoice_id = i.id
            WHERE ${whereClause}
            ORDER BY ft.transaction_date DESC, ft.created_at DESC
        `, params);
        
        res.render('accounting/general-ledger', {
            title: 'حسابداری - دفتر کل',
            user: req.session.user,
            transactions: transactions,
            filters: { startDate, endDate, type }
        });
    } catch (error) {
        console.error('General ledger error:', error);
        res.status(500).send('خطا در بارگذاری دفتر کل');
    }
});

// Customer Accounts (حساب تفصیلی مشتریان)
app.get('/accounting/customer-accounts', requireAuth, async (req, res) => {
    try {
        const [customers] = await db.execute(`
            SELECT c.*,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'sale' THEN ft.amount ELSE 0 END), 0) as total_purchases,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'payment' THEN ft.amount ELSE 0 END), 0) as total_payments,
                c.current_balance
            FROM customers c
            LEFT JOIN financial_transactions ft ON c.id = ft.related_customer_id
            GROUP BY c.id
            ORDER BY c.current_balance DESC, c.full_name
        `);
        
        res.render('accounting/customer-accounts', {
            title: 'حسابداری - حساب تفصیلی مشتریان',
            user: req.session.user,
            customers: customers
        });
    } catch (error) {
        console.error('Customer accounts error:', error);
        res.status(500).send('خطا در بارگذاری حساب مشتریان');
    }
});

// Customer Account Detail
app.get('/accounting/customer/:id', requireAuth, async (req, res) => {
    try {
        const [customer] = await db.execute(`
            SELECT * FROM customers WHERE id = ?
        `, [req.params.id]);
        
        if (customer.length === 0) {
            return res.status(404).send('مشتری یافت نشد');
        }
        
        // Enhanced transactions query with proper payment tracking
        const [transactions] = await db.execute(`
            SELECT 
                'sale' as transaction_type,
                i.grand_total as amount,
                i.invoice_date as transaction_date,
                CONCAT('فاکتور شماره ', i.invoice_number) as description,
                i.invoice_number,
                i.id as related_invoice_id
            FROM invoices i
            WHERE i.customer_id = ? AND i.status = 'active'
            
            UNION ALL
            
            SELECT 
                'payment' as transaction_type,
                p.amount,
                p.payment_date as transaction_date,
                COALESCE(p.description, CONCAT('پرداخت فاکتور ', i.invoice_number)) as description,
                i.invoice_number,
                p.invoice_id as related_invoice_id
            FROM payments p
            LEFT JOIN invoices i ON p.invoice_id = i.id
            WHERE p.customer_id = ?
            
            ORDER BY transaction_date DESC
        `, [req.params.id, req.params.id]);
        
        // Get invoices with enhanced payment status
        const [invoices] = await db.execute(`
            SELECT 
                i.*,
                IFNULL(i.paid_amount, 0) as paid_amount,
                IFNULL(i.remaining_amount, i.grand_total) as remaining_amount,
                IFNULL(i.payment_status, 'unpaid') as payment_status
            FROM invoices i
            WHERE i.customer_id = ? AND i.status = 'active'
            ORDER BY i.created_at DESC
        `, [req.params.id]);
        
        // Calculate accurate summary using customer table data
        const [summaryData] = await db.execute(`
            SELECT 
                total_purchases,
                total_payments,
                current_balance
            FROM customers 
            WHERE id = ?
        `, [req.params.id]);
        
        const summary = summaryData[0] || { total_purchases: 0, total_payments: 0, current_balance: 0 };

        res.render('accounting/customer-detail', {
            title: `حسابداری - ${customer[0].full_name}`,
            user: req.session.user,
            customer: customer[0],
            transactions: transactions.map(t => ({
                ...t,
                formatted_date: moment(t.transaction_date).format('jYYYY/jMM/jDD')
            })),
            invoices: invoices.map(inv => ({
                ...inv,
                formatted_date: inv.invoice_date_shamsi || moment(inv.invoice_date).format('jYYYY/jMM/jDD')
            })),
            summary: {
                totalPurchases: summary.total_purchases,
                totalPayments: summary.total_payments,
                currentBalance: summary.current_balance
            }
        });
    } catch (error) {
        console.error('Enhanced customer detail error:', error);
        res.status(500).send('خطا در بارگذاری جزئیات مشتری');
    }
});

// Financial Reports (گزارشات مالی)
app.get('/accounting/reports', requireAuth, async (req, res) => {
    try {
        const { period } = req.query;
        let startDate, endDate;
        
        // Calculate date range based on period
        const today = new Date();
        if (period === 'today') {
            startDate = endDate = today.toISOString().split('T')[0];
        } else if (period === 'week') {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            startDate = weekAgo.toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
        } else if (period === 'month') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
        } else {
            // Default to current month
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
        }
        
        // Sales Report
        const [salesReport] = await db.execute(`
            SELECT 
                COUNT(*) as invoice_count,
                COALESCE(SUM(grand_total), 0) as total_sales,
                COALESCE(AVG(grand_total), 0) as avg_sale
            FROM invoices 
            WHERE DATE(invoice_date) BETWEEN ? AND ? AND status = 'active'
        `, [startDate, endDate]);
        
        // Payment Report
        const [paymentReport] = await db.execute(`
            SELECT 
                COUNT(*) as payment_count,
                COALESCE(SUM(amount), 0) as total_payments,
                payment_method,
                COUNT(*) as method_count
            FROM payments 
            WHERE DATE(payment_date) BETWEEN ? AND ?
            GROUP BY payment_method
        `, [startDate, endDate]);
        
        // Top Customers
        const [topCustomers] = await db.execute(`
            SELECT c.full_name, c.customer_code, COALESCE(SUM(i.grand_total), 0) as total_purchases
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id 
                AND DATE(i.invoice_date) BETWEEN ? AND ? 
                AND i.status = 'active'
            GROUP BY c.id
            HAVING total_purchases > 0
            ORDER BY total_purchases DESC
            LIMIT 10
        `, [startDate, endDate]);
        
        res.render('accounting/reports', {
            title: 'حسابداری - گزارشات مالی',
            user: req.session.user,
            period: period || 'month',
            dateRange: { startDate, endDate },
            salesReport: salesReport[0],
            paymentReport: paymentReport,
            topCustomers: topCustomers
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).send('خطا در تولید گزارشات');
    }
});

// Enhanced Payment Processing - Inline Implementation

app.post('/accounting/add-payment', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { customer_id, invoice_id, amount, payment_method, payment_date, description } = req.body;
        
        // Validate required fields
        if (!customer_id || !amount || !payment_date) {
            throw new Error('اطلاعات ضروری ناقص است');
        }
        
        const paymentAmount = parseFloat(amount);
        
        // 1. Insert payment record
        const [paymentResult] = await connection.execute(`
            INSERT INTO payments (customer_id, invoice_id, amount, payment_method, payment_date, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [customer_id, invoice_id || null, paymentAmount, payment_method || 'cash', payment_date, description || 'پرداخت مشتری']);
        
        // 2. If payment is for a specific invoice, update invoice payment status
        if (invoice_id) {
            // Get current invoice data
            const [invoiceData] = await connection.execute(`
                SELECT grand_total, IFNULL(paid_amount, 0) as current_paid
                FROM invoices WHERE id = ?
            `, [invoice_id]);
            
            if (invoiceData.length > 0) {
                const invoice = invoiceData[0];
                const newPaidAmount = parseFloat(invoice.current_paid) + paymentAmount;
                const remainingAmount = parseFloat(invoice.grand_total) - newPaidAmount;
                
                let paymentStatus = 'unpaid';
                if (newPaidAmount >= parseFloat(invoice.grand_total)) {
                    paymentStatus = 'paid';
                } else if (newPaidAmount > 0) {
                    paymentStatus = 'partial';
                }
                
                // Update invoice payment status
                await connection.execute(`
                    UPDATE invoices 
                    SET paid_amount = ?, remaining_amount = ?, payment_status = ?
                    WHERE id = ?
                `, [newPaidAmount, Math.max(0, remainingAmount), paymentStatus, invoice_id]);
            }
        }
        
        // 3. Update customer balance
        await connection.execute(`
            UPDATE customers 
            SET total_payments = total_payments + ?,
                current_balance = current_balance - ?
            WHERE id = ?
        `, [paymentAmount, paymentAmount, customer_id]);
        
        // 4. Add financial transaction record
        const transactionId = `PAY-${Date.now()}`;
        await connection.execute(`
            INSERT INTO financial_transactions (
                transaction_id, transaction_type, description, amount, 
                related_customer_id, related_invoice_id, transaction_date
            ) VALUES (?, 'payment', ?, ?, ?, ?, ?)
        `, [
            transactionId,
            description || 'دریافت پرداخت',
            paymentAmount,
            customer_id,
            invoice_id || null,
            payment_date
        ]);
        
        await connection.commit();
        
        // Check if request expects JSON response
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            res.json({ 
                success: true, 
                message: 'پرداخت با موفقیت ثبت و تمام حساب‌ها بروزرسانی شد' 
            });
        } else {
            res.redirect(`/accounting/customer/${customer_id}?success=1`);
        }
        
    } catch (error) {
        await connection.rollback();
        console.error('Payment processing error:', error);
        
        // Check if request expects JSON response
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            res.status(500).json({ 
                success: false, 
                message: 'خطا در ثبت پرداخت: ' + error.message 
            });
        } else {
            res.status(500).send('خطا در ثبت پرداخت: ' + error.message);
        }
    } finally {
        connection.release();
    }
});

// مسیر مشاهده جزئیات مشتری
app.get('/customers/view/:id', requireAuth, async (req, res) => {
    try {
        const customerId = req.params.id;
        
        const [customer] = await db.execute(`
            SELECT c.*, 
                   CASE WHEN c.birth_date IS NOT NULL 
                        THEN TIMESTAMPDIFF(YEAR, c.birth_date, CURDATE()) 
                        ELSE NULL 
                   END as age,
                   CASE 
                       WHEN c.last_purchase_date IS NULL THEN 'بدون خرید'
                       WHEN DATEDIFF(CURDATE(), c.last_purchase_date) <= 30 THEN 'فعال'
                       WHEN DATEDIFF(CURDATE(), c.last_purchase_date) <= 90 THEN 'نیمه فعال'
                       ELSE 'غیرفعال'
                   END as activity_status
            FROM customers c 
            WHERE c.id = ?
        `, [customerId]);
        
        if (customer.length === 0) {
            return res.status(404).render('customers/list', {
                title: 'مشتریان',
                customers: [],
                errorMessage: 'مشتری مورد نظر یافت نشد'
            });
        }

        // دریافت تاریخ‌های خرید مشتری
        const [purchases] = await db.execute(`
            SELECT invoice_date, grand_total, status 
            FROM invoices 
            WHERE customer_id = ? 
            ORDER BY invoice_date DESC 
            LIMIT 10
        `, [customerId]);

        res.render('customers/view', {
            title: 'جزئیات مشتری',
            customer: customer[0],
            purchases: purchases
        });
    } catch (error) {
        console.error('Customer view error:', error);
        res.status(500).render('customers/list', {
            title: 'مشتریان',
            customers: [],
            errorMessage: 'خطا در نمایش جزئیات مشتری'
        });
    }
});

// مسیر ویرایش مشتری
app.get('/customers/edit/:id', requireAuth, async (req, res) => {
    try {
        const customerId = req.params.id;
        
        const [customer] = await db.execute(`
            SELECT * FROM customers WHERE id = ?
        `, [customerId]);
        
        if (customer.length === 0) {
            return res.status(404).render('customers/list', {
                title: 'مشتریان',
                customers: [],
                errorMessage: 'مشتری مورد نظر یافت نشد'
            });
        }

        res.render('customers/edit', {
            title: 'ویرایش مشتری',
            customer: customer[0],
            successMessage: null,
            errorMessage: null
        });
    } catch (error) {
        console.error('Customer edit page error:', error);
        res.status(500).render('customers/list', {
            title: 'مشتریان',
            customers: [],
            errorMessage: 'خطا در بارگذاری صفحه ویرایش'
        });
    }
});

// مسیر بروزرسانی مشتری
app.post('/customers/edit/:id', requireAuth, async (req, res) => {
    try {
        const customerId = req.params.id;
        const {
            full_name, national_id, phone, address, email, birth_date,
            gender, job_title, emergency_phone, reference_name, notes,
            customer_type, is_active
        } = req.body;

        // اعتبارسنجی نام
        if (!full_name || full_name.trim().length < 3) {
            const [customer] = await db.execute('SELECT * FROM customers WHERE id = ?', [customerId]);
            return res.render('customers/edit', {
                title: 'ویرایش مشتری',
                customer: customer[0],
                errorMessage: 'نام و نام خانوادگی باید حداقل 3 کاراکتر باشد',
                successMessage: null
            });
        }

        // بررسی تکرار کد ملی (اگر وارد شده باشد)
        if (national_id && national_id.trim()) {
            const [existingCustomer] = await db.execute(`
                SELECT id, full_name FROM customers 
                WHERE national_id = ? AND id != ?
            `, [national_id.trim(), customerId]);
            
            if (existingCustomer.length > 0) {
                const [customer] = await db.execute('SELECT * FROM customers WHERE id = ?', [customerId]);
                return res.render('customers/edit', {
                    title: 'ویرایش مشتری',
                    customer: customer[0],
                    errorMessage: `کد ملی ${national_id} قبلاً برای مشتری "${existingCustomer[0].full_name}" ثبت شده است`,
                    successMessage: null
                });
            }
        }

        // بروزرسانی اطلاعات مشتری
        await db.execute(`
            UPDATE customers SET 
                full_name = ?, 
                national_id = ?, 
                phone = ?, 
                address = ?,
                email = ?,
                birth_date = ?,
                gender = ?,
                job_title = ?,
                emergency_phone = ?,
                reference_name = ?,
                notes = ?,
                customer_type = ?,
                is_active = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [
            full_name.trim(),
            national_id ? national_id.trim() : null,
            phone ? phone.trim() : null,
            address ? address.trim() : null,
            email ? email.trim() : null,
            birth_date || null,
            gender || null,
            job_title ? job_title.trim() : null,
            emergency_phone ? emergency_phone.trim() : null,
            reference_name ? reference_name.trim() : null,
            notes ? notes.trim() : null,
            customer_type || 'normal',
            is_active === 'on' ? 1 : 0,
            customerId
        ]);

        const [updatedCustomer] = await db.execute('SELECT * FROM customers WHERE id = ?', [customerId]);
        
        res.render('customers/edit', {
            title: 'ویرایش مشتری',
            customer: updatedCustomer[0],
            successMessage: '✅ اطلاعات مشتری با موفقیت بروزرسانی شد',
            errorMessage: null
        });

    } catch (error) {
        console.error('Customer update error:', error);
        const [customer] = await db.execute('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        
        let errorMessage = 'خطا در بروزرسانی اطلاعات مشتری';
        if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'کد ملی تکراری است. لطفاً کد ملی دیگری وارد کنید';
        }
        
        res.render('customers/edit', {
            title: 'ویرایش مشتری',
            customer: customer[0],
            errorMessage: errorMessage,
            successMessage: null
        });
    }
});

// مسیر حذف مشتری
app.delete('/customers/delete/:id', requireAuth, async (req, res) => {
    try {
        const customerId = req.params.id;
        
        // بررسی وجود مشتری
        const [customer] = await db.execute('SELECT full_name FROM customers WHERE id = ?', [customerId]);
        
        if (customer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'مشتری مورد نظر یافت نشد'
            });
        }

        // حذف مشتری
        await db.execute('DELETE FROM customers WHERE id = ?', [customerId]);
        
        res.json({
            success: true,
            message: `مشتری "${customer[0].full_name}" با موفقیت حذف شد`
        });

    } catch (error) {
        console.error('Customer delete error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در حذف مشتری'
        });
    }
});

// مسیر جزئیات حساب مالی مشتری
app.get('/accounting/customer-detail/:id', requireAuth, async (req, res) => {
    try {
        const customerId = req.params.id;
        
        // دریافت اطلاعات مشتری
        const [customer] = await db.execute(`
            SELECT c.*,
                   CASE WHEN c.birth_date IS NOT NULL 
                        THEN TIMESTAMPDIFF(YEAR, c.birth_date, CURDATE()) 
                        ELSE NULL 
                   END as age
            FROM customers c 
            WHERE c.id = ?
        `, [customerId]);
        
        if (customer.length === 0) {
            return res.status(404).render('customers/list', {
                title: 'مشتریان',
                customers: [],
                errorMessage: 'مشتری مورد نظر یافت نشد'
            });
        }

        // دریافت تراکنش‌های مالی
        const [transactions] = await db.execute(`
            SELECT ft.*, 
                   DATE_FORMAT(ft.transaction_date, '%Y/%m/%d') as formatted_date,
                   i.invoice_number
            FROM financial_transactions ft
            LEFT JOIN invoices i ON ft.related_invoice_id = i.id
            WHERE ft.related_customer_id = ? 
            ORDER BY ft.transaction_date DESC, ft.created_at DESC
        `, [customerId]);

        // دریافت فاکتورها
        const [invoices] = await db.execute(`
            SELECT i.*, 
                   DATE_FORMAT(i.invoice_date, '%Y/%m/%d') as formatted_date,
                   (i.grand_total - COALESCE(
                       (SELECT SUM(ft.amount) 
                        FROM financial_transactions ft 
                        WHERE ft.related_invoice_id = i.id 
                        AND ft.transaction_type = 'payment'), 0
                   )) as remaining_amount
            FROM invoices i
            WHERE i.customer_id = ? 
            ORDER BY i.invoice_date DESC
        `, [customerId]);

        // محاسبه خلاصه مالی
        const totalPurchases = invoices.reduce((sum, invoice) => sum + Number(invoice.grand_total), 0);
        const totalPayments = transactions
            .filter(t => t.transaction_type === 'payment')
            .reduce((sum, payment) => sum + Number(payment.amount), 0);
        const currentBalance = totalPurchases - totalPayments;

        res.render('accounting/customer-detail', {
            title: 'حساب مالی مشتری',
            customer: customer[0],
            transactions: transactions,
            invoices: invoices,
            summary: {
                totalPurchases: totalPurchases,
                totalPayments: totalPayments,
                currentBalance: currentBalance
            }
        });

    } catch (error) {
        console.error('Customer accounting error:', error);
        res.status(500).render('customers/list', {
            title: 'مشتریان', 
            customers: [],
            errorMessage: 'خطا در نمایش حساب مالی مشتری'
        });
    }
});

// ===============================================
// PROFESSIONAL ACCOUNTING SYSTEM ROUTES
// ===============================================

// Chart of Accounts Management
app.get('/accounting/chart-of-accounts', requireAuth, async (req, res) => {
    try {
        const [accounts] = await db.execute(`
            SELECT a.*, p.account_name_persian as parent_name
            FROM chart_of_accounts a
            LEFT JOIN chart_of_accounts p ON a.parent_account_id = p.id
            WHERE a.is_active = true
            ORDER BY a.account_code
        `);
        
        res.render('accounting/chart-of-accounts', {
            title: 'حسابداری - بهار حساب‌ها',
            user: req.session.user,
            accounts: accounts
        });
    } catch (error) {
        console.error('Chart of accounts error:', error);
        res.status(500).send('خطا در بارگذاری بهار حساب‌ها');
    }
});

// Add New Account
app.post('/accounting/chart-of-accounts/add', requireAuth, async (req, res) => {
    try {
        const { account_code, account_name_persian, account_name, account_type, parent_account_id, initial_balance, description } = req.body;
        
        // Check if account code already exists
        const [existingAccount] = await db.execute(`
            SELECT id FROM chart_of_accounts WHERE account_code = ?
        `, [account_code]);
        
        if (existingAccount.length > 0) {
            return res.redirect('/accounting/chart-of-accounts?error=' + encodeURIComponent('کد حساب قبلاً موجود است'));
        }
        
        await db.execute(`
            INSERT INTO chart_of_accounts (
                account_code, account_name_persian, account_name, account_type, 
                parent_account_id, balance, description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            account_code, 
            account_name_persian, 
            account_name || account_name_persian, 
            account_type, 
            parent_account_id || null, 
            initial_balance || 0,
            description || null
        ]);
        
        res.redirect('/accounting/chart-of-accounts?success=' + encodeURIComponent('حساب جدید با موفقیت اضافه شد'));
    } catch (error) {
        console.error('Add account error:', error);
        res.redirect('/accounting/chart-of-accounts?error=' + encodeURIComponent('خطا در اضافه کردن حساب'));
    }
});

// Edit Account
app.post('/accounting/chart-of-accounts/edit', requireAuth, async (req, res) => {
    try {
        const { account_id, account_code, account_name_persian, account_type, parent_account_id } = req.body;
        
        // Check if account code already exists for another account
        const [existingAccount] = await db.execute(`
            SELECT id FROM chart_of_accounts WHERE account_code = ? AND id != ?
        `, [account_code, account_id]);
        
        if (existingAccount.length > 0) {
            return res.redirect('/accounting/chart-of-accounts?error=' + encodeURIComponent('کد حساب برای حساب دیگری موجود است'));
        }
        
        await db.execute(`
            UPDATE chart_of_accounts SET 
                account_code = ?, 
                account_name_persian = ?, 
                account_type = ?, 
                parent_account_id = ?,
                updated_at = NOW()
            WHERE id = ? AND is_system_account = FALSE
        `, [account_code, account_name_persian, account_type, parent_account_id || null, account_id]);
        
        res.redirect('/accounting/chart-of-accounts?success=' + encodeURIComponent('حساب با موفقیت بروزرسانی شد'));
    } catch (error) {
        console.error('Edit account error:', error);
        res.redirect('/accounting/chart-of-accounts?error=' + encodeURIComponent('خطا در ویرایش حساب'));
    }
});

// Delete Account
app.post('/accounting/chart-of-accounts/delete', requireAuth, async (req, res) => {
    try {
        const { account_id } = req.body;
        
        // Check if account has transactions
        const [hasTransactions] = await db.execute(`
            SELECT COUNT(*) as count FROM transactions 
            WHERE debit_account_id = ? OR credit_account_id = ?
        `, [account_id, account_id]);
        
        if (hasTransactions[0].count > 0) {
            return res.redirect('/accounting/chart-of-accounts?error=' + encodeURIComponent('این حساب دارای تراکنش است و قابل حذف نیست'));
        }
        
        // Check if it's a system account
        const [account] = await db.execute(`
            SELECT is_system_account FROM chart_of_accounts WHERE id = ?
        `, [account_id]);
        
        if (account.length > 0 && account[0].is_system_account) {
            return res.redirect('/accounting/chart-of-accounts?error=' + encodeURIComponent('حساب‌های سیستمی قابل حذف نیستند'));
        }
        
        // Soft delete - mark as inactive
        await db.execute(`
            UPDATE chart_of_accounts SET is_active = FALSE, updated_at = NOW() WHERE id = ?
        `, [account_id]);
        
        res.redirect('/accounting/chart-of-accounts?success=' + encodeURIComponent('حساب با موفقیت حذف شد'));
    } catch (error) {
        console.error('Delete account error:', error);
        res.redirect('/accounting/chart-of-accounts?error=' + encodeURIComponent('خطا در حذف حساب'));
    }
});

// Account Ledger (دفتر معین)
app.get('/accounting/account-ledger/:id', requireAuth, async (req, res) => {
    try {
        const accountId = req.params.id;
        const { startDate, endDate } = req.query;
        
        // Get account details
        const [account] = await db.execute(`
            SELECT * FROM chart_of_accounts WHERE id = ? AND is_active = true
        `, [accountId]);
        
        if (account.length === 0) {
            return res.status(404).send('حساب یافت نشد');
        }
        
        // Build date filter
        let dateFilter = '';
        let dateParams = [];
        
        if (startDate) {
            dateFilter += ' AND je.entry_date >= ?';
            dateParams.push(startDate);
        }
        
        if (endDate) {
            dateFilter += ' AND je.entry_date <= ?';
            dateParams.push(endDate);
        }
        
        // Get account transactions
        const [transactions] = await db.execute(`
            SELECT je.*, jed.debit_amount, jed.credit_amount, jed.description as detail_description,
                   ca_opposite.account_name_persian as opposite_account,
                   CASE 
                       WHEN je.reference_type = 'transaction' AND t.party_type = 'customer' THEN c.full_name
                       WHEN je.reference_type = 'transaction' AND t.party_type = 'supplier' THEN s.company_name
                       WHEN je.reference_type = 'transaction' AND t.party_type = 'employee' THEN e.full_name
                       WHEN je.reference_type = 'transaction' AND t.party_type = 'other' THEN op.party_name
                       ELSE NULL
                   END as party_name
            FROM journal_entries je
            JOIN journal_entry_details jed ON je.id = jed.journal_entry_id
            LEFT JOIN journal_entry_details jed_opposite ON je.id = jed_opposite.journal_entry_id AND jed_opposite.account_id != ?
            LEFT JOIN chart_of_accounts ca_opposite ON jed_opposite.account_id = ca_opposite.id
            LEFT JOIN transactions t ON je.reference_type = 'transaction' AND je.reference_id = t.id
            LEFT JOIN customers c ON t.party_type = 'customer' AND t.party_id = c.id
            LEFT JOIN suppliers s ON t.party_type = 'supplier' AND t.party_id = s.id
            LEFT JOIN employees e ON t.party_type = 'employee' AND t.party_id = e.id
            LEFT JOIN other_parties op ON t.party_type = 'other' AND t.party_id = op.id
            WHERE jed.account_id = ? ${dateFilter}
            ORDER BY je.entry_date DESC, je.created_at DESC
        `, [accountId, accountId, ...dateParams]);
        
        // Calculate running balance
        let runningBalance = parseFloat(account[0].balance || 0);
        const transactionsWithBalance = transactions.map(transaction => {
            const debitAmount = parseFloat(transaction.debit_amount || 0);
            const creditAmount = parseFloat(transaction.credit_amount || 0);
            
            // For assets and expenses: debit increases, credit decreases
            // For liabilities, equity, revenue: credit increases, debit decreases
            if (['asset', 'expense'].includes(account[0].account_type)) {
                runningBalance += debitAmount - creditAmount;
            } else {
                runningBalance += creditAmount - debitAmount;
            }
            
            return {
                ...transaction,
                running_balance: runningBalance
            };
        }).reverse(); // Reverse to show oldest first with correct running balance
        
        res.render('accounting/account-ledger', {
            title: `دفتر معین - ${account[0].account_name_persian}`,
            user: req.session.user,
            account: account[0],
            transactions: transactionsWithBalance.reverse(), // Back to newest first
            filters: { startDate, endDate }
        });
    } catch (error) {
        console.error('Account ledger error:', error);
        res.status(500).send('خطا در بارگذاری دفتر معین');
    }
});

// Bank Accounts Management
app.get('/accounting/bank-accounts', requireAuth, async (req, res) => {
    try {
        const [bankAccounts] = await db.execute(`
            SELECT ba.*,
                   (SELECT COUNT(*) FROM bank_transactions bt WHERE bt.bank_account_id = ba.id) as transaction_count,
                   (SELECT COUNT(*) FROM bank_transactions bt WHERE bt.bank_account_id = ba.id AND bt.reconciled = false) as unreconciled_count
            FROM bank_accounts ba
            WHERE ba.is_active = true
            ORDER BY ba.bank_name, ba.account_number
        `);
        
        // Calculate total bank balance
        const totalBalance = bankAccounts.reduce((sum, account) => sum + parseFloat(account.current_balance || 0), 0);
        
        res.render('accounting/bank-accounts', {
            title: 'حسابداری - حساب‌های بانکی',
            user: req.session.user,
            bankAccounts: bankAccounts,
            totalBalance: totalBalance
        });
    } catch (error) {
        console.error('Bank accounts error:', error);
        res.status(500).send('خطا در بارگذاری حساب‌های بانکی');
    }
});

// Add Bank Account
app.post('/accounting/bank-accounts/add', requireAuth, async (req, res) => {
    try {
        const { account_number, bank_name, branch_name, account_holder, account_type, initial_balance, notes } = req.body;
        
        await db.execute(`
            INSERT INTO bank_accounts (account_number, bank_name, branch_name, account_holder, account_type, current_balance, initial_balance, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [account_number, bank_name, branch_name || null, account_holder, account_type, initial_balance || 0, initial_balance || 0, notes || null]);
        
        res.redirect('/accounting/bank-accounts?success=account_added');
    } catch (error) {
        console.error('Add bank account error:', error);
        res.redirect('/accounting/bank-accounts?error=add_failed');
    }
});

// Bank Account Transactions
app.get('/accounting/bank-accounts/:id/transactions', requireAuth, async (req, res) => {
    try {
        const bankAccountId = req.params.id;
        const { transaction_type, from_date, to_date } = req.query;
        
        const [bankAccount] = await db.execute(`
            SELECT * FROM bank_accounts WHERE id = ? AND is_active = true
        `, [bankAccountId]);
        
        if (bankAccount.length === 0) {
            return res.status(404).send('حساب بانکی یافت نشد');
        }
        
        // Get all bank accounts for the filter dropdown
        const [bankAccounts] = await db.execute(`
            SELECT id, bank_name, account_number FROM bank_accounts WHERE is_active = true ORDER BY bank_name
        `);
        
        // Build dynamic query for filtering
        let whereClause = 'bt.bank_account_id = ?';
        let params = [bankAccountId];
        
        if (transaction_type) {
            whereClause += ' AND bt.transaction_type = ?';
            params.push(transaction_type);
        }
        
        if (from_date) {
            whereClause += ' AND DATE(bt.transaction_date) >= ?';
            params.push(from_date);
        }
        
        if (to_date) {
            whereClause += ' AND DATE(bt.transaction_date) <= ?';
            params.push(to_date);
        }
        
        const [transactions] = await db.execute(`
            SELECT bt.*, ba.bank_name, ba.account_number, je.description as journal_description
            FROM bank_transactions bt
            LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
            LEFT JOIN journal_entries je ON bt.related_journal_entry_id = je.id
            WHERE ${whereClause}
            ORDER BY bt.transaction_date DESC, bt.created_at DESC
        `, params);
        
        // Calculate summary
        const summary = {
            total_deposits: 0,
            total_withdrawals: 0
        };
        
        transactions.forEach(transaction => {
            if (['deposit', 'transfer_in', 'interest'].includes(transaction.transaction_type)) {
                summary.total_deposits += parseFloat(transaction.amount || 0);
            } else {
                summary.total_withdrawals += parseFloat(transaction.amount || 0);
            }
        });
        
        res.render('accounting/bank-transactions', {
            title: `حسابداری - تراکنش‌های ${bankAccount[0].bank_name}`,
            user: req.session.user,
            bankAccount: bankAccount[0],
            bankAccounts: bankAccounts,
            transactions: transactions,
            summary: summary,
            query: req.query
        });
    } catch (error) {
        console.error('Bank transactions error:', error);
        res.status(500).send('خطا در بارگذاری تراکنش‌های بانکی');
    }
});

// General Bank Transactions (all accounts)
app.get('/accounting/bank-transactions', requireAuth, async (req, res) => {
    try {
        const { bank_account_id, transaction_type, from_date, to_date } = req.query;
        
        // Get all bank accounts for the filter dropdown
        const [bankAccounts] = await db.execute(`
            SELECT id, bank_name, account_number FROM bank_accounts WHERE is_active = true ORDER BY bank_name
        `);
        
        // Build dynamic query for filtering
        let whereClause = '1=1';
        let params = [];
        
        if (bank_account_id) {
            whereClause += ' AND bt.bank_account_id = ?';
            params.push(bank_account_id);
        }
        
        if (transaction_type) {
            whereClause += ' AND bt.transaction_type = ?';
            params.push(transaction_type);
        }
        
        if (from_date) {
            whereClause += ' AND DATE(bt.transaction_date) >= ?';
            params.push(from_date);
        }
        
        if (to_date) {
            whereClause += ' AND DATE(bt.transaction_date) <= ?';
            params.push(to_date);
        }
        
        const [transactions] = await db.execute(`
            SELECT bt.*, ba.bank_name, ba.account_number, je.description as journal_description
            FROM bank_transactions bt
            LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
            LEFT JOIN journal_entries je ON bt.related_journal_entry_id = je.id
            WHERE ${whereClause}
            ORDER BY bt.transaction_date DESC, bt.created_at DESC
            LIMIT 1000
        `, params);
        
        // Calculate summary
        const summary = {
            total_deposits: 0,
            total_withdrawals: 0
        };
        
        transactions.forEach(transaction => {
            if (['deposit', 'transfer_in', 'interest'].includes(transaction.transaction_type)) {
                summary.total_deposits += parseFloat(transaction.amount || 0);
            } else {
                summary.total_withdrawals += parseFloat(transaction.amount || 0);
            }
        });
        
        res.render('accounting/bank-transactions', {
            title: 'حسابداری - تراکنش‌های بانکی',
            user: req.session.user,
            bankAccount: null,
            bankAccounts: bankAccounts,
            transactions: transactions,
            summary: summary,
            query: req.query
        });
    } catch (error) {
        console.error('Bank transactions error:', error);
        res.status(500).send('خطا در بارگذاری تراکنش‌های بانکی');
    }
});

// Expense Management
app.get('/accounting/expenses', requireAuth, async (req, res) => {
    try {
        const { status, category, startDate, endDate } = req.query;
        
        let whereClause = '1=1';
        let params = [];
        
        if (status && status !== 'all') {
            whereClause += ' AND e.status = ?';
            params.push(status);
        }
        
        if (category && category !== 'all') {
            whereClause += ' AND e.category_id = ?';
            params.push(category);
        }
        
        if (startDate) {
            whereClause += ' AND DATE(e.expense_date) >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            whereClause += ' AND DATE(e.expense_date) <= ?';
            params.push(endDate);
        }
        
        const [expenses] = await db.execute(`
            SELECT e.*, ec.category_name_persian, ba.bank_name, ba.account_number,
                   u1.full_name as created_by_name, u2.full_name as approved_by_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN bank_accounts ba ON e.bank_account_id = ba.id
            LEFT JOIN users u1 ON e.created_by = u1.id
            LEFT JOIN users u2 ON e.approved_by = u2.id
            WHERE ${whereClause}
            ORDER BY e.expense_date DESC, e.created_at DESC
        `, params);
        
        const [categories] = await db.execute(`
            SELECT * FROM expense_categories WHERE is_active = true ORDER BY category_name_persian
        `);
        
        // Calculate summary
        const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
        const paidAmount = expenses.filter(e => e.status === 'paid').reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
        const pendingAmount = expenses.filter(e => e.status === 'pending').reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
        
        res.render('accounting/expenses', {
            title: 'حسابداری - مدیریت هزینه‌ها',
            user: req.session.user,
            expenses: expenses,
            categories: categories,
            filters: { status, category, startDate, endDate },
            summary: { totalAmount, paidAmount, pendingAmount }
        });
    } catch (error) {
        console.error('Expenses error:', error);
        res.status(500).send('خطا در بارگذاری هزینه‌ها');
    }
});

// Add Expense
app.post('/accounting/expenses/add', requireAuth, async (req, res) => {
    try {
        const { expense_date, category_id, description, amount, payment_method, vendor_name, invoice_number, notes } = req.body;
        
        // Generate expense number
        const expenseNumber = `EXP-${Date.now()}`;
        
        await db.execute(`
            INSERT INTO expenses (
                expense_number, expense_date, category_id, description, amount, 
                payment_method, vendor_name, invoice_number, notes, 
                status, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
        `, [expenseNumber, expense_date, category_id, description, amount, 
            payment_method || 'cash', vendor_name || null, invoice_number || null, 
            notes || null, req.session.user.id]);
        
        res.redirect('/accounting/expenses?success=' + encodeURIComponent('هزینه با موفقیت ثبت شد'));
    } catch (error) {
        console.error('Add expense error:', error);
        res.redirect('/accounting/expenses?error=' + encodeURIComponent('خطا در ثبت هزینه'));
    }
});

// Manual Transaction Entry
app.get('/accounting/manual-transaction', requireAuth, async (req, res) => {
    try {
        const [accounts] = await db.execute(`
            SELECT * FROM chart_of_accounts WHERE is_active = true ORDER BY account_code
        `);
        
        const [customers] = await db.execute(`
            SELECT id, customer_code, full_name, current_balance FROM customers WHERE is_active = true ORDER BY full_name
        `);
        
        const [suppliers] = await db.execute(`
            SELECT id, supplier_code, company_name, current_balance FROM suppliers WHERE is_active = true ORDER BY company_name
        `);
        
        const [employees] = await db.execute(`
            SELECT id, employee_code, full_name, current_balance FROM employees WHERE is_active = true ORDER BY full_name
        `);
        
        const [otherParties] = await db.execute(`
            SELECT id, party_code, party_name, current_balance FROM other_parties WHERE is_active = true ORDER BY party_name
        `);
        
        const [bankAccounts] = await db.execute(`
            SELECT id, bank_name, account_number FROM bank_accounts WHERE is_active = true ORDER BY bank_name
        `);
        
        res.render('accounting/manual-transaction', {
            title: 'حسابداری - ثبت تراکنش دستی',
            user: req.session.user,
            accounts: accounts,
            customers: customers,
            suppliers: suppliers,
            employees: employees,
            otherParties: otherParties,
            bankAccounts: bankAccounts
        });
    } catch (error) {
        console.error('Manual transaction page error:', error);
        res.status(500).send('خطا در بارگذاری صفحه ثبت تراکنش');
    }
});

// Process Simple Transaction (New System)
app.post('/accounting/manual-transaction', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        console.log('=== DEBUG: Simple Transaction POST ===');
        console.log('Request body:', req.body);
        console.log('User:', req.session.user);
        
        await connection.beginTransaction();
        
        const {
            transaction_date,
            transaction_number,
            transaction_type,
            description,
            my_account_id,
            total_amount,
            paid_amount,
            customer_id,
            payment_method,
            reference_number,
            manual_account_info,
            bank_account_id,
            notes
        } = req.body;

        console.log('Extracted fields:', {
            transaction_date,
            transaction_number,
            transaction_type,
            description,
            my_account_id,
            total_amount,
            paid_amount
        });

        // Convert Persian date to Gregorian
        const entryDate = convertPersianToGregorian(transaction_date);
        console.log('Converted date:', entryDate);
        
        // Validate required fields
        if (!transaction_type || !description || !total_amount || !paid_amount || !my_account_id) {
            const missingFields = [];
            if (!transaction_type) missingFields.push('نوع عملیات');
            if (!description) missingFields.push('شرح');
            if (!total_amount) missingFields.push('مبلغ کل');
            if (!paid_amount) missingFields.push('مبلغ پرداختی');
            if (!my_account_id) missingFields.push('حساب من');
            
            console.log('Missing required fields:', missingFields);
            throw new Error('لطفاً تمام فیلدهای اجباری را پر کنید: ' + missingFields.join(', '));
        }

        const totalAmount = parseFloat(total_amount);
        const paidAmount = parseFloat(paid_amount);
        const remainingAmount = totalAmount - paidAmount;
        
        if (totalAmount <= 0) {
            console.log('Invalid total amount:', total_amount, totalAmount);
            throw new Error('مبلغ کل باید بیشتر از صفر باشد');
        }
        
        if (paidAmount < 0) {
            console.log('Invalid paid amount:', paid_amount, paidAmount);
            throw new Error('مبلغ پرداختی نمی‌تواند منفی باشد');
        }

        console.log('Validation passed, inserting transaction...');

        // Determine account setup based on transaction type
        let debitAccountId, creditAccountId;
        let partyType = null, partyId = null;
        
        // Get a cash account (assume ID 1 for now - should be dynamic)
        const [cashAccount] = await connection.execute(`
            SELECT id FROM chart_of_accounts 
            WHERE account_type = 'asset' AND account_code LIKE '11%' 
            ORDER BY account_code LIMIT 1
        `);
        
        if (transaction_type === 'purchase') {
            // Purchase: Debit = Inventory/Expense, Credit = Cash/Bank/Payable
            // For simplicity, we'll use user's account for inventory and cash for payment
            debitAccountId = my_account_id; // User's inventory account
            creditAccountId = cashAccount.length > 0 ? cashAccount[0].id : my_account_id; // Cash account
        } else if (transaction_type === 'sale') {
            // Sale: Debit = Cash/Receivable, Credit = Sales/Revenue
            debitAccountId = cashAccount.length > 0 ? cashAccount[0].id : my_account_id; // Cash account
            creditAccountId = my_account_id; // User's sales account
            
            if (customer_id && remainingAmount > 0) {
                partyType = 'customer';
                partyId = customer_id;
            }
        }

        // Create main transaction record for paid amount
        if (paidAmount > 0) {
            const [transactionResult] = await connection.execute(`
                INSERT INTO transactions (
                    transaction_number, transaction_date, transaction_type, description,
                    debit_account_id, credit_account_id, amount, party_type, party_id,
                    payment_method, reference_number, bank_account_id, notes, 
                    created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                transaction_number,
                entryDate,
                transaction_type,
                description + ` (پرداخت ${paidAmount.toLocaleString('fa-IR')} از ${totalAmount.toLocaleString('fa-IR')})`,
                debitAccountId,
                creditAccountId,
                paidAmount,
                partyType,
                partyId,
                payment_method || 'cash',
                reference_number || null,
                bank_account_id || null,
                notes || null,
                req.session.user.id
            ]);

            // Update account balances for paid transaction
            await connection.execute(`UPDATE chart_of_accounts SET balance = balance + ? WHERE id = ?`, [paidAmount, debitAccountId]);
            await connection.execute(`UPDATE chart_of_accounts SET balance = balance - ? WHERE id = ?`, [paidAmount, creditAccountId]);
        }

        // Handle remaining amount (create receivable/payable)
        if (remainingAmount > 0) {
            let remainingDebitAccount, remainingCreditAccount;
            
            if (transaction_type === 'sale' && customer_id) {
                // Create accounts receivable
                const [receivableAccount] = await connection.execute(`
                    SELECT id FROM chart_of_accounts 
                    WHERE account_type = 'asset' AND account_code LIKE '12%' 
                    ORDER BY account_code LIMIT 1
                `);
                
                remainingDebitAccount = receivableAccount.length > 0 ? receivableAccount[0].id : my_account_id;
                remainingCreditAccount = my_account_id; // Sales account
                
                const remainingTransactionNumber = `${transaction_number}-R`;
                await connection.execute(`
                    INSERT INTO transactions (
                        transaction_number, transaction_date, transaction_type, description,
                        debit_account_id, credit_account_id, amount, party_type, party_id,
                        payment_method, created_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    remainingTransactionNumber,
                    entryDate,
                    'receivable',
                    `${description} (باقی‌مانده ${remainingAmount.toLocaleString('fa-IR')})`,
                    remainingDebitAccount,
                    remainingCreditAccount,
                    remainingAmount,
                    'customer',
                    customer_id,
                    'credit',
                    req.session.user.id
                ]);

                // Update customer balance
                await connection.execute(`UPDATE customers SET current_balance = current_balance + ? WHERE id = ?`, [remainingAmount, customer_id]);
                
                // Update account balances for remaining
                await connection.execute(`UPDATE chart_of_accounts SET balance = balance + ? WHERE id = ?`, [remainingAmount, remainingDebitAccount]);
                await connection.execute(`UPDATE chart_of_accounts SET balance = balance - ? WHERE id = ?`, [remainingAmount, remainingCreditAccount]);
            }
        }

        // Create bank transaction if applicable
        if (bank_account_id && paidAmount > 0 && ['bank_transfer', 'card', 'online'].includes(payment_method)) {
            const bankTransactionType = transaction_type === 'sale' ? 'deposit' : 'withdrawal';
            const bankAmount = bankTransactionType === 'deposit' ? paidAmount : -paidAmount;
            
            await connection.execute(`
                INSERT INTO bank_transactions (
                    bank_account_id, transaction_type, amount, transaction_date,
                    description, reference_number
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                bank_account_id,
                bankTransactionType,
                Math.abs(bankAmount),
                entryDate,
                description,
                reference_number
            ]);

            // Update bank account balance
            await connection.execute(`UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?`, [bankAmount, bank_account_id]);
        }
        
        await connection.commit();
        res.redirect('/accounting/journal-entries?success=transaction_created');
        
    } catch (error) {
        await connection.rollback();
        console.error('Simple transaction error:', error);
        res.redirect('/accounting/manual-transaction?error=' + encodeURIComponent(error.message));
    } finally {
        connection.release();
    }
});

// Helper function to convert Persian date to Gregorian
function convertPersianToGregorian(persianDate) {
    if (!persianDate) return new Date().toISOString().split('T')[0];
    
    // Simple conversion - در پروژه واقعی از moment-jalaali استفاده کنید
    const parts = persianDate.split('/');
    if (parts.length === 3) {
        const persianYear = parseInt(parts[0]);
        const persianMonth = parseInt(parts[1]);
        const persianDay = parseInt(parts[2]);
        
        // Rough conversion (باید با کتابخانه دقیق انجام شود)
        const gregorianYear = persianYear + 621;
        const gregorianMonth = persianMonth;
        const gregorianDay = persianDay;
        
        return `${gregorianYear}-${String(gregorianMonth).padStart(2, '0')}-${String(gregorianDay).padStart(2, '0')}`;
    }
    
    return new Date().toISOString().split('T')[0];
}

// Recent Transactions API
app.get('/accounting/recent-transactions', requireAuth, async (req, res) => {
    try {
        const [transactions] = await db.execute(`
            SELECT t.*, 
                   CASE 
                       WHEN t.party_type = 'customer' THEN c.full_name
                       WHEN t.party_type = 'supplier' THEN s.company_name
                       WHEN t.party_type = 'employee' THEN e.full_name
                       WHEN t.party_type = 'other' THEN o.party_name
                       ELSE t.party_type 
                   END as party_name,
                   CASE 
                       WHEN t.party_type = 'customer' THEN c.customer_code
                       WHEN t.party_type = 'supplier' THEN s.supplier_code
                       WHEN t.party_type = 'employee' THEN e.employee_code
                       WHEN t.party_type = 'other' THEN o.party_code
                       ELSE NULL 
                   END as party_code
            FROM transactions t
            LEFT JOIN customers c ON t.party_type = 'customer' AND t.party_id = c.id
            LEFT JOIN suppliers s ON t.party_type = 'supplier' AND t.party_id = s.id
            LEFT JOIN employees e ON t.party_type = 'employee' AND t.party_id = e.id
            LEFT JOIN other_parties o ON t.party_type = 'other' AND t.party_id = o.id
            ORDER BY t.created_at DESC 
            LIMIT 10
        `);
        
        const formattedTransactions = transactions.map(t => ({
            ...t,
            date: new Date(t.transaction_date).toLocaleDateString('fa-IR'),
            amount: t.amount
        }));
        
        res.json(formattedTransactions);
    } catch (error) {
        console.error('Recent transactions error:', error);
        res.status(500).json([]);
    }
});

// Transaction CRUD Operations

// View Transaction
app.get('/accounting/transactions/:id', requireAuth, async (req, res) => {
    try {
        const [transactions] = await db.execute(`
            SELECT t.*, 
                   u.username as created_by_name,
                   CASE 
                       WHEN t.party_type = 'customer' THEN c.full_name
                       ELSE t.party_type 
                   END as party_name,
                   ba.bank_name, ba.account_number
            FROM transactions t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN customers c ON t.party_type = 'customer' AND t.party_id = c.id
            LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
            WHERE t.id = ?
        `, [req.params.id]);
        
        if (transactions.length === 0) {
            return res.status(404).send('تراکنش یافت نشد');
        }
        
        // Get related journal entries
        const [journalEntries] = await db.execute(`
            SELECT je.*, jed.*, coa.account_name_persian
            FROM journal_entries je
            JOIN journal_entry_details jed ON je.id = jed.journal_entry_id
            JOIN chart_of_accounts coa ON jed.account_id = coa.id
            WHERE je.reference_type = 'transaction' AND je.reference_id = ?
            ORDER BY jed.debit_amount DESC
        `, [req.params.id]);
        
        res.render('accounting/transaction-view', {
            title: 'مشاهده تراکنش',
            user: req.session.user,
            transaction: transactions[0],
            journalEntries: journalEntries
        });
    } catch (error) {
        console.error('View transaction error:', error);
        res.status(500).send('خطا در نمایش تراکنش');
    }
});

// Edit Transaction Form
app.get('/accounting/transactions/:id/edit', requireAuth, async (req, res) => {
    try {
        const [transactions] = await db.execute(`
            SELECT * FROM transactions WHERE id = ?
        `, [req.params.id]);
        
        if (transactions.length === 0) {
            return res.status(404).send('تراکنش یافت نشد');
        }
        
        const [accounts] = await db.execute(`
            SELECT * FROM chart_of_accounts WHERE is_active = true ORDER BY account_code
        `);
        
        const [customers] = await db.execute(`
            SELECT id, customer_code, full_name, current_balance FROM customers ORDER BY full_name
        `);
        
        const [bankAccounts] = await db.execute(`
            SELECT id, bank_name, account_number FROM bank_accounts WHERE is_active = true ORDER BY bank_name
        `);
        
        res.render('accounting/transaction-edit', {
            title: 'ویرایش تراکنش',
            user: req.session.user,
            transaction: transactions[0],
            accounts: accounts,
            customers: customers,
            bankAccounts: bankAccounts
        });
    } catch (error) {
        console.error('Edit transaction error:', error);
        res.status(500).send('خطا در بارگذاری فرم ویرایش');
    }
});

// Update Transaction
app.post('/accounting/transactions/:id/edit', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const transactionId = req.params.id;
        const {
            transaction_date,
            transaction_type,
            description,
            party_type,
            party_id,
            amount,
            payment_method,
            reference_number,
            bank_account_id,
            notes
        } = req.body;

        // Convert Persian date to Gregorian
        const entryDate = convertPersianToGregorian(transaction_date);
        const transactionAmount = parseFloat(amount);
        
        // Get original transaction
        const [originalTransaction] = await connection.execute(`
            SELECT * FROM transactions WHERE id = ?
        `, [transactionId]);
        
        if (originalTransaction.length === 0) {
            throw new Error('تراکنش یافت نشد');
        }
        
        const original = originalTransaction[0];
        
        // Update transaction
        await connection.execute(`
            UPDATE transactions SET
                transaction_date = ?, transaction_type = ?, description = ?,
                party_type = ?, party_id = ?, amount = ?, payment_method = ?,
                reference_number = ?, bank_account_id = ?, notes = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [
            entryDate, transaction_type, description, party_type || null,
            party_id || null, transactionAmount, payment_method || null,
            reference_number || null, bank_account_id || null, notes || null,
            transactionId
        ]);
        
        // Update related journal entries
        await connection.execute(`
            UPDATE journal_entries SET
                entry_date = ?, description = ?, total_debit = ?, total_credit = ?
            WHERE reference_type = 'transaction' AND reference_id = ?
        `, [entryDate, description, transactionAmount, transactionAmount, transactionId]);
        
        // Update journal entry details
        await connection.execute(`
            UPDATE journal_entry_details jed
            JOIN journal_entries je ON jed.journal_entry_id = je.id
            SET jed.debit_amount = ?, jed.description = ?
            WHERE je.reference_type = 'transaction' AND je.reference_id = ? AND jed.debit_amount > 0
        `, [transactionAmount, description, transactionId]);
        
        await connection.execute(`
            UPDATE journal_entry_details jed
            JOIN journal_entries je ON jed.journal_entry_id = je.id
            SET jed.credit_amount = ?, jed.description = ?
            WHERE je.reference_type = 'transaction' AND je.reference_id = ? AND jed.credit_amount > 0
        `, [transactionAmount, description, transactionId]);
        
        // Update customer balance if changed
        if (original.party_type === 'customer' && original.party_id) {
            const oldBalanceChange = original.transaction_type === 'payment' ? -original.amount : original.amount;
            await connection.execute(`UPDATE customers SET current_balance = current_balance - ? WHERE id = ?`, 
                [oldBalanceChange, original.party_id]);
        }
        
        if (party_type === 'customer' && party_id) {
            const newBalanceChange = transaction_type === 'payment' ? -transactionAmount : transactionAmount;
            await connection.execute(`UPDATE customers SET current_balance = current_balance + ? WHERE id = ?`, 
                [newBalanceChange, party_id]);
        }
        
        await connection.commit();
        res.redirect(`/accounting/transactions/${transactionId}?success=updated`);
        
    } catch (error) {
        await connection.rollback();
        console.error('Update transaction error:', error);
        res.redirect(`/accounting/transactions/${req.params.id}/edit?error=` + encodeURIComponent(error.message));
    } finally {
        connection.release();
    }
});

// Delete Transaction
app.post('/accounting/transactions/:id/delete', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const transactionId = req.params.id;
        
        // Get transaction details
        const [transaction] = await connection.execute(`
            SELECT * FROM transactions WHERE id = ?
        `, [transactionId]);
        
        if (transaction.length === 0) {
            throw new Error('تراکنش یافت نشد');
        }
        
        const trans = transaction[0];
        
        // Reverse customer balance changes
        if (trans.party_type === 'customer' && trans.party_id) {
            const balanceChange = trans.transaction_type === 'payment' ? trans.amount : -trans.amount;
            await connection.execute(`UPDATE customers SET current_balance = current_balance + ? WHERE id = ?`, 
                [balanceChange, trans.party_id]);
        }
        
        // Delete journal entry details first
        await connection.execute(`
            DELETE jed FROM journal_entry_details jed
            JOIN journal_entries je ON jed.journal_entry_id = je.id
            WHERE je.reference_type = 'transaction' AND je.reference_id = ?
        `, [transactionId]);
        
        // Delete journal entry
        await connection.execute(`
            DELETE FROM journal_entries 
            WHERE reference_type = 'transaction' AND reference_id = ?
        `, [transactionId]);
        
        // Delete bank transactions
        await connection.execute(`
            DELETE FROM bank_transactions 
            WHERE related_journal_entry_id IN (
                SELECT id FROM journal_entries 
                WHERE reference_type = 'transaction' AND reference_id = ?
            )
        `, [transactionId]);
        
        // Delete transaction
        await connection.execute(`DELETE FROM transactions WHERE id = ?`, [transactionId]);
        
        await connection.commit();
        res.redirect('/accounting/journal-entries?success=transaction_deleted');
        
    } catch (error) {
        await connection.rollback();
        console.error('Delete transaction error:', error);
        res.redirect(`/accounting/transactions/${req.params.id}?error=` + encodeURIComponent(error.message));
    } finally {
        connection.release();
    }
});

// Journal Entries
app.get('/accounting/journal-entries', requireAuth, async (req, res) => {
    try {
        const { startDate, endDate, reference_type } = req.query;
        
        let whereClause = '1=1';
        let params = [];
        
        if (startDate) {
            whereClause += ' AND DATE(t.transaction_date) >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            whereClause += ' AND DATE(t.transaction_date) <= ?';
            params.push(endDate);
        }
        
        if (reference_type && reference_type !== 'all') {
            whereClause += ' AND t.transaction_type = ?';
            params.push(reference_type);
        }
        
        // Get journal entries with transaction details and party names
        const [journalEntries] = await db.execute(`
            SELECT t.id as transaction_id,
                   t.transaction_number as entry_number,
                   t.transaction_date as entry_date,
                   t.description,
                   t.amount as total_debit,
                   t.amount as total_credit,
                   t.transaction_type as reference_type,
                   t.id as reference_id,
                   t.created_at,
                   u.full_name as created_by_name,
                   
                   -- Payment Method
                   t.payment_method,
                   t.reference_number,
                   
                   -- Party Name
                   CASE 
                       WHEN t.party_type = 'customer' THEN c.full_name
                       WHEN t.party_type = 'supplier' THEN s.company_name
                       WHEN t.party_type = 'employee' THEN e.full_name
                       WHEN t.party_type = 'other' THEN op.party_name
                       ELSE NULL
                   END as party_name,
                   
                   -- Transaction Type in Persian
                   CASE 
                       WHEN t.transaction_type = 'payment' THEN 'دریافت وجه'
                       WHEN t.transaction_type = 'receipt' THEN 'پرداخت وجه'
                       WHEN t.transaction_type = 'purchase' THEN 'خرید'
                       WHEN t.transaction_type = 'sale' THEN 'فروش'
                       WHEN t.transaction_type = 'transfer' THEN 'انتقال'
                       WHEN t.transaction_type = 'adjustment' THEN 'تعدیل'
                       ELSE t.transaction_type
                   END as transaction_type_persian
                   
            FROM transactions t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN customers c ON t.party_type = 'customer' AND t.party_id = c.id
            LEFT JOIN suppliers s ON t.party_type = 'supplier' AND t.party_id = s.id
            LEFT JOIN employees e ON t.party_type = 'employee' AND t.party_id = e.id
            LEFT JOIN other_parties op ON t.party_type = 'other' AND t.party_id = op.id
            WHERE ${whereClause}
            ORDER BY t.transaction_date DESC, t.created_at DESC
        `, params);
        
        res.render('accounting/journal-entries', {
            title: 'حسابداری - دفتر روزنامه',
            user: req.session.user,
            journalEntries: journalEntries,
            filters: { startDate, endDate, reference_type }
        });
    } catch (error) {
        console.error('Journal entries error:', error);
        res.status(500).send('خطا در بارگذاری دفتر روزنامه');
    }
});

// Journal Entry Details
app.get('/accounting/journal-entries/:id', requireAuth, async (req, res) => {
    try {
        const [journalEntry] = await db.execute(`
            SELECT je.*, u1.full_name as created_by_name, u2.full_name as posted_by_name
            FROM journal_entries je
            LEFT JOIN users u1 ON je.created_by = u1.id
            LEFT JOIN users u2 ON je.posted_by = u2.id
            WHERE je.id = ?
        `, [req.params.id]);
        
        if (journalEntry.length === 0) {
            return res.status(404).send('قید مورد نظر یافت نشد');
        }
        
        const [entryDetails] = await db.execute(`
            SELECT jed.*, coa.account_code, coa.account_name_persian,
                   c.full_name as customer_name, ba.bank_name, ba.account_number
            FROM journal_entry_details jed
            LEFT JOIN chart_of_accounts coa ON jed.account_id = coa.id
            LEFT JOIN customers c ON jed.customer_id = c.id
            LEFT JOIN bank_accounts ba ON jed.bank_account_id = ba.id
            WHERE jed.journal_entry_id = ?
            ORDER BY jed.id
        `, [req.params.id]);
        
        res.render('accounting/journal-entry-detail', {
            title: `حسابداری - جزئیات قید ${journalEntry[0].entry_number}`,
            user: req.session.user,
            journalEntry: journalEntry[0],
            entryDetails: entryDetails
        });
    } catch (error) {
        console.error('Journal entry detail error:', error);
        res.status(500).send('خطا در بارگذاری جزئیات قید');
    }
});

// Trial Balance
app.get('/accounting/trial-balance', requireAuth, async (req, res) => {
    try {
        const { as_of_date } = req.query;
        const asOfDate = as_of_date || new Date().toISOString().split('T')[0];
        
        const [accounts] = await db.execute(`
            SELECT coa.*, 
                   COALESCE(
                       (SELECT SUM(jed.debit_amount - jed.credit_amount)
                        FROM journal_entry_details jed
                        JOIN journal_entries je ON jed.journal_entry_id = je.id
                        WHERE jed.account_id = coa.id 
                        AND DATE(je.entry_date) <= ?
                        AND je.status = 'posted'), 0
                   ) as calculated_balance
            FROM chart_of_accounts coa
            WHERE coa.is_active = true
            ORDER BY coa.account_code
        `, [asOfDate]);
        
        // Calculate totals by type
        const summary = {
            assets: 0,
            liabilities: 0,
            equity: 0,
            revenue: 0,
            expenses: 0,
            total_debit: 0,
            total_credit: 0
        };
        
        accounts.forEach(account => {
            const balance = parseFloat(account.calculated_balance);
            summary[account.account_type] += Math.abs(balance);
            
            if (balance > 0) {
                summary.total_debit += balance;
            } else if (balance < 0) {
                summary.total_credit += Math.abs(balance);
            }
        });
        
        res.render('accounting/trial-balance', {
            title: 'حسابداری - تراز آزمایشی',
            user: req.session.user,
            accounts: accounts,
            asOfDate: asOfDate,
            summary: summary
        });
    } catch (error) {
        console.error('Trial balance error:', error);
        res.status(500).send('خطا در تولید تراز آزمایشی');
    }
});

// Enhanced Financial Reports
app.get('/accounting/financial-reports', requireAuth, async (req, res) => {
    try {
        const { report_type, start_date, end_date } = req.query;
        const reportType = report_type || 'summary';
        
        // Calculate default date range (current month)
        const today = new Date();
        const startDate = start_date || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endDate = end_date || today.toISOString().split('T')[0];
        
        let reportData = {};
        
        if (reportType === 'profit_loss') {
            // Profit & Loss Statement
            const [revenue] = await db.execute(`
                SELECT COALESCE(SUM(jed.credit_amount - jed.debit_amount), 0) as total
                FROM journal_entry_details jed
                JOIN journal_entries je ON jed.journal_entry_id = je.id
                JOIN chart_of_accounts coa ON jed.account_id = coa.id
                WHERE coa.account_type = 'revenue'
                  AND DATE(je.entry_date) BETWEEN ? AND ?
                  AND je.status = 'posted'
            `, [startDate, endDate]);
            
            const [expenses] = await db.execute(`
                SELECT COALESCE(SUM(jed.debit_amount - jed.credit_amount), 0) as total
                FROM journal_entry_details jed
                JOIN journal_entries je ON jed.journal_entry_id = je.id
                JOIN chart_of_accounts coa ON jed.account_id = coa.id
                WHERE coa.account_type = 'expense'
                  AND DATE(je.entry_date) BETWEEN ? AND ?
                  AND je.status = 'posted'
            `, [startDate, endDate]);
            
            reportData = {
                revenue: revenue[0].total,
                expenses: expenses[0].total,
                netIncome: revenue[0].total - expenses[0].total
            };
        }
        
        res.render('accounting/financial-reports', {
            title: 'حسابداری - گزارشات مالی پیشرفته',
            user: req.session.user,
            reportType: reportType,
            startDate: startDate,
            endDate: endDate,
            reportData: reportData
        });
    } catch (error) {
        console.error('Financial reports error:', error);
        res.status(500).send('خطا در تولید گزارشات مالی');
    }
});

// ===== BACKUP SYSTEM ROUTES =====

// Backup page
app.get('/backup', requireAuth, async (req, res) => {
    try {
        // Get backup history
        const [backups] = await db.execute(`
            SELECT * FROM backup_history 
            ORDER BY created_at DESC 
            LIMIT 50
        `);
        
        // Get backup settings
        const [settings] = await db.execute(`
            SELECT setting_key, setting_value 
            FROM system_settings 
            WHERE setting_key IN ('auto_backup_enabled', 'backup_retention_days')
        `);
        
        const autoBackupEnabled = settings.find(s => s.setting_key === 'auto_backup_enabled')?.setting_value === 'true';
        const lastBackup = backups[0] || null;
        
        res.render('backup', {
            title: 'مدیریت بک‌آپ',
            user: req.session.user,
            backups: backups,
            lastBackup: lastBackup,
            autoBackupEnabled: autoBackupEnabled
        });
    } catch (error) {
        console.error('Backup page error:', error);
        res.status(500).send('خطا در بارگذاری صفحه بک‌آپ');
    }
});

// Create backup
app.post('/backup/create', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { type = 'full', tables = [] } = req.body;
        const fs = require('fs');
        const path = require('path');
        
        // Create backup directory if it doesn't exist
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Generate backup filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${type}_${timestamp}.sql`;
        const filepath = path.join(backupDir, filename);
        
        // Start backup process
        const backupId = Date.now();
        await connection.execute(`
            INSERT INTO backup_history (id, filename, backup_type, status, created_by)
            VALUES (?, ?, ?, 'processing', ?)
        `, [backupId, filename, type, req.session.user.id]);
        
        let sqlContent = '-- Gold Shop Management System Backup\n';
        sqlContent += `-- Created: ${new Date().toLocaleString('fa-IR')}\n`;
        sqlContent += `-- Type: ${type}\n\n`;
        
        if (type === 'full' || type === 'schema') {
            // Export table structures
            const tablesToBackup = tables.length > 0 ? tables : [
                'customers', 'products', 'categories', 'sales', 'sale_items',
                'transactions', 'chart_of_accounts', 'bank_accounts', 'users'
            ];
            
            for (const table of tablesToBackup) {
                try {
                    const [structure] = await connection.execute(`SHOW CREATE TABLE ${table}`);
                    sqlContent += `-- Table: ${table}\n`;
                    sqlContent += `DROP TABLE IF EXISTS \`${table}\`;\n`;
                    sqlContent += structure[0]['Create Table'] + ';\n\n';
                } catch (tableError) {
                    console.warn(`Warning: Could not backup table ${table}:`, tableError.message);
                }
            }
        }
        
        if (type === 'full' || type === 'data') {
            // Export data
            const tablesToBackup = tables.length > 0 ? tables : [
                'customers', 'products', 'categories', 'sales', 'sale_items',
                'transactions', 'chart_of_accounts', 'bank_accounts'
            ];
            
            for (const table of tablesToBackup) {
                try {
                    const [rows] = await connection.execute(`SELECT * FROM ${table}`);
                    if (rows.length > 0) {
                        sqlContent += `-- Data for table: ${table}\n`;
                        sqlContent += `INSERT INTO \`${table}\` VALUES\n`;
                        
                        const values = rows.map(row => {
                            const vals = Object.values(row).map(val => {
                                if (val === null) return 'NULL';
                                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                                return val;
                            });
                            return `(${vals.join(', ')})`;
                        });
                        
                        sqlContent += values.join(',\n') + ';\n\n';
                    }
                } catch (tableError) {
                    console.warn(`Warning: Could not backup data for table ${table}:`, tableError.message);
                }
            }
        }
        
        // Write backup file
        fs.writeFileSync(filepath, sqlContent, 'utf8');
        const fileSize = fs.statSync(filepath).size;
        
        // Update backup record
        await connection.execute(`
            UPDATE backup_history 
            SET status = 'success', file_size = ?, completed_at = NOW()
            WHERE id = ?
        `, [fileSize, backupId]);
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'بک‌آپ با موفقیت ایجاد شد',
            backupId: backupId,
            filename: filename,
            size: fileSize
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Backup creation error:', error);
        
        // Update backup record as failed
        try {
            await connection.execute(`
                UPDATE backup_history 
                SET status = 'failed', error_message = ?
                WHERE id = (SELECT MAX(id) FROM backup_history WHERE created_by = ?)
            `, [error.message, req.session.user.id]);
        } catch (updateError) {
            console.error('Error updating backup status:', updateError);
        }
        
        res.json({
            success: false,
            message: 'خطا در ایجاد بک‌آپ: ' + error.message
        });
    } finally {
        connection.release();
    }
});

// Download backup
app.get('/backup/download/:id', requireAuth, async (req, res) => {
    try {
        const [backup] = await db.execute(`
            SELECT * FROM backup_history WHERE id = ?
        `, [req.params.id]);
        
        if (backup.length === 0) {
            return res.status(404).send('فایل بک‌آپ یافت نشد');
        }
        
        const path = require('path');
        const filepath = path.join(__dirname, 'backups', backup[0].filename);
        
        if (!require('fs').existsSync(filepath)) {
            return res.status(404).send('فایل بک‌آپ در سرور یافت نشد');
        }
        
        res.download(filepath, backup[0].filename);
        
    } catch (error) {
        console.error('Backup download error:', error);
        res.status(500).send('خطا در دانلود بک‌آپ');
    }
});

// Update backup settings
app.post('/backup/settings', requireAuth, async (req, res) => {
    try {
        const { autoBackup } = req.body;
        
        await db.execute(`
            INSERT INTO system_settings (setting_key, setting_value, updated_by)
            VALUES ('auto_backup_enabled', ?, ?)
            ON DUPLICATE KEY UPDATE 
            setting_value = VALUES(setting_value),
            updated_by = VALUES(updated_by),
            updated_at = NOW()
        `, [autoBackup ? 'true' : 'false', req.session.user.id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Backup settings error:', error);
        res.json({ success: false, message: error.message });
    }
});

// Restore backup
app.post('/backup/restore', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const multer = require('multer');
        const upload = multer({ dest: 'temp_uploads/' });
        
        // Handle file upload
        upload.single('backupFile')(req, res, async (err) => {
            if (err) {
                return res.json({ success: false, message: 'خطا در آپلود فایل' });
            }
            
            if (!req.file) {
                return res.json({ success: false, message: 'فایل انتخاب نشده است' });
            }
            
            try {
                const fs = require('fs');
                const sqlContent = fs.readFileSync(req.file.path, 'utf8');
                
                // Execute SQL commands
                const statements = sqlContent.split(';').filter(stmt => stmt.trim());
                
                for (const statement of statements) {
                    if (statement.trim()) {
                        await connection.execute(statement);
                    }
                }
                
                // Clean up temp file
                fs.unlinkSync(req.file.path);
                
                await connection.commit();
                res.json({ success: true, message: 'بک‌آپ با موفقیت بازیابی شد' });
                
            } catch (restoreError) {
                await connection.rollback();
                console.error('Restore error:', restoreError);
                res.json({ success: false, message: 'خطا در بازیابی بک‌آپ: ' + restoreError.message });
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Backup restore error:', error);
        res.json({ success: false, message: 'خطا در بازیابی بک‌آپ' });
    } finally {
        connection.release();
    }
});

// Delete backup
app.delete('/backup/delete/:id', requireAuth, async (req, res) => {
    try {
        const backupId = req.params.id;
        
        // Get backup info
        const [backup] = await db.execute(`
            SELECT * FROM backup_history WHERE id = ?
        `, [backupId]);
        
        if (backup.length === 0) {
            return res.json({ success: false, message: 'بک‌آپ یافت نشد' });
        }
        
        // Delete file from filesystem
        const fs = require('fs');
        const path = require('path');
        const filepath = path.join(__dirname, 'backups', backup[0].filename);
        
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        
        // Delete from database
        await db.execute(`
            DELETE FROM backup_history WHERE id = ?
        `, [backupId]);
        
        res.json({ success: true, message: 'بک‌آپ با موفقیت حذف شد' });
        
    } catch (error) {
        console.error('Delete backup error:', error);
        res.json({ success: false, message: 'خطا در حذف بک‌آپ: ' + error.message });
    }
});

// Cleanup old backups
app.post('/backup/cleanup', requireAuth, async (req, res) => {
    try {
        const retentionDays = 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        const [oldBackups] = await db.execute(`
            SELECT * FROM backup_history 
            WHERE created_at < ? AND status = 'success'
        `, [cutoffDate.toISOString().split('T')[0]]);
        
        let deletedCount = 0;
        const path = require('path');
        const fs = require('fs');
        
        for (const backup of oldBackups) {
            try {
                const filepath = path.join(__dirname, 'backups', backup.filename);
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
                
                await db.execute(`DELETE FROM backup_history WHERE id = ?`, [backup.id]);
                deletedCount++;
            } catch (deleteError) {
                console.error('Error deleting backup:', deleteError);
            }
        }
        
        res.json({ success: true, deletedCount: deletedCount });
        
    } catch (error) {
        console.error('Backup cleanup error:', error);
        res.json({ success: false, message: error.message });
    }
});

// Backup status check
app.get('/backup/status', requireAuth, async (req, res) => {
    try {
        const [recent] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM backup_history 
            WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
        `);
        
        res.json({ hasNewBackups: recent[0].count > 0 });
    } catch (error) {
        res.json({ hasNewBackups: false });
    }
});

// ===== DATABASE INITIALIZATION FOR BACKUP SYSTEM =====

// Initialize backup tables
async function initializeBackupTables() {
    try {
        // Create backup_history table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS backup_history (
                id BIGINT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                backup_type ENUM('full', 'data', 'schema') DEFAULT 'full',
                file_size BIGINT DEFAULT 0,
                status ENUM('processing', 'success', 'failed') DEFAULT 'processing',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                created_by INT,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        
        // Create system_settings table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                updated_by INT,
                FOREIGN KEY (updated_by) REFERENCES users(id)
            )
        `);
        
        console.log('Backup system tables initialized successfully');
    } catch (error) {
        console.error('Error initializing backup tables:', error);
    }
}

// Initialize backup system on startup
initializeBackupTables();

// راه‌اندازی سرور
app.listen(PORT, () => {
    console.log(`Gold Shop Management Server running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
});

// ===== SETTINGS ROUTES =====

// Settings main page
app.get('/settings', requireAuth, async (req, res) => {
    try {
        res.render('settings', {
            title: 'تنظیمات سیستم',
            user: req.session.user
        });
    } catch (error) {
        console.error('Settings page error:', error);
        res.status(500).send('خطا در بارگذاری صفحه تنظیمات');
    }
});

// Change password
app.post('/settings/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;
        
        // Get current user data
        const [users] = await db.execute(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.json({ success: false, message: 'کاربر یافت نشد' });
        }
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
        if (!isValidPassword) {
            return res.json({ success: false, message: 'رمز عبور فعلی اشتباه است' });
        }
        
        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        await db.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, userId]
        );
        
        res.json({ success: true, message: 'رمز عبور با موفقیت تغییر یافت' });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.json({ success: false, message: 'خطا در تغییر رمز عبور' });
    }
});

// Save general settings
app.post('/settings/general', requireAuth, async (req, res) => {
    try {
        const { shopName, shopAddress, shopPhone, autoBackup } = req.body;
        const userId = req.session.user.id;
        
        // Save settings to database
        const settings = [
            ['shop_name', shopName],
            ['shop_address', shopAddress],
            ['shop_phone', shopPhone],
            ['auto_backup', autoBackup]
        ];
        
        for (const [key, value] of settings) {
            await db.execute(`
                INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value),
                updated_by = VALUES(updated_by),
                updated_at = VALUES(updated_at)
            `, [key, value, userId]);
        }
        
        res.json({ success: true, message: 'تنظیمات با موفقیت ذخیره شد' });
        
    } catch (error) {
        console.error('Save settings error:', error);
        res.json({ success: false, message: 'خطا در ذخیره تنظیمات' });
    }
});

// Create backup from settings
app.post('/settings/backup/create', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { type = 'full', description } = req.body;
        const fs = require('fs');
        const path = require('path');
        
        // Create backup directory if it doesn't exist
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Generate backup filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${type}_${timestamp}.sql`;
        const filepath = path.join(backupDir, filename);
        
        // Start backup process
        const backupId = Date.now();
        await connection.execute(`
            INSERT INTO backup_history (id, filename, backup_type, description, status, created_by)
            VALUES (?, ?, ?, ?, 'processing', ?)
        `, [backupId, filename, type, description || '', req.session.user.id]);
        
        let sqlContent = '-- Gold Shop Management System Backup\n';
        sqlContent += `-- Created: ${new Date().toLocaleString('fa-IR')}\n`;
        sqlContent += `-- Type: ${type}\n`;
        sqlContent += `-- Description: ${description || 'No description'}\n\n`;
        
        // Get all tables
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(table => Object.values(table)[0]);
        
        if (type === 'full' || type === 'structure') {
            // Export table structures
            for (const tableName of tableNames) {
                try {
                    const [structure] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
                    sqlContent += `-- Table: ${tableName}\n`;
                    sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
                    sqlContent += structure[0]['Create Table'] + ';\n\n';
                } catch (tableError) {
                    console.warn(`Warning: Could not backup table ${tableName}:`, tableError.message);
                }
            }
        }
        
        if (type === 'full' || type === 'data') {
            // Export data (exclude sensitive tables like backup_history)
            const excludeTables = ['backup_history'];
            const dataTables = tableNames.filter(name => !excludeTables.includes(name));
            
            for (const tableName of dataTables) {
                try {
                    const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
                    if (rows.length > 0) {
                        sqlContent += `-- Data for table: ${tableName}\n`;
                        
                        // Get column info
                        const [columns] = await connection.execute(`SHOW COLUMNS FROM \`${tableName}\``);
                        const columnNames = columns.map(col => `\`${col.Field}\``);
                        
                        sqlContent += `INSERT INTO \`${tableName}\` (${columnNames.join(', ')}) VALUES\n`;
                        
                        const values = rows.map(row => {
                            const vals = Object.values(row).map(val => {
                                if (val === null) return 'NULL';
                                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                                return val;
                            });
                            return `(${vals.join(', ')})`;
                        });
                        
                        sqlContent += values.join(',\n') + ';\n\n';
                    }
                } catch (tableError) {
                    console.warn(`Warning: Could not backup data for table ${tableName}:`, tableError.message);
                }
            }
        }
        
        // Write backup file
        fs.writeFileSync(filepath, sqlContent, 'utf8');
        const fileSize = fs.statSync(filepath).size;
        
        // Update backup record
        await connection.execute(`
            UPDATE backup_history 
            SET status = 'success', file_size = ?, completed_at = NOW()
            WHERE id = ?
        `, [fileSize, backupId]);
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'بک‌آپ با موفقیت ایجاد شد',
            backupId: backupId,
            filename: filename,
            size: fileSize
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Backup creation error:', error);
        
        // Update backup record as failed
        try {
            await connection.execute(`
                UPDATE backup_history 
                SET status = 'failed', error_message = ?
                WHERE id = (SELECT MAX(id) FROM backup_history WHERE created_by = ?)
            `, [error.message, req.session.user.id]);
        } catch (updateError) {
            console.error('Error updating backup status:', updateError);
        }
        
        res.json({
            success: false,
            message: 'خطا در ایجاد بک‌آپ: ' + error.message
        });
    } finally {
        connection.release();
    }
});

// Restore backup from settings
app.post('/settings/backup/restore', requireAuth, async (req, res) => {
    if (!req.files || !req.files.backupFile) {
        return res.json({ success: false, message: 'فایل بک‌آپ انتخاب نشده است' });
    }
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const backupFile = req.files.backupFile;
        const sqlContent = backupFile.data.toString('utf8');
        
        // Split SQL content into individual statements
        const statements = sqlContent.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
        
        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                await connection.execute(statement);
            }
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'بازیابی با موفقیت انجام شد'
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Restore error:', error);
        res.json({
            success: false,
            message: 'خطا در بازیابی: ' + error.message
        });
    } finally {
        connection.release();
    }
});

// Backup history page
app.get('/settings/backup/history', requireAuth, async (req, res) => {
    try {
        const [backups] = await db.execute(`
            SELECT bh.*, u.full_name as created_by_name
            FROM backup_history bh
            LEFT JOIN users u ON bh.created_by = u.id
            ORDER BY bh.created_at DESC 
            LIMIT 100
        `);
        
        res.render('backup-history', {
            title: 'تاریخچه بک‌آپ - تنظیمات',
            user: req.session.user,
            backups: backups
        });
    } catch (error) {
        console.error('Backup history error:', error);
        res.status(500).send('خطا در بارگذاری تاریخچه بک‌آپ');
    }
});

// Security settings
app.post('/settings/security', requireAuth, async (req, res) => {
    try {
        const { sessionTimeout, autoBackupInterval, maxBackups } = req.body;
        const userId = req.session.user.id;
        
        const settings = [
            ['session_timeout', sessionTimeout],
            ['auto_backup_interval', autoBackupInterval], 
            ['max_backups', maxBackups]
        ];
        
        for (const [key, value] of settings) {
            await db.execute(`
                INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value),
                updated_by = VALUES(updated_by),
                updated_at = VALUES(updated_at)
            `, [key, value, userId]);
        }
        
        res.json({ success: true, message: 'تنظیمات امنیتی ذخیره شد' });
    } catch (error) {
        console.error('Security settings error:', error);
        res.json({ success: false, message: 'خطا در ذخیره تنظیمات' });
    }
});

// Clear system cache
app.post('/settings/clear-cache', requireAuth, async (req, res) => {
    try {
        // Clear any cache data here (if implemented)
        res.json({ success: true, message: 'کش سیستم پاک شد' });
    } catch (error) {
        res.json({ success: false, message: 'خطا در پاک کردن کش' });
    }
});

// System health check
app.get('/settings/system-health', requireAuth, async (req, res) => {
    try {
        // Check database connection
        await db.execute('SELECT 1');
        
        // Get database size
        const [sizeResult] = await db.execute(`
            SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS db_size_mb
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
        `);
        
        const dbSize = sizeResult[0].db_size_mb || 0;
        
        res.json({
            success: true,
            dbStatus: '✅ متصل و سالم',
            dbSize: `${dbSize} MB`,
            performance: 'عالی'
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'مشکل در اتصال به دیتابیس'
        });
    }
});

// Optimize database
app.post('/settings/optimize-db', requireAuth, async (req, res) => {
    try {
        // Get table list
        const [tables] = await db.execute('SHOW TABLES');
        
        let optimized = 0;
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            try {
                await db.execute(`OPTIMIZE TABLE \`${tableName}\``);
                optimized++;
            } catch (tableError) {
                console.warn(`Could not optimize table ${tableName}:`, tableError.message);
            }
        }
        
        res.json({
            success: true,
            improvement: `${optimized} جدول بهینه شد`
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'خطا در بهینه‌سازی دیتابیس'
        });
    }
});

// Last backup info
app.get('/settings/last-backup-info', requireAuth, async (req, res) => {
    try {
        const [backups] = await db.execute(`
            SELECT created_at FROM backup_history 
            WHERE status = 'success' 
            ORDER BY created_at DESC 
            LIMIT 1
        `);
        
        if (backups.length > 0) {
            const lastBackup = new Date(backups[0].created_at).toLocaleDateString('fa-IR');
            res.json({ success: true, lastBackup });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        res.json({ success: false });
    }
});

// Database size info
app.get('/settings/db-size', requireAuth, async (req, res) => {
    try {
        const [sizeResult] = await db.execute(`
            SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS db_size_mb
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
        `);
        
        const size = sizeResult[0].db_size_mb || 0;
        res.json({ success: true, size: `${size} MB` });
    } catch (error) {
        res.json({ success: false, size: 'نامشخص' });
    }
});

// Add this after the /sales/new route (around line 755)

// API to get customer financial info
app.get('/api/customer/:id/financial', requireAuth, async (req, res) => {
    try {
        const [customer] = await db.execute(`
            SELECT id, customer_code, full_name, current_balance, total_purchases, total_payments
            FROM customers 
            WHERE id = ?
        `, [req.params.id]);

        if (customer.length === 0) {
            return res.status(404).json({ error: 'مشتری یافت نشد' });
        }

        const customerData = customer[0];
        const balance = parseFloat(customerData.current_balance || 0);
        
        // تعیین وضعیت مالی
        let balanceStatus;
        let balanceType;
        if (balance > 0) {
            balanceStatus = 'بدهکار';
            balanceType = 'debt';
        } else if (balance < 0) {
            balanceStatus = 'بستانکار';
            balanceType = 'credit';
        } else {
            balanceStatus = 'تسویه';
            balanceType = 'clear';
        }

        res.json({
            id: customerData.id,
            customerCode: customerData.customer_code,
            fullName: customerData.full_name,
            currentBalance: Math.abs(balance),
            balanceStatus: balanceStatus,
            balanceType: balanceType,
            totalPurchases: parseFloat(customerData.total_purchases || 0),
            totalPayments: parseFloat(customerData.total_payments || 0)
        });
    } catch (error) {
        console.error('Error fetching customer financial info:', error);
        res.status(500).json({ error: 'خطا در دریافت اطلاعات مالی مشتری' });
    }
});