# Eye Care System - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EYE CARE SYSTEM (ECS)                           │
│                    4 User Roles - 4 Dashboards                          │
└─────────────────────────────────────────────────────────────────────────┘

                              FRONTEND (React)
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              Browser DOM      AuthContext    Services
                    │         (Auth State)     (API)
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                         RoleBasedDashboard
                         (Routes by Role)
                                   │
        ┌──────────┬───────────┬──────┬──────────┐
        │          │           │      │          │
     CUSTOMER   STAFF      DOCTOR   ADMIN    UNKNOWN
        │          │           │      │
        ▼          ▼           ▼      ▼
   Appointments  Assignment  Doctor   Admin
   (Book + View) Dashboard   Dashboard Statistics
```

---

## Customer Dashboard Flow

```
┌─────────────────────────────────────────────────────────┐
│                  CUSTOMER DASHBOARD                      │
│                 (Appointments.jsx)                       │
└─────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │    TAB   │  │    TAB   │  │    TAB   │
      │  MY APTS │  │  BASIC   │  │ ADVANCED │
      └──────────┘  └──────────┘  └──────────┘
            │             │             │
            │             │             │
            ▼             ▼             ▼
      ┌─────────┐  ┌─────────────────────────┐
      │ APT      │  │ BasicAppointmentForm    │
      │ LIST     │  │ - Select Date (7 days)  │
      │         │  │ - Add Notes             │
      │ - Cards │  │ - Create → PENDING PAY  │
      │ - Filter│  │ - Payment 15-min timer  │
      │ - Cancel│  └─────────────────────────┘
      └─────────┘
            │
            │         POST /api/appointments
            │              │
            │              ▼
            │         ┌─────────────────────────┐
            │         │ AdvancedAppointmentForm │
            │         │ - Select Doctor         │
            │         │ - Select Date (7 days)  │
            │         │ - Load Slots            │
            │         │ - Select Slot           │
            │         │ - Create → CONFIRMED    │
            │         └─────────────────────────┘
            │
            └─ POST /api/appointments/:id/cancel
            └─ GET /api/appointments
            └─ GET /api/slots?date=...&doctorId=...
```

---

## Sale Staff Dashboard Flow

```
┌──────────────────────────────────────────────────────────┐
│            SALE STAFF DASHBOARD                          │
│        (SaleStaffAppointmentDashboard.jsx)               │
└──────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
    ┌─────────────┐                 ┌─────────────────┐
    │   LEFT      │                 │      RIGHT      │
    │  PANEL      │                 │     PANEL       │
    │ WAITING FOR │ ────SELECT───→  │  ASSIGNMENT     │
    │  ASSIGNMENT │                 │     FORM        │
    │             │                 │                 │
    │ APT LIST:   │                 │ - Doctor Input  │
    │ - Name      │                 │ - Date Picker   │
    │ - Type      │                 │ - Slot Radio    │
    │ - Date      │                 │ - Approve Btn   │
    │ - Count     │                 │                 │
    └─────────────┘                 └─────────────────┘
        │                                   │
        │                                   │
        └─ GET /api/appointments/staff
           ?status=WAITING_ASSIGN
                                            │
                                   POST /api/appointments/:id/approve
                                   {doctorId, slotId}
                                            │
                                            ▼
                                   Status: CONFIRMED
