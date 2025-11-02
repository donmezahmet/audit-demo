// Configuration for Audit Dashboard Demo
// All settings are hard-coded for demo purposes
// No environment variables or external dependencies

const config = {
  // Server Configuration
  port: 3001, // Different port than original project (3000)
  
  // Database - NOT USED (Mock data only)
  db: null,
  
  // URLs
  backendUrl: 'http://localhost:3001',
  frontendUrl: 'http://localhost:5174', // Different port than original (5173)
  
  // Session
  session: {
    secret: 'demo-audit-dashboard-secret-key',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Company Info
  company: {
    name: 'Demo Company',
    domain: 'democompany.com'
  },
  
  // Mock Admin User
  adminUser: {
    username: 'mahmut@demo.com',
    password: 'mahmutturan12345', // Plain text for demo - would be hashed in production
    email: 'mahmut@demo.com',
    name: 'Mahmut Uran',
    role: 'admin'
  }
};

module.exports = config;
