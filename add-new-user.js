const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addNewUser() {
    try {
        // Hash the password
        const password = 'Arman18588530*';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log('🔐 Password hashed successfully');
        
        // Connect to database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gold_shop_db',
            charset: 'utf8mb4'
        });
        
        console.log('📊 Connected to database');
        
        // Check if user already exists
        const [existing] = await connection.execute(
            'SELECT username FROM users WHERE username = ?',
            ['crystalah']
        );
        
        if (existing.length > 0) {
            console.log('⚠️  User "crystalah" already exists');
            
            // Update existing user
            await connection.execute(`
                UPDATE users 
                SET password = ?, full_name = ?, role = 'admin', updated_at = NOW()
                WHERE username = ?
            `, [hashedPassword, 'Crystalah Admin', 'crystalah']);
            
            console.log('✅ User "crystalah" updated successfully');
        } else {
            // Insert new user
            await connection.execute(`
                INSERT INTO users (username, password, full_name, role) 
                VALUES (?, ?, ?, 'admin')
            `, ['crystalah', hashedPassword, 'Crystalah Admin']);
            
            console.log('✅ User "crystalah" created successfully');
        }
        
        // Show all users
        const [users] = await connection.execute(
            'SELECT id, username, full_name, role, created_at FROM users ORDER BY id'
        );
        
        console.log('\n👥 Current users:');
        users.forEach(user => {
            console.log(`   - ID: ${user.id} | Username: ${user.username} | Name: ${user.full_name} | Role: ${user.role}`);
        });
        
        console.log('\n🔑 Login credentials for new user:');
        console.log(`   Username: crystalah`);
        console.log(`   Password: Arman18588530*`);
        
        await connection.end();
        console.log('\n🎉 User addition completed successfully!');
        
    } catch (error) {
        console.error('❌ Error adding user:', error.message);
    }
}

addNewUser();