```

---

## Doctor Dashboard Flow

```
┌────────────────────────────────────────────────────────────┐
│                DOCTOR DASHBOARD                            │
│           (DoctorAppointmentDashboard.jsx)                 │
└────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
        TODAY        WEEK        MONTH
        (Filter by appointment date)
            │
            ▼
    ┌────────────────────────────────┐
    │  LEFT: APT LIST                │
    │  - Only CONFIRMED (Doctor's)   │
    │  - Click to select             │
    └────────────────────────────────┘
            │
            └──SELECT─→ ┌──────────────────────────┐
                        │ RIGHT: DETAILS           │
                        │                          │
                        │ Patient Info:            │
                        │ - Name, Phone, Email     │
                        │ - Notes                  │
                        │                          │
                        │ Appointment Details:     │
                        │ - Date, Time, Status     │
                        │                          │
                        │ Medical Record Form:     │
                        │ - Symptoms (req)         │
                        │ - Diagnosis (req)        │
                        │ - Prescription (opt)     │
                        │ - Notes (opt)            │
                        │     │                    │
                        │     ▼                    │
                        │  SAVE BUTTON             │
                        │     │                    │
                        │     └──→ Medical Record  │
                        │         Created/Updated  │
                        │                          │
                        │  COMPLETE BUTTON         │
                        │     │                    │
                        │     └──→ Status:         │
                        │         COMPLETED       │
                        └──────────────────────────┘
                        │
                        └─ GET /api/appointments/staff?status=CONFIRMED
                        └─ GET /api/medical-records/appointment/:id
                        └─ POST /api/medical-records
                        └─ PUT /api/medical-records/:id
```

---

## Admin Dashboard Flow

```
┌────────────────────────────────────────────────────────────┐
│             ADMIN STATISTICS DASHBOARD                      │
│           (AdminStatisticsDashboard.jsx)                    │
└────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
         WEEK          MONTH         YEAR
         (Date Range Filter)
            │
            ▼
    ┌──────────────────────────────────────┐
    │      OVERVIEW CARDS                  │
    │                                      │
    │  Total │  Confirmed │  Completed │  │
    │  Apts  │   Apts     │   Apts     │  │
    │        │            │            │  │
    │  Revenue Statistics                │
    └──────────────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────────────┐
    │    APPOINTMENT TRENDS CHART          │
    │                                      │
    │  Date →  Count                      │
    │  2024-01  ━━━━━━━━  45              │
    │  2024-02  ━━━━━━━   40              │
    │  2024-03  ━━━━━━━━━━ 52             │
    └──────────────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────────────┐
    │   REVENUE BREAKDOWN                  │
    │                                      │
    │  Basic     ▓▓▓▓▓▓▓   35%             │
    │  Advanced  ▓▓▓▓▓▓▓▓▓▓ 65%            │
    └──────────────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────────────┐
    │   TOP DOCTORS                        │
    │                                      │
    │  1. Dr. A  📊 50 apts ⭐ 4.8        │
    │  2. Dr. B  📊 45 apts ⭐ 4.6        │
    │  3. Dr. C  📊 42 apts ⭐ 4.5        │
    │  ...                                 │
    └──────────────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────────────┐
    │   STATUS DISTRIBUTION                │
    │                                      │
    │  ⏱  PENDING_PAYMENT   15             │
    │  ⏳ WAITING_ASSIGN    22             │
    │  ✅ CONFIRMED        185             │
    │  🏆 COMPLETED        312             │
    │  ❌ CANCELED          18             │
    └──────────────────────────────────────┘
                    │
                    └─ GET /api/statistics/overview?range=...
                    └─ GET /api/statistics/appointments?range=...
                    └─ GET /api/statistics/doctors?range=...
                    └─ GET /api/statistics/feedbacks?range=...
```

---

## Appointment State Machine

```
┌────────────────────────────────────────────────────────────┐
│           APPOINTMENT STATUS TRANSITIONS                    │
└────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  BASIC PATH     │
                    └─────────────────┘
                           │
                           ▼
                  ┌──────────────────────┐
                  │  PENDING_PAYMENT     │──PaymentTimeout──→ CANCELED
                  │  (15 min countdown)  │
                  └──────────────────────┘
                           │
                    PaymentCompleted
                           │
                           ▼
                  ┌──────────────────────┐
                  │ WAITING_ASSIGN       │──StaffApproves──→
                  │ (Staff reviews)      │
                  └──────────────────────┘
                           │
                           │
                ┌──────────┴──────────┐
                │                     │
         ┌──────────────────┐  ┌───────────────────┐
         │  CONFIRMED       │  │  ADVANCED PATH    │
         │  (Doctor views)  │  │  (Booked directly)│
         └──────────────────┘  └───────────────────┘
                │                     │
                └──────────┬──────────┘
                           │
                    DoctorCompletes
                    + MedicalRecord
                           │
                           ▼
                  ┌──────────────────────┐
                  │ COMPLETED            │──CustomerFeedback──→
                  │ (Done, can feedback) │  FEEDBACK_RECORDED
                  └──────────────────────┘
                           │
                    FinalState (Terminal)


   TERMINAL STATES:  COMPLETED, CANCELED
   ACTIVE STATES:    PENDING_PAYMENT, WAITING_ASSIGN, CONFIRMED
```

---

## Data Model Relationships

```
┌────────────────┐
│   CUSTOMER     │
│                │
│ id             │
│ fullName       │───────┐
│ phone          │       │
│ email          │       │
│ rank           │       │
└────────────────┘       │
                         │ 1:Many
                         │
                         ▼
                 ┌────────────────┐
                 │  APPOINTMENT   │
                 │                │
                 │ id             │
                 │ customerId  ◄──┘
                 │ type           │
                 │ status         │───┐
                 │ desiredDate    │   │
                 │ slotId         │   │  1:1
                 │ doctorId       │   │  │
                 │ approvedBy     │   │  ▼
                 │ note           │   │ ┌─────────────┐
                 │                │   │ │ MEDICAL     │
                 └─────┬──────────┘   │ │ RECORD      │
                       │              │ │             │
                       │ 1:1          │ │ id          │
                       │              │ │ appointId ◄─┘
                       │              │ │ doctorId    │
                       │              │ │ symptoms    │
                       │              │ │ diagnosis   │
                       │              │ │ prescription│
                       │              │ │ notes       │
                       │              │ └─────────────┘
                       │              │
                       ▼              │
                 ┌────────────┐      │
                 │   SLOT     │      │
                 │            │      │
                 │ id         │      │
                 │ doctorId   │──┐   │
                 │ startTime  │  │   │
                 │ endTime    │  │   │
                 │ maxPatients│  │   │
                 │ bookedCount│  │   │
                 │ status     │  │   │
                 │ isExclusive│  │   │
                 └────────────┘  │   │
                                 │1:Many
                                 │
                                 ▼
                        ┌────────────────┐
                        │   DOCTOR       │
                        │                │
                        │ id             │
                        │ fullName       │
                        │ specializations│
                        │ experienceYrs  │
                        │ approvedBy     │
                        └────────────────┘
```

---

## Component Hierarchy

```
RoleBasedDashboard (Router)
│
├─→ Customer Role
│   └─→ Appointments.jsx
│       ├─→ BasicAppointmentForm.jsx
│       ├─→ AdvancedAppointmentForm.jsx
│       ├─→ AppointmentCard.jsx (repeated in list)
│       │   └─→ AppointmentPaymentCountdown.jsx
│       └─→ Alert, Loading (UI components)
│
├─→ Sale Staff Role
│   └─→ SaleStaffAppointmentDashboard.jsx
│       ├─→ Left Panel: Appointment List
│       ├─→ Right Panel: Assignment Form
│       └─→ Alert, Loading (UI components)
│
├─→ Doctor Role
│   └─→ DoctorAppointmentDashboard.jsx
│       ├─→ Left Panel: Appointment List
│       ├─→ Right Panel: Details & Medical Form
│       └─→ Alert, Loading (UI components)
│
└─→ Admin Role
    └─→ AdminStatisticsDashboard.jsx
        ├─→ StatCard (overview cards)
        ├─→ Trend Chart
        ├─→ Revenue Breakdown
        ├─→ Top Doctors List
        └─→ Status Distribution
            └─→ StatusItem (repeated)
```

---

## API Call Sequence Diagram

### BASIC Appointment Creation & Assignment

```
Customer                     Frontend              Backend
   │                            │                    │
   ├─ Click "Book Basic" ──────→│                    │
   │                            │                    │
   ├─ Submit Date ─────────────→│ POST /appointments │
   │                            ├──────────────────→│
   │                            │                    │ Create appointment
   │                            │                    │ Status: PENDING_PAYMENT
   │                            │←─ 201 Created ────┤
   │←──── Show Payment Timer ────│                    │
   │                            │                    │
   │ (After 15 min or payment   │ GET /appointments ├─ Check status
   │  completes, status updates)│                    │
   │                            │                    │
   └─────────────────────────────────────────────────┘
                                │                    │
                          Staff Portal              │
                                │                    │
   ┌──── View Assignment ───────│ GET /appointments/staff
   │                            ├──────────────────→│
   │                            │← [WAITING_ASSIGN] │
   │                            │                    │
   └──── Click Approve ────────→│ POST /approve     │
   │                            │ {doctorId, slotId}│
   │                            ├──────────────────→│
   │                            │                    │ Assign & validate
   │                            │                    │ Status: CONFIRMED
   │                            │←─ 200 OK ─────────┤
   │                            │                    │

                    Doctor Portal
                            │                    │
        ┌──── View Apts ────→│ GET /appointments/staff
        │                    ├──────────────────→│
        │                    │← [CONFIRMED] ─────┤
        │                    │                    │
        └─ Add Medical Record│ POST /medical-records
                            ├──────────────────→│
                            │← 201 Created ─────┤
                            │                    │
          Click Complete ────│ POST /appointments/:id
                            │ {status: COMPLETED}│
                            ├──────────────────→│
                            │← 200 OK ──────────┤
                            │                    │
```

---

## Key Algorithms

### Slot Availability Calculation

```javascript
// Backend calculates
remaining = maxPatients - bookedCount;

// Frontend validation
if (remaining <= 0) {
  status = "FULL"; // Can't book
  slot.disabled = true;
} else if (appointment.type === ADVANCED) {
  slot.exclusive = true; // No other advanced on same slot
}
```

### Payment Timeout Handling

```javascript
// Backend creates appointment with
paymentExpireAt = now + 15 minutes

// Frontend countdown
every 1 second: {
  timeLeft = paymentExpireAt - now
  if (timeLeft <= 0) {
    show "Payment Deadline Passed"
    check server status (might be auto-canceled)
  }
}

// Backend cron job (every minute)
find appointments where {
  status === PENDING_PAYMENT &&
  paymentExpireAt <= now &&
  NOT PAID
}
then: status = CANCELED
```

### Doctor Slot Closing Logic

```javascript
// When ADVANCED appointment created:
// 1. Increment bookedCount
// 2. Set isExclusive = true (no more bookings)
// 3. If bookedCount >= maxPatients: status = BOOKED

// When BASIC appointment assigned:
// 1. Increment bookedCount
// 2. Keep isExclusive = false
// 3. If bookedCount >= maxPatients: status = BOOKED

// Frontend display:
// AVAILABLE: Show with "X spots left"
// BOOKED: Show as disabled/grayed out
```

---

## Performance Considerations

```
Component            Update Strategy
─────────────────────────────────────────────
Appointments         • Re-fetch on mount
List                 • Filter locally (no re-fetch)
                     • Poll every 30s if visible

Doctor               • Re-fetch on mount
Dashboard            • Auto-poll every 30s
                     • Manual refresh button

Admin                • Re-fetch on date change
Statistics           • Fetch once per date range
                     • Cache results

Payment              • Countdown every 1 sec
Countdown            • Check server every 10 min
                     • Lightweight computation

Slot                 • Fetch on doctor+date change
Selection            • Cache per doctor+date combo
                     • Debounce API calls
```

---

This architecture diagram provides a complete visual overview of the Eye Care System frontend implementation.
