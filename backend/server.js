import cron from "node-cron";
import app from "./app.js";
import logger from "./utils/logger.js";
import { env } from "./config/env.js";

import { processDueScans, processAllDigests } from "./services/emailWorker.js";
import { processDueSubscriptions } from "./services/subscriptionWorker.js";
import { cleanupExpiredSessions } from "./middleware/authMiddleware.js";

const PORT = env.BACKEND_PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

server.on("error", (err) => {
  logger.error("Server failed to start:", err);
});

if (process.env.NODE_ENV !== "test") {
  processDueScans();
  processDueSubscriptions();
  processAllDigests();

  cron.schedule("0 * * * *", () => {
    logger.info("Running scheduled session cleanup");
    cleanupExpiredSessions();
  });
}

export default server;
