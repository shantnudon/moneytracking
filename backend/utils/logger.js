import winston from "winston";

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    process.env.NODE_ENV === "production"
      ? json()
      : combine(colorize(), consoleFormat),
  ),
  transports: [new winston.transports.Console()],
});

if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  );
  logger.add(new winston.transports.File({ filename: "logs/combined.log" }));
}

const log = (message, metadata = {}) => {
  if (process.env.NODE_ENV === "production") {
    logger.info(message, metadata);
  } else {
    console.log(`[DEV LOG] ${message}`, metadata);
  }
};

const error = (message, metadata = {}) => {
  if (process.env.NODE_ENV === "production") {
    logger.error(message, metadata);
  } else {
    console.error(`[DEV ERROR] ${message}`, metadata);
  }
};

const warn = (message, metadata = {}) => {
  if (process.env.NODE_ENV === "production") {
    logger.warn(message, metadata);
  } else {
    console.warn(`[DEV WARN] ${message}`, metadata);
  }
};

export default {
  log,
  error,
  warn,
  info: log,
  stream: {
    write: (message) => logger.info(message.trim()),
  },
};
