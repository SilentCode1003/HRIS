var express = require("express");
var router = express.Router();

const mysql = require("./repository/hrmisdb");
const moment = require("moment");
const multer = require("multer");
const XLSX = require("xlsx");
const { Validator } = require("./controller/middleware");
const { convertExcelDate } = require("./repository/customhelper");
const { Encrypter } = require("./repository/crytography");
const { generateUsernameAndPasswordForApprentice } = require("./helper");
const { generateUsernameAndPasswordforemployee } = require("./helper");

const apprenticecurrentYear = moment().format("YYYY");
const currentYear = moment().format("YY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('employeelayout', { title: 'Express' });

  Validator(req, res, "employeelayout");
});

module.exports = router;

router.post("/upload", (req, res) => {
  const { data } = req.body;
  let dataJson = JSON.parse(data);
  let inputFormat = "DD/MM/YYYY";

  let counter = 0;

  console.log(dataJson);
  dataJson.forEach((key, item) => {
    // console.log("Department: ", key.department);
    // console.log("Employee Id: ", key.position);
    GetDepartment(key.department, (err, result) => {
      if (err) console.log("Error: ", err);
      let departmentid = result[0].departmentid;
      GetPosition(key.position, (err, result) => {
        if (err) console.log("Error: ", err);
        let positionid = result[0].positionid;
        counter += 1;

        // let dateofbirth = moment(key.dateofbirth, "MM/DD/YYYY").format(
        //   "YYYY-MM-DD"
        // );

        let dateofbirth = convertExcelDate(key.dateofbirth);
        let datehired = convertExcelDate(key.hiredate);
        // let datehired = moment(key.hiredate, "MM/DD/YYYY").format("YYYY-MM-DD");
        console.log("Birth Date", dateofbirth, "Date Hired", datehired);

        master_employee = [
          [
            key.id,
            key.firstname,
            key.middlename,
            key.lastname,
            dateofbirth,
            key.gender,
            key.civilstatus,
            key.contactno,
            key.email,
            datehired,
            key.jobstatus,
            key.econtactname,
            key.econtactno,
            departmentid,
            positionid,
            key.address,
            "",
          ],
        ];

        console.log(master_employee);
        mysql.InsertTable("master_employee", master_employee, (err, result) => {
          if (err) console.error("Error: ", err);

          console.log(result);
        });
      });
    });

    if (counter == dataJson.length) {
      res.json({
        msg: "success",
      });
    }
  });
});

