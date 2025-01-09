const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();
const { Encrypter } = require("./repository/cryptography");
const { error } = require("jquery");
const {
  generateUsernameAndPasswordforemployee,
} = require("./repository/helper");

const currentYear = moment().format("YY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('announcementlayout', { title: 'Express' });

  Validator(req, res, "apprenticelayout", "apprentice");
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
    mysql
      .mysqlQueryPromise(insertEmployeeQuery)
      .then(async (result) => {
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
        mysql
          .mysqlQueryPromise(updateOldEmployeeQuery)
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

router.post("/updateuser", (req, res) => {
  try {
    let employeeid = req.body.employeeid;

    let sql = `    UPDATE master_user SET
    mu_status = 'Inactive'
    where mu_employeeid = '${employeeid}'`;

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
    res.json({
      msg: "error",
      data: error,
    });
  }
});

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
