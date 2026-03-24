# ProcureEng - Procurement & Project Management System

A full-stack web application for engineering firms to manage procurement, projects, and material tracking.

## Features

### Core Modules
- **Item Database** - Full CRUD with multiple suppliers per item, pricing, and lead times
- **Supplier Management** - Track supplier contacts, link items with pricing
- **Order System** - Create orders, assign to procurement, track through delivery
- **Project Module** - Create projects with Bill of Materials (BOM), generate material lists
- **Status Tracking** - Order pipeline: Pending → Ordered → Shipped → Delivered
- **Dashboard** - KPIs, order charts, project readiness, overdue alerts

### User Roles
| Role | Capabilities |
|------|-------------|
| **Sales** | View all, create projects & orders |
| **Engineer** | View all, manage items & BOMs, create orders |
| **Procurement** | Full access: manage suppliers, assign orders, update statuses |

## Tech Stack
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS v4, Custom UI components
- **Backend**: Node.js, Express, SQLite (sql.js)
- **Auth**: JWT-based with role-based access control
- **Charts**: Recharts

## Getting Started

### Prerequisites
- Node.js 18+

### Installation
```bash
git clone https://github.com/shimoli007/procurement-project-mgmt-engineering.git
cd procurement-project-mgmt-engineering
npm install
```

### Seed the Database
```bash
npm run db:seed
```

### Run Development Servers
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Sales | alice@company.com | password123 |
| Engineer | bob@company.com | password123 |
| Procurement | carol@company.com | password123 |

## Project Structure
```
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI & feature components
│       ├── context/        # Auth context
│       ├── hooks/          # Data fetching hooks
│       ├── pages/          # Route pages
│       └── types/          # TypeScript interfaces
├── server/                 # Express backend
│   └── src/
│       ├── controllers/    # Business logic
│       ├── db/             # Schema, connection, seeds
│       ├── middleware/      # Auth & RBAC
│       ├── routes/         # API route definitions
│       └── utils/          # JWT, error handling
└── package.json            # Workspace root
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

### Items & Suppliers
- `GET/POST /api/items` - List/Create items
- `GET/PATCH/DELETE /api/items/:id` - Item CRUD
- `GET/POST/DELETE /api/items/:id/suppliers` - Item-supplier links
- `GET/POST /api/suppliers` - List/Create suppliers

### Orders
- `GET/POST /api/orders` - List/Create orders
- `PATCH /api/orders/:id/status` - Update order status

### Projects
- `GET/POST /api/projects` - List/Create projects
- `GET/POST /api/projects/:id/bom` - BOM management
- `POST /api/projects/:id/generate-orders` - Generate orders from BOM
- `GET /api/projects/:id/material-list` - Material readiness report

### Dashboard
- `GET /api/dashboard/summary` - KPI summary
- `GET /api/dashboard/recent-orders` - Latest orders
- `GET /api/dashboard/project-readiness` - Project readiness data

## Roadmap
- **Phase 1** ✅ Full working application with clean interface
- **Phase 2** 🔜 Production database optimization (PostgreSQL migration)
- **Phase 3** 🔜 AI-powered insights + SaaS multi-tenancy
