// Mock Data Service for Audit Dashboard Demo
// All data is fictional and for demonstration purposes only

const mockData = {
  // Single admin user
  users: [
    {
      id: 1,
      username: 'mahmut@demo.com',
      password: 'mahmutturan12345', // In production, this would be hashed
      email: 'mahmut@demo.com',
      name: 'Mahmut Uran',
      role: 'admin',
      department: 'Internal Audit',
      status: 'active'
    }
  ],

  // Audit Projects by Year
  auditProjectsByYear: [
    { auditYear: '2025', count: 13, perAuditor: 2.17 },
    { auditYear: '2024', count: 11, perAuditor: 1.84 },
    { auditYear: '2023', count: 6, perAuditor: 0.86 },
    { auditYear: '2022', count: 8, perAuditor: 1.15 },
    { auditYear: '2021', count: 14, perAuditor: 1.94 }
  ],

  // Investigations by Year
  investigationsByYear: [
    { year: '2025', count: 65, perAuditor: 10.84 },
    { year: '2024', count: 62, perAuditor: 10.25 },
    { year: '2023', count: 103, perAuditor: 14.74 },
    { year: '2022', count: 165, perAuditor: 23.59 },
    { year: '2021', count: 75, perAuditor: 10.70 }
  ],

  // Finding Status by Year
  findingStatusByYear: {
    '2021': { Open: 12, 'Risk Accepted': 8, Completed: 45 },
    '2022': { Open: 18, 'Risk Accepted': 12, Completed: 67 },
    '2023': { Open: 25, 'Risk Accepted': 15, Completed: 82 },
    '2024': { Open: 32, 'Risk Accepted': 18, Completed: 95 },
    '2025': { Open: 28, 'Risk Accepted': 10, Completed: 42 }
  },

  // Finding Action Status Distribution
  findingActionStatusDistribution: {
    '2024+': {
      statusDistribution: {
        'Open': 145,
        'Overdue': 42,
        'Risk Accepted': 28,
        'Completed': 137
      },
      totalFinancialImpact: 8750000, // €8.75M
      parentKeys: ['AUDIT-2024-001', 'AUDIT-2024-002', 'AUDIT-2024-003', 'AUDIT-2024-004', 'AUDIT-2024-005']
    },
    'all': {
      statusDistribution: {
        'Open': 215,
        'Overdue': 68,
        'Risk Accepted': 53,
        'Completed': 386
      },
      totalFinancialImpact: 15420000, // €15.42M
      parentKeys: ['AUDIT-2021-001', 'AUDIT-2022-001', 'AUDIT-2023-001', 'AUDIT-2024-001', 'AUDIT-2025-001']
    }
  },

  // Lead Status Distribution
  leadStatusDistribution: {
    'John Smith': { Open: 15, 'Risk Accepted': 3, Completed: 22, Overdue: 5 },
    'Sarah Johnson': { Open: 12, 'Risk Accepted': 2, Completed: 18, Overdue: 3 },
    'Michael Brown': { Open: 18, 'Risk Accepted': 4, Completed: 25, Overdue: 6 },
    'Emily Davis': { Open: 10, 'Risk Accepted': 2, Completed: 15, Overdue: 2 },
    'David Wilson': { Open: 14, 'Risk Accepted': 3, Completed: 20, Overdue: 4 },
    'Lisa Anderson': { Open: 8, 'Risk Accepted': 1, Completed: 12, Overdue: 2 },
    'James Taylor': { Open: 11, 'Risk Accepted': 2, Completed: 16, Overdue: 3 },
    'Jennifer Martinez': { Open: 9, 'Risk Accepted': 2, Completed: 14, Overdue: 2 },
    'Robert Garcia': { Open: 13, 'Risk Accepted': 3, Completed: 19, Overdue: 4 },
    'Mary Rodriguez': { Open: 7, 'Risk Accepted': 1, Completed: 10, Overdue: 1 }
  },

  // Action Age Distribution (days until/past due date)
  actionAgeDistribution: {
    '-720—360': 5,
    '-360—180': 8,
    '-180—90': 12,
    '-90—30': 15,
    '-30—0': 18,
    '0—30': 35,
    '30—90': 42,
    '90—180': 28,
    '180—360': 20,
    '360—720': 12,
    '720+': 8
  },

  // Fraud Impact Score Cards
  fraudImpactScoreCards: {
    scoreCards: [
      { year: '2025', impact: 8050000 },
      { year: '2024', impact: 16250000 },
      { year: '2023', impact: 10920000 },
      { year: '2022', impact: 24500000 },
      { year: '2021', impact: 6720000 }
    ]
  },

  // Loss Prevention Impact Score Cards
  lpImpactScoreCards: {
    scoreCards2: [
      { year: '2025', impact: 5580000 },
      { year: '2024', impact: 4560000 },
      { year: '2023', impact: 1610000 },
      { year: '2022', impact: 490000 },
      { year: '2021', impact: 350000 }
    ]
  },

  // Audit Maturity Scores
  matScores: {
    average2024: 3.8,
    average2025: 4.2,
    dimensions: [
      { dimension: 'Governance', group: 'Governance', score2024: 4.1, score2025: 4.5 },
      { dimension: 'Strategy', group: 'Governance', score2024: 3.8, score2025: 4.2 },
      { dimension: 'Audit Tools', group: 'Use of Technology', score2024: 3.5, score2025: 4.0 },
      { dimension: 'Data Analytics', group: 'Use of Technology', score2024: 3.2, score2025: 3.8 },
      { dimension: 'Team Skills', group: 'People', score2024: 4.0, score2025: 4.3 },
      { dimension: 'Training', group: 'People', score2024: 3.7, score2025: 4.1 },
      { dimension: 'Stakeholder Engagement', group: 'Communications', score2024: 3.9, score2025: 4.4 },
      { dimension: 'Reporting', group: 'Communications', score2024: 4.2, score2025: 4.6 },
      { dimension: 'Risk Assessment', group: 'Scope of Work', score2024: 4.0, score2025: 4.3 },
      { dimension: 'Audit Coverage', group: 'Scope of Work', score2024: 3.6, score2025: 4.0 }
    ]
  },

  // Audit Plan Data
  auditPlan: [
    {
      id: 1,
      auditName: 'Financial Controls Audit',
      auditType: 'Compliance',
      status: 'Completed',
      plannedStart: '2025-01-15',
      actualStart: '2025-01-15',
      plannedEnd: '2025-02-28',
      actualEnd: '2025-02-25',
      lead: 'John Smith',
      country: 'Turkey',
      quarter: 'Q1'
    },
    {
      id: 2,
      auditName: 'IT Security Assessment',
      auditType: 'IT Audit',
      status: 'In Progress',
      plannedStart: '2025-02-01',
      actualStart: '2025-02-05',
      plannedEnd: '2025-03-31',
      actualEnd: null,
      lead: 'Sarah Johnson',
      country: 'Turkey',
      quarter: 'Q1'
    },
    {
      id: 3,
      auditName: 'Supply Chain Review',
      auditType: 'Operational',
      status: 'Planning',
      plannedStart: '2025-03-15',
      actualStart: null,
      plannedEnd: '2025-05-15',
      actualEnd: null,
      lead: 'Michael Brown',
      country: 'Turkey',
      quarter: 'Q2'
    },
    {
      id: 4,
      auditName: 'Fraud Investigation - Case 2025-001',
      auditType: 'Investigation',
      status: 'Completed',
      plannedStart: '2025-01-20',
      actualStart: '2025-01-20',
      plannedEnd: '2025-02-15',
      actualEnd: '2025-02-10',
      lead: 'Emily Davis',
      country: 'Turkey',
      quarter: 'Q1'
    },
    {
      id: 5,
      auditName: 'Vendor Management Audit',
      auditType: 'Compliance',
      status: 'Not Started',
      plannedStart: '2025-04-01',
      actualStart: null,
      plannedEnd: '2025-05-30',
      actualEnd: null,
      lead: 'David Wilson',
      country: 'Turkey',
      quarter: 'Q2'
    }
  ],

  // Finding Actions (for various views)
  generateFindingActions: function(filters = {}) {
    const { auditYear = 'all', cLevel, status, responsible, limit = 100 } = filters;
    
    const statuses = ['Open', 'Overdue', 'Risk Accepted', 'Completed'];
    const riskLevels = ['Critical', 'High', 'Medium', 'Low'];
    const cLevels = ['CEO', 'CFO', 'CTO', 'COO', 'CHRO'];
    const responsibles = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 
      'David Wilson', 'Lisa Anderson', 'James Taylor', 'Jennifer Martinez',
      'Robert Garcia', 'Mary Rodriguez'
    ];
    
    const actions = [];
    const baseCount = limit;
    
    for (let i = 1; i <= baseCount; i++) {
      const actionStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const year = auditYear === 'all' 
        ? ['2021', '2022', '2023', '2024', '2025'][Math.floor(Math.random() * 5)]
        : auditYear.replace('+', '');
      
      // Skip if year filter doesn't match
      if (auditYear === '2024+' && parseInt(year) < 2024) continue;
      if (status && actionStatus !== status) continue;
      
      const daysOffset = actionStatus === 'Overdue' 
        ? -Math.floor(Math.random() * 180) 
        : Math.floor(Math.random() * 365);
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysOffset);
      
      const action = {
        key: `FIND-${year}-${String(i).padStart(4, '0')}`,
        summary: `Finding Action ${i}: ${['Process improvement needed', 'Control weakness identified', 'Policy compliance issue', 'System vulnerability', 'Documentation gap'][Math.floor(Math.random() * 5)]}`,
        description: `Detailed description of finding action ${i}. This action requires attention and proper remediation to address identified risks.`,
        status: actionStatus,
        dueDate: dueDate.toISOString().split('T')[0],
        responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
        cLevel: cLevels[Math.floor(Math.random() * cLevels.length)],
        auditYear: year,
        auditName: `Audit Project ${year}-${Math.floor(Math.random() * 10) + 1}`,
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        financialImpact: Math.floor(Math.random() * 500000),
        createdDate: `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`
      };
      
      actions.push(action);
    }
    
    return actions;
  },

  // Control Element Distribution
  controlElementDistribution: {
    '2024+': [
      { control: 'Control Environment', Critical: 5, High: 12, Medium: 18, Low: 8, Total: 43 },
      { control: 'Risk Assessment', Critical: 3, High: 8, Medium: 15, Low: 12, Total: 38 },
      { control: 'Control Activities', Critical: 8, High: 15, Medium: 22, Low: 10, Total: 55 },
      { control: 'Information & Communication', Critical: 2, High: 6, Medium: 12, Low: 15, Total: 35 },
      { control: 'Monitoring Activities', Critical: 4, High: 10, Medium: 16, Low: 9, Total: 39 },
      { control: 'Total', Critical: 22, High: 51, Medium: 83, Low: 54, Total: 210 }
    ],
    'all': [
      { control: 'Control Environment', Critical: 12, High: 25, Medium: 35, Low: 18, Total: 90 },
      { control: 'Risk Assessment', Critical: 8, High: 18, Medium: 28, Low: 22, Total: 76 },
      { control: 'Control Activities', Critical: 15, High: 32, Medium: 45, Low: 20, Total: 112 },
      { control: 'Information & Communication', Critical: 5, High: 12, Medium: 25, Low: 28, Total: 70 },
      { control: 'Monitoring Activities', Critical: 10, High: 20, Medium: 32, Low: 18, Total: 80 },
      { control: 'Total', Critical: 50, High: 107, Medium: 165, Low: 106, Total: 428 }
    ]
  },

  // Risk Type Distribution
  riskTypeDistribution: {
    '2024+': [
      { type: 'Operational Risk', Critical: 8, High: 18, Medium: 25, Low: 12, Total: 63 },
      { type: 'Financial Risk', Critical: 6, High: 14, Medium: 20, Low: 15, Total: 55 },
      { type: 'Compliance Risk', Critical: 5, High: 12, Medium: 22, Low: 18, Total: 57 },
      { type: 'Strategic Risk', Critical: 3, High: 7, Medium: 16, Low: 9, Total: 35 },
      { type: 'Total', Critical: 22, High: 51, Medium: 83, Low: 54, Total: 210 }
    ],
    'all': [
      { type: 'Operational Risk', Critical: 18, High: 38, Medium: 52, Low: 25, Total: 133 },
      { type: 'Financial Risk', Critical: 14, High: 28, Medium: 42, Low: 30, Total: 114 },
      { type: 'Compliance Risk', Critical: 12, High: 26, Medium: 45, Low: 35, Total: 118 },
      { type: 'Strategic Risk', Critical: 6, High: 15, Medium: 26, Low: 16, Total: 63 },
      { type: 'Total', Critical: 50, High: 107, Medium: 165, Low: 106, Total: 428 }
    ]
  },

  // Google Sheets Mock Data - Fraud Internal Control
  fraudInternalControl: {
    result: [
      ['Year', '2021', '2022', '2023', '2024', '2025'],
      ['Prevented Losses (€)', '6.72M', '24.50M', '10.92M', '16.25M', '8.05M'],
      ['Cases Investigated', '75', '165', '103', '62', '65'],
      ['Recovery Rate %', '68%', '72%', '65%', '70%', '73%']
    ]
  },

  // Google Sheets Mock Data - Loss Prevention
  lossPreventionSummary: {
    result: [
      ['Category', '2021', '2022', '2023', '2024', '2025'],
      ['Inventory Shrinkage', '€150K', '€210K', '€680K', '€1.8M', '€2.2M'],
      ['Process Improvements', '€200K', '€280K', '€930K', '€2.76M', '€3.38M'],
      ['Total Impact', '€350K', '€490K', '€1.61M', '€4.56M', '€5.58M']
    ]
  },

  // Tasks
  tasks: [
    {
      id: 1,
      title: 'Complete Q1 Audit Report',
      description: 'Finalize and submit Q1 audit findings report',
      status: 'in_progress',
      priority: 'high',
      assignee: 'admin@democompany.com',
      due_date: '2025-02-28',
      created_by: 'admin@democompany.com',
      created_at: '2025-01-15T10:00:00Z'
    },
    {
      id: 2,
      title: 'Review IT Security Controls',
      description: 'Conduct comprehensive review of IT security measures',
      status: 'to_do',
      priority: 'medium',
      assignee: 'admin@democompany.com',
      due_date: '2025-03-15',
      created_by: 'admin@democompany.com',
      created_at: '2025-01-20T14:30:00Z'
    },
    {
      id: 3,
      title: 'Update Risk Register',
      description: 'Update quarterly risk register with new identified risks',
      status: 'completed',
      priority: 'medium',
      assignee: 'admin@democompany.com',
      due_date: '2025-01-31',
      created_by: 'admin@democompany.com',
      created_at: '2025-01-10T09:00:00Z'
    }
  ],

  // Overdue Actions
  getOverdueActions: function() {
    return this.generateFindingActions({ status: 'Overdue', limit: 42 });
  },

  // Upcoming Actions (within 30 days)
  getUpcomingActions: function() {
    const allActions = this.generateFindingActions({ status: 'Open', limit: 100 });
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);
    
    return allActions.filter(action => {
      const dueDate = new Date(action.dueDate);
      return dueDate >= now && dueDate <= thirtyDaysLater;
    }).slice(0, 35);
  },

  // Access Management Data (mirrors real project structure)
  accessManagement: {
    users: [
      { id: 1, email: 'mahmut@demo.com', name: 'Mahmut Uran', role: 'admin', status: 'active', department: 'Internal Audit' },
      { id: 2, email: 'mahmuturan44@gmail.com', name: 'Mahmut Uran (Email)', role: 'team', status: 'active', department: 'Audit Team' },
      { id: 3, email: 'donmezahmet@yandex.com', name: 'Ahmet Dönmez', role: 'team_manager', status: 'active', department: 'Audit Team' },
      { id: 4, email: 'director@democompany.com', name: 'Department Director', role: 'department_director', status: 'active', department: 'Operations' },
      { id: 5, email: 'ceo@democompany.com', name: 'CEO User', role: 'top_management', status: 'active', department: 'Executive' },
      { id: 6, email: 'manager@democompany.com', name: 'Management User', role: 'management', status: 'active', department: 'Management' }
    ],
    
    roles: [
      { id: 1, name: 'admin', description: 'Full access to all features' },
      { id: 2, name: 'team', description: 'Team member access' },
      { id: 3, name: 'team_manager', description: 'Team manager with same access as team' },
      { id: 4, name: 'top_management', description: 'Top management access' },
      { id: 5, name: 'department_director', description: 'Department director access' },
      { id: 6, name: 'management', description: 'Management level user access' }
    ],
    
    components: [
      { key: 'dashboard_page', name: 'Dashboard' },
      { key: 'my_actions_page', name: 'My Team Actions' },
      { key: 'department_actions_page', name: 'Department Actions' },
      { key: 'clevel_actions_page', name: 'C-Level Actions' },
      { key: 'all_findings_actions_page', name: 'All Findings & Actions' },
      { key: 'audit_plan_page', name: 'Audit Plan' },
      { key: 'risk_management_page', name: 'Risk Management' },
      { key: 'audit_maturity_page', name: 'Audit Maturity' },
      { key: 'task_manager', name: 'Task Manager' },
      { key: 'access_management', name: 'Access Management' },
      { key: 'send_email_button', name: 'Send Email' },
      { key: 'export_button', name: 'Export Data' }
    ],
    
    // Role-based permissions (matching real project)
    rolePermissions: {
      admin: {
        components: ['all'],
        interactiveComponents: ['all'],
        charts: ['all'],
        pages: ['all'],
        viewAsRoles: ['admin', 'team', 'team_manager', 'department_director', 'top_management', 'management']
      },
      team: {
        components: [
          'dashboard_page', 'my_actions_page', 'all_findings_actions_page', 
          'audit_plan_page', 'task_manager'
        ],
        interactiveComponents: [],
        charts: [
          'audit_findings_chart', 'audit_plan_chart', 'finding_actions_status_chart',
          'my_actions_chart'
        ],
        pages: ['dashboard', 'my-actions', 'all-findings-actions', 'audit-plan', 'tasks'],
        viewAsRoles: ['team']
      },
      team_manager: {
        components: [
          'dashboard_page', 'my_actions_page', 'all_findings_actions_page', 
          'audit_plan_page', 'task_manager'
        ],
        interactiveComponents: [],
        charts: [
          'audit_findings_chart', 'audit_plan_chart', 'finding_actions_status_chart',
          'my_actions_chart'
        ],
        pages: ['dashboard', 'my-actions', 'all-findings-actions', 'audit-plan', 'tasks'],
        viewAsRoles: ['team_manager', 'team']
      },
      department_director: {
        components: ['department_actions_page', 'my_actions_chart'],
        interactiveComponents: ['open_actions_button', 'overdue_actions_button'],
        charts: ['department_actions_chart', 'my_actions_chart'],
        pages: ['department-actions'],
        viewAsRoles: ['department_director']
      },
      top_management: {
        components: ['clevel_actions_page', 'audit_maturity_chart', 'fraud_impact_chart'],
        interactiveComponents: [],
        charts: ['audit_findings_chart', 'fraud_impact_chart', 'loss_prevention_chart', 'audit_maturity_chart'],
        pages: ['clevel-actions'],
        viewAsRoles: ['top_management']
      },
      management: {
        components: ['management_actions_page'],
        interactiveComponents: [],
        charts: [],
        pages: ['management-level-actions'],
        viewAsRoles: ['management']
      }
    }
  }
};

module.exports = mockData;

