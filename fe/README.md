# WDP-ECS Frontend

Modern React + Vite frontend for the Eye Clinic Appointment Management System.

**Note:** this version uses hard‑coded mock data and TailwindCSS via CDN; it does not perform any real API calls. It's intended as a static UI prototype / design showcase.

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

## Setup (Static Prototype)

No backend is required – all pages use mock data defined in `src/mockData.js` and styling relies on the Tailwind CSS CDN included in `index.html`.

1. Install dependencies (only build tooling):

```bash
cd fe
npm install
```

2. Start dev server:

```bash
npm run dev
```

Server runs on `http://localhost:3000`.

You may also rebuild for production with `npm run build`.

## Build

```bash
npm run build
```

Outputs to `dist/`

## Features

- **Static Mock UI** – all data (doctors, services, blogs) are hard‑coded in `src/mockData.js`.
- **Tailwind CSS CDN** – layout and utility classes provided via `<script src="https://cdn.tailwindcss.com"></script>` in `index.html`.
- **Branding**: drop your logo image into `public/logo.png` or `public/logo.svg` and header/hero will display it.
- **Simple Navigation**: Home, Services, Blogs, Doctors with static detail pages.
- **Forms**: Login/Register/Verify pages show non‑functional dummy forms for demonstration.
- **Responsive**: Designs are mobile friendly thanks to Tailwind's responsive utilities.

## API Endpoints

- `GET /` - Health check
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/services` - List services
- `GET /api/appointments` - List user appointments
- `POST /api/appointments` - Create appointment

See backend README for full API docs.
