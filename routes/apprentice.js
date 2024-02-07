const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();
const { generateUsernameAndPasswordforemployee } = require("./helper");
const { Encrypter } = require("./repository/crytography");
const { error } = require("jquery");

const currentYear = moment().format("YY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('announcementlayout', { title: 'Express' });

  Validator(req, res, "apprenticelayout");
});

module.exports = router;

function generateEmployeeId(year, month) {
  return new Promise((resolve, reject) => {
    const maxIdQuery = `SELECT count(*) as count FROM master_employee WHERE me_id LIKE '${year}${month}%'`;
    mysql
      .mysqlQueryPromise(maxIdQuery)
      .then((result) => {
        let currentCount = parseInt(result[0].count) + 1;
        const paddedNumericPart = String(currentCount).padStart(2, "0");

        let newEmployeeID = `${year}${month}${paddedNumericPart}`;

        resolve(newEmployeeID);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

router.get("/load", (req, res) => {
  try {
    let sql = `
        select 
        me_profile_pic,
        me_id,
        concat(me_lastname,' ',me_firstname) as me_firstname,
        md_departmentname as me_department,
        me_hiredate,
        me_jobstatus
        from master_employee
        inner join master_department on master_employee.me_department = md_departmentid
        where me_jobstatus = 'apprentice'`;

    mysql.Select(sql, "Master_Employee", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getapprentice", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
        me_profile_pic,
        concat(me_lastname,' ',me_firstname) as me_firstname,
        me_department,
        me_hiredate
        from master_employee 
        where me_id = '${employeeid}'`;

    mysql.Select(sql, "Master_Employee", (err, result) => {
      if (err) console.error("Error :", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "success",
      data: error,
    });
  }
});

router.post("/update", async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let jobstatus = req.body.jobstatus;
    let hiredate = currentDate.format("YYYY-MM-DD");

    let newEmployeeId = await generateEmployeeId(currentYear, currentMonth);
    console.log("New Employee ID:", newEmployeeId);

    const existingEmployeeData = await fetchEmployeeData(employeeid);

    if (!existingEmployeeData) {
      return res.json({
        msg: "error",
        data: existingEmployeeData,
      });
    }

    let insertEmployeeQuery = `INSERT INTO master_employee (me_id, me_firstname, me_middlename, me_lastname, me_birthday, me_gender, me_civilstatus, me_phone, me_email, me_hiredate, me_jobstatus, me_ercontactname, me_ercontactphone, me_department, me_position, me_address, me_profile_pic) VALUES (
          '${newEmployeeId}',
          '${existingEmployeeData.firstname}',
          '${existingEmployeeData.middlename}',
          '${existingEmployeeData.lastname}',
          '${existingEmployeeData.birthday}',
          '${existingEmployeeData.gender}',
          '${existingEmployeeData.civilstatus}',
          '${existingEmployeeData.phone}',
          '${existingEmployeeData.email}',
          '${hiredate}',
          '${jobstatus}',
          '${existingEmployeeData.ercontactname}',
          '${existingEmployeeData.ercontactphone}',
          '${existingEmployeeData.departmentName}',
          '${existingEmployeeData.positionName}',
          '${existingEmployeeData.address}',
          '${existingEmployeeData.profilePicturePath}'
      )`;

    console.log("Insert Employee Query:", insertEmployeeQuery);

    mysql
      .mysqlQueryPromise(insertEmployeeQuery)
      .then(async (result) => {
        console.log("Insert Employee Result:", result);

        const { username, password } = generateUsernameAndPasswordforemployee({
          me_firstname: existingEmployeeData.firstname,
          me_lastname: existingEmployeeData.lastname,
          me_id: newEmployeeId,
          me_birthday: existingEmployeeData.birthday,
        });

        Encrypter(password, async (encryptErr, encryptedPassword) => {
          if (encryptErr) {
            console.error("Error encrypting password: ", encryptErr);
            return res.json({ msg: "encrypt_error" });
          }

          const createBy = req.session.fullname; 
          const createdate = currentDate.format("YYYY-MM-DD");
          const accessType = 2; 

          let insertUserQuery = `INSERT INTO master_user (
                      mu_employeeid, 
                      mu_username, 
                      mu_password, 
                      mu_accesstype, 
                      mu_createby, 
                      mu_createdate, 
                      mu_status) VALUES (
                      '${newEmployeeId}', '${username}', '${encryptedPassword}', '${accessType}', '${createBy}', '${createdate}', 'Active')`;

          console.log("Insert User Query:", insertUserQuery);

          mysql
            .mysqlQueryPromise(insertUserQuery)
            .then((result) => {
              console.log("Insert User Result:", result);
            })
            .catch((error) => {
              console.error("Insert User Error:", error);
            });
        });

        let updateOldEmployeeQuery = `UPDATE master_employee SET me_jobstatus = 'Done Apprentice' WHERE me_id = '${employeeid}'`;

        console.log("Update Old Employee Query:", updateOldEmployeeQuery);

        mysql.mysqlQueryPromise(updateOldEmployeeQuery)
        .then((result) => {
          res.json({
            msg: 'success',
            data: result,
          });
        })
        .catch((error) => {
          res.json({
            msg: 'error',
            data: error,
          });
        });
      })
      .catch((error) => {
        console.error("Insert Employee Error:", error);
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    console.error("Overall Error:", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});


// router.post("/update", async (req, res) => {
//     try {
//         let employeeid = req.body.employeeid;
//         let jobstatus = req.body.jobstatus;
//         let hiredate = currentDate.format('YYYY-MM-DD');

//         console.log("Employee ID:", employeeid);

//         let newEmployeeId = await generateEmployeeId(currentYear, currentMonth);
//         console.log("New Employee ID:", newEmployeeId);

//         // Fetch the existing employee data before the update
//         const existingEmployeeData = await fetchEmployeeData(employeeid);

//         if (!existingEmployeeData) {
//             return res.json({
//                 msg: "error",
//                 data: "Employee data not found for the provided employeeId",
//             });
//         }

//         // Insert a new record into master_employee
//         let insertEmployeeQuery = `INSERT INTO master_employee (me_id, me_firstname, me_middlename, me_lastname, me_birthday, me_gender, me_civilstatus, me_phone, me_email, me_hiredate, me_jobstatus, me_ercontactname, me_ercontactphone, me_department, me_position, me_address, me_profile_pic) VALUES (
//             '${newEmployeeId}',
//             '${existingEmployeeData.firstname}',
//             '${existingEmployeeData.middlename}',
//             '${existingEmployeeData.lastname}',
//             '${existingEmployeeData.birthday}',
//             '${existingEmployeeData.gender}',
//             '${existingEmployeeData.civilstatus}',
//             '${existingEmployeeData.phone}',
//             '${existingEmployeeData.email}',
//             '${hiredate}',
//             '${jobstatus}',
//             '${existingEmployeeData.ercontactname}',
//             '${existingEmployeeData.ercontactphone}',
//             '${existingEmployeeData.departmentName}',
//             '${existingEmployeeData.positionName}',
//             '${existingEmployeeData.address}',
//             '${existingEmployeeData.profilePicturePath}'
//         )`;

//         console.log("Insert Employee Query:", insertEmployeeQuery);

//         mysql.mysqlQueryPromise(insertEmployeeQuery)
//             .then(async (result) => {
//                 console.log("Insert Employee Result:", result);

//                 // Generate new username and password for the employee
//                 const { username, password } = generateUsernameAndPasswordforemployee({
//                     me_firstname: existingEmployeeData.firstname,
//                     me_lastname: existingEmployeeData.lastname,
//                     me_id: newEmployeeId,
//                     me_birthday: existingEmployeeData.birthday,
//                 });

//                 Encrypter(password, async (encryptErr, encryptedPassword) => {
//                     if (encryptErr) {
//                         console.error("Error encrypting password: ", encryptErr);
//                         return res.json({ msg: "encrypt_error" });
//                     }

//                     const createBy = req.session.fullname; // Assuming user information is stored in session
//                     const currentDate = currentDate.format('YYYY-MM-DD');
//                     const accessType = 2; // Default access type

//                     // Save user record with encrypted password
//                     let insertUserQuery = `INSERT INTO master_user (
//                         mu_employeeid,
//                         mu_username,
//                         mu_password,
//                         mu_accesstype,
//                         mu_createby,
//                         mu_createdate,
//                         mu_status) VALUES (
//                         '${newEmployeeId}', '${username}', '${encryptedPassword}', '${accessType}', '${createBy}', '${currentDate}', 'Active')`;

//                     console.log("Insert User Query:", insertUserQuery);

//                     mysql.mysqlQueryPromise(insertUserQuery)
//                         .then((result) => {
//                             console.log("Insert User Result:", result);

//                             res.json({
//                                 msg: "success",
//                                 data: result,
//                             });
//                         })
//                         .catch((error) => {
//                             console.error("Insert User Error:", error);
//                             res.json({
//                                 msg: "error",
//                                 data: error,
//                             });
//                         });
//                 });
//             })
//             .catch((error) => {
//                 console.error("Insert Employee Error:", error);
//                 res.json({
//                     msg: "error",
//                     data: error,
//                 });
//             });
//     } catch (error) {
//         console.error("Overall Error:", error);
//         res.json({
//             msg: "error",
//             data: error,
//         });
//     }
// });

// async function saveUserRecord(req, res, newEmployeeId, username, encryptedPassword) {
//   try {
//     let createBy = req.session.fullname;
//     let currentDate = moment().format('YYYY-MM-DD');

//     let insertUserData = [
//       newEmployeeId,
//       username,
//       encryptedPassword,
//       2,
//       createBy,
//       currentDate,
//       "Active", // Assuming 'active' is the default status
//     ];

//     mysql.InsertTable("master_user", insertUserData, (err, result) => {
//       if (err) {
//         console.error("Error", err);
//         return res.json({ msg: 'insert_failed' });
//       }

//       console.log(result);

//     });
//   } catch (error) {
//     console.error("Error saving user record: ", error);

//     // Send the error response only once
//     if (!res.headersSent) {
//       res.json({ msg: "error", data: error });
//     }
//   }
// }

// router.post("/update", async (req, res) => {
//   try {
//     let employeeid = req.body.employeeid;
//     let jobstatus = req.body.jobstatus;
//     let hiredate = currentDate.format("YYYY-MM-DD");

//     console.log("Employee ID:", employeeid);

//     let newEmployeeId = await generateEmployeeId(currentYear, currentMonth);
//     console.log("New Employee ID:", newEmployeeId);

//     // Fetch the existing employee data before the update
//     const existingEmployeeData = await fetchEmployeeData(employeeid);

//     if (!existingEmployeeData) {
//       return res.json({
//         msg: "error",
//         data: "Employee data not found for the provided employeeId",
//       });
//     }

//     // Insert a new record into master_employee
//     let insertEmployeeQuery = `INSERT INTO master_employee (me_id, me_firstname, me_middlename, me_lastname, me_birthday, me_gender, me_civilstatus, me_phone, me_email, me_hiredate, me_jobstatus, me_ercontactname, me_ercontactphone, me_department, me_position, me_address, me_profile_pic) VALUES (
//         '${newEmployeeId}',
//         '${existingEmployeeData.firstname}',
//         '${existingEmployeeData.middlename}',
//         '${existingEmployeeData.lastname}',
//         '${existingEmployeeData.birthday}',
//         '${existingEmployeeData.gender}',
//         '${existingEmployeeData.civilstatus}',
//         '${existingEmployeeData.phone}',
//         '${existingEmployeeData.email}',
//         '${hiredate}',
//         '${jobstatus}',
//         '${existingEmployeeData.ercontactname}',
//         '${existingEmployeeData.ercontactphone}',
//         '${existingEmployeeData.departmentName}',
//         '${existingEmployeeData.positionName}',
//         '${existingEmployeeData.address}',
//         '${existingEmployeeData.profilePicturePath}'
//       )`;

//     console.log("Insert Employee Query:", insertEmployeeQuery);

//     mysql
//       .mysqlQueryPromise(insertEmployeeQuery)
//       .then(async (result) => {
//         console.log("Insert Employee Result:", result);

//         // Generate new username and password for the employee
//         const { username, password } = generateUsernameAndPasswordforemployee({
//           me_firstname: existingEmployeeData.firstname,
//           me_lastname: existingEmployeeData.lastname,
//           me_id: newEmployeeId,
//           me_birthday: existingEmployeeData.birthday,
//         });

//         Encrypter(password, async (encryptErr, encryptedPassword) => {
//           if (encryptErr) {
//             console.error("Error encrypting password: ", encryptErr);
//             return res.json({ msg: "encrypt_error" });
//           }

//           // Save user record with encrypted password
//           const result = await saveUserRecord(
//             req,
//             res,
//             newEmployeeId,
//             username,
//             encryptedPassword,
//           );

//           if (result.msg === "success") {
//             return res.json({ msg: "success" });
//           } else {
//             console.error("Error saving user record: ", result.msg);
//             return res.json({ msg: "user_save_error" });
//           }
//         });
//       })
//       .catch((error) => {
//         console.error("Insert Employee Error:", error);
//         res.json({
//           msg: "error",
//           data: error,
//         });
//       });
//   } catch (error) {
//     console.error("Overall Error:", error);
//     res.json({
//       msg: "error",
//       data: error,
//     });
//   }
// });

// router.post("/update", async (req, res) => {
//     try {
//       let employeeid = req.body.employeeid;
//       let jobstatus = req.body.jobstatus;
//       let hiredate = currentDate.format('YYYY-MM-DD');

//       console.log("Employee ID:", employeeid);

//       let newEmployeeId = await generateEmployeeId(currentYear, currentMonth);
//       console.log("New Employee ID:", newEmployeeId);

//       // Fetch the existing employee data before the update
//       const existingEmployeeData = await fetchEmployeeData(employeeid);

//       if (!existingEmployeeData) {
//         return res.json({
//           msg: "error",
//           data: "Employee data not found for the provided employeeId",
//         });
//       }

//       // Insert a new record into master_employee
//       let insertEmployeeQuery = `INSERT INTO master_employee (me_id, me_firstname, me_middlename, me_lastname, me_birthday, me_gender, me_civilstatus, me_phone, me_email, me_hiredate, me_jobstatus, me_ercontactname, me_ercontactphone, me_department, me_position, me_address, me_profile_pic) VALUES (
//         '${newEmployeeId}',
//         '${existingEmployeeData.firstname}',
//         '${existingEmployeeData.middlename}',
//         '${existingEmployeeData.lastname}',
//         '${existingEmployeeData.birthday}',
//         '${existingEmployeeData.gender}',
//         '${existingEmployeeData.civilstatus}',
//         '${existingEmployeeData.phone}',
//         '${existingEmployeeData.email}',
//         '${hiredate}',
//         '${jobstatus}',
//         '${existingEmployeeData.ercontactname}',
//         '${existingEmployeeData.ercontactphone}',
//         '${existingEmployeeData.departmentName}',
//         '${existingEmployeeData.positionName}',
//         '${existingEmployeeData.address}',
//         '${existingEmployeeData.profilePicturePath}'
//       )`;

//       console.log("Insert Employee Query:", insertEmployeeQuery);

//       // Insert new record into master_employee
//       mysql.mysqlQueryPromise(insertEmployeeQuery)
//         .then(async (result) => {
//           console.log("Insert Employee Result:", result);

//           // Generate new username and password for the employee
//           const { username, password } = generateUsernameAndPasswordforemployee({
//             me_firstname: existingEmployeeData.firstname,
//             me_lastname: existingEmployeeData.lastname,
//             me_id: newEmployeeId,
//             me_birthday: existingEmployeeData.birthday,
//           });

//           Encrypter(password, async (encryptErr, encryptedPassword) => {
//             if (encryptErr) {
//               console.error("Error encrypting password: ", encryptErr);
//               return res.json({ msg: "encrypt_error" });
//             }

//             const createBy = req.session.user; // Assuming user information is stored in session
//             const currentDate = new Date().toISOString().slice(0, 19).replace("T", " "); // Current date in YYYY-MM-DD HH:mm:ss format
//             const accessType = 2; // Default access type

//             // Save user record with encrypted password
//             const userSaveResult = await saveUserRecord(
//               req,
//               employeeId,
//               username,
//               encryptedPassword,
//               accessType,
//               createBy,
//               currentDate
//             );

//             if (userSaveResult.msg === "success") {
//               return res.json({ msg: "success" });
//             } else {
//               console.error("Error saving user record: ", userSaveResult.msg);
//               return res.json({ msg: "user_save_error" });
//             }
//           });

//           let insertUserQuery = `INSERT INTO master_user (mu_employeeid, mu_username, mu_password) VALUES ('${newEmployeeId}', '${username}', '${password}')`;

//           console.log("Insert User Query:", insertUserQuery);
//           mysql.mysqlQueryPromise(insertUserQuery)
//             .then((result) => {
//               console.log("Insert User Result:", result);

//               res.json({
//                 msg: "success",
//                 data: result,
//               });
//             })
//             .catch((error) => {
//               console.error("Insert User Error:", error);
//               res.json({
//                 msg: "error",
//                 data: error,
//               });
//             });
//         })
//         .catch((error) => {
//           console.error("Insert Employee Error:", error);
//           res.json({
//             msg: "error",
//             data: error,
//           });
//         });
//     } catch (error) {
//       console.error("Overall Error:", error);
//       res.json({
//         msg: "error",
//         data: error,
//       });
//     }
//   });

function fetchEmployeeData(employeeid) {
  return new Promise((resolve, reject) => {
    const query = ` select 
    me_firstname as firstname,
    me_middlename as middlename,
    me_lastname as lastname,
    me_birthday as birthday,
    me_gender as gender,
    me_civilstatus as civilstatus,
    me_phone as phone,
    me_email as email,
    me_ercontactname as ercontactname,
    me_ercontactphone as ercontactphone,
    me_department as departmentName,
    me_position as positionName,
    me_address as address,
    me_profile_pic as profilePicturePath
    from master_employee
    where me_id = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(query)
      .then((result) => {
        if (result && result.length > 0) {
          const employeeData = result[0];
          resolve(employeeData);
        } else {
          resolve(null);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// router.post("/update", async (req, res) => {
//     try {
//       const employeeIdToUpdate = req.body.employeeid;

//       console.log(employeeIdToUpdate);

//       // Fetch existing employee data based on the employeeId
//       const existingEmployeeData = await fetchEmployeeData(employeeIdToUpdate);

//       if (!existingEmployeeData) {
//         return res.json({ msg: "employee_not_found" });
//       }

//       // Update the job status to probationary
//       existingEmployeeData.jobstatus = "probationary";

//       // Generate new employee ID for the updated employee
//       const newEmployeeId = await generateEmployeeId(currentYear, currentMonth);

//       // Update hire date to the current date
//       const currentDate = new Date().toISOString().slice(0, 10);
//       existingEmployeeData.hiredate = currentDate;

//       // Directly use department and position names for insertion
//       const updatedEmployeeData = [
//         [
//           newEmployeeId,
//           existingEmployeeData.firstname,
//           existingEmployeeData.middlename,
//           existingEmployeeData.lastname,
//           existingEmployeeData.birthday,
//           existingEmployeeData.gender,
//           existingEmployeeData.civilstatus,
//           existingEmployeeData.phone,
//           existingEmployeeData.email,
//           existingEmployeeData.hiredate,
//           existingEmployeeData.jobstatus,
//           existingEmployeeData.ercontactname,
//           existingEmployeeData.ercontactphone,
//           existingEmployeeData.departmentName,
//           existingEmployeeData.positionName,
//           existingEmployeeData.address,
//           existingEmployeeData.profilePicturePath,
//         ],
//       ];

//       console.log(updatedEmployeeData);

//       mysql.InsertTable("master_employee", updatedEmployeeData, async (insertErr, insertResult) => {
//         if (insertErr) {
//           console.error("Error inserting updated employee record: ", insertErr);
//           return res.json({ msg: "insert_failed" });
//         }

//         console.log("Updated employee record inserted: ", insertResult);

//         try {
//           // Generate username and password for the updated employee
//           const { username, password } = generateUsernameAndPasswordforemployee({
//             me_firstname: existingEmployeeData.firstname,
//             me_lastname: existingEmployeeData.lastname,
//             me_id: newEmployeeId,
//             me_birthday: existingEmployeeData.birthday,
//           });

//           // Encrypt the password
//           Encrypter(password, async (encryptErr, encryptedPassword) => {
//             if (encryptErr) {
//               console.error("Error encrypting password: ", encryptErr);
//               return res.json({ msg: "encrypt_error" });
//             }

//             // Save user record for the updated employee
//             const userSaveResult = await saveUserRecord(
//               req,
//               newEmployeeId,
//               username,
//               encryptedPassword
//             );

//             if (userSaveResult.msg === "success") {
//               // Optionally, you can update the existing employee record in your database
//               // with the new job status or perform any other necessary updates.

//               return res.json({ msg: "success" });
//             } else {
//               console.error("Error saving user record: ", userSaveResult.msg);
//               return res.json({ msg: "user_save_error" });
//             }
//           });
//         } catch (error) {
//           console.error("Error generating username and password: ", error);
//           return res.json({ msg: "username_password_generation_error" });
//         }
//       });
//     } catch (error) {
//       console.error("Error in /update route: ", error);
//       return res.json({ msg: "error" });
//     }
//   });

//   async function saveUserRecord(req, employeeId, username, encryptedPassword) {
//     return new Promise((resolve, reject) => {
//       const createdate = moment().format('YYYY-MM-DD');
//       const createby = req.session ? req.session.fullname : null;

//       console.log("Session:", req.session);

//       const data = [
//         [
//           employeeId,
//           username,
//           encryptedPassword,
//           2,
//           createby,
//           createdate,
//           "Active",
//         ],
//       ];

//       mysql.InsertTable("master_user", data, (inserterr, insertResult) => {
//         if (inserterr) {
//           console.error("Error inserting user record: ", inserterr);
//           reject({ msg: "insert_failed" });
//         } else {
//           console.log("User record inserted: ", insertResult);
//           resolve({ msg: "success" });
//         }
//       });
//     });
//   }

//   function fetchEmployeeData(employeeId) {
//     return new Promise((resolve, reject) => {
//       const query = `SELECT * FROM master_employee WHERE me_id = '${employeeId}'`;

//       mysql
//         .mysqlQueryPromise(query)
//         .then((result) => {
//           if (result && result.length > 0) {
//             const employeeData = result[0];
//             resolve(employeeData);
//           } else {
//             resolve(null); // Resolve with null if no data is found for the employeeId
//           }
//         })
//         .catch((error) => {
//           reject(error);
//         });
//     });
//   }
