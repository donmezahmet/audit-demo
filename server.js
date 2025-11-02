// Audit Dashboard Demo - Backend Server
// This is a simplified version that uses only mock data
// No database, no external APIs, no Google OAuth

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieSession = require('cookie-session');
const config = require('./config');
const mockData = require('./mockData');

const app = express();
const PORT = config.port;

// In-memory session storage (for demo purposes)
const sessions = {};

// CORS configuration for development
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware
app.use(cookieSession({
  name: 'demo-session',
  keys: [config.session.secret],
  maxAge: config.session.maxAge,
  httpOnly: true,
  sameSite: 'lax',
}));

// Helper: Check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Not authenticated' });
}

// ======================
// AUTHENTICATION ROUTES
// ======================

// Login endpoint (simple username/password)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Check credentials
  const adminUser = config.adminUser;
  
  if ((email === adminUser.username || email === adminUser.email) && password === adminUser.password) {
    // Set session
    req.session.user = {
      id: 1,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    };
    
    return res.json({
      success: true,
      data: {
        user: req.session.user,
        role: adminUser.role
      }
    });
  }
  
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session = null;
  res.json({ success: true });
});

// Get auth status
app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      authenticated: true,
      user: req.session.user,
      role: req.session.user.role,
      permissions: {
        charts: ['all'], // Admin has access to all charts
        pages: ['all'],
        components: ['all']
      }
    });
  }
  
  return res.json({ authenticated: false });
});

// Get permissions
app.get('/api/auth/permissions', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: {
      charts: ['all'],
      pages: ['all'],
      components: ['all']
    }
  });
});

// ======================
// JIRA DATA ENDPOINTS (Mock Data)
// ======================

// Audit Projects by Year
app.get('/api/audit-projects-by-year', isAuthenticated, (req, res) => {
  res.json(mockData.auditProjectsByYear);
});

// Investigation Counts
app.get('/api/investigation-counts', isAuthenticated, (req, res) => {
  res.json(mockData.investigationsByYear);
});

// Finding Status by Year
app.get('/api/finding-status-by-year', isAuthenticated, (req, res) => {
  res.json(mockData.findingStatusByYear);
});

// Finding Action Status Distribution
app.get('/api/finding-action-status-distribution', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || '2024+';
  const data = mockData.findingActionStatusDistribution[auditYear] || mockData.findingActionStatusDistribution['2024+'];
  res.json(data);
});

// Finding Actions by Lead
app.get('/api/finding-action-status-by-lead', isAuthenticated, (req, res) => {
  res.json(mockData.leadStatusDistribution);
});

// User Finding Actions
app.get('/api/user-finding-actions', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || 'all';
  const actions = mockData.generateFindingActions({ auditYear, limit: 50 });
  res.json(actions);
});

// Department Finding Actions
app.get('/api/department-finding-actions', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || 'all';
  const actions = mockData.generateFindingActions({ auditYear, limit: 50 });
  res.json(actions);
});

// C-Level Finding Actions
app.get('/api/clevel-finding-actions', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || 'all';
  const actions = mockData.generateFindingActions({ auditYear, limit: 50 });
  res.json(actions);
});

// All Finding Actions
app.get('/api/all-finding-actions', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || 'all';
  const actions = mockData.generateFindingActions({ auditYear, limit: 100 });
  res.json(actions);
});

// VP Finding Actions
app.get('/api/vp-finding-actions', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || 'all';
  const actions = mockData.generateFindingActions({ auditYear, limit: 50 });
  res.json(actions);
});

// Team Finding Actions
app.get('/api/team-finding-actions', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || 'all';
  const actions = mockData.generateFindingActions({ auditYear, limit: 50 });
  res.json(actions);
});

// Management Finding Actions
app.get('/api/management-finding-actions', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || 'all';
  const actions = mockData.generateFindingActions({ auditYear, limit: 50 });
  res.json(actions);
});

// Finding Actions Aging
app.get('/api/finding-actions-aging', isAuthenticated, (req, res) => {
  res.json(mockData.actionAgeDistribution);
});

