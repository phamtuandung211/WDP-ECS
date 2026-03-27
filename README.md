# WDP-ECS

Eye Clinic Appointment Management System built with React, Express, and MongoDB.

## Overview

WDP-ECS is a full-stack clinic platform for booking and managing eye-care appointments.

Main capabilities:

- Authentication and role-based access control
- Basic and advanced appointment booking flows
- Slot management and staff assignment
- Payment integration
- Medical records and feedback management
- Blog/service administration
- Real-time chat (Socket.IO)

## Tech Stack

### Backend

- Node.js (ES Modules)
- Express.js
- MongoDB + Mongoose
- JWT, bcryptjs, validator
- Socket.IO, node-cron

### Frontend

- React 18
- Vite
- React Router v6
- Axios
- TailwindCSS + CSS

## Repository Structure

```text
WDP-ECS/
|-- be/                     # Backend API
|   |-- src/
|   |   |-- config/
|   |   |-- constants/
|   |   |-- controllers/
|   |   |-- cron/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   `-- index.js
|   `-- package.json
|-- fe/                     # Frontend app
|   |-- src/
|   |   |-- components/
|   |   |-- constants/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   `-- services/
|   `-- package.json
`-- README.md
```

## Prerequisites

- Node.js 16+
- npm 8+
- MongoDB (Atlas or local)

## Quick Start

### 1. Backend

```bash
cd be
npm install
cp .env.example .env
```

If you are on Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wdp-ecs
JWT_SECRET=your_secret_key
NODE_ENV=development
```

Run backend:

```bash
npm run dev
```

Backend URL:

- API base: `http://localhost:5000/api`
- Health check: `http://localhost:5000/`

### 2. Frontend

```bash
cd fe
npm install
cp .env.example .env
```

If you are on Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Set frontend env:

```env
VITE_API_URL=http://localhost:5000/api
```

Run frontend:

```bash
npm run dev
```

Frontend URL:

- App: `http://localhost:3000`

## Scripts

### Backend (`be/package.json`)

- `npm run dev`: start with nodemon
- `npm start`: run production mode

### Frontend (`fe/package.json`)

- `npm run dev`: start Vite dev server (port 3000)
- `npm run build`: build production bundle
- `npm run preview`: preview build output

## Main API Groups

The backend currently mounts these route groups:

- `/api/auth`
- `/api/user`
- `/api/roles`
- `/api/manage-services`
- `/api/services`
- `/api/manage-blogs`
- `/api/blogs`
- `/api/appointments`
- `/api/payments`
- `/api/slots`
- `/api/doctors`
- `/api/specializations`
- `/api/medical-records`
- `/api/feedbacks`
- `/api/statistics`
- `/api/upload`
- `/api/degrees`
- `/api/certificates`
- `/api/chat`

## User Roles

- Admin
- Doctor
- Sale Staff
- Customer
- Support

## Notes

- Keep secrets only in `.env` files (never commit real secrets).
- Use `.env.example` as the template for team onboarding.
- Follow conventional commits and open PRs with clear scope.

## Related Docs

- [be/README.md](be/README.md)
- [fe/README.md](fe/README.md)
- [be/MONGODB_SETUP.md](be/MONGODB_SETUP.md)

---

Last updated: 2026-03-27
