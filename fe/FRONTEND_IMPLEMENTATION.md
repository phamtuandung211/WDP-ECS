# Eye Care System (ECS) - Frontend Implementation Guide

## Overview

This document describes the complete frontend implementation for the Eye Care System appointment management system. The system supports 4 user roles:

- **Customer** - Book and manage their appointments
- **Sale Staff** - Assign doctors and time slots to basic appointments
- **Doctor** - View their appointments and create medical records
- **Admin** - View statistics and analytics

---

## Architecture & File Structure

### Services Layer (`fe/src/services/`)

#### **apiClient.js**

- Base axios configuration
- JWT token interceptor
- 401 error handling → auto-logout

#### **index.js** - New Service Methods

```javascript
// Appointment Service
appointmentService.getAll(params?)        // Get my appointments
appointmentService.getById(id)            // Get appointment by ID
appointmentService.create(data)           // Create BASIC or ADVANCED
appointmentService.approve(id, data)      // Approve & assign (Staff)
appointmentService.cancel(id)             // Cancel appointment
appointmentService.getAllForStaff(params) // Get all (Staff/Doctor)

// Slot Service
slotService.getAvailable(params)          // Get available slots
```

**Note:** All methods include JWT token in Authorization header automatically.

### Components Layer (`fe/src/components/`)

#### **Customer Appointment Booking**

- `appointment/BasicAppointmentForm.jsx` - BASIC appointment form
  - Date selection (7 days advance max)
  - Optional notes
  - Auto-redirects to payment

- `appointment/AdvancedAppointmentForm.jsx` - ADVANCED appointment form
  - Doctor selection dropdown
  - Real-time slot loading by doctor/date
  - Shows remaining capacity (max 3 per slot)
  - Prevents full slot selection

#### **Customer Appointment Management**

- `pages/Appointments.jsx` - Main appointments page
  - Tabs: "My Appointments", "Book Basic", "Book Advanced"
  - Filter by status and type
  - Shows all appointment details
  - Cancel buttons for PENDING_PAYMENT and WAITING_ASSIGN
  - Payment countdown timer
  - Shows "Leave Feedback" button for COMPLETED

#### **Sale Staff Dashboard**

- `staff/SaleStaffAppointmentDashboard.jsx`
  - Shows WAITING_ASSIGN appointments list
  - Split-panel UI: left (appointments) + right (assignment form)
  - Doctor and slot selection for assignment
  - Status updates from WAITING_ASSIGN → CONFIRMED

#### **Doctor Dashboard**

