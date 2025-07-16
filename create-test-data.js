const db = require('./config/database');

async function createTestData() {
    console.log('🚀 Creating test data...\n');
    
    try {
        // 1. Create 5 test customers with unique national IDs
        const timestamp = Date.now().toString().slice(-6);
        const customers = [
            { name: 'علی احمدی', phone: '09121234567', national_id: `12345${timestamp}1` },
            { name: 'فاطمه محمدی', phone: '09129876543', national_id: `09876${timestamp}2` },
            { name: 'حسن رضایی', phone: '09123456789', national_id: `11223${timestamp}3` },
            { name: 'زهرا کریمی', phone: '09987654321', national_id: `55443${timestamp}4` },
            { name: 'محمد حسینی', phone: '09111222333', national_id: `99887${timestamp}5` }
        ];
        
        console.log('👥 Creating customers...');
        const customerIds = [];
        
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            const customer_code = `CUS-${String(1000 + i).padStart(4, '0')}`;
            
            const [result] = await db.execute(`
                INSERT INTO customers (
                    customer_code, full_name, phone, national_id, 
                    is_active, total_purchases, total_payments, current_balance
                ) VALUES (?, ?, ?, ?, TRUE, 0, 0, 0)
            `, [customer_code, customer.name, customer.phone, customer.national_id]);
            
            customerIds.push(result.insertId);
            console.log(`✅ Created customer: ${customer.name} (ID: ${result.insertId})`);
        }
        
        // 2. Get available inventory items
        const [items] = await db.execute(`
            SELECT id, item_name, carat FROM inventory_items 
            WHERE current_quantity > 0 
            LIMIT 10
        `);
        
        if (items.length === 0) {
            console.log('⚠️  No inventory items found. Please add some items first.');
            return;
        }
        
        console.log(`\n📦 Found ${items.length} inventory items for invoices`);
        
        // 3. Create 2-3 invoices for each customer
        console.log('\n🧾 Creating invoices...');
        
        for (let customerId of customerIds) {
            const invoiceCount = Math.floor(Math.random() * 2) + 2; // 2-3 invoices per customer
            
            for (let j = 0; j < invoiceCount; j++) {
                // Generate invoice data
                const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const goldRate = 3500000 + Math.floor(Math.random() * 500000); // 3.5M to 4M
                const invoiceDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // Last 30 days
                const shamsiDate = `1403/04/${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
                
                // Select random items for this invoice
                const selectedItems = [];
                const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items per invoice
                
                for (let k = 0; k < itemCount; k++) {
                    const randomItem = items[Math.floor(Math.random() * items.length)];
                    const weight = (Math.random() * 20 + 5).toFixed(3); // 5-25 grams
                    const unitPrice = goldRate * parseFloat(weight) / 1000; // Price per gram
                    const laborCost = unitPrice * 0.1; // 10% labor
                    const totalPrice = unitPrice + laborCost;
                    
                    selectedItems.push({
                        item_id: randomItem.id,
                        weight: parseFloat(weight),
                        unit_price: unitPrice,
                        total_price: totalPrice,
                        labor_cost: laborCost
                    });
                }
                
                // Calculate totals
                const subtotal = selectedItems.reduce((sum, item) => sum + item.total_price, 0);
                const grandTotal = subtotal;
                const totalWeight = selectedItems.reduce((sum, item) => sum + item.weight, 0);
                
                // Create invoice
                const [invoiceResult] = await db.execute(`
                    INSERT INTO invoices (
                        invoice_number, customer_id, invoice_date, invoice_date_shamsi, 
                        gold_rate, subtotal, grand_total, total_weight, 
                        paid_amount, remaining_amount, payment_status, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'unpaid', 'active')
                `, [
                    invoiceNumber, customerId, invoiceDate, shamsiDate,
                    goldRate, subtotal, grandTotal, totalWeight, grandTotal
                ]);
                
                const invoiceId = invoiceResult.insertId;
                
                // Add invoice items
                for (let item of selectedItems) {
                    await db.execute(`
                        INSERT INTO invoice_items (
                            invoice_id, item_id, quantity, weight, unit_price, 
                            total_price, labor_cost, description
                        ) VALUES (?, ?, 1, ?, ?, ?, ?, ?)
                    `, [
                        invoiceId, item.item_id, item.weight, item.unit_price,
                        item.total_price, item.labor_cost, 'تست فاکتور'
                    ]);
                }
                
                // Update customer totals
                await db.execute(`
                    UPDATE customers 
                    SET total_purchases = total_purchases + ?,
                        current_balance = current_balance + ?
                    WHERE id = ?
                `, [grandTotal, grandTotal, customerId]);
                
                console.log(`✅ Created invoice ${invoiceNumber} for customer ${customerId} (${grandTotal.toLocaleString()} ریال)`);
            }
        }
        
        // 4. Create some payments for random invoices
        console.log('\n💳 Creating test payments...');
        
        const [allInvoices] = await db.execute(`
            SELECT id, customer_id, grand_total, invoice_number 
            FROM invoices 
            WHERE status = 'active' 
            ORDER BY RAND() 
            LIMIT 8
        `);
        
        for (let invoice of allInvoices) {
            // Random payment amount (50% to 100% of invoice)
            const paymentRatio = 0.5 + Math.random() * 0.5;
            const paymentAmount = Math.floor(invoice.grand_total * paymentRatio);
            const paymentDate = new Date();
            
            // Create payment
            const [paymentResult] = await db.execute(`
                INSERT INTO payments (
                    customer_id, invoice_id, amount, payment_method, 
                    payment_date, description
                ) VALUES (?, ?, ?, 'cash', ?, ?)
            `, [
                invoice.customer_id, invoice.id, paymentAmount, 
                paymentDate, `پرداخت فاکتور ${invoice.invoice_number}`
            ]);
            
            // Update invoice payment status
            const newPaidAmount = paymentAmount;
            const remainingAmount = invoice.grand_total - newPaidAmount;
            let paymentStatus = 'partial';
            
            if (remainingAmount <= 0) {
                paymentStatus = 'paid';
            }
            
            await db.execute(`
                UPDATE invoices 
                SET paid_amount = ?, remaining_amount = ?, payment_status = ?
                WHERE id = ?
            `, [newPaidAmount, Math.max(0, remainingAmount), paymentStatus, invoice.id]);
            
            // Update customer balance
            await db.execute(`
                UPDATE customers 
                SET total_payments = total_payments + ?,
                    current_balance = current_balance - ?
                WHERE id = ?
            `, [paymentAmount, paymentAmount, invoice.customer_id]);
            
            console.log(`✅ Created payment ${paymentAmount.toLocaleString()} ریال for invoice ${invoice.invoice_number}`);
        }
        
        // 5. Show summary
        console.log('\n📊 Test Data Summary:');
        
        const [customerSummary] = await db.execute(`
            SELECT 
                COUNT(*) as customer_count,
                SUM(total_purchases) as total_purchases,
                SUM(total_payments) as total_payments,
                SUM(current_balance) as total_balance
            FROM customers 
            WHERE customer_code LIKE 'CUS-1%'
        `);
        
        const [invoiceSummary] = await db.execute(`
            SELECT 
                COUNT(*) as invoice_count,
                SUM(grand_total) as total_amount,
                COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partial_count,
                COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_count
            FROM invoices 
            WHERE customer_id IN (SELECT id FROM customers WHERE customer_code LIKE 'CUS-1%')
        `);
        
        console.log(`👥 Customers: ${customerSummary[0].customer_count}`);
        console.log(`🧾 Invoices: ${invoiceSummary[0].invoice_count}`);
        console.log(`💰 Total Sales: ${Number(customerSummary[0].total_purchases).toLocaleString()} ریال`);
        console.log(`💳 Total Payments: ${Number(customerSummary[0].total_payments).toLocaleString()} ریال`);
        console.log(`📊 Payment Status: ${invoiceSummary[0].paid_count} paid, ${invoiceSummary[0].partial_count} partial, ${invoiceSummary[0].unpaid_count} unpaid`);
        
        console.log('\n🎉 Test data created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating test data:', error);
    } finally {
        process.exit(0);
    }
}

createTestData();