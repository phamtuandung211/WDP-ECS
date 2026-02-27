import cron from "node-cron";
import { generateSlotsForNextDays } from "../services/slot.service.js";
import { autoExpirePendingAppointments } from "../services/appointment.service.js";

/**
 * Register all cron jobs for the application.
 * Call this once after DB connection is established.
 */
export const registerCronJobs = () => {
  // Run immediately when server starts
  (async () => {
    console.log("[Startup] Generating slots for next 7 days...");
    try {
      const { totalCreated } = await generateSlotsForNextDays(7);
      console.log(
        `[Startup] Slot generation complete. Created: ${totalCreated}`,
      );
    } catch (err) {
      console.error("[Startup] Slot generation failed:", err.message);
    }
  })();

  // 1. Run every day at 00:00 VN
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("[Cron] Generating slots for next 7 days...");
      try {
        const { totalCreated } = await generateSlotsForNextDays(7);
        console.log(
          `[Cron] Slot generation complete. Created: ${totalCreated}`,
        );
      } catch (err) {
        console.error("[Cron] Slot generation failed:", err.message);
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    },
  );

  // 2. Auto-expire every minute
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const { expired } = await autoExpirePendingAppointments();
        if (expired > 0) {
          console.log(`[Cron] Auto-expired ${expired} expired appointment(s)`);
        }
      } catch (err) {
        console.error("[Cron] Auto-expire failed:", err.message);
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    },
  );

  console.log("✓ Cron jobs registered");
};
