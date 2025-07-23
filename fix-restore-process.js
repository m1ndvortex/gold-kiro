// Fix restore process - Helper script
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixRestoreProcess() {
    console.log('🔧 Fixing Restore Process...\n');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gold_shop_db'
        });
        
        console.log('✅ Database connection established');
        
        // Step 1: Get all foreign key constraints
        console.log('\n🔍 Checking foreign key constraints...');
        
        const [constraints] = await connection.execute(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE CONSTRAINT_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME, COLUMN_NAME
        `);
        
        console.log(`Found ${constraints.length} foreign key constraints:`);
        
        const tableOrder = [];
        const referencedTables = new Set();
        const referencingTables = new Set();
        
        constraints.forEach(constraint => {
            console.log(`   - ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} → ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
            referencedTables.add(constraint.REFERENCED_TABLE_NAME);
            referencingTables.add(constraint.TABLE_NAME);
        });
        
        // Step 2: Create proper deletion order
        console.log('\n📋 Recommended deletion order:');
        
        // Tables that are referenced by others should be deleted last
        // Tables that reference others should be deleted first
        
        const [allTables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_TYPE = 'BASE TABLE'
            AND TABLE_NAME NOT IN ('users', 'backup_history', 'system_settings')
            ORDER BY TABLE_NAME
        `);
        
        // Separate tables into categories
        const childTables = []; // Tables that reference others
        const parentTables = []; // Tables that are referenced by others
        const independentTables = []; // Tables with no foreign key relationships
        
        allTables.forEach(table => {
            const tableName = table.TABLE_NAME;
            const isChild = referencingTables.has(tableName);
            const isParent = referencedTables.has(tableName);
            
            if (isChild && !isParent) {
                childTables.push(tableName);
            } else if (isParent && !isChild) {
                parentTables.push(tableName);
            } else if (isChild && isParent) {
                // Tables that are both parent and child - handle carefully
                childTables.push(tableName);
            } else {
                independentTables.push(tableName);
            }
        });
        
        console.log('\n📊 Table categories:');
        console.log(`   Child tables (delete first): ${childTables.join(', ')}`);
        console.log(`   Parent tables (delete last): ${parentTables.join(', ')}`);
        console.log(`   Independent tables: ${independentTables.join(', ')}`);
        
        // Step 3: Test safe deletion order
        console.log('\n🧪 Testing safe deletion order...');
        
        const safeDeletionOrder = [
            ...childTables,
            ...independentTables,
            ...parentTables
        ];
        
        console.log('Recommended deletion order:');
        safeDeletionOrder.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table}`);
        });
        
        // Step 4: Create a safe restore script
        const restoreScript = `
-- Safe Restore Script for Gold Shop Database
-- Generated: ${new Date().toLocaleString('fa-IR')}

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- Clear existing data in safe order
${safeDeletionOrder.map(table => `DELETE FROM \`${table}\`;`).join('\n')}

-- Reset auto increment
${safeDeletionOrder.map(table => `ALTER TABLE \`${table}\` AUTO_INCREMENT = 1;`).join('\n')}

-- Your backup data will be inserted here

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
`;
        
        require('fs').writeFileSync('safe-restore-template.sql', restoreScript);
        console.log('\n✅ Safe restore template created: safe-restore-template.sql');
        
        await connection.end();
        console.log('\n🎉 Restore process analysis completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixRestoreProcess();