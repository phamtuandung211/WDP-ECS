# Frontend Integration Checklist

## Pre-Integration Review

- ✅ All service methods are defined in `fe/src/services/index.js`
- ✅ All constants are defined in `fe/src/constants/appointment.js`
- ✅ All components are created and tested
- ✅ README documentation is complete

---

## Step-by-Step Integration Guide

### Phase 1: Service Layer Integration

- [ ] Review `fe/src/services/index.js`
  - Verify `appointmentService` has all CRUD methods
  - Verify `slotService` has `getAvailable()` method
  - Check API base URL in `apiClient.js` matches backend

- [ ] Test API connection
  ```bash
  # In browser console, after login
  const { appointmentService } = await import('./services.js');
  appointmentService.getAll().then(r => console.log(r));
  ```

### Phase 2: Routing & Navigation

- [ ] Update `App.jsx` with new routes

  ```jsx
  import RoleBasedDashboard from './components/RoleBasedDashboard';

  // Add this route
  <Route path="/dashboard" element={<RoleBasedDashboard />} />
  // or replace existing appointments route
  <Route path="/appointments" element={<RoleBasedDashboard />} />
  ```

- [ ] Update navbar/menu links

  ```jsx
  <nav>{user && <Link to="/appointments">My Dashboard</Link>}</nav>
  ```

- [ ] Test navigation
  - Login as customer → Should see "Book Appointment" tabs
  - Login as staff → Should see "Assignment Dashboard"
  - Login as doctor → Should see "My Appointments"
  - Login as admin → Should see "Statistics Dashboard"

### Phase 3: Customer Features

- [ ] Test BASIC Appointment Booking
  1. Navigate to `/appointments`
  2. Click "Book Basic" tab
  3. Select date (must be within 7 days)
  4. Add optional notes
  5. Click "Create Appointment"
  6. Verify:
     - ✅ Success message appears
     - ✅ Tab switches to "My Appointments"
     - ✅ Payment countdown timer shows (15 min)
     - ✅ Status is "Waiting for Payment"

- [ ] Test ADVANCED Appointment Booking
  1. Click "Book Advanced" tab
  2. Select doctor from dropdown
  3. Select date (must be within 7 days)
  4. Wait for slots to load
  5. Select available time slot
  6. Click "Book Appointment"
  7. Verify:
     - ✅ Success message appears
     - ✅ Appointment shows as "Confirmed"
     - ✅ Doctor and time slot are populated
     - ✅ NO payment countdown (ADVANCED is direct confirmation)

- [ ] Test Appointment Viewing
  1. Click "My Appointments" tab
  2. Verify all appointments display:
     - ✅ Type (BASIC/ADVANCED)
     - ✅ Status badge (color-coded)
     - ✅ Date and time
     - ✅ Doctor name (if assigned)
     - ✅ Notes (if exists)

- [ ] Test Filtering
  1. Use Status filter dropdown
  2. Should show only selected status
  3. Use Type filter
  4. Should toggle between BASIC/ADVANCED/All

- [ ] Test Cancellation
  1. Find PENDING_PAYMENT appointment
  2. Click "Cancel" button
  3. Confirm in dialog
  4. Verify:
     - ✅ Status changes to "Canceled"
     - ✅ Cancel button disappears
     - ✅ Cannot re-activate canceled appointment

### Phase 4: Sale Staff Features

- [ ] Test Staff Dashboard Access
  1. Login as staff
  2. Should see "Appointment Assignment Dashboard"
  3. Verify:
     - ✅ Left panel shows WAITING_ASSIGN appointments
     - ✅ Right panel (empty until selection)

- [ ] Test Appointment Selection
  1. Click on appointment in left panel
  2. Should highlight
  3. Right panel should populate with:
     - ✅ Customer name, phone, email
     - ✅ Appointment notes
     - ✅ Input fields for doctor & slot selection

- [ ] Test Doctor & Slot Assignment
  1. Select an appointment
  2. Enter doctor ID in "Assign Doctor" field
     - ⚠️ TODO: Replace with dropdown from backend
  3. Select date if BASIC appointment
  4. Wait for slots to load
  5. Select time slot
  6. Click "Approve & Assign"
  7. Verify:
     - ✅ Success message
     - ✅ Appointment removed from list
     - ✅ Status changed to CONFIRMED

### Phase 5: Doctor Features

- [ ] Test Doctor Dashboard Access
  1. Login as doctor
  2. Should see "My Appointments"
  3. Verify:
     - ✅ Filter buttons: Today, Week, Month
     - ✅ Only this doctor's appointments show

- [ ] Test Appointment Viewing
  1. Doctor can see CONFIRMED appointments
  2. Click appointment to select
  3. Right panel shows:
     - ✅ Patient information
     - ✅ Appointment details
     - ✅ Medical record section
     - ✅ Complete button

- [ ] Test Medical Record Creation
  1. Select appointment
  2. Click "Add Record" button
  3. Fill in form:
     - Symptoms (required)
     - Diagnosis (required)
     - Prescription (optional)
     - Notes (optional)
  4. Click "Save Record"
  5. Verify:
     - ✅ Record saves successfully
     - ✅ Form shows data on reload
     - ✅ Can edit record by clicking "Edit Record"

- [ ] Test Completion
  1. After medical record saved
  2. Click "Mark as Completed"
  3. Confirm in dialog
  4. Verify:
     - ✅ Appointment removed from list
     - ✅ Status changed to COMPLETED

### Phase 6: Admin Features

- [ ] Test Admin Dashboard Access
  1. Login as admin
  2. Should see "Statistics Dashboard"
  3. Verify:
     - ✅ Overview cards show (Total, Confirmed, Completed, Revenue)

- [ ] Test Date Range Selection
  1. Buttons: Week, Month, Year
  2. Clicking should refresh statistics
  3. Data should update

- [ ] Test Statistics Display
  1. Appointments trend chart visible
  2. Revenue breakdown shown
  3. Top doctors list displayed
  4. Status distribution shown

### Phase 7: Advanced Features

- [ ] Test Payment Countdown Timer
  1. Create BASIC appointment
  2. Should show "⏱️ Payment Expires In: MM:SS"
  3. Timer should decrease every second
  4. When < 5 minutes: color changes to red (urgent)
  5. When timer reaches 0:00: shows "Payment Deadline Passed"

- [ ] Test Auto-Refresh
  1. Doctor dashboard should auto-refresh every 30 sec
  2. Admin dashboard should auto-refresh every 30 sec
  3. Can manually click refresh

- [ ] Test Responsive Design
  1. View on desktop (1280px+)
  2. View on tablet (768px-1024px)
  3. View on mobile (< 768px)
  4. All components should adapt

---

## Testing Data Requirements

### Required Test Accounts

```
CUSTOMER:
  Email: customer1@example.com
  Password: Test123!
  Role: CUSTOMER

SALE_STAFF:
  Email: staff1@example.com
  Password: Test123!
  Role: SALE_STAFF

DOCTOR:
  Email: doctor1@example.com
  Password: Test123!
  Role: DOCTOR

ADMIN:
  Email: admin@example.com
  Password: Test123!
  Role: ADMIN
```

### Required Backend Data

- [ ] Doctors created and approved
- [ ] Specializations created
- [ ] Slots generated for next 7 days (via cron or manual)
- [ ] At least 1 customer created

### Create Test Appointments

```bash
# Via API or Frontend:
1. Create BASIC appointment as customer
2. Create ADVANCED appointment as customer
3. Have staff assign doctor/slot to BASIC
4. Have doctor create medical record
5. Have doctor mark as COMPLETED
```

---

## Environment Setup

### Backend .env Requirements

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eye-care
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Frontend .env Requirements

```
VITE_API_URL=http://localhost:5000/api
```

### Backend Running?

```bash
# In /be directory
npm start
# Should see: "Listening on port 5000"
```

---

## Common Integration Issues & Solutions

| Issue                        | Cause                          | Solution                         |
| ---------------------------- | ------------------------------ | -------------------------------- |
| 404 Not Found on API calls   | Backend not running            | Start backend: `npm start`       |
| CORS error                   | API URL mismatch               | Check VITE_API_URL in .env       |
| 401 Unauthorized             | Token expired                  | Re-login in auth context         |
| Empty appointments list      | No data in backend             | Create test appointments via API |
| Slot selection empty         | Date is in past                | Select future date               |
| Doctor dropdown empty        | Doctors table not seeded       | Create doctors via admin panel   |
| Payment timer not showing    | ADVANCED type instead of BASIC | Create BASIC appointment to test |
| Staff can't see appointments | Looking at wrong endpoint      | Check status filter              |

---

## Browser DevTools Debugging

### Check Network Requests

1. Open DevTools (F12)
2. Network tab
3. Filter by "XHR"
4. Create appointment
5. Look for `POST /api/appointments`
   - Headers: `Authorization: Bearer <token>`
   - Status: 201 (success)
   - Response: appointment object

### Check Console Errors

```javascript
// Clear console
console.clear();

// Test appointment service
const { appointmentService } = await import("/src/services/index.js");
const apts = await appointmentService.getAll();
console.log(apts);
```

### Check LocalStorage

```javascript
// View auth token
console.log(localStorage.getItem("token"));

// View user data
console.log(JSON.parse(localStorage.getItem("user")));
```

### Check Component State (React DevTools)

1. Install React DevTools extension
2. Click Components tab
3. Find component in tree
4. View props and state
5. Use time-travel debugging

---

## Deployment Checklist

Before deploying to production:

- [ ] All API endpoints tested
- [ ] All user flows tested (BASIC, ADVANCED, Staff, Doctor, Admin)
- [ ] Error messages are user-friendly
- [ ] Loading states work properly
- [ ] Responsive design verified on mobile
- [ ] Payment timeout logic works (15 min)
- [ ] Auto-refresh/polling works
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security: JWT tokens secure
- [ ] Security: CORS properly configured
- [ ] Backup database before deploy
- [ ] Test on staging environment first

---

## Post-Integration Testing

After full integration, run these tests:

### End-to-End Workflow Tests

- [ ] Customer books BASIC → Staff assigns → Doctor completes
- [ ] Customer books ADVANCED directly → Confirmed
- [ ] Customer cancels appointment
- [ ] Payment timer expires and auto-cancels (verify via backend logs)
- [ ] Admin views statistics

### Load Testing

- [ ] 10 simultaneous appointments created
- [ ] 100 appointments in list → filtering still fast
- [ ] Multiple doctors → slot loading still responsive

### Cross-Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome)

---

## Support Resources

### Documentation

- Backend: `be/README.md`
- Frontend: `fe/README.md`
- API Docs: `be/API_DOCUMENTATION.md` (if exists)
- Implementation: `fe/FRONTEND_IMPLEMENTATION.md`

### Key Files to Review

1. `be/src/models/Appointment.js` - Data schema
2. `be/src/services/appointment.service.js` - Business logic
3. `fe/src/services/index.js` - API client methods
4. `fe/src/components/RoleBasedDashboard.jsx` - Role routing

### Debugging Commands

```bash
# Check MongoDB connection
mongo mongodb://localhost:27017/eye-care

# Check backend logs
npm run dev  # with nodemon

# Check frontend build
npm run build

# Check bundle size
npm run build -- --reporter verbose
```

---

## Sign-Off Checklist

**Frontend Developer:**

- [ ] All components created ✅
- [ ] All services integrated ✅
- [ ] All routes configured
- [ ] All tests passed
- [ ] Documentation complete ✅
- [ ] Code reviewed
- Signed: ****\_**** Date: ****\_****

**Backend Developer:**

- [ ] All endpoints tested
- [ ] All business logic verified
- [ ] Database integrity confirmed
- [ ] CORS properly configured
- [ ] Error handling consistent
- Signed: ****\_**** Date: ****\_****

**QA Tester:**

- [ ] End-to-end tests passed
- [ ] Load testing passed
- [ ] Cross-browser testing passed
- [ ] Mobile responsive verified
- [ ] No critical bugs found
- Signed: ****\_**** Date: ****\_****

---
