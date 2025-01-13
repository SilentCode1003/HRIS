const { DataModeling } = require("../model/hrmisdb");
const { DecrypterString } = require("./cryptography");
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

const style = /*css*/ `@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap');

* {font-family: "Merriweather", serif;font-weight: 400;}


/* desktop style */

.card-style {width: 15rem;top: 100px;}
.header-style {background-color: #fffafa !important;text-align: center;border-bottom: 5px solid red !important;}
.card-logo {margin-top: 15px;width: 55px;height: 55px;}
.header-title {font-size: 16px;color: black !important;text-shadow: rgb(58, 1, 1) 1px 1px;font-weight: 700;font-style: italic !important;letter-spacing: .05rem;padding: 15px;}
.line-title {color: black !important;padding-top: 35px;font-weight: 700;font-size: 30px;}
.icon-style {width: 30px;height: 30px;padding: 2px;color: rgb(66, 65, 65) !important;}
.shift-title {color: rgb(97, 96, 96) !important;font-size: 15px;margin-right: 0.35rem;font-weight: 600;}
hr {border-bottom-width: 3px; --tw-border-opacity: 1;border-bottom-color: rgb(97 96 96 / var(--tw-border-opacity)); margin-bottom: 1rem;}
body,table,td,a {-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;}
table,td {mso-table-rspace: 0pt;mso-table-lspace: 0pt;}
img {-ms-interpolation-mode: bicubic;}
body {margin: 0;padding: 0;width: 100% !important;-webkit-font-smoothing: antialiased;}
.container { max-width: 650px;margin: 2rem auto;}
.container-lg { max-width: 900px;margin: 2rem auto;}
.card {background-color: white !important;box-shadow: 0 .15rem 1.75rem 0 rgba(35, 36, 41, 0.15);border: 2px solid #757474 !important;border-radius: .3125rem;padding: 10px;}
.time-card {background-color: rgb(252, 251, 251) !important;border: 1px solid #757474 !important;padding: 35px;margin-top: 20px !important;}
.check {margin-top: 1rem;float: right;}
.bmss-link {color: rgb(15, 172, 15) !important;font-weight: 900;font-size: 14px;}
.bmss-link:hover {color: rgb(8, 124, 😎 !important;font-weight: 900);}
.company-link {color: black !important;font-size: 12px;font-weight: 600;}
.company-link:hover { color: red !important;font-weight: 900;}
.company-logo {width: 25px;height: 25px;}
.card-header {text-align: center;font-size: 2.5rem;padding: 10px;}
.card-body { padding: 10px;}
.card-footer { text-align: center;padding-top: 25px !important;background-color: white !important;}
.title-footer {color: black !important;font-weight: 900;font-family: 'Franklin Gothic Medium';}
.label-title {color: black !important;font-size: 18px;margin-right: 0.35rem;font-weight: 400;font-family: 'Franklin Gothic Medium';}
.start-date {color: black !important;font-size: 18px;margin-right: 0.35rem;font-weight: 400;font-family: 'Franklin Gothic Medium';padding: 2px;}
.start-time {color: rgb(23, 165, 23) !important;font-size: 18px;margin-right: 0.35rem;font-weight: 400;font-family: 'Franklin Gothic Medium';text-transform: uppercase;padding: 2px;}
.text-left {text-align: left;}
.table-container {border: 1px solid #e4e4e4;border-radius: .3125rem;width: 100%;margin: 1rem 0;}
.table {width: 100%;border-collapse: collapse;}
.table th,
.table td {padding: .75rem;text-align: left;border-bottom: 1px solid #e4e4e4;}
.table-header { background-color: #eaecf4;}
.text-md {font-size: 18px;font-weight: 400;font-family: 'Franklin Gothic Medium';}
.label-value {font-size: 18px;font-weight: 600;font-family: 'Franklin Gothic Medium';color: rgb(23, 165, 23) !important;}
.label-end {font-size: 18px;font-weight: 600;font-family: 'Franklin Gothic Medium';color: rgb(221, 14, 14) !important;}
.row {display: flex;flex-wrap: wrap;gap: 50%;padding-left: 4%;padding-right: 3%;padding-top: 1%;}
.date {margin-left: auto;float: right;}
.employeename {margin-top: 5%;padding: 2px;}
.status-context {color: black !important;font-size: 18px;font-weight: 400;font-family: 'Franklin Gothic Medium';text-transform: uppercase;}
.reason-context {color: rgb(73, 72, 72) !important;font-size: 15px;font-weight: 600;font-style: italic;}
.col-full { flex: 0 0 100%; width: 100%;}
.mt-1 {margin-top: 0.25rem;}
.col-half { margin-bottom: 1rem;flex: 1 1 0%;}
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
    <html lang="en">

<head>
    <link rel="stylesheet" href="css/template.css">

    <!--boostrap css-->
    <link rel="stylesheet" href="	https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">

    <!--bootstrap icons-->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <!--boxicons-->
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>

</head>

<body>

    <div class="container">
        <div class="card">
            <div class="card-header header-style">
                <img rel src="https://hrmis.5lsolutions.com/images/img/5L.png" alt="Logo" class="card-logo">
                <b class="header-title">Solutions Supply and Allied Services Corp.</b>
                <h2 class="line-title">${requesttype} Request</h2>
            </div>

            <div class="card-body">
                <div class="date"> 
                    <i class='bx bx-calendar-alt icon-style'></i>
                    <span class="label-title">Date:</span>
                    <span class="text-md">${date}</span>
                </div>  
        
                <div class="employeename">
                    <i class='bx bx-user icon-style'></i>
                    <span class="label-title">Employee:</span>
                    <span class="text-md">${employeename}</span>
                </div>
          

                <div class="status">
                    <i class='bx bx-stats icon-style'></i>
                    <span class="label-title">Status:</span>
                    <span class="status-context">${status}</span>
                  </div>


                  <div class="reason">
                    <i class='bx bx-message-alt-detail icon-style'></i>
                    <span class="label-title">Reason:</span>
                    <span class="reason-context">${
                      reason == undefined ? "N/A" : reason
                    }</span>
                  </div>

                <div class="card time-card">
                    <h6 class="shift-title">These are your shift records:</h6>
                <div class="row mt-4">
                    <div class="col">
                        <h6 class="label-title">${
                          timein == undefined ? "Start Date" : "Time In"
                        }:</h6>
                        <h6 class="label-value">${
                          timein == undefined ? startdate : timein
                        }</h6>
                    </div>
                </div>

                <hr className="border-b-[3px] border-b-red-800 mb-4" />

                <div class="row mt-4">
                  <div class="col">
                        <h6 class="label-title">${
                          timeout == undefined ? "Start Date" : "Time Out"
                        }:</h6>
                        <h6 class="label-value">${
                          timeout == undefined ? enddate : timeout
                        }</h6>
                    </div>
                </div>
            </div>

          
                <div class="check">
                    <a href="https://hrmis.5lsolutions.com/" class="bmss-link">Check here</a>
                </div>
            </div>

            <div class="card-footer">
                <span class="title-footer">Chronus MTK Powered by </span>
                <a href="https://www.5lsolutions.com/" class="company-link"><img src="https://hrmis.5lsolutions.com/images/img/5L.png" alt="Logo" class="company-logo">Solutions Supply and Allied Services Corp.</a>
            </div>
        </div>
    </div>



    <!-- bootstrap js -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <!--script for lordicon-->
    <script src="https://cdn.lordicon.com/lordicon.js"></script>
</body>

</html>`;

  //juice.inlineContent(template, style)
  const inlinedHtml = juice.inlineContent(template, style);
  return inlinedHtml;
};

