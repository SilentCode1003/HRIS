const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable, Update } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  MessageStatus,
  JsonWarningResponse,
  JsonSuccess,
} = require("./repository/response");
const { UserLogin } = require("./repository/helper");
const { DataModeling } = require("./model/hrmisdb");
const e = require("express");
var router = express.Router();
const currentDate = moment();
const { Encrypter, Decrypter } = require("./repository/cryptography");
const { InsertStatement, SelectStatement, GetCurrentDate, GetCurrentDatetime, UpdateStatement } = require("./repository/customhelper");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestovertimelayout', { title: 'Express' });
  Validator(req, res, "mobile-api", "mobile-api");
});

module.exports = router;

router.post("/loadotmeal", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
    oma_mealid,
    DATE_FORMAT(oma_attendancedate, '%W, %Y-%m-%d') AS oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%d %M %Y, %h:%i %p') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%d %M %Y, %h:%i %p') AS oma_clockout,
    oma_totalovertime,
    s_name as oma_subgroupid,
    oma_otmeal_amount,
    oma_status
    FROM  ot_meal_allowances
    INNER JOIN subgroup ON ot_meal_allowances.oma_subgroupid = s_id
    WHERE oma_employeeid = '${employeeid}'
    AND oma_status in ('Pending', 'Applied')`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    Encrypter(password, (err, encrypted) => {
      if (err) console.error("Error: ", err);

      let sql = `SELECT 
        mu_employeeid AS employeeid,
        CONCAT(me_firstname, ' ', me_lastname) AS fullname,
        ma_accessname AS accesstype,
        mu_status AS status,
        me_profile_pic AS image,
        me_jobstatus AS jobstatus,
        md_departmentid AS departmentid,
        mu_isgeofence as isgeofence,
        md_departmentname AS departmentname,
        mp_positionname AS position,
        ma_accessid as accesstypeid,
        mgs_id AS geofenceid
        FROM master_user
        INNER JOIN master_access ON mu_accesstype = ma_accessid
        LEFT JOIN master_employee ON mu_employeeid = me_id
        LEFT JOIN master_department ON md_departmentid = me_department
        LEFT JOIN master_position ON mp_positionid = me_position
        LEFT JOIN master_geofence_settings ON mgs_departmentid = me_department 
        WHERE mu_username = '${username}' AND mu_password = '${encrypted}'
        AND mu_accesstype = '2'`;

      mysql
        .mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length !== 0) {
            const user = result[0];

            if (
              user.jobstatus === "probitionary" ||
              user.jobstatus === "regular" ||
              user.jobstatus === "apprentice"
            ) {
              if (user.status === "Active") {
                let data = UserLogin(result);

                //console.log(data,'data');

                data.forEach((user) => {
                  req.session.employeeid = user.employeeid;
                  req.session.fullname = user.fullname;
                  req.session.accesstype = user.accesstype;
                  req.session.image = user.image;
                  req.session.departmentid = user.departmentid;
                  req.session.isgeofence = user.isgeofence;
                  req.session.departmentname = user.departmentname;
                  req.session.position = user.position;
                  req.session.jobstatus = user.jobstatus;
                  req.session.geofenceid = user.geofenceid;
                  req.session.accesstypeid = user.accesstypeid;
                });
                console.log("accesstype", req.session.accesstype);
                return res.json({
                  msg: "success",
                  data: data,
                });
              } else {
                return res.json({
                  msg: "inactive",
                });
              }
            } else {
              return res.json({
                msg: "resigned",
              });
            }
          } else {
            return res.json({
              msg: "incorrect",
            });
          }
        })
        .catch((error) => {
          return res.json({
            msg: "error",
            data: error,
          });
        });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/getpayrolldate", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
      CONCAT(p_startdate, ' To ', p_enddate) AS p_daterange,
      DATE_FORMAT(p_payrolldate, '%Y-%m-%d') AS p_payrolldate,
      p_cutoff as p_cutoff,
      ROUND(p_salary + p_allowances + p_basic_adjustments, 2) as p_totalsalary,
      SUM(p_totalhours) as p_totalhours,
      SUM(p_nightothours) as p_nightdiff,
      SUM(p_normalothours) as p_normalot,
      SUM(p_earlyothours) as p_earlyot,
      SEC_TO_TIME(SUM(TIME_TO_SEC(COALESCE(p_lateminutes, '00:00:00')))) AS p_totalminutes,
      round(p_total_netpay, 2) as p_totalnetpay
      FROM 
      payslip  
      WHERE 
      p_employeeid = '${employeeid}'
      GROUP BY 
      p_startdate, p_enddate, p_payrolldate, p_cutoff, p_salary, p_allowances, p_basic_adjustments, p_total_netpay
      ORDER BY 
      p_payrolldate DESC
      LIMIT 2`;

    console.log(employeeid);

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "p_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/updatepassword", async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let currentPass = req.body.currentPass;
    let newPass = req.body.newPass;
    let confirmPass = req.body.confirmPass;
    let accesstypeid = req.body.accesstypeid;

    console.log(employeeid, currentPass, newPass, confirmPass, accesstypeid);

    if (newPass !== confirmPass) {
      return res.json({
        msg: "error",
        description: "New password and confirm password do not match",
      });
    }

    const userData = await mysql.mysqlQueryPromise(
      `SELECT mu_password FROM master_user WHERE 
        mu_accesstype = '${accesstypeid}' and  mu_employeeid = '${employeeid}'`
    );

    if (userData.length !== 1) {
      return res.json({
        msg: "error",
        description: "Employee not found",
      });
    }

    const encryptedStoredPassword = userData[0].mu_password;

    Decrypter(
      encryptedStoredPassword,
      async (decryptError, decryptedStoredPassword) => {
        if (decryptError) {
          return res.json({
            msg: "error",
            description: "Error decrypting the stored password",
          });
        }

        if (currentPass !== decryptedStoredPassword) {
          return res.json({
            msg: "error",
            description: "Current password is incorrect",
          });
        }

        Encrypter(newPass, async (encryptError, encryptedNewPassword) => {
          if (encryptError) {
            return res.json({
              msg: "error",
              description: "Error encrypting the new password",
            });
          }

          await mysql.Update(
            `UPDATE master_user SET mu_password = '${encryptedNewPassword}' WHERE mu_employeeid = '${employeeid}' and mu_accesstype = '${accesstypeid}'`
          );

          return res.json({
            msg: "success",
            description: "Password updated successfully",
          });
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.json({
      msg: "error",
      description: error.message || "Internal server error",
    });
  }
});

router.post("/loadloansdetails", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT * FROM gov_loan_details
      WHERE gld_employeeid = '${employeeid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gld_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/loadloans", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT * FROM gov_loans
      WHERE gl_employeeid = '${employeeid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gl_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/countheader", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
      IFNULL((SELECT count(*) FROM leaves WHERE l_leavestatus = 'Pending' AND l_employeeid = '${employeeid}'), 0) AS ms_pending,
      IFNULL((SELECT count(*) FROM leaves WHERE l_leavestatus = 'Approved' AND l_employeeid = '${employeeid}'), 0) AS ms_approved,
      IFNULL((SELECT count(*) FROM leaves WHERE l_leavestatus = 'Rejected' AND l_employeeid = '${employeeid}'), 0) AS ms_rejected,
      IFNULL((SELECT count(*) FROM leaves WHERE l_leavestatus = 'Cancelled' AND l_employeeid = '${employeeid}'), 0) AS ms_cancelled
      FROM leaves 
      WHERE l_employeeid = '${employeeid}'
      LIMIT 1`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ms_");

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

//#region COA

router.post("/loadcoa", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
      ar_requestid,
      DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
      DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
      DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
      ar_total,
      ar_createdate,
      ar_status,
      ar_reason
    FROM attendance_request
    INNER JOIN
    master_employee ON attendance_request.ar_employeeid = me_id
    where ar_employeeid ='${employeeid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ar_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});


//#endregion

//#region REST DAY OT APPROVAL



router.post("/loadrdot", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `
        SELECT 
            roa_rdotid,
            DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
            DAYNAME(roa_attendancedate) AS roa_dayname,
            DATE_FORMAT(roa_timein, '%H:%i:%s') AS roa_timein,
            DATE_FORMAT(roa_timeout, '%H:%i:%s') AS roa_timeout,
            roa_total_hours,
            roa_status,
            roa_admin_comment,
            DATE_FORMAT(roa_createdate, '%Y-%m-%d %H:%i:%s') AS roa_createdate
        FROM restday_ot_approval
        WHERE roa_employeeid = '${employeeid}'
        ORDER BY roa_rdotid DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getrestdayot", (req, res) => {
  try {
    let rdotid = req.body.rdotid;
    let sql = `SELECT
        roa_rdotid,
        DATE_FORMAT(roa_timein, '%Y-%m-%d %H:%i:%s') AS roa_timein,
        DATE_FORMAT(roa_timeout, '%Y-%m-%d %H:%i:%s') AS roa_timeout,
        DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
        DAYNAME(roa_attendancedate) AS roa_dayname,
        roa_status,
        roa_total_hours,
        roa_file,
        roa_admin_comment,
          (
          SELECT rra_comment 
          FROM restdayot_request_activity 
          WHERE rra_restdayotid = roa_rdotid
          ORDER BY rra_date DESC
          LIMIT 1
        ) AS roa_comment,
        DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
        roa_subgroupid
        FROM restday_ot_approval
        WHERE roa_rdotid = '${rdotid}'
        LIMIT 1`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.put("/editrdot", (req, res) => {
  try {
    let createdby = req.body.fullname;
    let createddate = GetCurrentDatetime();
    const {
      rdotid,
      status,
      clockin,
      clockout,
      total_hours,
      attendancedate,
      payrolldate,
      subgroup,
      file,
      employeeid,
    } = req.body;

    console.log(req.body);

    let data = [];
    let columns = [];
    let arguments = [];

    if (createdby) {
      data.push(createdby);
      columns.push("createby");
    }

    if (createddate) {
      data.push(createddate);
      columns.push("createdate");
    }

    if (total_hours) {
      data.push(total_hours);
      columns.push("total_hours");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (clockin) {
      data.push(clockin);
      columns.push("timein");
    }

    if (clockout) {
      data.push(clockout);
      columns.push("timeout");
    }

    if (attendancedate) {
      data.push(attendancedate);
      columns.push("attendancedate");
    }

    if (payrolldate) {
      data.push(payrolldate);
      columns.push("payrolldate");
    }

    if (file) {
      data.push(file);
      columns.push("file");
    }

    if (subgroup) {
      data.push(subgroup);
      columns.push("subgroupid");
    }

    if (rdotid) {
      data.push(rdotid);
      arguments.push("rdotid");
    }

    let updateStatement = UpdateStatement(
      "restday_ot_approval",
      "roa",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from restday_ot_approval where roa_employeeid = ? and roa_attendancedate = ? and roa_status = ?",
      [employeeid, attendancedate, status]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            //

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/saverdot", async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let fullname = req.body.fullname;
    let attendancedate = req.body.attendancedate;
    let timein = req.body.timein;
    let timeout = req.body.timeout;
    let payrolldate = req.body.payrolldate;
    let subgroupid = req.body.subgroupid;
    let file = req.body.file;
    let status = "Applied";

    let timeInDate = new Date(timein);
    let timeOutDate = new Date(timeout);
    let total_hours = 0;

    if (timeInDate && timeOutDate && timeOutDate > timeInDate) {
      total_hours = (timeOutDate - timeInDate) / (1000 * 60 * 60);
      total_hours = Math.floor(total_hours);
    }

    let sqlSalary = `SELECT 
      CASE 
        WHEN ${total_hours} <= 3 THEN 0
        WHEN ${total_hours} <= 8 THEN
          CASE 
            WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly * 1.30) / 2
            ELSE (s.ms_monthly / 313 * 12 * 1.30) / 2
          END
        ELSE
          CASE 
            WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly * 1.30)
            ELSE (s.ms_monthly / 313 * 12 * 1.30)
          END
      END AS ot_total
      FROM master_salary s 
      WHERE s.ms_employeeid = '${employeeid}'`;

    Select(sqlSalary, (err, result) => {
      if (err) {
        console.error(err);
        return res.json(JsonErrorResponse(err));
      }

      let ot_total = result && result.length > 0 ? result[0].ot_total : 0;

      let sqlInsert = InsertStatement("restday_ot_approval", "roa", [
        "employeeid",
        "fullname",
        "timein",
        "timeout",
        "attendancedate",
        "status",
        "total_hours",
        "ot_total",
        "file",
        "createdate",
        "createby",
        "payrolldate",
        "subgroupid",
        "approvalcount",
      ]);

      let data = [
        [
          employeeid,
          fullname,
          timein,
          timeout,
          attendancedate,
          status,
          total_hours,
          ot_total,
          file,
          new Date().toISOString(),
          employeeid,
          payrolldate,
          subgroupid,
          0,
        ],
      ];

      let checkStatement = SelectStatement(
        "SELECT * FROM restday_ot_approval WHERE roa_employeeid=? AND roa_attendancedate=? AND roa_status=?",
        [employeeid, attendancedate, status]
      );

      Check(checkStatement)
        .then((result) => {
          if (result.length > 0) {
            return res.json(JsonWarningResponse(MessageStatus.EXIST));
          } else {
            InsertTable(sqlInsert, data, (err, result) => {
              if (err) {
                console.log(err);
                return res.json(JsonErrorResponse(err));
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
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

//#endregion

//#region HOLIDAY APPROVAL

router.post("/loadholiday", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    ph_holidayid,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d, %W') as ph_attendancedate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_status,
    ph_nightdiff_ot_total,
    ph_normal_ot_total
    from payroll_holiday
    where ph_employeeid = '${employeeid}'
    order by ph_attendancedate asc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");

        //console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.put("/editholiday", (req, res) => {
  try {
    let createdby = req.body.fullname;
    let createddate = GetCurrentDatetime();
    const {
      holidayid,
      status,
      clockin,
      clockout,
      attendancedate,
      payrolldate,
      subgroup,
      holidayimage,
      employeeid,
    } = req.body;

    console.log(req.body);

    let data = [];
    let columns = [];
    let arguments = [];

    if (createdby) {
      data.push(createdby);
      columns.push("createby");
    }

    if (createddate) {
      data.push(createddate);
      columns.push("createdate");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (clockin) {
      data.push(clockin);
      columns.push("timein");
    }

    if (clockout) {
      data.push(clockout);
      columns.push("timeout");
    }

    if (attendancedate) {
      data.push(attendancedate);
      columns.push("attendancedate");
    }

    if (payrolldate) {
      data.push(payrolldate);
      columns.push("payrolldate");
    }

    if (holidayimage) {
      data.push(holidayimage);
      columns.push("file");
    }

    if (subgroup) {
      data.push(subgroup);
      columns.push("subgroupid");
    }

    if (holidayid) {
      data.push(holidayid);
      arguments.push("holidayid");
    }

    let updateStatement = UpdateStatement(
      "payroll_holiday",
      "ph",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from payroll_holiday where ph_employeeid = ? and ph_attendancedate = ? and ph_status = ?",
      [employeeid, attendancedate, status]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            //

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});


//#endregion

//#region OVERTIME 

// router.post("/loadovertime", (req, res) => {
//   try {
//     let employeeid = req.body.employeeid;
//     let startdate = req.body.startdate;
//     let enddate = req.body.enddate;
//     let overtimestatus = req.body.overtimestatus;

//     if (overtimestatus === "") 
//       {let sql = `SELECT
//       pao_id,
//       DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
//       DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
//       DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
//       pao_total_hours,
//       pao_early_ot,
//       pao_normal_ot,
//       pao_night_differentials,
//       pao_payroll_date,
//       pao_status
//       FROM payroll_approval_ot
//       WHERE pao_employeeid = '${employeeid}'
//       AND pao_attendancedate BETWEEN '${startdate}' AND '${enddate}'
//       ORDER BY pao_id DESC`;

//     Select(sql, (err, result) => {
//       if (err) {
//         console.error(err);
//         res.json(JsonErrorResponse(err));
//       }

//       if (result != 0) {
//         let data = DataModeling(result, "pao_");

//         res.json(JsonDataResponse(data));
//       } else {
//         res.json(JsonDataResponse(result));
//       }
//     });
//   } else {
//     let sql = `SELECT
//       pao_id,
//       DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
//       DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
//       DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
//       pao_total_hours,
//       pao_early_ot,
//       pao_normal_ot,
//       pao_night_differentials,
//       pao_payroll_date,
//       pao_status
//     FROM payroll_approval_ot
//     WHERE pao_employeeid = '${employeeid}'
//     AND MONTH(pao_attendancedate) = MONTH(CURDATE())
//     AND YEAR(pao_attendancedate) = YEAR(CURDATE())
//     AND pao_status = '${overtimestatus}'
//     ORDER BY pao_id DESC`;

//     Select(sql, (err, result) => {
//       if (err) {
//         console.error(err);
//         res.json(JsonErrorResponse(err));
//       }

//       if (result != 0) {
//         let data = DataModeling(result, "pao_");

//         res.json(JsonDataResponse(data));
//       } else {
//         res.json(JsonDataResponse(result));
//       }
//     });
//   }
//   } catch (error) {
//     res.json({
//       msg: "error",
//       error,
//     });
//   }
// });

router.post("/loadovertime", (req, res) => {
  try {
    const { employeeid, startdate, enddate, overtimestatus } = req.body;
    let sql = `
      SELECT
        pao_id,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
        DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
        DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
        pao_total_hours,
        pao_early_ot,
        pao_normal_ot,
        pao_night_differentials,
        pao_payroll_date,
        pao_status
      FROM payroll_approval_ot
      WHERE pao_employeeid = '${employeeid}'
      AND pao_attendancedate BETWEEN '${startdate}' AND '${enddate}'
    `;
    if (overtimestatus) {
      sql += ` AND pao_status = '${overtimestatus}'`;
    }
    sql += " ORDER BY pao_id DESC";

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");

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

router.post("/loadotcurrentmonth", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let overtimestatus = req.body.overtimestatus;
    let sql = `SELECT
        pao_id,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
        DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
        DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
        pao_total_hours,
        pao_early_ot,
        pao_normal_ot,
        pao_night_differentials,
        pao_payroll_date,
        pao_status
    FROM payroll_approval_ot
    WHERE pao_employeeid = '${employeeid}'
    AND MONTH(pao_attendancedate) = MONTH(CURDATE())
    AND YEAR(pao_attendancedate) = YEAR(CURDATE())`


    if (overtimestatus) {
      sql += ` AND pao_status = '${overtimestatus}'`;
    }
    sql += " ORDER BY pao_id DESC";

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/getovertime", (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let sql = `SELECT
    pao_id AS approvalid,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(pao_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_in'
    )) AS scheduledtimein,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(pao_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_out'
    )) AS scheduledtimeout,
    DATE_FORMAT(pao_attendancedate,  '%Y-%m-%d') AS attendancedate,
    date_format(pao_clockin, '%Y-%m-%d %H:%i:%s') AS clockin,
    date_format(pao_clockout, '%Y-%m-%d %H:%i:%s') AS clockout,
    pao_status
FROM payroll_approval_ot
INNER JOIN master_shift ON payroll_approval_ot.pao_employeeid = ms_employeeid
INNER JOIN master_employee ON master_shift.ms_employeeid = me_id
LEFT JOIN master_holiday ON pao_attendancedate = mh_date
INNER JOIN master_department ON master_employee.me_department = md_departmentid
INNER JOIN master_position ON master_employee.me_position = mp_positionid
WHERE pao_id = '${approveot_id}'`;

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

//#endregion

//#region FUNCTION
function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}