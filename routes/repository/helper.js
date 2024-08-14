const { DataModeling } = require("../model/hrmisdb");
const { Select } = require("./dbconnect");
const { SendEmail } = require("./mailer");

if (typeof ReadableStream === "undefined") {
  global.ReadableStream =
    require("web-streams-polyfill/polyfill").ReadableStream;
}
const juice = require("juice");

exports.generateUsernameAndPassword = (employee) => {
  try {
    const {
      me_id: employeeid,
      me_firstname: firstname,
      me_lastname: lastname,
      me_birthday: birthday,
    } = employee;

    // const username = (firstname.charAt(0) + lastname).toLowerCase();

    // const password = employeeid + birthday.replace(/-/g, "");

    function sanitizeName(name) {
      return name.replace(/\s+/g, "").replace(/(jr|sr)$/i, "");
    }

    const sanitizedFirstname = sanitizeName(firstname.charAt(0).toLowerCase());
    const sanitizedLastname = sanitizeName(lastname.toLowerCase());

    const username = sanitizedFirstname + sanitizedLastname;
    const password = employeeid + birthday.replace(/-/g, "");

    return { username, password };
  } catch (error) {
    console.log(error);
  }
};

// exports.generateUsernameAndPasswordforemployee = (employee) => {
//   try {
//     const {
//       me_id: newEmployeeId,
//       me_firstname: firstname,
//       me_lastname: lastname,
//       me_birthday: birthday,
//     } = employee;

//     const username = firstname.toLowerCase() + lastname.charAt(0).toLowerCase();

//     const password = newEmployeeId + birthday.replace(/-/g, "");

//     return { username, password };
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.generateUsernameAndPasswordforemployee = (employee) => {
  try {
    const {
      me_id: newEmployeeId,
      me_firstname: firstname,
      me_lastname: lastname,
      me_birthday: birthday,
    } = employee;

    function sanitizeName(name) {
      return name.replace(/\s+/g, "").replace(/(jr|sr)$/i, "");
    }

    const sanitizedFirstname = sanitizeName(firstname.charAt(0).toLowerCase());
    const sanitizedLastname = sanitizeName(lastname.toLowerCase());

    const username = sanitizedFirstname + sanitizedLastname;
    const password = newEmployeeId + birthday.replace(/-/g, "");

    return { username, password };
  } catch (error) {
    console.log(error);
  }
};

exports.generateUsernameAndPasswordForApprentice = (apprentice) => {
  try {
    const {
      apprentice_id: newApprenticeId,
      apprentice_firstname: firstname,
      apprentice_lastname: lastname,
      apprentice_birthday: birthday,
    } = apprentice;

    // Generate username by combining the first name and the first letter of the last name
    const username = firstname.charAt(0).toLowerCase() + lastname.toLowerCase();

    // Generate the password by combining apprentice id and birthday
    const password = newApprenticeId + birthday.replace(/-/g, "");

    return { username, password };
  } catch (error) {
    console.log(error);
  }
};

exports.generateUsernamefoApplicant = (applicant) => {
  try {
    const { map_applicantid: newApplicantId, map_nickname: nickname } =
      applicant;

    const username = nickname.toLowerCase() + newApplicantId;

    return { username };
  } catch (error) {
    console.log(error);
  }
};

exports.UserLogin = (result, callback) => {
  try {
    const userData = [];

    result.forEach((row) => {
      userData.push({
        employeeid: row.employeeid,
        fullname: row.fullname,
        accesstype: row.accesstype,
        departmentid: row.departmentid,
        isgeofence: row.isgeofence,
        departmentname: row.departmentname,
        position: row.position,
        jobstatus: row.jobstatus,
        geofenceid: row.geofenceid,
        accesstypeid: row.accesstypeid,
        subgroupid: row.subgroupid,
        image: row.image,
      });
    });

    return userData;
  } catch (error) {
    console.log(error);
    callback(error);
  }
};

// exports.TeamLeadLogin = (result, callback) => {
//   try {
//     const tlData = [];

