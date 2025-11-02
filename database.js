// Database module for Audit Dashboard Demo
// This demo version does NOT use any database
// All data comes from mockData.js

const database = {
  // No database connection in demo version
  pool: null,
  
  testConnection: async function() {
    console.log('✅ Demo mode: Using mock data (no database)');
    return true;
  },
  
  initializeDatabase: async function() {
    console.log('✅ Demo mode: Mock data initialized');
    return true;
  },
  
  query: async function(text, params) {
    console.warn('⚠️  Database query attempted in demo mode. Use mockData instead.');
    throw new Error('Database not available in demo mode. Use mockData service.');
  }
};

module.exports = database;
