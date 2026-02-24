import { PayOS } from "@payos/node";
import dotenv from "dotenv";
dotenv.config();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

(async () => {
  try {
    const result = await payos.webhooks.confirm(
      process.env.PAYOS_WEBHOOK_URL + "/api/payments/payos/webhook",
    );
    console.log("✓ Confirm webhook success:", result.webhookUrl);
  } catch (err) {
    console.error("❌ Confirm webhook failed:", err.message);
  }
})();
export default payos;
