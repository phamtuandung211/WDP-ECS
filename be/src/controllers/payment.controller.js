import {
  createPaymentLinkService,
  handlePayosWebhook,
  handleCancelPayment,
} from "../services/payment.service.js";

export const createPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: "appointmentId is required" });
    }

    const result = await createPaymentLinkService(appointmentId);

    return res.status(201).json({
      message: "Payment link created",
      data: {
        checkoutUrl: result.checkoutUrl,
        payment: result.payment,
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to create payment link",
    });
  }
};

/**
 * POST /api/payments/payos/cancel
 * Called by frontend when user is redirected to cancelUrl from PayOS checkout.
 */
export const cancelPayment = async (req, res) => {
  try {
    const { orderCode } = req.body;

    if (!orderCode) {
      return res.status(400).json({ message: "orderCode is required" });
    }

    const result = await handleCancelPayment(Number(orderCode));

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to cancel payment",
    });
  }
};

/**
 * POST /api/payments/payos/webhook
 * Called by PayOS servers – no auth required, signature verified internally.
 */
export const payosWebhook = async (req, res) => {
  try {
    const result = await handlePayosWebhook(req.body);

    return res.status(200).json(result);
  } catch (err) {
    console.error("[PayOS Webhook] Error:", err.message);
    // Always return 200 to PayOS so it stops retrying on known errors
    return res.status(err.status === 400 ? 400 : 200).json({
      success: false,
      message: err.message || "Webhook processing failed",
    });
  }
};
