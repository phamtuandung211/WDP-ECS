# WDP-ECS Frontend

Modern React + Vite frontend for the Eye Clinic Appointment Management System.

## Structure

```
src/
├── components/       # Reusable UI components
├── context/         # React Context (Auth)
├── pages/           # Page components
├── services/        # API clients
├── styles.css       # Global styles
├── App.jsx          # Main app
└── main.jsx         # Entry point
```

## Setup

1. Copy `.env.example` to `.env` and set `VITE_API_URL`:

```
VITE_API_URL=http://localhost:5000/api
```

2. Install dependencies:

```bash
cd fe
npm install
```

3. Start dev server:

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Build

```bash
npm run build
```

Outputs to `dist/`

## Features

- **Auth Context**: Centralized authentication state
- **Protected Routes**: Login guard for appointments
- **API Service**: Axios client with interceptors
- **Components**: Reusable UI components (Button, Input, Card, Alert, etc.)
- **Responsive**: Mobile-friendly design
- **Pages**: Home, Services, Login, Appointments

## API Endpoints

- `GET /` - Health check
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/services` - List services
- `GET /api/appointments` - List user appointments
- `POST /api/appointments` - Create appointment

See backend README for full API docs.