exports.ForgotPasswordTemplate = (details) => {
  // Read and combine CSS files

  const { id, fullname, password } = details[0];

  const template = /*html*/ `
<html lang="en">
<head>
    <link rel="stylesheet" href="css/template.css">
    <!--boostrap css-->
    <link rel="stylesheet" href="	https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <!--bootstrap icons-->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <!--boxicons-->
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>

</head>

<body>

    <div class="container">
        <div class="card">
            <div class="card-header header-style">
                <img rel src="https://hrmis.5lsolutions.com/images/img/5L.png" alt="Logo" class="card-logo">
                <b class="header-title">Solutions Supply and Allied Services Corp.</b>
                <h2 class="line-title">Forgot Password</h2>
            </div>

            <div class="card-body">
                <div class="date"> 
                    <span class="label-title">ID:</span>
                    <span class="text-md">${id}</span>
                </div>
        
                    <div class="employeename">
                        <i class='bx bx-user icon-style'></i>
                        <span class="label-title">Employee:</span>
                        <span class="text-md">${fullname}</span>
                    </div>
          
                <div class="reason">
                    <i class='bx bx-stats icon-style'></i>
                    <span class="label-title">Password:</span>
                    <span class="reason-context">${DecrypterString(
                      password
                    )}</span>
                  </div>
            </div>

           



                <div class="check">
                    <a href="https://hrmis.5lsolutions.com/" class="bmss-link">Login here</a>
                </div>
            </div>

            <div class="card-footer">
                <span class="title-footer">Chronus MTK Powered by </span>
                <a href="https://www.5lsolutions.com/" class="company-link"> <img src="https://hrmis.5lsolutions.com/images/img/5L.png" alt="Logo" class="company-logo"> Solutions Supply and Allied Services Corp.</a>
            </div>
        </div>
    </div>



    <!-- bootstrap js -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <!--script for lordicon-->
    <script src="https://cdn.lordicon.com/lordicon.js"></script>
</body>

</html>`;

  //juice.inlineContent(template, style)
  const inlinedHtml = juice.inlineContent(template, style);
  return inlinedHtml;
};


exports.UnauthorizedTemplate = () => {
  const unauthorizedError = /*html*/ `
  <!DOCTYPE html>
  <html lang="en">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Expired</title>
    <!-- Bootstrap 4 CSS -->
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
      body {
        background-color: #f8f9fa;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .error-container {
        text-align: center;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 40px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      .error-title {
        font-size: 3rem;
        font-weight: 700;
        color: #dc3545;
      }

      .error-message {
        font-size: 1.25rem;
        margin: 20px 0;
        color: #6c757d;
      }
    </style>
  </head>

  <body>
    <div class="error-container">
      <h1 class="error-title">401</h1>
      <p class="error-message">Token Expired</p>
      <p>Your session has expired. Please log in again to continue.</p>
      <a href="/" class="btn btn-primary mt-3">Log In</a>
    </div>

    <!-- Bootstrap 4 JS and dependencies -->
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.4.4/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
  </body>

  </html>


  `;

  return unauthorizedError;

};
//#endregion