//     result.forEach((row) => {
//       tlData.push({
//         image: row.image,
//         employeeid: row.employeeid,
//         fullname: row.fullname,
//         accesstype: row.accesstype,
//         departmentid: row.departmentid,
//         departmentname: row.departmentname,
//         position: row.position,
//         jobstatus: row.jobstatus,
//         geofenceid: row.geofenceid,
//         subgroupid: row.subgroupid,
//         accesstypeid: row.accesstypeid,
//       });
//     });

//     return tlData;
//   } catch (error) {
//     console.log(error);
//     callback(error);
//   }
// };

exports.OjtLogin = (result, callback) => {
  try {
    const ojtData = [];

    result.forEach((row) => {
      ojtData.push({
        image: row.image,
        ojtid: row.ojtid,
        fullname: row.fullname,
        accesstype: row.accesstype,
        departmentid: row.departmentid,
        status: row.status,
      });
    });

    return ojtData;
  } catch (error) {
    console.log(error);
    callback(error);
  }
};

exports.showSweetAlert = (title, text, icon, buttonText) => {
  try {
    swal({
      title: title,
      text: text,
      icon: icon,
      button: buttonText,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.generateUsernameAndPasswordforOjt = (ojt) => {
  try {
    const {
      mo_name: firstname,
      mo_lastname: lastname,
      mo_id: ojtID,
      mo_birthday: birthday,
    } = ojt;

    // Generate username by combining the first name and the first letter of the last name
    const username = firstname.toLowerCase() + lastname.charAt(0).toLowerCase();

    // Generate the password by combining employee id and birthday
    const password = ojtID + birthday.replace(/-/g, "");

    return { username, password };
  } catch (error) {
    console.log(error);
  }
};

// Example of how to use the custom function:
// showSweetAlert("success", "Log in Successfully", "success", "Let's go!");
// showSweetAlert("incorrect", "Incorrect Credentials. Please try again!", "error", "AWW NO!!!");

//#region SLQ SNIPPET CODE
exports.InsertStatement = (tablename, prefix, columns) => {
  let cols = "";

  columns.forEach((col) => {
    cols += `${prefix}_${col},`;
  });

  cols = cols.slice(0, -1);

  let statement = `INSERT INTO ${tablename}(${cols}) VALUES ?`;

  return statement;
};

exports.UpdateStatement = (tablename, prefix, columns, arguments) => {
  let cols = "";
  let agrs = "";

  columns.forEach((col) => {
    cols += `${prefix}_${col} = ?,`;
  });

  arguments.forEach((arg) => {
    agrs += `${prefix}_${arg} = ? AND `;
  });

  cols = cols.slice(0, -1);
  agrs = agrs.slice(0, -5);

  let statement = `UPDATE ${tablename} SET ${cols} WHERE ${agrs}`;

  return statement;
};

exports.SelectStatement = (str, data) => {
  let statement = "";
  let found = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "?") {
      statement += `'${data[found]}'`;
      found += 1;
    } else {
      statement += str[i];
    }
  }
  return statement;
};

//#endregion

//#region Email Notification

exports.SendNotification = (subgroupid, requesttype, body) => {
  try {
    let sql = `select me_email as s_email, s_name as s_subgroup,
                concat(me_firstname, '', me_lastname) as s_fullname 
                from master_employee
                inner join master_user on me_id = mu_employeeid
                inner join user_subgroup on us_userid = mu_userid
                inner join subgroup on s_id = us_subgroupid
                where s_id = ?`;

    let cmd = this.SelectStatement(sql, [subgroupid]);
    let emailList = "";

    Select(cmd, (err, result) => {
      if (err) {
        console.log(err);
      }

      if (result.length > 0) {
        let data = DataModeling(result, "s_");

        data.forEach((d) => {
          emailList += d.email + ",";
        });

        SendEmail(emailList.slice(0, -1), requesttype, body);
      }
    });
  } catch (error) {
    throw error;
  }
};

exports.SendEmployeeNotification = (employeeid, requesttype, body) => {
  try {
    let sql = `select 
              me_email
              from master_employee
              where me_id=?`;

    let cmd = this.SelectStatement(sql, [employeeid]);
    let emailList = "";

    Select(cmd, (err, result) => {
      if (err) {
        console.log(err);
      }

      if (result.length > 0) {
        let data = DataModeling(result, "me_");

        data.forEach((d) => {
          emailList += d.email + ",";
        });

        SendEmail(emailList.slice(0, -1), requesttype, body);
      }
    });
  } catch (error) {
    throw error;
  }
};

const style = /*css*/ `@import url('https://fonts.googleapis.com/css2?family=Share+Tech&display=swap');
  body, table, td, a {-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;}
  table, td {mso-table-rspace: 0pt;mso-table-lspace: 0pt;}
  img {-ms-interpolation-mode: bicubic;}
  body {margin: 0; padding: 0; width: 100% !important;-webkit-font-smoothing: antialiased;}
  .container {max-width: 650px; margin: 2rem auto;}
  .container-lg {max-width: 900px; margin: 2rem auto;}
  .card {background-color: #fff; box-shadow: 0 .15rem 1.75rem 0 rgba(58, 59, 69, 0.15); border: 1px solid #dadada; border-radius: .3125rem; padding: 10px;}
  .card-header {text-align: center; font-size: 2.5rem; color: #B13434; padding: 10px;}
  .card-body {padding: 10px;}
  .card-footer {text-align: center; padding: 10px;}
  .divider {border: solid 1px #e4e4e4;}
  .label-title {color: #B13434; font-size: 1.25rem; margin-right: 0.35rem;}
  .text-left {text-align: left;}
  .table-container {border: 1px solid #e4e4e4; border-radius: .3125rem; width: 100%; margin: 1rem 0;}
  .table {width: 100%; border-collapse: collapse;}
  .table th, .table td {padding: .75rem; text-align: left; border-bottom: 1px solid #e4e4e4;}
  .table-header {background-color: #eaecf4;}
  .bmss-link {color: #d82a27;}
  .text-md {font-size: 1.25rem;}
  .row {display: flex; flex-wrap: wrap;}
  .col-full {flex: 0 0 100%; width: 100%;}
  .mt-1 {margin-top: 0.25rem;}
  .col-half {flex:0 0 50%;width:50%}
  .text-right {text-align: right !important;}`;

exports.EmailNotification = (details) => {
  // Read and combine CSS files

  const {
    employeename,
    date,
    timein,
    timeout,
    reason,
    requesttype,
    startdate,
    enddate,
    status,
  } = details[0];

  const template = /*html*/ `
    <html>
    <head>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="card-header">
                    ${requesttype} Request
                </div>
                <hr class="divider">
                <div class="card-body">
                    <div class="row">
                        <div class="col-half">
                            <span class="label-title">Employee:</span>
                            <span class="text-md">${employeename}</span>
                        </div>
                        <div class="col-half">
                            <span class="label-title">Date:</span>
                            <span class="text-md">${date}</span>
                        </div>
                    </div>
                    <div class="row mt 1">
                        <div class="col-half">
                            <span class="label-title">${
                              timein == undefined ? "Start Date" : "Time In"
                            } :</span>
                            <span class="text-md">${
                              timein == undefined ? startdate : timein
                            }</span>
                        </div>
                        <div class="col-half">
                            <span class="label-title">${
                              timeout == undefined ? "End Date" : "Time Out"
                            } :</span>
                            <span class="text-md">${
                              timeout == undefined ? enddate : timeout
                            }</span>
                        </div>
                    </div>

                    <div class="row mt-1">
                        <div class="col-full">
                            <span class="label-title">${
                              reason == undefined ? "Status" : "Reason"
                            }:</span>
                            <span class="text-md">${
                              reason == undefined ? status : reason
                            }</span>
                        </div>
                    </div>

                    

                    <div style="margin-top: 1rem;">
                    <a href="https://hrmis.5lsolutions.com/" class="bmss-link">CHECK</a>
                      </div>
                </div>
                <hr class="divider">
                <div class="card-footer">
                    <span>Chronus MTK Powered by </span> 
                    <a href="https://www.5lsolutions.com/" class="bmss-link">5L Solutions</a>
                </div>
            </div>
        </div>
    </body>
    </html>`;

  //juice.inlineContent(template, style)
  const inlinedHtml = juice.inlineContent(template, style);
  return inlinedHtml;
};

//#endregion
