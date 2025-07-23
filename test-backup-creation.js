// Test backup creation functionality
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testBackupCreation() {
    console.log('🧪 Testing Backup Creation...\n');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gold_shop_db'
        });
        
        console.log('✅ Database connection established');
        
        // Test 1: Check backup_history table structure
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'backup_history'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME || 'gold_shop_db']);
        
        console.log('\n📋 backup_history table structure:');
        columns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // Test 2: Check if description column exists
        const hasDescription = columns.some(col => col.COLUMN_NAME === 'description');
        if (hasDescription) {
            console.log('\n✅ Description column exists');
        } else {
            console.log('\n❌ Description column missing - run migration first');
        }
        
        // Test 3: Test insert with description
        if (hasDescription) {
            const testId = Date.now();
            const testFilename = `test_backup_${testId}.sql`;
            
            try {
                await connection.execute(`
                    INSERT INTO backup_history (id, filename, backup_type, status, created_by, description)
                    VALUES (?, ?, 'full', 'success', 1, 'Test backup creation')
                `, [testId, testFilename]);
                
                console.log('✅ Test backup record created successfully');
                
                // Clean up test record
                await connection.execute('DELETE FROM backup_history WHERE id = ?', [testId]);
                console.log('✅ Test record cleaned up');
                
            } catch (insertError) {
                console.log('❌ Error creating test backup record:', insertError.message);
            }
        }
        
        // Test 4: Check existing backups
        const [backups] = await connection.execute(`
            SELECT id, filename, backup_type, status, created_at, description
            FROM backup_history 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        console.log(`\n📊 Found ${backups.length} existing backup records:`);
        backups.forEach(backup => {
            const date = new Date(backup.created_at).toLocaleDateString('fa-IR');
            console.log(`   - ${backup.filename} (${backup.backup_type}, ${backup.status}) - ${date}`);
            if (backup.description) {
                console.log(`     Description: ${backup.description}`);
            }
        });
        
        await connection.end();
        console.log('\n🎉 Backup creation test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('\n💡 Solution: Run the database schema setup first');
        } else if (error.code === 'ER_BAD_FIELD_ERROR') {
            console.log('\n💡 Solution: Run the migration to add missing columns');
        }
    }
}

testBackupCreation();