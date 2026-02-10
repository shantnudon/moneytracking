import prisma from "../utils/prismaClient.js";
import { encrypt, decrypt } from "../utils/crypto.js"; // need to think about the breakpoints and edgecases for this utility
import { emailConfigSchema } from "../validators/emailValidators.js";
import Imap from "imap";
import logger from "../utils/logger.js";

export const saveEmailConfig = async (req, res) => {
  try {
    // console.log(req.body);
    const validatedData = emailConfigSchema.parse(req.body);
    const userId = req.user.id;

    let encryptedData = {};
    if (validatedData.emailPassword) {
      const { iv, content } = encrypt(validatedData.emailPassword);
      encryptedData = { iv, encryptedPassword: content };
    }

    // const senderConnect = validatedData.monitoredSenders
    //   ? {
    //       create: validatedData.monitoredSenders.map((sender) => ({
    //         email: sender.email,
    //         pdfPasswords: sender.pdfPasswords || [],
    //       })),
    //     }
    //   : undefined;

    await prisma.$transaction(async (tx) => {
      const existingConfig = await tx.emailConfig.findUnique({
        where: { userId },
      });

      if (!existingConfig && !validatedData.emailPassword) {
        throw new Error("Password is required for new configuration");
      }

      if (existingConfig) {
        await tx.monitoredSender.deleteMany({
          where: { emailConfigId: existingConfig.id },
        });
      }

      const dataToUpdate = {
        emailUser: validatedData.emailUser,
        host: validatedData.host || "imap.gmail.com",
        port: validatedData.port || 993,
        scanFrequency: validatedData.scanFrequency,
        processingType: validatedData.processingType || "REGEX",
        ...encryptedData,
      };

      await tx.emailConfig.upsert({
        where: { userId },
        update: dataToUpdate,
        create: {
          userId,
          ...dataToUpdate,
          encryptedPassword: encryptedData.encryptedPassword,
          iv: encryptedData.iv,
        },
      });
    });

    res
      .status(200)
      .json({ message: "Email configuration saved successfully." });
  } catch (error) {
    if (error.name === "ZodError") {
      logger.error(error);
      return res.status(400).json({ errors: error.errors });
    }
    logger.error("Save Config Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getEmailConfig = async (req, res) => {
  try {
    const config = await prisma.emailConfig.findUnique({
      where: { userId: req.user.id },
      include: { monitoredSenders: true },
    });

    if (!config)
      return res.status(404).json({ message: "No configuration found" });

    const { encryptedPassword, iv, ...safeConfig } = config;
    res.status(200).json(safeConfig);
  } catch (error) {
    logger.error("Error fetching email config:", error);
    res.status(500).json({
      message: "Error fetching config",
      error: error.message,
    });
  }
};

export const testEmailConfig = async (req, res) => {
  try {
    // console.log("body     ", req.body);
    let { emailUser, emailPassword, host, port } = req.body;

    if (!emailPassword && req.user && req.user.id) {
      const storedConfig = await prisma.emailConfig.findUnique({
        where: { userId: req.user.id },
      });

      if (storedConfig) {
        emailPassword = decrypt(
          storedConfig.encryptedPassword,
          storedConfig.iv,
        );
        if (!emailUser) emailUser = storedConfig.emailUser;
        if (!host) host = storedConfig.host;
        if (!port) port = storedConfig.port;
      }
    }

    if (!emailUser || !emailPassword || !host || !port) {
      logger.info("Missing fields:", {
        emailUser: !!emailUser,
        emailPassword: !!emailPassword,
        host: !!host,
        port: !!port,
      });
      return res.status(400).json({
        message: "Missing required fields or no saved configuration found",
        received: {
          emailUser: !!emailUser,
          emailPassword: !!emailPassword,
          host: !!host,
          port: !!port,
        },
      });
    }

    // logger.info(emailPassword)
    const imap = new Imap({
      user: emailUser,
      password: emailPassword,
      host: host,
      port: port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 10000,
    });
    return new Promise((resolve) => {
      let connectionSuccess = false;

      imap.once("ready", () => {
        connectionSuccess = true;
        imap.end();
        res.status(200).json({
          success: true,
          message: "Connection successful! Credentials are valid.",
        });
        resolve();
      });

      imap.once("error", (err) => {
        if (!connectionSuccess) {
          logger.error(err);
          res.status(400).json({
            success: false,
            message: `Connection failed: ${err.message}`,
          });
          resolve();
        }
      });

      imap.once("end", () => {
        if (connectionSuccess && !res.headersSent) {
          res.status(200).json({
            success: true,
            message: "Connection successful! Credentials are valid.",
          });
          resolve();
        }
      });

      try {
        imap.connect();
      } catch (err) {
        res.status(400).json({
          success: false,
          message: `Failed to initiate connection: ${err.message}`,
        });
        resolve();
      }

      setTimeout(() => {
        if (!res.headersSent) {
          imap.end();
          res.status(408).json({
            success: false,
            message: "Connection timeout. Please check your settings.",
          });
          resolve();
        }
      }, 15000);
    });
  } catch (error) {
    logger.error("Test Config Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during connection test",
    });
  }
};