// Finding Action Age Summary
app.get('/api/finding-action-age-summary', isAuthenticated, (req, res) => {
  res.json({
    totalActions: 203,
    overdueActions: 58,
    upcomingActions: 125,
    avgDaysToComplete: 45
  });
});

// Finding Action Age (with filters)
app.get('/api/finding-action-age', isAuthenticated, (req, res) => {
  res.json(mockData.actionAgeDistribution);
});

// Actions by Status (for modals)
app.get('/api/finding-actions-by-status', isAuthenticated, (req, res) => {
  const status = req.query.status;
  const auditYear = req.query.auditYear || 'all';
  const actions = mockData.generateFindingActions({ status, auditYear, limit: 50 });
  res.json(actions);
});

// Overdue Actions
app.get('/api/overdue-actions', isAuthenticated, (req, res) => {
  const actions = mockData.getOverdueActions();
  res.json(actions);
});

// Upcoming Actions
app.get('/api/upcoming-actions', isAuthenticated, (req, res) => {
  const actions = mockData.getUpcomingActions();
  res.json(actions);
});

// ======================
// FINANCIAL IMPACT
// ======================

// Fraud Impact Score Cards
app.get('/api/fraud-impact-score-cards', isAuthenticated, (req, res) => {
  res.json(mockData.fraudImpactScoreCards);
});

// LP Impact Score Cards
app.get('/api/lp-impact-score-cards', isAuthenticated, (req, res) => {
  res.json(mockData.lpImpactScoreCards);
});

// Financial Impact Sum
app.get('/api/financial-impact-sum', isAuthenticated, (req, res) => {
  res.json({
    totalFraudImpact: 66490000,
    totalLPImpact: 12590000,
    totalCombined: 79080000
  });
});

// ======================
// AUDIT MATURITY
// ======================

// MAT Scores
app.get('/api/mat-scores', isAuthenticated, (req, res) => {
  res.json(mockData.matScores);
});

// Radar Chart Data
app.get('/api/radar-chart-data', isAuthenticated, (req, res) => {
  const dimensions = mockData.matScores.dimensions;
  
  res.json({
    labels: dimensions.map(d => d.dimension),
    labelsWithGroups: dimensions.map(d => ({
      dimension: d.dimension,
      group: d.group,
      fullLabel: `${d.dimension} (${d.group})`
    })),
    data2024: dimensions.map(d => d.score2024),
    data2025: dimensions.map(d => d.score2025)
  });
});

// ======================
// GOOGLE SHEETS (Mock)
// ======================

// Google Sheet Data (Fraud)
app.get('/api/google-sheet-data', isAuthenticated, (req, res) => {
  res.json(mockData.fraudInternalControl);
});

// Loss Prevention Summary
app.get('/api/loss-prevention-summary', isAuthenticated, (req, res) => {
  res.json(mockData.lossPreventionSummary);
});

// ======================
// STATISTICS & DISTRIBUTION
// ======================

// Lead Status Distribution
app.get('/api/lead-status-distribution', isAuthenticated, (req, res) => {
  res.json(mockData.leadStatusDistribution);
});

// Control Element Distribution
app.get('/api/statistics-by-control-and-risk', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || '2024+';
  const data = mockData.controlElementDistribution[auditYear] || mockData.controlElementDistribution['2024+'];
  res.json(data);
});

// Risk Type Distribution
app.get('/api/statistics-by-type-and-risk', isAuthenticated, (req, res) => {
  const auditYear = req.query.auditYear || '2024+';
  const data = mockData.riskTypeDistribution[auditYear] || mockData.riskTypeDistribution['2024+'];
  res.json(data);
});

// Department Stats
app.get('/api/department-stats', isAuthenticated, (req, res) => {
  res.json({
    totalActions: 145,
    openActions: 62,
    overdueActions: 18,
    completedActions: 65,
    completionRate: 44.8
  });
});

// ======================
// AUDIT PLAN
// ======================

// Yearly Audit Plan
app.get('/api/yearly-audit-plan', isAuthenticated, (req, res) => {
  res.json(mockData.auditPlan);
});

// ======================
// FILTERS & OPTIONS
// ======================