router.post("/getemployeeprofile", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `
    SELECT 
    me_id AS employeeid,
    CONCAT(me_firstname, ' ', me_lastname) AS firstname,
    md_departmentname AS department,
    mp_positionname AS position,
    me_phone AS contact,
    CONCAT(
        TIMESTAMPDIFF(YEAR, me_hiredate, CURRENT_DATE), ' Years ',
        TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) % 12, ' Months ',
        DATEDIFF(CURRENT_DATE, DATE_ADD(me_hiredate, INTERVAL TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) MONTH)), ' Days'
    ) AS tenure
    FROM 
    master_employee
    LEFT JOIN 
    master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN 
    master_position ON master_employee.me_position = mp_positionid
    where me_id = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          error,
        });
      });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/getemployeeprofileforappbasicinformation", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
    me_id AS employeeid,
    md_departmentname AS department,
    mp_positionname AS position,
    md_departmenthead AS departmenthead,
    me_jobstatus AS jobstatus,
    me_hiredate AS hiredate,
    CONCAT(
        TIMESTAMPDIFF(YEAR, me_hiredate, CURRENT_DATE), ' Years ',
        TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) % 12, ' Months ',
        DATEDIFF(CURRENT_DATE, DATE_ADD(me_hiredate, INTERVAL TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) MONTH)), ' Days'
    ) AS tenure
    FROM 
    master_employee
    LEFT JOIN 
    master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN 
    master_position ON master_employee.me_position = mp_positionid
    where me_id = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          error,
        });
      });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});


router.post("/getemployee", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `    
    SELECT
    me_id as employeeid,
    me_firstname as firstname,
    me_middlename as middlename,
    me_lastname as lastname,
    me_birthday as birthday,
    me_gender as gender,
    me_civilstatus as civilstatus,
    me_phone as phone,
    me_email as email,
    me_hiredate as hiredate,
    me_jobstatus as jobstatus,
    me_ercontactname as ercontactname,
    me_ercontactphone as ercontactphone,
    me_department as department,
    me_position as position,
    me_address as address,
    me_profile_pic as profilePicturePath
    FROM master_employee me
    WHERE me_id = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.get("/loadedit", (req, res) => {
  try {
    let sql = ` SELECT
    me_id,
    CONCAT(master_employee.me_firstname, " ", master_employee.me_lastname) AS me_firstname,
    me_phone,
    me_email,
    me_jobstatus,
    md_departmentname AS me_department,
    mp_positionname AS me_position
    FROM
    master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid`;

    mysql.Select(sql, "Master_Employee", (err, result) => {
      if (err) {
        console.error("Error: ", err);
        res.status(500).json({ msg: "Error fetching data" });
        return;
      }

      res.json({ msg: "success", data: result });
    });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = ` 
    SELECT
    me_profile_pic as image,
    me_id as newEmployeeId,
    CONCAT(master_employee.me_lastname, " ", master_employee.me_firstname) AS firstname,
    me_phone as phone,
    me_email as email,
    me_jobstatus as jobstatus,
    md_departmentname AS me_department,
    mp_positionname AS me_position
    FROM
    master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    WHERE
    me_jobstatus IN ('regular', 'probitionary','apprentice')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});

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

function generateApprenticeId(year, month) {
  return new Promise((resolve, reject) => {
    const maxIdQuery = `SELECT count(*) as count FROM master_employee WHERE me_id LIKE '${year}${month}%'`;
    // Replace 'apprentice_table' with the actual table name where apprentice IDs are stored

    mysql
      .mysqlQueryPromise(maxIdQuery)
      .then((result) => {
        let currentCount = parseInt(result[0].count) + 1;
        const paddedNumericPart = String(currentCount).padStart(2, "0");

        let newApprenticeID = `${year}${month}${paddedNumericPart}`;

        resolve(newApprenticeID);
      })
      .catch((error) => {
        reject(error);
      });
  });
}



router.post("/save", async (req, res) => {
  try {
    const {
      firstname,
      middlename,
      lastname,
      birthday,
      gender,
      civilstatus,
      phone,
      email,
      hiredate,
      jobstatus,
      ercontactname,
      ercontactphone,
      departmentName,
      positionName,
      address,
      profilePicturePath,
    } = req.body;

    const employeeExists = await checkEmployeeExists(firstname, lastname);

    if (employeeExists) {
      return res.json({ msg: "exist" });
    }

    let employeeId, username, password;

    if (jobstatus === "apprentice") {
      // If jobstatus is apprentice, generate apprentice ID
      employeeId = await generateApprenticeId(apprenticecurrentYear, currentMonth);
      
      // Generate username and password for apprentice
      ({ username, password } = generateUsernameAndPasswordForApprentice({
        apprentice_firstname: firstname,
        apprentice_lastname: lastname,
        apprentice_id: employeeId,
        apprentice_birthday: birthday,
      }));
    } else {
      // If jobstatus is not apprentice, generate employee ID
      employeeId = await generateEmployeeId(currentYear, currentMonth);

      // Generate username and password for employee
      ({ username, password } = generateUsernameAndPasswordforemployee({
        me_firstname: firstname,
        me_lastname: lastname,
        me_id: employeeId,
        me_birthday: birthday,
      }));
    }

    // Directly use department and position names for insertion
    const employeeData = [
      [
        employeeId,
        firstname,
        middlename,
        lastname,
        birthday,
        gender,
        civilstatus,
        phone,
        email,
        hiredate,
        jobstatus,
        ercontactname,
        ercontactphone,
        departmentName,
        positionName,
        address,
        profilePicturePath,
      ],
    ];

    mysql.InsertTable(
      "master_employee",
      employeeData,
      async (insertErr, insertResult) => {
        if (insertErr) {
          console.error("Error inserting employee record: ", insertErr);
          return res.json({ msg: "insert_failed" });
        }

        console.log("Employee record inserted: ", insertResult);

        Encrypter(password, async (encryptErr, encryptedPassword) => {
          if (encryptErr) {
            console.error("Error encrypting password: ", encryptErr);
            return res.json({ msg: "encrypt_error" });
          }

          // Save user record
          const userSaveResult = await saveUserRecord(
            req,
            employeeId,
            username,
            encryptedPassword
          );

          if (userSaveResult.msg === "success") {
            return res.json({ msg: "success" });
          } else {
            console.error("Error saving user record: ", userSaveResult.msg);
            return res.json({ msg: "user_save_error" });
          }
        });
      }
    );
  } catch (error) {
    console.error("Error in /save route: ", error);
    return res.json({ msg: "error" });
  }
});



// router.post("/save", async (req, res) => {
//   try {
//     const {
//       firstname,
//       middlename,
//       lastname,
//       birthday,
//       gender,
//       civilstatus,
//       phone,
//       email,
//       hiredate,
//       jobstatus,
//       ercontactname,
//       ercontactphone,
//       departmentName,
//       positionName,
//       address,
//       profilePicturePath,
//     } = req.body;

//     const employeeExists = await checkEmployeeExists(firstname, lastname);

//     if (employeeExists) {
//       return res.json({ msg: "exist" });
//     }

//     const employeeId = await generateEmployeeId(currentYear, currentMonth);

//     // Directly use department and position names for insertion
//     const employeeData = [
//       [
//         employeeId,
//         firstname,
//         middlename,
//         lastname,
//         birthday,
//         gender,
//         civilstatus,
//         phone,
//         email,
//         hiredate,
//         jobstatus,
//         ercontactname,
//         ercontactphone,
//         departmentName,
//         positionName,
//         address,
//         profilePicturePath,
//       ],
//     ];

//     mysql.InsertTable(
//       "master_employee",
//       employeeData,
//       async (insertErr, insertResult) => {
//         if (insertErr) {
//           console.error("Error inserting employee record: ", insertErr);
//           return res.json({ msg: "insert_failed" });
//         }

//         console.log("Employee record inserted: ", insertResult);

//         const { username, password } = generateUsernameAndPasswordforemployee({
//           me_firstname: firstname,
//           me_lastname: lastname,
//           me_id: employeeId,
//           me_birthday: birthday,
//         });

//         Encrypter(password, async (encryptErr, encryptedPassword) => {
//           if (encryptErr) {
//             console.error("Error encrypting password: ", encryptErr);
//             return res.json({ msg: "encrypt_error" });
//           }

//           // Save user record
//           const userSaveResult = await saveUserRecord(
//             req,
//             employeeId,
//             username,
//             encryptedPassword
//           );

//           if (userSaveResult.msg === "success") {
//             return res.json({ msg: "success" });
//           } else {
//             console.error("Error saving user record: ", userSaveResult.msg);
//             return res.json({ msg: "user_save_error" });
//           }
//         });
//       }
//     );
//   } catch (error) {
//     console.error("Error in /save route: ", error);
//     return res.json({ msg: "error" });
//   }
// });

// router.post('/save', async (req, res) => {
//   try {
//     const {
//       firstname,
//       middlename,
//       lastname,
//       birthday,
//       gender,
//       civilstatus,
//       phone,
//       email,
//       hiredate,
//       jobstatus,
//       ercontactname,
//       ercontactphone,
//       departmentName,
//       positionName,
//       address,
//       profilePicturePath,
//     } = req.body;

//     const employeeExists = await checkEmployeeExists(firstname, lastname);

//     if (employeeExists) {
//       return res.json({ msg: 'exist' });
//     }

//     const employeeId = await generateEmployeeId(currentYear, currentMonth);

//     const departmentIdQuery = `SELECT md_departmentid FROM master_department WHERE md_departmentname = '${departmentName}'`;

//     try {
//       const departmentIdResult = await mysql.mysqlQueryPromise(departmentIdQuery);
//       const departmentId = departmentIdResult[0].md_departmentid;

//       const positionIdQuery = `SELECT mp_positionid FROM master_position WHERE mp_positionname = '${positionName}'`;

//       try {
//         const positionIdResult = await mysql.mysqlQueryPromise(positionIdQuery);
//         const positionId = positionIdResult[0].mp_positionid;

//         const employeeData = [
//           [employeeId, firstname, middlename, lastname, birthday, gender, civilstatus,
//             phone, email, hiredate, jobstatus, ercontactname, ercontactphone,
//             departmentId, positionId, address, profilePicturePath],
//         ];

//         mysql.InsertTable('master_employee', employeeData, async (insertErr, insertResult) => {
//           if (insertErr) {
//             console.error('Error inserting employee record: ', insertErr);
//             return res.json({ msg: 'insert_failed' });
//           }

//           console.log('Employee record inserted: ', insertResult);

//           const { username, password } = generateUsernameAndPasswordforemployee({
//             me_firstname: firstname,
//             me_lastname: lastname,
//             me_id: employeeId,
//             me_birthday: birthday,
//           });

//           Encrypter(password, async (encryptErr, encryptedPassword) => {
//             if (encryptErr) {
//               console.error('Error encrypting password: ', encryptErr);
//               return res.json({ msg: 'encrypt_error' });
//             }

//             // Save user record
//             const userSaveResult = await saveUserRecord(req, employeeId, username, encryptedPassword);

//             if (userSaveResult.msg === 'success') {
//               return res.json({ msg: 'success' });
//             } else {
//               console.error('Error saving user record: ', userSaveResult.msg);
//               return res.json({ msg: 'user_save_error' });
//             }
//           });
//         });
//       } catch (positionIdError) {
//         console.error('Error fetching position ID: ', positionIdError);
//         return res.json({ msg: 'position_id_fetch_error' });
//       }
//     } catch (departmentIdError) {
//       console.error('Error fetching department ID: ', departmentIdError);
//       return res.json({ msg: 'department_id_fetch_error' });
//     }
//   } catch (error) {
//     console.error('Error in /save route: ', error);
//     return res.json({ msg: 'error' });
//   }
// });

// router.post("/save", async (req, res) => {
//   try {
//     let firstname = req.body.firstname;
//     let middlename = req.body.middlename;
//     let lastname = req.body.lastname;
//     let birthday = req.body.birthday;
//     let gender = req.body.gender;
//     let civilstatus = req.body.civilstatus;
//     let phone = req.body.phone;
//     let email = req.body.email;
//     let hiredate = req.body.hiredate;
//     let jobstatus = req.body.jobstatus;
//     let ercontactname = req.body.ercontactname;
//     let ercontactphone = req.body.ercontactphone;
//     let departmentName = req.body.department;
//     let positionName = req.body.position;
//     let address = req.body.address;
//     let profilePicturePath = req.body.profilePicturePath;
//     let data = [];

//     const employeeExists = await checkEmployeeExists(firstname, lastname);

//     if (employeeExists) {
//       // The employee already exists
//       res.json({ msg: "exist" });
//       return;
//     }

//     generateEmployeeId(currentYear, currentMonth)
//       .then(async (newEmployeeId) => {
//         // Check if the employee ID already exists in the table

//         // Fetch the department ID based on the department name
//         const departmentIdQuery = `SELECT md_departmentid FROM master_department WHERE md_departmentname = '${departmentName}'`;

//         try {
//           const departmentIdResult = await mysql.mysqlQueryPromise(
//             departmentIdQuery
//           );
//           const departmentId = departmentIdResult[0].md_departmentid;

//           // Fetch the position ID based on the position name
//           const positionIdQuery = `SELECT mp_positionid FROM master_position WHERE mp_positionname = '${positionName}'`;

//           try {
//             const positionIdResult = await mysql.mysqlQueryPromise(
//               positionIdQuery
//             );
//             const positionId = positionIdResult[0].mp_positionid;

//             data.push([
//               newEmployeeId,
//               firstname,
//               middlename,
//               lastname,
//               birthday,
//               gender,
//               civilstatus,
//               phone,
//               email,
//               hiredate,
//               jobstatus,
//               ercontactname,
//               ercontactphone,
//               departmentId,
//               positionId,
//               address,
//               profilePicturePath,
//             ]);

//             mysql.InsertTable(
//               "master_employee",
//               data,
//               (insertErr, insertResult) => {
//                 if (insertErr) {
//                   console.error("Error inserting record: ", insertErr);
//                   res.json({ msg: "insert_failed" });
//                 } else {
//                   console.log(insertResult);
//                   res.json({ msg: "success" });
//                 }
//               }
//             );
//           } catch (positionIdError) {
//             console.error("Error fetching position ID: ", positionIdError);
//             res.json({ msg: "position_id_fetch_error" });
//           }
//         } catch (departmentIdError) {
//           console.error("Error fetching department ID: ", departmentIdError);
//           res.json({ msg: "department_id_fetch_error" });
//         }
//       })
//       .catch((error) => {
//         res.json({
//           msg: error,
//         });
//       });
//   } catch (error) {
//     console.error("Error in /save route: ", error);
//     res.json({ msg: "error" });
//   }
// });

router.post("/update", async (req, res) => {
  try {
    let newEmployeeId = req.body.newEmployeeId;
    let firstname = req.body.firstname;
    let middlename = req.body.middlename;
    let lastname = req.body.lastname;
    let birthday = req.body.birthday;
    let gender = req.body.gender;
    let civilstatus = req.body.civilstatus;
    let phone = req.body.phone;
    let email = req.body.email;
    let hiredate = req.body.hiredate;
    let jobstatus = req.body.jobstatus;
    let ercontactname = req.body.ercontactname;
    let ercontactphone = req.body.ercontactphone;
    let department = req.body.department;
    let position = req.body.position;
    let address = req.body.address;
    let profilePicturePath = req.body.profilePicturePath;

    const sql = `UPDATE master_employee SET
      me_firstname = ?,
      me_middlename = ?,
      me_lastname = ?,
      me_birthday = ?,
      me_gender = ?,
      me_phone = ?,
      me_email = ?,
      me_civilstatus = ?,
      me_hiredate = ?,
      me_jobstatus = ?,
      me_ercontactname = ?,
      me_ercontactphone = ?,
      me_department = ?,
      me_position = ?,
      me_address = ?,
      me_profile_pic = ?
      WHERE me_id = ?`;

    const values = [
      firstname,
      middlename,
      lastname,
      birthday,
      gender,
      phone,
      email,
      civilstatus,
      hiredate,
      jobstatus,
      ercontactname,
      ercontactphone,
      department,
      position,
      address,
      profilePicturePath,
      newEmployeeId,
    ];

    console.log(values);

    mysql.UpdateMultiple(sql, values, (err, result) => {
      if (err) {
        console.error("Error: ", err);
        return res.status(500).json({ msg: "Error updating data" });
      }
      const rowsAffected = result && result.affectedRows;

      console.log(result);

      if (rowsAffected > 0) {
        return res.json({ msg: "success" });
      } else {
        return res.json({ msg: "exists" });
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal server error", 
      error: error.message 
    });
  }
});


router.post("/getgovid", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select
    mg_governmentid as governmentid,
    mg_employeeid as employeeid,
    mg_idtype as idtype,
    mg_idnumber as idnumber,
    mg_issuedate as issuedate
    from master_govid
    inner join master_employee on mg_employeeid = me_id
    where mg_employeeid = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {

        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/gethealth", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    mh_bloodtype as bloodtype,
    mh_medicalcondition as medicalcondition,
    mh_prescribemedications as prescribemedications,
    mh_lastcheckup as lastcheckup,
    mh_insurance as insurance,
    mh_insurancenumber as insurancenumber
    from master_health
    inner join master_employee on mh_employeeid = me_id
    where mh_employeeid = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        console.log(result);
        console.log("SQL query:", sql);

        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/gettraining", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = ` select 
    mt_name as name,
    mt_startdate as startdate,
    mt_enddate as enddate,
    mt_location as location,
    mt_status as status
    from master_training 
    inner join master_employee on mt_employeeid = me_id
    where mt_employeeid = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        console.log(result);
        console.log("SQL query:", sql);

        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/getdisciplinary", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    mda_description as actioncode,
    mo_offensename as offenseid,
    mv_description as description,
    oda_date as date,
    oda_status as status
    from offense_disciplinary_actions 
    LEFT JOIN master_employee ON offense_disciplinary_actions.oda_employeeid = me_id
    LEFT JOIN master_offense ON offense_disciplinary_actions.oda_offenseid = mo_offenseid
    LEFT JOIN master_disciplinary_action ON offense_disciplinary_actions.oda_actionid = mda_actionid
    LEFT JOIN master_violation ON offense_disciplinary_actions.oda_violation = mv_violationid
    where oda_employeeid = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        console.log(result);
        console.log("SQL query:", sql);

        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.get("/totalregular", (req, res) => {
  try {
    let sql = `select
    me_profile_pic as profilePicturePath,
    me_id as newEmployeeId,
    concat(me_lastname, " ", me_firstname) as firstname,
    me_phone as contact,
    me_email as email,
    md_departmentname as me_department,
    mp_positionname as me_position
    from master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    where me_jobstatus = 'regular'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.get("/totalactive", (req, res) => {
  try {
    let sql = `select
    me_profile_pic as profilePicturePath,
    me_id as newEmployeeId,
    concat(me_lastname, " ", me_firstname) as firstname,
    me_phone as phone,
    me_email as email,
    me_jobstatus as jobstatus,
    md_departmentname as department,
    mp_positionname as position
    from master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    where me_jobstatus IN ('regular', 'probitionary')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.get("/totalprobi", (req, res) => {
  try {
    let sql = `select
    me_profile_pic as profilePicturePath,
    me_id as newEmployeeId,
    concat(me_lastname, " ", me_firstname) as firstname,
    me_phone as phone,
    me_email as email,
    md_departmentname as department,
    mp_positionname as position
    from master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    where me_jobstatus = 'probitionary'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.get("/totalresigned", (req, res) => {
  try {
    let sql = `   SELECT
    me.me_profile_pic AS profilePicturePath,
      me.me_id AS newEmployeeId,
      CONCAT(me.me_lastname, ' ', me.me_firstname) AS firstname,
      me.me_phone AS phone,
      md.md_departmentname AS department,
      mp.mp_positionname AS position,
      mr.mr_reason AS reason,
      mr.mr_dateresigned as dateresigned,
      mr.mr_createdate as createdate
  FROM
      master_resigned mr
  LEFT JOIN
      master_employee me ON mr.mr_employeeid = me.me_id
  LEFT JOIN
      master_department md ON me.me_department = md.md_departmentid
  LEFT JOIN
      master_position mp ON me.me_position = mp.mp_positionid
  WHERE
      mr.mr_status = 'resigned'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

//#region functions
function GetDepartment(name, callback) {
  let sql = `select * from master_department where md_departmentname='${name}'`;
  mysql.Select(sql, "Master_Department", (err, result) => {
    if (err) callback(err, null);
    // console.log(result);
    callback(null, result);
  });
}

function GetPosition(name, callback) {
  let sql = `select * from master_position where mp_positionname='${name}'`;
  mysql.Select(sql, "Master_Position", (err, result) => {
    if (err) callback(err, null);
    // console.log(result);
    callback(null, result);
  });
}

async function saveUserRecord(req, employeeId, username, encryptedPassword) {
  return new Promise((resolve, reject) => {
    const createdate = moment().format('YYYY-MM-DD');
    const createby = req.session ? req.session.fullname : null; 

    console.log("Session:", req.session);

    const data = [
      [
        employeeId,
        username,
        encryptedPassword,
        2,
        createby,
        createdate,
        "Active",
      ],
    ];

    mysql.InsertTable("master_user", data, (inserterr, insertResult) => {
      if (inserterr) {
        console.error("Error inserting user record: ", inserterr);
        reject({ msg: "insert_failed" });
      } else {
        console.log("User record inserted: ", insertResult);
        resolve({ msg: "success" });
      }
    });
  });
}

function checkEmployeeExists(firstname, lastname) {
  return new Promise((resolve, reject) => {
    const checkQuery = `SELECT COUNT(*) AS count FROM master_employee WHERE me_firstname = '${firstname}' AND me_lastname = '${lastname}'`;

    mysql
      .mysqlQueryPromise(checkQuery)
      .then((result) => {
        const count = parseInt(result[0].count);

        if (count > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
//#endregion