- `doctor/DoctorAppointmentDashboard.jsx`
  - Shows only CONFIRMED appointments (doctor's own)
  - Filter by: Today, Week, Month
  - Patient information display
  - Medical record creation/editing form
  - Mark appointment as COMPLETED
  - Fields: symptoms, diagnosis, prescription, notes

#### **Admin Dashboard**

- `admin/AdminStatisticsDashboard.jsx`
  - Overview cards: Total, Confirmed, Completed, Revenue
  - Appointments trend chart
  - Revenue breakdown (Basic vs Advanced)
  - Top doctors by appointments & ratings
  - Status distribution pie/bar chart

#### **Appointment Tracking**

- `appointment/AppointmentTracking.jsx`
  - `<AppointmentPaymentCountdown/>` - 15-min countdown timer
  - `useAppointmentStatus()` - Auto-refresh hook
  - `usePaymentExpiration()` - Payment deadline hook

#### **Role-Based Dashboard Router**

- `RoleBasedDashboard.jsx`
  - Routes to appropriate dashboard based on user role
  - Handles unknown roles gracefully

### Constants Layer (`fe/src/constants/`)

#### **appointment.js** - New

```javascript
APPOINTMENT_TYPE; // { BASIC, ADVANCED }
APPOINTMENT_STATUS; // { PENDING_PAYMENT, WAITING_ASSIGN, CONFIRMED, COMPLETED, CANCELED }
APPOINTMENT_PRICE; // { BASIC: 100000, ADVANCED: 200000 }
STATUS_LABELS; // Display labels for each status
STATUS_COLORS; // Tailwind color classes for each status
PAYMENT_TIMEOUT_MINUTES; // 15
MAX_BOOKING_ADVANCE_DAYS; // 7
```

---

## Workflow Diagrams

### BASIC Appointment Flow

```
Customer
  ↓
Select Date (7 days max)
  ↓
Create Appointment (Status: PENDING_PAYMENT)
  ↓
Complete Payment (15-min timeout)
  ↓
Payment Expires? → Auto-Cancel (Cron job)
  ↓
Sale Staff Views WAITING_ASSIGN
  ↓
Assign Doctor + Time Slot
  ↓
Appointment → CONFIRMED
```

### ADVANCED Appointment Flow

```
Customer
  ↓
Select Doctor (from dropdown)
  ↓
Select Date (7 days max)
  ↓
Select Slot (shows remaining capacity)
  ↓
Create Appointment (Status: CONFIRMED immediately)
  ↓
Doctor Views & Manages
```

### Sale Staff Workflow

```
View WAITING_ASSIGN appointments
  ↓
Select appointment
  ↓
Select Doctor & Slot
  ↓
Click Approve & Assign
  ↓
Status: CONFIRMED
  ↓
Doctor sees appointment
```

### Doctor Workflow

```
View CONFIRMED appointments (Today/Week/Month)
  ↓
Click appointment
  ↓
View patient information
  ↓
Create/Edit medical record
  ↓
Mark as COMPLETED
```

### Admin Workflow

```
View Overview (Total, Confirmed, Completed, Revenue)
  ↓
Select date range (Week/Month/Year)
  ↓
View appointment trends
  ↓
View revenue breakdown
  ↓
View doctor rankings
```

---

## Integration Steps

### 1. Update App.jsx Routes

```jsx
import RoleBasedDashboard from "./components/RoleBasedDashboard";

// Add route
<Route path="/appointments" element={<RoleBasedDashboard />} />;
```

### 2. Update Navigation Menu

```jsx
// Add to navbar/sidebar for authenticated users
<Link to="/appointments">My Dashboard</Link>
```

### 3. Environment Variables

Ensure `.env` has:

```
VITE_API_URL=http://localhost:5000/api
```

### 4. Install Dependencies (if needed)

```bash
# All required dependencies should already be in package.json
npm install
```

---

## Component API Reference

### BasicAppointmentForm

```jsx
<BasicAppointmentForm onSuccess={(apt) => handleSuccess(apt)} />

Props:
- onSuccess: (appointment) => void  // Called when appointment created
```

### AdvancedAppointmentForm

```jsx
<AdvancedAppointmentForm onSuccess={(apt) => handleSuccess(apt)} />

Props:
- onSuccess: (appointment) => void
```

### AppointmentPaymentCountdown

```jsx
<AppointmentPaymentCountdown
  appointment={apt}
  onStatusChange={(updated) => handleChange(updated)}
  onExpire={(apt) => handleExpire(apt)}
  showCountdown={true}
/>

Props:
- appointment: Appointment object
- onStatusChange: (appointment) => void
- onExpire: (appointment) => void
- showCountdown: boolean
```

### useAppointmentStatus Hook

```jsx
const { appointment, loading, error, refresh } = useAppointmentStatus(
  appointmentId,
  {
    refreshInterval: 30000, // milliseconds
    autoRefresh: true,
    onStatusChange: (updated) => {},
  },
);
```

### usePaymentExpiration Hook

```jsx
usePaymentExpiration(appointment, (apt) => {
  // Called when payment expires
  handleExpiration(apt);
});
```

---

## Backend API Endpoints Used

### Appointment Endpoints

- `POST /api/appointments` - Create (Customer)
- `GET /api/appointments` - Get my appointments (Customer)
- `GET /api/appointments/:id` - Get by ID (all roles)
- `POST /api/appointments/:id/approve` - Approve & assign (Staff)
- `POST /api/appointments/:id/cancel` - Cancel (Customer)
- `GET /api/appointments/staff` - Get all (Staff/Doctor)

### Slot Endpoints

- `GET /api/slots?date=YYYY-MM-DD&doctorId=&type=` - Get available (Customer)

### Medical Record Endpoints

- `POST /api/medical-records` - Create (Doctor)
- `GET /api/medical-records/appointment/:appointmentId` - Get by apt (Doctor)
- `PUT /api/medical-records/:id` - Update (Doctor)

### Statistics Endpoints

- `GET /api/statistics/overview?range=month` - Overview (Admin)
- `GET /api/statistics/appointments?range=month` - Trends (Admin)
- `GET /api/statistics/doctors?range=month` - Doctor stats (Admin)
- `GET /api/statistics/feedbacks?range=month` - Feedback (Admin)

---

## Business Logic Implementation

### Appointment Validation

- **Date validation**: Must be 0-7 days from today
- **Time slot validation**: 30-min slots, 07:30-12:00 & 13:30-17:00
- **Capacity check**: Max 3 customers per slot
- **Payment timeout**: 15 minutes from creation
- **One BASIC per day**: Customer can't have 2 BASIC on same day

### Status Transitions

```
BASIC Flow:
PENDING_PAYMENT (payment) → CONFIRMED

ADVANCED Flow:
CONFIRMED (directly after creation)

Final States:
COMPLETED → Customer can leave feedback
CANCELED → Can't be reactivated
```

### Slot Availability Logic

```javascript
// Slot is FULL when bookedCount >= maxPatients
// When ADVANCED appointment booked → isExclusive = true
// When last slot booked → status = BOOKED
// Frontend filters out FULL slots in selection
```

---

## Error Handling

### Global Error Handling

1. 401 Unauthorized → Auto-logout, redirect to login
2. 403 Forbidden → Show "Access Denied" alert
3. 400 Bad Request → Show validation error message
4. 409 Conflict → Show "Already has appointment on this date"
5. 500 Server Error → Show "Something went wrong" alert

### Component-Level Errors

Each form component has:

- Try-catch blocks in submit handlers
- Error state display via `<Alert type="error" />`
- Loading state management
- Success confirmation messages

---

## Performance Optimizations

1. **Lazy Loading**: Components are lazy-loaded by role
2. **Polling**: Doctor & Admin dashboards auto-refresh
3. **Memoization**: Use `React.memo()` for large lists
4. **Debouncing**: Date/doctor changes trigger slot fetch once
5. **Caching**: Appointment list cached until user refetches

---

## Testing Scenarios

### Customer - BASIC Appointment

1. Navigate to Appointments → "Book Basic" tab
2. Select date within 7 days
3. Add optional notes
4. Click "Create Appointment"
5. Should show "Waiting for Payment" status
6. 15-min countdown timer appears
7. After 15 min, auto-cancels (backend cron)

### Customer - ADVANCED Appointment

1. Navigate to Appointments → "Book Advanced" tab
2. Select doctor from dropdown
3. Select date within 7 days
4. Select time slot (must show available slots)
5. Click "Book Appointment"
6. Should show "Confirmed" status immediately

### Staff - Assign Appointment

1. Navigate to Staff Dashboard
2. See list of WAITING_ASSIGN appointments
3. Click appointment
4. Select doctor and time slot
5. Click "Approve & Assign"
6. Appointment status → CONFIRMED

### Doctor - View Appointments

1. Navigate to Doctor Dashboard
2. Select "Today" tab
3. See list of CONFIRMED appointments
4. Click appointment
5. Add medical record (symptoms, diagnosis, etc.)
6. Click "Save Record"
7. Click "Mark as Completed"

### Admin - View Statistics

1. Navigate to Admin Dashboard
2. Select date range (Week/Month/Year)
3. See overview cards (Total, Confirmed, Revenue)
4. See appointment trend chart
5. See top doctors by appointments
6. See revenue breakdown

---

## Known Limitations & TODOs

### Not Yet Implemented

1. ❌ Payment processing integration (PayOS)
2. ❌ Email notifications for appointment updates
3. ❌ SMS reminders for upcoming appointments
4. ❌ Feedback form & rating system
5. ❌ Doctor schedule/availability management
6. ❌ Appointment rescheduling
7. ❌ Recurring appointments
8. ❌ Real-time notifications (WebSocket)

### TODO in Code

- `SaleStaffAppointmentDashboard.jsx`: Line 60 - Replace doctor input with dropdown via API
- `DoctorAppointmentDashboard.jsx`: Line 152 - Add API endpoint for marking completed
- `Appointments.jsx`: Line 325 - Navigate to feedback form on button click

---

## Debugging Tips

### Check Console Errors

```javascript
// Enable verbose logging
localStorage.setItem("debug", "true");
```

### Check Network Requests

1. Open DevTools → Network tab
2. Filter by XHR
3. Check request headers: Authorization bearer token
4. Check response status: 200/201 (success), 400/401/500 (error)

### Check Storage

```javascript
// View stored data
console.log(localStorage.getItem("token"));
console.log(localStorage.getItem("user"));
```

### Common Issues

| Issue                       | Solution                                          |
| --------------------------- | ------------------------------------------------- |
| "404 Not Found" on API call | Check backend is running on correct port          |
| "401 Unauthorized"          | Token expired, re-login required                  |
| "Empty appointments list"   | Check filters aren't too restrictive              |
| "Slots not loading"         | Verify date is within 7 days and doctor selected  |
| "Can't cancel appointment"  | Can only cancel PENDING_PAYMENT or WAITING_ASSIGN |

---

## File Summary

| File                                               | Lines | Purpose                                |
| -------------------------------------------------- | ----- | -------------------------------------- |
| services/index.js                                  | +40   | New appointment & slot service methods |
| constants/appointment.js                           | 30    | Appointment enums & constants          |
| components/RoleBasedDashboard.jsx                  | 50    | Role-based routing                     |
| components/appointment/BasicAppointmentForm.jsx    | 120   | BASIC booking form                     |
| components/appointment/AdvancedAppointmentForm.jsx | 250   | ADVANCED booking form                  |
| components/appointment/AppointmentTracking.jsx     | 180   | Payment countdown & hooks              |
| components/staff/SaleStaffAppointmentDashboard.jsx | 280   | Staff assignment UI                    |
| components/doctor/DoctorAppointmentDashboard.jsx   | 340   | Doctor dashboard                       |
| components/admin/AdminStatisticsDashboard.jsx      | 320   | Admin statistics                       |
| pages/Appointments.jsx                             | 320   | Customer appointments page             |

**Total: ~1,900 lines of new frontend code**

---

## Quick Start

1. **Ensure backend is running**

   ```bash
   cd be && npm start
   ```

2. **Install frontend dependencies**

   ```bash
   cd fe && npm install
   ```

3. **Start frontend development server**

   ```bash
   npm run dev
   ```

4. **Access at** `http://localhost:5173`

5. **Login with test account**
   - Email: customer@example.com
   - Password: (check .env or registration)

6. **Navigate to /appointments to see dashboard**
   - Customer sees booking tabs
   - Staff sees assignment screen
   - Doctor sees appointment list
   - Admin sees statistics

---

## Support & Contact

For issues or questions about this implementation:

1. Check the TODOs section above
2. Review backend API documentation
3. Check console for error messages
4. Verify network requests in DevTools
