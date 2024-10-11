const { createLogger, transports, format } = require("winston");
const {
  GetCurrentDatetime,
  getNetwork,
  GetIPAddress,
  GetCurrentDate,
} = require("../routes/repository/customhelper");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { v4: uuid } = require("uuid");

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.simple(),
    format.json(),
    format.errors({ stack: true }),
    format.colorize({ all: true }),
    format.printf(
      (info) =>
        `Datetime: ${GetCurrentDatetime()} Status: ${info.status} | Level: ${
          info.level
        } | Message: ${info.message}`
    )
  ),
  transports: [
    new transports.File({
      filename: path.join(__dirname, "..", "logs", `${GetCurrentDate()}_error.log`),
      level: "error",
    }),
  ],
});

const logEvents = async (message, logFilename) => {
  try {
    const dateTime = GetCurrentDatetime();
    const logItem = `Datetime ${dateTime} | ${message}\n`;

    if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
      await fsPromises.mkdir(path.join(__dirname, "..", "logs"));
    }
    await fsPromises.appendFile(
      path.join(__dirname, "..", "logs", logFilename),
      logItem
    );
  } catch (error) {
    console.log("Logging Error", error);
  }
};

const eventlogger = (req, res, next) => {
  getNetwork().then((ipaddress) => {
    logEvents(
      `Type: ${req.method} | URI: ${req.url} | IP: ${ipaddress} | Client IP: ${req.session.clientip}`,
      `${GetCurrentDate()}_reqLog.log`
    );
    next();
  });
};

module.exports = {
  logger,
  logEvents,
  eventlogger,
};
