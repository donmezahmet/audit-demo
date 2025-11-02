# 📊 Audit Dashboard Demo

A fully functional demo version of the Audit Dashboard application. This version uses **mock data only** - no database, no external APIs, perfect for demonstration and testing purposes.

## ✨ Features

- ✅ **No Database Required** - All data is mocked
- ✅ **No External APIs** - No Jira, Google Sheets, or SendGrid integration
- ✅ **Simple Authentication** - Login with `admin/admin`
- ✅ **All Pages Functional** - Dashboard, Audit Plan, Risk Management, Task Manager, etc.
- ✅ **Interactive Charts** - All visualizations work with realistic dummy data
- ✅ **Full Filtering** - Year filters, status filters, all work as expected
- ✅ **Different Ports** - Runs on ports 3001 (backend) and 5174 (frontend) to avoid conflicts

## 🚀 Quick Start

### Prerequisites

- Node.js v16 or higher
- npm or yarn

### Installation

1. **Install Backend Dependencies**
```bash
npm install
```

2. **Install Frontend Dependencies**
```bash
cd client
npm install
cd ..
```

### Running the Application

**Option 1: Run Both Servers Separately (Recommended for Development)**

Terminal 1 - Backend:
```bash
npm start
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

**Option 2: Production Build**

```bash
cd client
npm run build
cd ..
npm start
```


## 📁 Project Structure

```
audit-project-demo/
├── server.js           # Express backend with mock endpoints
├── mockData.js         # All mock data definitions
├── config.js           # Configuration (ports, settings)
├── database.js         # Empty (no DB in demo)
├── package.json        # Backend dependencies
└── client/             # React frontend
    ├── src/
    │   ├── pages/      # All dashboard pages
    │   ├── components/ # Reusable components
    │   ├── services/   # API services
    │   ├── hooks/      # Custom React hooks
    │   └── store/      # State management
    ├── package.json    # Frontend dependencies
    └── vite.config.ts  # Vite configuration
```

## 🌐 Available Pages

- **Dashboard** - Overview with charts and KPIs
- **My Actions** - User-specific action items
- **Department Actions** - Department-level view
- **C-Level Actions** - Executive-level actions
- **All Findings & Actions** - Complete list of findings
- **Audit Plan** - Yearly audit planning
- **Risk Management** - Risk assessment and tracking
- **Audit Maturity** - Maturity assessment radar charts
- **Task Manager** - Task CRUD operations
- **Access Management** - User permissions (admin only)

## 🎯 Mock Data Highlights

- **Audit Projects**: 2021-2025 data
- **Finding Actions**: 200+ realistic actions with various statuses
- **Financial Impact**: Fraud and Loss Prevention data
- **Maturity Scores**: 2024 vs 2025 comparison
- **Risk Distributions**: By control element and risk type
- **Action Aging**: Overdue, upcoming, and open actions

## 📧 Email Functionality (Demo Mode)

**Important:** Emails are NOT actually sent in demo mode!

- ✅ **UI Fully Functional** - Email modal, dropdowns, all work perfectly
- ✅ **Console Logging** - Email details are logged to backend console
- ❌ **No SendGrid** - No actual email delivery (no API key)
- 📝 **Test Emails Available:**


When you click "Send Email", a **preview modal** will open showing exactly how the email would look. This provides a realistic demo experience without actually sending emails.

**Preview Modal Features:**
- Shows recipient list
- Displays email subject and content
- Indicates bulk send mode if enabled
- Clear "Demo Mode" warnings
- Professional email template preview

## 🔧 Configuration

All settings are in `config.js`:
- Backend Port: `3001`
- Frontend Port: `5174`
- Session Secret: Pre-configured
- No environment variables needed



## 🔒 Security Notes

⚠️ **This is a demo version**:
- Passwords are stored in plain text (admin/admin)
- No production-grade security measures
- Mock data only, no real user information
- Not suitable for production use without security enhancements

## 🆚 Differences from Original

| Feature | Original | Demo |
|---------|----------|------|
| Database | PostgreSQL | None (mock data) |
| Authentication | Google OAuth | **/** |
| External APIs | Jira, Google Sheets | None (mock) |
| Email | SendGrid | Console log only |
| Ports | **/** |
| Data | Real from APIs | Realistic mock data |

## 📦 Dependencies

### Backend
- Express.js - Web framework
- cookie-session - Session management
- cors - CORS handling
- bcrypt - Password hashing (not used in demo)

### Frontend
- React 18 - UI framework
- TypeScript - Type safety
- Chart.js - Data visualization
- React Query - Data fetching
- Zustand - State management
- Tailwind CSS - Styling
