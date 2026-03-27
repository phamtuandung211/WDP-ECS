import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import Slot from "../models/Slot.js";
import Doctor from "../models/Doctor.js";
import Account from "../models/Account.js";
import Role from "../models/Role.js";
import {
  SLOT_STATUS,
  WORKING_HOURS,
  SLOT_DURATION_MINUTES,
  MAX_PATIENTS,
} from "../constants/Slot.enum.js";
import { ACCOUNT_STATUS } from "../constants/Account.enum.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import { APPOINTMENT_TYPE } from "../constants/Appointment.enum.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function generateSlotTimesForDate(date) {
  const slots = [];

  const base = dayjs(date).tz("Asia/Ho_Chi_Minh").startOf("day");

  const sessions = [
    { start: WORKING_HOURS.MORNING_START, end: WORKING_HOURS.MORNING_END },
    { start: WORKING_HOURS.AFTERNOON_START, end: WORKING_HOURS.AFTERNOON_END },
  ];

  for (const session of sessions) {
    let cursor = base
      .hour(session.start.hour)
      .minute(session.start.minute)
      .second(0)
      .millisecond(0);

    const sessionEnd = base
      .hour(session.end.hour)
      .minute(session.end.minute)
      .second(0)
      .millisecond(0);

    while (cursor.isBefore(sessionEnd)) {
      const end = cursor.add(SLOT_DURATION_MINUTES, "minute");

      if (end.isAfter(sessionEnd)) break;

      slots.push({
        startTime: cursor.toDate(),
        endTime: end.toDate(),
      });

      cursor = end;
    }
  }

  return slots;
}

export const generateSlotsForDate = async (date) => {
  const doctorRole = await Role.findOne({ name: ROLE_NAME.DOCTOR }).lean();
  if (!doctorRole) {
    console.warn("[SlotGen] DOCTOR role not found – skipping");
    return { created: 0 };
  }

  const doctors = await Doctor.find({
    approvedBy: { $ne: null },
  })
    .populate({
      path: "accountId",
      match: {
        role: doctorRole._id,
        status: ACCOUNT_STATUS.ACTIVE,
        isVerified: true,
      },
      select: "_id",
    })
    .select("_id")
    .lean();

  const approvedDoctors = doctors.filter((d) => d.accountId);
  if (!approvedDoctors.length) {
    return { created: 0 };
  }

  const slotTimes = generateSlotTimesForDate(date);
  const bulkOps = [];

  for (const doctor of approvedDoctors) {
    for (const { startTime, endTime } of slotTimes) {
      bulkOps.push({
        updateOne: {
          filter: {
            doctorId: doctor._id,
            startTime,
            endTime,
          },
          update: {
            $setOnInsert: {
              doctorId: doctor._id,
              startTime,
              endTime,
              maxPatients: MAX_PATIENTS,
              bookedCount: 0,
              status: SLOT_STATUS.AVAILABLE,
              isExclusive: false,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (!bulkOps.length) return { created: 0 };

  const result = await Slot.bulkWrite(bulkOps, { ordered: false });
  const created = result.upsertedCount || 0;

  console.log(
    `[SlotGen] Date=${date.toISOString().slice(0, 10)} doctors=${approvedDoctors.length} created=${created}`,
  );

  return { created };
};

export const generateSlotsForNextDays = async (days = 7) => {
  let totalCreated = 0;
  const today = dayjs().tz("Asia/Ho_Chi_Minh").startOf("day");

  for (let i = 1; i <= days; i++) {
    const date = today.add(i, "day").toDate();
    const { created } = await generateSlotsForDate(date);
    totalCreated += created;
  }

  return { totalCreated };
};

export const getAvailableSlots = async (params = {}) => {
  const { date, doctorId } = params;

  const query = { status: SLOT_STATUS.AVAILABLE };
  query.endTime = { $gt: new Date() };

  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    query.startTime = { $gte: dayStart, $lte: dayEnd };
  }

  if (doctorId) {
    query.doctorId = new mongoose.Types.ObjectId(doctorId);
  }

  // Only return slots that still have capacity
  query.$expr = { $lt: ["$bookedCount", "$maxPatients"] };

  const slots = await Slot.find(query)
    .populate("doctorId", "fullName specializations")
    .sort({ startTime: 1 })
    .lean();

  return slots;
};

/**
 * Atomically book a slot: increment bookedCount and mark BOOKED if full.
 * Returns the updated slot or null if no capacity.
 */
export const bookSlotByType = async (
  slotId,
  appointmentType,
  session = null,
) => {
  const opts = session ? { session } : {};

  const slot = await Slot.findOneAndUpdate(
    {
      _id: slotId,
      status: SLOT_STATUS.AVAILABLE,
      $expr: { $lt: ["$bookedCount", "$maxPatients"] },
      isExclusive: false, // không cho book nếu đã exclusive
    },
    [
      {
        $set: {
          bookedCount: { $add: ["$bookedCount", 1] },

          // Nếu ADVANCED → set exclusive
          isExclusive: {
            $cond: [
              { $eq: [appointmentType, APPOINTMENT_TYPE.ADVANCED] },
              true,
              "$isExclusive",
            ],
          },

          status:
            appointmentType === APPOINTMENT_TYPE.ADVANCED
              ? SLOT_STATUS.BOOKED
              : {
                  $cond: {
                    if: {
                      $gte: [{ $add: ["$bookedCount", 1] }, "$maxPatients"],
                    },
                    then: SLOT_STATUS.BOOKED,
                    else: SLOT_STATUS.AVAILABLE,
                  },
                },
        },
      },
    ],
    { new: true, ...opts },
  );

  return slot;
};
