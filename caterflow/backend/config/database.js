const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool({
  host: config.DB.HOST,
  port: config.DB.PORT,
  user: config.DB.USER,
  password: config.DB.PASSWORD,
  database: config.DB.NAME,
  waitForConnections: true,
  connectionLimit: config.DB.CONNECTION_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

// Helper function for transactions
const withTransaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Query helper with tenant isolation
const query = async (sql, params, tenantId = null) => {
  // If tenantId is provided, ensure it's included in the query
  if (tenantId && !sql.includes('WHERE') && !sql.includes('WHERE tenant_id')) {
    // This is a simple safety check - actual tenant isolation should be handled in the SQL
    console.warn('Warning: Query without tenant_id filter:', sql.substring(0, 50));
  }
  
  const [rows] = await pool.execute(sql, params);
  return rows;
};

module.exports = {
  pool,
  query,
  withTransaction,
};
