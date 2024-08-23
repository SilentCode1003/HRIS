const { GetCurrentDate } = require("./customhelper");
const {
  EmailNotification,
  SendNotification,
  SendEmployeeNotification,
  SendEmployeeRequestPassword,
  ForgotPasswordTemplate,
} = require("./helper");
function SendEmailNotificationEmployee(employeeid, subgroupid, title, data) {
  return new Promise((resolve, reject) => {
    try {
      let html = EmailNotification(data);
      SendNotification(subgroupid, title, html);
      SendEmployeeNotification(employeeid, title, html);
      resolve("success");
    } catch (error) {
      console.log(error);

      reject(error);
    }
  });
}

function SendEmailNotification(employeeid,subgroupid, title, data) {
  return new Promise((resolve, reject) => {
    try {
      let html = EmailNotification(data);
      SendNotification(
        subgroupid,
        `${title} - ${GetCurrentDate()}`,
        html
      );
      SendEmployeeNotification(employeeid, title, html);
      resolve("success");
    } catch (error) {
      console.log(error);

      reject(error);
    }
  });
}

function SendRequestPassword(employeeid, title, data) {
  return new Promise((resolve, reject) => {
    try {
      let html = ForgotPasswordTemplate(data);
      SendEmployeeNotification(employeeid, title, html);
      resolve("success");
    } catch (error) {
      console.log(error);

      reject(error);
    }
  });
}

module.exports = {
  SendEmailNotification,
  SendEmailNotificationEmployee,
  SendRequestPassword,
};
