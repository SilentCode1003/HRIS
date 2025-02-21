var express = require("express");
var router = express.Router();

const mysql = require("./repository/hrmisdb");
const moment = require("moment");
const multer = require("multer");
const XLSX = require("xlsx");
const { Validator } = require("./controller/middleware");
const {
  convertExcelDate,
  GetCurrentDatetime,
  GetCurrentDate,
  SelectStatement,
  InsertStatement,
} = require("./repository/customhelper");
const { Encrypter } = require("./repository/cryptography");
const {
  generateUsernameAndPasswordForApprentice,
} = require("./repository/helper");
const {
  generateUsernameAndPasswordforemployee,
} = require("./repository/helper");
const { GenerateExcel } = require("./repository/excel");
const { Select, InsertTable } = require("./repository/dbconnect");
const { DataModeling, RawData } = require("./model/hrmisdb");
const {
  JsonDataResponse,
  JsonErrorResponse,
  JsonWarningResponse,
  MessageStatus,
  JsonSuccess,
} = require("./repository/response");

const apprenticecurrentYear = moment().format("YYYY");
const currentYear = moment().format("YY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "employeelayout", "employee");
});

module.exports = router;

router.get("/filtertenure", (req, res) => {
  try {
    let sql = `  SELECT 
    me_id AS newEmployeeId,
    CONCAT(me_firstname, ' ', me_lastname) AS firstname,
    md_departmentname AS department,
    me_hiredate AS hiredate,
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
    where me_jobstatus in ('regular', 'probitionary','apprentice')`;

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
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/saveold", async (req, res) => {
  try {
    const {
      oldemployeeid,
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

    const oldemployeeExists = await checkOldIdExists(oldemployeeid);

    if (oldemployeeExists) {
      return res.json({ msg: "existoldid" });
    }

    let username, password;

    ({ username, password } = generateUsernameAndPasswordforemployee({
      me_firstname: firstname,
      me_lastname: lastname,
      me_id: oldemployeeid,
      me_birthday: birthday,
    }));

    const employeeData = [
      [
        oldemployeeid,
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
        Encrypter(password, async (encryptErr, encryptedPassword) => {
          if (encryptErr) {
            console.error("Error encrypting password: ", encryptErr);
            return res.json({ msg: "encrypt_error" });
          }
          const userSaveResult = await saveUserRecord(
            req,
            res,
            oldemployeeid,
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

router.get("/selectdistinctshift", (req, res) => {
  try {
    let sql = `SELECT DISTINCT
    me_id,
    concat(me_lastname,' ',me_firstname) as me_fullname
    FROM master_employee
    LEFT JOIN master_shift ON master_employee.me_id = master_shift.ms_employeeid
    WHERE master_shift.ms_employeeid IS NULL
    AND me_jobstatus IN ('regular', 'probitionary','apprentice')`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "me_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.get("/selectdistinctsalary", (req, res) => {
  try {
    let sql = `SELECT DISTINCT
    me_id,
    concat(me_lastname,' ',me_firstname) as me_fullname
    FROM master_employee
    LEFT JOIN master_salary ON master_employee.me_id = master_salary.ms_employeeid
    WHERE master_salary.ms_employeeid IS NULL
    AND me_jobstatus IN ('regular', 'probitionary','apprentice')`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "me_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/upload", (req, res) => {
  const { data } = req.body;
  let dataJson = JSON.parse(data);
  let inputFormat = "DD/MM/YYYY";

  let counter = 0;

  console.log(dataJson);
  dataJson.forEach((key, item) => {
    GetDepartment(key.department, (err, result) => {
      if (err) console.log("Error: ", err);
      let departmentid = result[0].departmentid;
      GetPosition(key.position, (err, result) => {
        if (err) console.log("Error: ", err);
        let positionid = result[0].positionid;
        counter += 1;
        let dateofbirth = convertExcelDate(key.dateofbirth);
        let datehired = convertExcelDate(key.hiredate);

        let employeeId, username, password;
        employeeId = key.id;
        ({ username, password } = generateUsernameAndPasswordforemployee({
          me_firstname: key.firstname,
          me_lastname: key.lastname,
          me_id: key.id,
          me_birthday: dateofbirth,
        }));

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

        mysql.InsertTable(
          "master_employee",
          master_employee,
          async (insertErr, insertResult) => {
            if (insertErr) {
              console.error("Error inserting employee record: ", insertErr);
              return res.json({ msg: "insert_failed" });
            }

            Encrypter(password, async (encryptErr, encryptedPassword) => {
              if (encryptErr) {
                console.error("Error encrypting password: ", encryptErr);
                return res.json({ msg: "encrypt_error" });
              }
              const userSaveResult = await saveUserRecord(
                req,
                employeeId,
                username,
                encryptedPassword
              );

              if (userSaveResult.msg === "success") {
              } else {
                console.error("Error saving user record: ", userSaveResult.msg);
                return res.json({ msg: "user_save_error" });
              }
            });
          }
        );
        if (counter == dataJson.length) {
          res.json({
            msg: "success",
          });
        }
      });
    });
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
    concat(me_firstname, ' ', me_lastname) as me_fullname,
    me_phone,
    me_email,
    me_jobstatus,
    md_departmentname AS me_department,
    mp_positionname AS me_position
    FROM
    master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "me_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
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
    me_id,
    CONCAT(master_employee.me_lastname, " ", master_employee.me_firstname) AS me_fullname,
    me_phone,
    me_email,
    me_jobstatus,
    md_departmentname as me_departmentname,
    mp_positionname as me_positionname
    FROM
    master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    WHERE
    me_jobstatus IN ('regular', 'probitionary','apprentice')
    ORDER BY me_id DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "me_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});

router.get("/loadwithshift", (req, res) => {
  try {
    let sql = `
    SELECT   
    me_id,
    CONCAT(master_employee.me_lastname, " ", master_employee.me_firstname) AS me_fullname,
    me_phone,
    me_email,
    me_jobstatus
    FROM 
        master_employee
    INNER JOIN 
        master_shift
    ON 
        me_id = ms_employeeid`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "me_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

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
      employeeId = await generateApprenticeId(
        apprenticecurrentYear,
        currentMonth
      );
      ({ username, password } = generateUsernameAndPasswordForApprentice({
        apprentice_firstname: firstname,
        apprentice_lastname: lastname,
        apprentice_id: employeeId,
        apprentice_birthday: birthday,
      }));
    } else {
      employeeId = await generateEmployeeId(currentYear, currentMonth);

      ({ username, password } = generateUsernameAndPasswordforemployee({
        me_firstname: firstname,
        me_lastname: lastname,
        me_id: employeeId,
        me_birthday: birthday,
      }));
    }
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

        Encrypter(password, async (encryptErr, encryptedPassword) => {
          if (encryptErr) {
            console.error("Error encrypting password: ", encryptErr);
            return res.json({ msg: "encrypt_error" });
          }
          const userSaveResult = await saveUserRecord(
            req,
            res,
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

    let sql = `UPDATE master_employee SET
      me_firstname = '${firstname}',
      me_middlename = '${middlename}',
      me_lastname = '${lastname}',
      me_birthday = '${birthday}',
      me_gender = '${gender}',
      me_phone = '${phone}',
      me_email = '${email}',
      me_civilstatus = '${civilstatus}',
      me_hiredate = '${hiredate}',
      me_jobstatus = '${jobstatus}',
      me_ercontactname = '${ercontactname}',
      me_ercontactphone = '${ercontactphone}',
      me_department = '${department}',
      me_position = '${position}',
      me_address = '${address}',
      me_profile_pic = '${profilePicturePath}'
      WHERE me_id = '${newEmployeeId}'`;

    mysql
      .Update(sql)
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

router.post("/getdeductother", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select
    md_deductionid,
    md_employeeid,
    md_idtype,
    md_idnumber,
    md_issuedate
    from master_deductions
    inner join master_employee on md_employeeid = me_id
    where md_employeeid = '${employeeid}'`;

    mysql.Select(sql, "Master_Deductions", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/getleave", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select
    l_leaveid as leaveid,
    l_employeeid as employeeid,
    ml_leavetype as leavetype,
    l_leavestartdate as startdate,
    l_leaveenddate as enddate,
    l_leavestatus as status
    from leaves
    inner join master_employee on l_employeeid = me_id
    inner join master_leaves on leaves.l_leavetype = ml_id
    where l_employeeid = '${employeeid}'`;
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

router.get("/generatealphalist", (req, res) => {
  try {
    let date = GetCurrentDate();
    let storeProceedure = "call hrmis.GenerateAlphaList()";

    Select(storeProceedure, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ msg: "error", data: err });
      }

      let data = DataModeling(result[0], "al_");
      let excelBuffer = GenerateExcel("Alpha List", data);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="AlphaList_${date}.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.send(excelBuffer);
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ msg: "error", data: error });
  }
});

//#region functions

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

function GetDepartment(name, callback) {
  let sql = `select * from master_department where md_departmentname='${name}'`;
  mysql.Select(sql, "Master_Department", (err, result) => {
    if (err) callback(err, null);
    callback(null, result);
  });
}

function GetPosition(name, callback) {
  let sql = `select * from master_position where mp_positionname='${name}'`;
  mysql.Select(sql, "Master_Position", (err, result) => {
    if (err) callback(err, null);
    callback(null, result);
  });
}

async function saveUserRecord(
  req,
  res,
  oldemployeeid,
  username,
  encryptedPassword
) {
  return new Promise((resolve, reject) => {
    const createdate = moment().format("YYYY-MM-DD");
    const createby = req.session ? req.session.fullname : null;

    console.log("Session:", req.session);
    let sql = `select * from master_access where ma_accessname='Employee'`;

    mysql.Select(sql, "Master_Access", (err, result) => {
      if (err) reject(err);
      let geofenceValue = 1;
      let status = "Active";
      let accessid = result[0].accessid;
      let sql = InsertStatement("master_user", "mu", [
        "employeeid",
        "username",
        "password",
        "accesstype",
        "createby",
        "createdate",
        "status",
        "isgeofence",
      ]);
      let data = [
        [
          oldemployeeid,
          username,
          encryptedPassword,
          accessid,
          createby,
          createdate,
          status,
          geofenceValue,
        ],
      ];
      let checkStatement = SelectStatement(
        "select * from master_user where mu_employeeid=? and mu_accesstype=?",
        [oldemployeeid, accessid]
      );

      Check(checkStatement)
        .then((result) => {
          if (result != 0) {
            return res.json(JsonWarningResponse(MessageStatus.EXIST));
          } else {
            InsertTable(sql, data, (err, result) => {
              if (err) {
                console.log(err);
                res.json(JsonErrorResponse(err));
              }

              res.json(JsonSuccess());
            });
          }
        })
        .catch((error) => {
          console.log(error);
          res.json(JsonErrorResponse(error));
        });
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

function checkOldIdExists(oldemployeeid) {
  return new Promise((resolve, reject) => {
    const checkQuery = `SELECT COUNT(*) AS count FROM master_employee WHERE me_id = '${oldemployeeid}'`;

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

function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}
//#endregion
