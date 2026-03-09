import mongoose from "mongoose";
import payos from "../config/payos.js";
import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";
import { PAYMENT_STATUS } from "../constants/Payment.enum.js";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
  PAYMENT_TIMEOUT_MINUTES,
  APPOINTMENT_PRICE,
} from "../constants/Appointment.enum.js";
import { bookSlotByType } from "./slot.service.js";

export const createPaymentLinkService = async (appointmentId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const appointment =
      await Appointment.findById(appointmentId).session(session);
    if (!appointment) {
      throw Object.assign(new Error("Appointment not found"), { status: 404 });
    }

    if (appointment.status !== APPOINTMENT_STATUS.PENDING_PAYMENT) {
      throw Object.assign(
        new Error(
          `Cannot pay for appointment with status ${appointment.status}`,
        ),
        { status: 400 },
      );
    }

    // Reuse existing pending payment
    const existingPayment = await Payment.findOne({
      appointmentId,
      status: PAYMENT_STATUS.PENDING,
    }).session(session);

    if (existingPayment) {
      await session.commitTransaction();
      return {
        checkoutUrl: existingPayment.checkoutUrl,
        payment: existingPayment.toObject(),
      };
    }

    const expiredAt = Math.floor(
      (Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000) / 1000,
    );

    const orderCode = Number(String(Date.now()).slice(-6));

    const paymentLink = await payos.paymentRequests.create({
      orderCode: orderCode,
      amount:
        appointment.type === APPOINTMENT_TYPE.BASIC
          ? APPOINTMENT_PRICE.BASIC
          : APPOINTMENT_PRICE.ADVANCED,
      description:
        appointment.type === APPOINTMENT_TYPE.BASIC
          ? APPOINTMENT_TYPE.BASIC + " -" + orderCode
          : APPOINTMENT_TYPE.ADVANCED + " -" + orderCode,
      cancelUrl: process.env.PAYOS_CANCEL_URL,
      returnUrl: process.env.PAYOS_RETURN_URL,
    });

    const [payment] = await Payment.create(
      [
        {
          appointmentId,
          customerId: appointment.customerId,
          orderCode,
          amount:
            appointment.type === APPOINTMENT_TYPE.BASIC
              ? APPOINTMENT_PRICE.BASIC
              : APPOINTMENT_PRICE.ADVANCED,
          status: PAYMENT_STATUS.PENDING,
          checkoutUrl: paymentLink.checkoutUrl,
          expiredAt: new Date(expiredAt * 1000),
        },
      ],
      { session },
    );

    appointment.paymentOrderCode = orderCode;
    await appointment.save({ session });

    await session.commitTransaction();

    return {
      checkoutUrl: paymentLink.checkoutUrl,
      payment: payment.toObject(),
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const handlePayosWebhook = async (rawBody) => {
  let data;

  try {
    data = await payos.webhooks.verify(rawBody);
  } catch (err) {
    throw Object.assign(new Error("Invalid PayOS webhook"), { status: 400 });
  }

  const isSuccess = data.code === "00";
  const orderCode = data.orderCode;
  const isCanceled = data.status === "CANCELED";
  const payment = await Payment.findOne({ orderCode });
  if (!payment) {
    return { success: true, message: "Payment not found, skipped" };
  }

  if (payment.status !== PAYMENT_STATUS.PENDING) {
    return { success: true, message: "Already processed" };
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const appointment = await Appointment.findById(
      payment.appointmentId,
    ).session(session);

    if (!appointment) {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save({ session });
      await session.commitTransaction();
      return { success: true };
    }

    if (isSuccess) {
      let bookedSlot = null;

      if (appointment.slotId) {
        bookedSlot = await bookSlotByType(
          appointment.slotId,
          appointment.type,
          session,
        );

        if (!bookedSlot) {
          // Slot full or unavailable → fail payment and appointment
          payment.status = PAYMENT_STATUS.FAILED;
          payment.failureReason = "Slot no longer available";
          await payment.save({ session });

          appointment.status = APPOINTMENT_STATUS.CANCELED;
          await appointment.save({ session });

          await session.commitTransaction();

          return {
            success: true,
            message: "Slot unavailable, payment and appointment cancelled",
          };
        }
      }

      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.paidAt = new Date();
      payment.payosTransactionId = data.reference;
      await payment.save({ session });

      appointment.status =
        appointment.type === APPOINTMENT_TYPE.BASIC
          ? APPOINTMENT_STATUS.WAITING_ASSIGN
          : APPOINTMENT_STATUS.CONFIRMED;

      await appointment.save({ session });
    } else if (isCanceled) {
      payment.status = PAYMENT_STATUS.CANCELED;
      payment.canceledAt = new Date();
      await payment.save({ session });

      appointment.status = APPOINTMENT_STATUS.CANCELED;
      await appointment.save({ session });
    } else {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save({ session });

      await Appointment.deleteOne({ _id: appointment._id }).session(session);
    }

    await session.commitTransaction();

    return {
      success: true,
      message: isSuccess ? "Payment confirmed" : "Payment failed",
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Handle cancel return from PayOS checkout page.
 * Called by frontend when user is redirected to cancelUrl.
 */
export const handleCancelPayment = async (orderCode) => {
  const payment = await Payment.findOne({ orderCode });
  if (!payment) {
    throw Object.assign(new Error("Payment not found"), { status: 404 });
  }

  if (payment.status !== PAYMENT_STATUS.PENDING) {
    return { success: true, message: "Already processed" };
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Cancel payment link on PayOS
    try {
      await payos.paymentRequests.cancel(orderCode);
    } catch (e) {
      // Ignore if already cancelled on PayOS side
      console.warn(
        `[CancelPayment] PayOS cancel request failed for orderCode ${orderCode}:`,
        e.message,
      );
    }

    payment.status = PAYMENT_STATUS.CANCELED;
    payment.canceledAt = new Date();
    await payment.save({ session });

    const appointment = await Appointment.findById(
      payment.appointmentId,
    ).session(session);
    if (
      appointment &&
      appointment.status === APPOINTMENT_STATUS.PENDING_PAYMENT
    ) {
      appointment.status = APPOINTMENT_STATUS.CANCELED;
      await appointment.save({ session });
    }

    await session.commitTransaction();

    return { success: true, message: "Payment canceled" };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
