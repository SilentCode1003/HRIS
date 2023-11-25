const mysql = require("./repository/hrmisdb");
const moment = require("moment");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const XLSX = require("xlsx");
const { Validator } = require("./controller/middleware");

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

  dataJson.forEach((key, item) => {
    counter += 1;

    GetDepartment(key.department, (err, result) => {
      if (err) console.log("Error: ", err);
      let departmentid = result[0].departmentid;
      GetPosition(key.position, (err, result) => {
        if (err) console.log("Error: ", err);
        let positionid = result[0].positionid;

        let dateofbirth = moment(key.dateofbirth, "MM/DD/YYYY").format(
          "YYYY-MM-DD"
        );
        let datehired = moment(key.hiredate, "MM/DD/YYYY").format("YYYY-MM-DD");
        console.log(key.hiredate);

        master_employee = [
          [
            key.id,
            key.firstname,
            key.middlename,
            key.lastname,
            dateofbirth,
            key.gender,
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

router.post("/getemployee", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT
    me_id as employeeid,
    me_firstname as firstname,
    me_middlename as middlename,
    me_lastname as lastname,
    me_birthday as birthday,
    me_gender as gender,
    me_phone as phone,
    me_email as email,
    me_hiredate as hiredate,
    me_jobstatus as jobstatus,
    me_ercontactname as ercontactname,
    me_ercontactphone as ercontactphone,
    md_departmentname as department,
    mp_positionname as position,
    me_address as address,
    me_profile_pic as profilePicturePath
    FROM master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    where me_id='${employeeid}'`;

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

router.get("/load", (req, res) => {
  try {
    let sql = `
      SELECT
        me_id,
        CONCAT(master_employee.me_firstname, " ", master_employee.me_lastname) AS me_firstname, me_phone,
        me_phone,
        me_email,
        md_departmentname AS me_department,  -- Fetch department name from master_department table
        mp_positionname AS me_position
      FROM master_employee
      LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
      LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    `;

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

// Function to check if a record with the same firstname and lastname exists
function checkEmployeeExists(firstname, lastname) {
  return new Promise((resolve, reject) => {
    const checkQuery = `SELECT COUNT(*) AS count FROM master_employee WHERE me_firstname = '${firstname}' AND me_lastname = '${lastname}'`;

    mysql
      .mysqlQueryPromise(checkQuery)
      .then((result) => {
        const count = parseInt(result[0].count);

        if (count > 0) {
          // The employee with the same firstname and lastname already exists
          resolve(true);
        } else {
          // The employee does not exist
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Function to generate the employee ID
function generateEmployeeId(year, month) {
  // Query to find the maximum sequence number for the current year and month

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

// Function to convert an image file to a base64-encoded string
router.post("/save", async (req, res) => {
  try {
    let firstname = req.body.firstname;
    let middlename = req.body.middlename;
    let lastname = req.body.lastname;
    let birthday = req.body.birthday;
    let gender = req.body.gender;
    let phone = req.body.phone;
    let email = req.body.email;
    let hiredate = req.body.hiredate;
    let jobstatus = req.body.jobstatus;
    let ercontactname = req.body.ercontactname;
    let ercontactphone = req.body.ercontactphone;
    let departmentName = req.body.department; // Get the department name from the request
    let positionName = req.body.position; // Get the position name from the request
    let address = req.body.address;
    let profilePicturePath = req.body.profilePicturePath; // Get the profile picture path from the request
    let data = [];

    const employeeExists = await checkEmployeeExists(firstname, lastname);

    if (employeeExists) {
      // The employee already exists
      res.json({ msg: "exist" });
      return;
    }

    generateEmployeeId(currentYear, currentMonth)
      .then(async (newEmployeeId) => {
        // Check if the employee ID already exists in the table

        // Fetch the department ID based on the department name
        const departmentIdQuery = `SELECT md_departmentid FROM master_department WHERE md_departmentname = '${departmentName}'`;

        try {
          const departmentIdResult = await mysql.mysqlQueryPromise(
            departmentIdQuery
          );
          const departmentId = departmentIdResult[0].md_departmentid;

          // Fetch the position ID based on the position name
          const positionIdQuery = `SELECT mp_positionid FROM master_position WHERE mp_positionname = '${positionName}'`;

          try {
            const positionIdResult = await mysql.mysqlQueryPromise(
              positionIdQuery
            );
            const positionId = positionIdResult[0].mp_positionid;

            data.push([
              newEmployeeId,
              firstname,
              middlename,
              lastname,
              birthday,
              gender,
              phone,
              email,
              hiredate,
              jobstatus,
              ercontactname,
              ercontactphone,
              departmentId,
              positionId,
              address,
              profilePicturePath,
            ]);

            mysql.InsertTable(
              "master_employee",
              data,
              (insertErr, insertResult) => {
                if (insertErr) {
                  console.error("Error inserting record: ", insertErr);
                  res.json({ msg: "insert_failed" });
                } else {
                  console.log(insertResult);
                  res.json({ msg: "success" });
                }
              }
            );
          } catch (positionIdError) {
            console.error("Error fetching position ID: ", positionIdError);
            res.json({ msg: "position_id_fetch_error" });
          }
        } catch (departmentIdError) {
          console.error("Error fetching department ID: ", departmentIdError);
          res.json({ msg: "department_id_fetch_error" });
        }
      })
      .catch((error) => {
        res.json({
          msg: error,
        });
      });
  } catch (error) {
    console.error("Error in /save route: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/update", async (req, res) => {
  try {
    // Retrieve request parameters
    let newEmployeeId = req.body.newEmployeeId;
    let firstname = req.body.firstname;
    let middlename = req.body.middlename;
    let lastname = req.body.lastname;
    let birthday = req.body.birthday;
    let gender = req.body.gender;
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

    // Get department ID based on department name
    const departmentIdQuery = `SELECT md_departmentid FROM master_department WHERE md_departmentname = '${department}'`;
    const [departmentIdRow] = await mysql.mysqlQueryPromise(departmentIdQuery, [
      department,
    ]);
    if (!departmentIdRow) {
      return res.status(400).json({ msg: "Department not found" });
    }
    const departmentId = departmentIdRow.md_departmentid;

    // Get position ID based on position name
    const positionIdQuery = `SELECT mp_positionid FROM master_position WHERE mp_positionname = '${position}'`;
    const [positionIdRow] = await mysql.mysqlQueryPromise(positionIdQuery, [
      position,
    ]);
    if (!positionIdRow) {
      return res.status(400).json({ msg: "Position not found" });
    }
    const positionId = positionIdRow.mp_positionid;

    // Define the SQL query
    const sql = `UPDATE master_employee SET
      me_firstname = ?,
      me_middlename = ?,
      me_lastname = ?,
      me_birthday = ?,
      me_gender = ?,
      me_phone = ?,
      me_email = ?,
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
      hiredate,
      jobstatus,
      ercontactname,
      ercontactphone,
      departmentId,
      positionId,
      address,
      profilePicturePath,
      newEmployeeId,
    ];

    mysql.UpdateMultiple(sql, values, (err, result) => {
      if (err) {
        console.error("Error: ", err);
        return res.status(500).json({ msg: "Error updating data" });
      }
      res.json({ msg: "success", data: result });
    });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});

router.post("/getgovid", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    mg_idtype as idtype,
    mg_idnumber as idnumber,
    mg_issuedate as issuedate,
    mg_expirydate as expirydate
    from master_govid
    inner join master_employee on mg_employeeid = me_id
    where mg_employeeid = '${employeeid}'`;

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

router.post('/insert', (req, res) => {
  try {
    
    let newEmployeeId = req.body.newEmployeeId;
    let reason = req.body.reason; 
    let dateresigned = req.body.dateresigned;
    let status = req.body.status;
    let createby = req.session.fullname; 
    let createdate = currentDate.format('YYYY-MM-DD');

  
    let data = [];
  
    data.push([
      newEmployeeId, reason, dateresigned, status, createby, createdate,
    ])
    let query = `SELECT * FROM master_resigned WHERE mr_employeeid = '${newEmployeeId}'`;
    mysql.Select(query, 'Master_Resigned', (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist"
        });
      }
      else {
        mysql.InsertTable('master_resigned', data, (err, result) => {
          if (err) console.error('Error: ', err);

          console.log(result);

          res.json({
            msg: 'success'
          })
        })
      }
    });

    
  } catch (error) {
    res.json({
      msg: 'error'
    })
  }
});



module.exports = router;

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