// Audit Types
app.get('/api/audit-types', isAuthenticated, (req, res) => {
  res.json(['Compliance', 'IT Audit', 'Operational', 'Investigation', 'Financial']);
});

// Audit Countries
app.get('/api/audit-countries', isAuthenticated, (req, res) => {
  res.json(['Turkey', 'Germany', 'UK', 'Spain', 'Netherlands']);
});

// C-Level Options
app.get('/api/clevel-options', isAuthenticated, (req, res) => {
  res.json(['CEO', 'CFO', 'CTO', 'COO', 'CHRO']);
});

// Action Responsible Options
app.get('/api/action-responsible-options', isAuthenticated, (req, res) => {
  res.json([
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
    'David Wilson', 'Lisa Anderson', 'James Taylor', 'Jennifer Martinez',
    'Robert Garcia', 'Mary Rodriguez'
  ]);
});

// ======================
// TASK MANAGER
// ======================

// Get all tasks
app.get('/api/tasks', isAuthenticated, (req, res) => {
  res.json({ success: true, data: mockData.tasks });
});

// Create task
app.post('/api/tasks', isAuthenticated, (req, res) => {
  const newTask = {
    id: mockData.tasks.length + 1,
    ...req.body,
    created_by: req.session.user.email,
    created_at: new Date().toISOString()
  };
  mockData.tasks.push(newTask);
  res.json({ success: true, data: newTask });
});

// Update task
app.put('/api/tasks/:id', isAuthenticated, (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = mockData.tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex !== -1) {
    mockData.tasks[taskIndex] = {
      ...mockData.tasks[taskIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    res.json({ success: true, data: mockData.tasks[taskIndex] });
  } else {
    res.status(404).json({ success: false, error: 'Task not found' });
  }
});

// Delete task
app.delete('/api/tasks/:id', isAuthenticated, (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = mockData.tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex !== -1) {
    mockData.tasks.splice(taskIndex, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Task not found' });
  }
});

// ======================
// EMAIL ENDPOINTS (Mock - Just Log)
// ======================

// Get Action Responsible List (Demo - Only 2 emails)
app.get('/api/email/action-responsible-list', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: [
      { email: 'mahmuturan44@gmail.com', name: 'Mahmut Uran', actionCount: 45 },
      { email: 'donmezahmet@yandex.com', name: 'Ahmet Dönmez', actionCount: 34 }
    ]
  });
});

// Get All Action Responsible List (Demo - Same 2 emails)
app.get('/api/email/all-action-responsible-list', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: [
      { email: 'mahmuturan44@gmail.com', name: 'Mahmut Uran', actionCount: 45 },
      { email: 'donmezahmet@yandex.com', name: 'Ahmet Dönmez', actionCount: 34 }
    ]
  });
});

// Get C-Level List (Demo - Same 2 emails)
app.get('/api/email/clevel-list', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: [
      { email: 'mahmuturan44@gmail.com', name: 'Mahmut Uran', cLevel: 'CEO', actionCount: 45 },
      { email: 'donmezahmet@yandex.com', name: 'Ahmet Dönmez', cLevel: 'CFO', actionCount: 34 }
    ]
  });
});

// Send Email (Mock - Just log, no actual email sent)
app.post('/api/send-email', isAuthenticated, (req, res) => {
  console.log('\n📧 =====================================');
  console.log('   DEMO EMAIL - NOT ACTUALLY SENT');
  console.log('   =====================================');
  console.log('   To:', req.body.to);
  console.log('   Subject:', req.body.subject);
  console.log('   Report Type:', req.body.reportingTarget);
  console.log('   =====================================\n');
  res.json({ 
    success: true, 
    message: '✅ Email logged to console (Demo mode - SendGrid not configured)'
  });
});

app.post('/api/send-action-responsible-email', isAuthenticated, (req, res) => {
  console.log('\n📧 =====================================');
  console.log('   ACTION RESPONSIBLE EMAIL (DEMO)');
  console.log('   =====================================');
  console.log('   Recipients:', req.body.recipients);
  console.log('   Bulk Send:', req.body.bulkEmail);
  console.log('   =====================================\n');
  res.json({ 
    success: true, 
    message: '✅ Email logged to console (Demo mode - SendGrid not configured)'
  });
});

