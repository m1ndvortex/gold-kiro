const mysql = require('mysql2');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gold_shop_db',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    multipleStatements: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

module.exports = promisePool; 