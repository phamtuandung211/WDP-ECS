# WDP-ECS - Eye Clinic Appointment Management System

**Syllabus ID:** 12037 | **Code:** WDP301 | **Credits:** 3 | **Level:** Bachelor

Modern full-stack web application for managing eye clinic appointments with React, Node.js, Express, and MongoDB.

## Project Overview

WDP-ECS (Web Development Project - Eye Clinic System) is a comprehensive appointment management platform for eye clinics. Built with modern web technologies, it supports multiple user roles (admin, doctor, staff, customer, support) with features for appointment booking, medical records, service management, and payments.

## Tech Stack

### Backend

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB (Online: Atlas / Local)
- **Auth:** JWT (JSON Web Tokens)
- **Validation:** Validator.js, bcryptjs

### Frontend

- **Framework:** React 18
- **Build:** Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** CSS3

## Project Structure

```
WDP-ECS/
├── be/                          # Backend API
│   ├── src/
│   │   ├── config/             # Database config
│   │   ├── middleware/         # Auth, error handling
│   │   ├── models/             # MongoDB schemas
│   │   ├── routes/             # API endpoints
│   │   ├── utils/              # Validators, helpers
│   │   └── index.js            # Entry point
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md
│   └── MONGODB_SETUP.md
│
├── fe/                          # Frontend App
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Auth context
│   │   ├── pages/              # Page components
│   │   ├── services/           # API clients
│   │   ├── styles.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   ├── .gitignore
│   └── README.md
│
├── docker-compose.yml          # Docker setup
├── .gitignore                  # Root gitignore
├── .gitattributes              # Line endings
└── README.md                   # This file
```

## Quick Start

### Prerequisites

- Node.js 16+
- MongoDB (local or Atlas online)

### Backend Setup

```bash
cd be
cp .env.example .env
# Update .env with MongoDB URI and JWT_SECRET
npm install
npm run dev
```

Server runs on `http://localhost:5000`

See [be/README.md](be/README.md) and [be/MONGODB_SETUP.md](be/MONGODB_SETUP.md) for details.

### Frontend Setup

```bash
cd fe
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

App runs on `http://localhost:3000`

See [fe/README.md](fe/README.md) for details.

### Docker Setup (Optional)

```bash
docker-compose up
```

- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:3000
- **MongoDB:** localhost:27017

## Key Features

### User Roles

- **Admin:** System management, approve staff
- **Doctor:** View/update medical records, schedules
- **Sales Staff:** Manage services, campaigns, discounts
- **Customer:** Book appointments, view records
- **Support:** Handle inquiries, manage reviews
- **Guest:** Browse services, blog posts

### Core Functions

- Account management (registration, login, JWT auth)
- Service package management
- Appointment booking & scheduling
- Medical record tracking
- Payment processing
- Feedback & reviews
- Blog/content management
- Admin dashboard & reports

## API Endpoints

| Method | Endpoint                | Description                 |
| ------ | ----------------------- | --------------------------- |
| POST   | `/api/auth/register`    | Register new user           |
| POST   | `/api/auth/login`       | Login & get JWT token       |
| GET    | `/api/services`         | List services               |
| POST   | `/api/services`         | Create service (admin/sale) |
| GET    | `/api/appointments`     | List user appointments      |
| POST   | `/api/appointments`     | Create appointment          |
| PUT    | `/api/appointments/:id` | Update appointment          |

See [be/README.md](be/README.md) for complete API docs.

## Environment Variables

### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wdp-ecs
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
```

## Team Requirements

- **Team Size:** 3-5 members
- **Git:** GitLab for version control
- **Project Management:** OneDrive for documents
- **Attendance:** Min 80% contact hours
- **Deliverables:** Code + Project docs + Presentation

## Development Guidelines

- Use Git for collaboration
- Follow conventional commits
- Regular code reviews
- Test endpoints before merging
- Update documentation
- Use `.env.example` for config template

## Useful Commands

**Backend:**

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with auto-reload
```

**Frontend:**

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

**Docker:**

```bash
docker-compose up    # Start all services
docker-compose down  # Stop services
```

## Database Models

- **User** — Authentication, profiles, roles
- **Service** — Eye care services offered
- **Appointment** — Booking, scheduling, status
- **MedicalRecord** — Doctor notes, diagnosis, prescription

## Security Notes

- Passwords hashed with bcryptjs
- JWT tokens expire in 7 days
- CORS enabled for cross-origin requests
- Environment variables for sensitive data
- Role-based access control (RBAC)

## Deployment

- **Backend:** Node.js hosting (Heroku, Railway, Render)
- **Frontend:** Static hosting (Vercel, Netlify, GitHub Pages)
- **Database:** MongoDB Atlas (cloud)

## References

- [Express.js Docs](https://expressjs.com)
- [React Docs](https://react.dev)
- [MongoDB Docs](https://docs.mongodb.com)
- [Vite Docs](https://vitejs.dev)

## Contact & Support

For course information, see [FPT University WDP301](https://fpt.edu.vn)

---

**Last Updated:** January 27, 2026  
**Status:** Development