app.post('/api/send-clevel-email', isAuthenticated, (req, res) => {
  console.log('\n📧 =====================================');
  console.log('   C-LEVEL EMAIL (DEMO)');
  console.log('   =====================================');
  console.log('   Recipients:', req.body.recipients);
  console.log('   Bulk Send:', req.body.bulkEmail);
  console.log('   =====================================\n');
  res.json({ 
    success: true, 
    message: '✅ Email logged to console (Demo mode - SendGrid not configured)'
  });
});

// ======================
// ADMIN & PERMISSIONS
// ======================

// Get all users (for access management)
app.get('/api/users', isAuthenticated, (req, res) => {
  res.json({ success: true, data: mockData.users });
});

// Get user permissions
app.get('/api/permissions/user/:email', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: {
      charts: ['all'],
      pages: ['all'],
      components: ['all']
    }
  });
});

// ======================
// ACCESS MANAGEMENT ENDPOINTS
// ======================

// Get all users for Access Management
app.get('/api/access-management/users', isAuthenticated, (req, res) => {
  res.json({ success: true, data: mockData.accessManagement.users });
});

// Get all roles
app.get('/api/access-management/roles', isAuthenticated, (req, res) => {
  res.json({ success: true, data: mockData.accessManagement.roles });
});

// Get all components
app.get('/api/access-management/components', isAuthenticated, (req, res) => {
  res.json({ success: true, data: mockData.accessManagement.components });
});

// Get role permissions
app.get('/api/access-management/role-permissions/:roleName', isAuthenticated, (req, res) => {
  const roleName = req.params.roleName;
  const rolePermissions = mockData.accessManagement.rolePermissions[roleName];
  
  if (!rolePermissions) {
    return res.status(404).json({ success: false, error: 'Role not found' });
  }
  
  res.json({ success: true, data: rolePermissions });
});

// View as user (impersonation)
app.post('/api/access-management/view-as', isAuthenticated, (req, res) => {
  const { targetEmail } = req.body;
  const targetUser = mockData.accessManagement.users.find(u => u.email === targetEmail);
  
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Store original user in session
  if (!req.session.originalUser) {
    req.session.originalUser = req.session.user;
  }
  
  // Set impersonated user
  req.session.user = targetUser;
  req.session.isImpersonating = true;
  
  const permissions = mockData.accessManagement.rolePermissions[targetUser.role] || {
    components: [],
    interactiveComponents: [],
    charts: [],
    pages: []
  };
  
  res.json({
    success: true,
    data: {
      user: targetUser,
      role: targetUser.role,
      permissions,
      isImpersonating: true,
      originalUser: req.session.originalUser
    }
  });
});

// Stop impersonation
app.post('/api/access-management/stop-view-as', isAuthenticated, (req, res) => {
  if (req.session.originalUser) {
    req.session.user = req.session.originalUser;
    delete req.session.originalUser;
    delete req.session.isImpersonating;
    
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Not impersonating' });
  }
});

// ======================
// EXPORT ENDPOINTS (Mock - Return empty Excel)
// ======================

app.get('/api/finding-actions-export', isAuthenticated, (req, res) => {
  // In demo mode, we'll just send a success message
  // In real implementation, would generate Excel file
  res.json({ success: true, message: 'Export functionality available in full version' });
});

app.get('/api/finding-actions-aging-export', isAuthenticated, (req, res) => {
  res.json({ success: true, message: 'Export functionality available in full version' });
});

// ======================
// STATIC FILES (Frontend)
// ======================

// Serve static files from client/dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  });
}

// ======================
// START SERVER
// ======================

app.listen(PORT, async () => {
  console.log('\n🚀 ================================');
  console.log('   AUDIT DASHBOARD DEMO');
  console.log('   ================================');
  console.log(`   Backend: http://localhost:${PORT}`);
  console.log(`   Frontend: ${config.frontendUrl}`);
  console.log('   ================================');
  console.log('   📊 Using mock data (no database)');
  console.log('   🔐 Login: mahmut@demo.com');
  console.log('   🔑 Pass: mahmutturan12345');
  console.log('   ================================\n');
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = app;
