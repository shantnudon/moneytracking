import nodemailer from "nodemailer";
import prisma from "../utils/prismaClient.js";
import { decrypt } from "../utils/crypto.js";
import logger from "../utils/logger.js";

export const sendEmailNotification = async (userId, subject, body) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { emailConfig: true },
    });

    if (!user || !user.notificationsEmail || !user.emailConfig) {
      logger.info(
        `Email notifications disabled or not configured for User ${userId}`,
      );
      return;
    }

    const config = user.emailConfig;
    const password = decrypt(config.encryptedPassword, config.iv);

    let smtpHost = config.host.replace("imap", "smtp");
    if (config.host === "imap.gmail.com") smtpHost = "smtp.gmail.com";

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 465,
      secure: true,
      auth: {
        user: config.emailUser,
        pass: password,
      },
    });

    await transporter.sendMail({
      from: `"Money Tracking Don" <${config.emailUser}>`,
      to: user.alertEmail || user.email,
      subject: subject,
      html: body,
    });

    logger.info(`Email notification sent to User ${userId}`);
  } catch (error) {
    logger.error(
      `Error sending email notification to User ${userId}:`,
      error.message,
    );
  }
};

export const sendNtfyNotification = async (
  userId,
  message,
  title = "Money Tracking Alert",
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.notificationsNtfy || !user.ntfyTopic) {
      return;
    }

    const response = await fetch(user.ntfyTopic, {
      method: "POST",
      body: message,
      headers: {
        Title: title,
        Priority: "default",
        Tags: "money,receipt",
      },
    });

    if (response.ok) {
      logger.info(`ntfy notification sent to User ${userId}`);
    } else {
      logger.error(`ntfy error for User ${userId}: ${response.statusText}`);
    }
  } catch (error) {
    logger.error(
      `Error sending ntfy notification to User ${userId}:`,
      error.message,
    );
  }
};

export const checkPendingBillsAndNotify = async (userId) => {
  try {
    const pendingBills = await prisma.transaction.findMany({
      where: {
        userId,
        status: "unsettled",
        source: { contains: "STATEMENT" },
      },
    });

    if (pendingBills.length > 0) {
      const billCount = pendingBills.length;
      const message = `Platform Login: You have ${billCount} pending bill(s) requiring review.`;
      const title = "Pending Bill Action Required";

      const htmlBody = `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #000;">Baseline Alert: Action Required</h2>
                    <p>The system has identified <strong>${billCount}</strong> pending financial statement(s) that need your confirmation or adjustment.</p>
                    <p>Please log in to the dashboard to reconcile these entries.</p>
                    <br/>
                    <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; text-transform: uppercase;">Review Pending Bills</a>
                </div>
            `;

      await sendAllNotifications(userId, title, message, htmlBody);
    }
  } catch (error) {
    logger.error("Error checking pending bills:", error);
  }
};

export const sendAllNotifications = async (
  userId,
  title,
  message,
  htmlBody,
) => {
  await Promise.all([
    sendEmailNotification(userId, title, htmlBody || message),
    sendNtfyNotification(userId, message, title),
  ]);
};
