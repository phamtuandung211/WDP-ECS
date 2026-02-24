const SLOT_STATUS = {
  AVAILABLE: "AVAILABLE",
  BOOKED: "BOOKED",
};

/** Fixed slot duration in minutes */
const SLOT_DURATION_MINUTES = 30;

/** Working hours definition */
const WORKING_HOURS = {
  MORNING_START: { hour: 7, minute: 30 },
  MORNING_END: { hour: 12, minute: 0 },
  AFTERNOON_START: { hour: 13, minute: 30 },
  AFTERNOON_END: { hour: 17, minute: 0 },
};

const MAX_PATIENTS = 3;

export { SLOT_STATUS, SLOT_DURATION_MINUTES, WORKING_HOURS, MAX_PATIENTS };
