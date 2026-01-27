# WDP-ECS Backend API

Express.js + MongoDB backend for the Eye Clinic Appointment Management System.

## Structure

```
src/
├── config/         # Database config
├── middleware/     # Auth, error handling
├── models/         # MongoDB schemas
├── routes/         # API endpoints
├── utils/          # Validators, helpers
└── index.js        # Entry point
```

## Setup

### 1. MongoDB

**Online (Atlas):**

- Create free cluster at https://www.mongodb.com/cloud/atlas
- Copy connection string
- Set in `.env` as `MONGODB_URI`

**Local:**

- Install MongoDB Community
- Start: `mongod`
- Auto-fallback: `mongodb://localhost:27017/wdp-ecs`

See [MONGODB_SETUP.md](MONGODB_SETUP.md) for details.

### 2. Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Set:

```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wdp-ecs
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### 3. Install & Run

```bash
npm install
npm run dev
```

API runs on `http://localhost:5000`

## API Endpoints

### Auth

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/profile` — Get profile (auth required)

### Services

- `GET /api/services` — List services
- `GET /api/services/:id` — Get service
- `POST /api/services` — Create (admin/sale)
- `PUT /api/services/:id` — Update (admin/sale)

### Appointments

- `GET /api/appointments` — List user appointments (auth)
- `POST /api/appointments` — Create appointment (auth)
- `PUT /api/appointments/:id` — Update appointment (auth)
- `DELETE /api/appointments/:id` — Cancel appointment (auth)

## Models

- **User** — Customers, doctors, admin, sales staff, support
- **Service** — Eye care services
- **Appointment** — Booking, scheduling, payment status
- **MedicalRecord** — Doctor notes, diagnosis, prescription

## Roles

- `admin` — Full access
- `sale` — Manage services, campaigns
- `doctor` — View/update medical records
- `customer` — Book appointments
- `support` — Support staff
- `guest` — Browse only

## Development

- `npm run dev` — Dev server with auto-reload
- JWT auth required for protected routes
- Passwords hashed with bcryptjs
- Middleware: auth, error handling, CORS

## Notes

- Passwords must be 6+ characters
- Email must be unique
- MongoDB Atlas free tier: 512MB storage, 3 shared nodes
