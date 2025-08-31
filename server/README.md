
# CRM Server (Node + Express + MySQL + Sequelize) with RBAC

Endpoints match the client:
- `POST /api/auth/register`  → `{ token, user }`
- `POST /api/auth/login`     → `{ token, user }`
- `GET  /api/auth/me`
- `GET  /api/dashboard`
- CRUD: `/api/companies`, `/api/contacts`, `/api/deals`, `/api/activities`

## Quick Start

1. Create `.env` from example and set DB credentials
```
cp .env.example .env
# edit values
```

2. Install deps and run
```
npm i
npm run start   # or npm run dev
```

3. First boot seeds **Admin** user:
```
email: admin@example.com
pass : admin123
```
Login from client, token is required for all non-auth routes.

## Notes
- RBAC is enforced via `middleware/rbac.js`
- Pagination: `?page=1&limit=10&search=foo`
- MySQL tables are auto-synced (Sequelize `sync()`); switch to migrations if needed.
