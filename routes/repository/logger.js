const { createLogger, transports, format } = require("winston");
const { GetCurrentDatetime, getNetwork, GetIPAddress } = require("./customhelper");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { v4: uuid } = require('uuid')

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.simple(),
    format.json(),
    format.errors({ stack: true }),
    format.colorize({ all: true }),
    format.printf(
      (info) =>
        `Time: ${GetCurrentDatetime()}} Level: ${info.level} Message:F ${
          info.message
        }`
    )
  ),
  transports: [
    new transports.File({
      filename: path.join(__dirname, "..", "logs", "error.log"),
      level: "error",
    }),
  ],
});

const logEvents = async (message, logFilename) => {
  try {
    const dateTime = `${format(new Date(), "yyyyMMdd\tHH:mm:ss")}`;
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

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
    GetIPAddress().then((ipaddress) => {
      logEvents(`${req.method}\t${req.url}\t${ipaddress}`, 'reqLog.log')
      next()
    })
  }

module.exports = {
  logger,
  logEvents,
  eventlogger
};
