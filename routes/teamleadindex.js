const mysql = require("./repository/hrmisdb");
//const moment = require('moment');
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const { de } = require("date-fns/locale");
var router = express.Router();
//const currentDate = moment();

/* GET home page. */

router.get("/", function (req, res, next) {
  // Validator(req, res, "indexlayout");
  Validator(req, res, "teamleadindexlayout", "teamleadindex");
});
// router.get("/", function (req, res, next) {
//   ValidatorForTeamLead(req, res, "teamleadindexlayout", "teamleadindex");
// });

module.exports = router;

router.get("/attendancestatus", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `
    SELECT
    me.me_profile_pic as image,
    concat(me.me_lastname,' ',me.me_firstname) as FullName,
    TIME_FORMAT(ma.ma_clockin, '%h:%i %p') AS actual_clockin,
    CASE
        WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
    END AS scheduled_time_in,
    TIMESTAMPDIFF(MINUTE, 
        CONCAT(CAST(ma.ma_attendancedate AS DATE), ' ', 
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END), 
        ma.ma_clockin
    ) AS minutes_late
FROM
    master_attendance ma
JOIN
    master_shift ms ON ma.ma_employeeid = ms.ms_employeeid
JOIN master_employee me ON ma.ma_employeeid = me.me_id
WHERE
    ma.ma_attendancedate = CURDATE()
    AND me.me_department = '${departmentid}'
    AND ma.ma_clockin IS NOT NULL
    AND (
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END
    ) IS NOT NULL
    AND ma.ma_clockin > CONCAT(CAST(ma.ma_attendancedate AS DATE), ' ', 
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END)
ORDER BY
    minutes_late DESC`;

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

router.get("/countcoacard", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `    
    SELECT 
    count(*) AS COA
    FROM 
    attendance_request
    INNER JOIN master_employee ON attendance_request.ar_employeeid = me_id
    INNER JOIN 
        aprroval_stage_settings ON 
            aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
            aprroval_stage_settings.ats_subgroupid = attendance_request.ar_subgroupid AND
            aprroval_stage_settings.ats_count = attendance_request.ar_approvalcount
     WHERE 
        ar_status = 'Pending' 
        AND ar_subgroupid IN (${subgroupid})`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              COACount: result[0].COA,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countovertimecard", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `    
    SELECT 
    count(*) AS AOT
    FROM 
    payroll_approval_ot
    INNER JOIN master_employee ON payroll_approval_ot.pao_employeeid = me_id
     INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = payroll_approval_ot.pao_subgroupid AND
                aprroval_stage_settings.ats_count = payroll_approval_ot.pao_approvalcount
        WHERE 
        pao_status = 'Applied' 
            AND pao_subgroupid IN (${subgroupid})`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              AOTCount: result[0].AOT,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countleavecard", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `    
    SELECT 
    count(*) AS LEAVES
    FROM 
    leaves
    INNER JOIN master_employee ON leaves.l_employeeid = me_id
     INNER JOIN 
        aprroval_stage_settings ON 
            aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
            aprroval_stage_settings.ats_subgroupid = leaves.l_subgroupid AND
            aprroval_stage_settings.ats_count = leaves.l_approvalcount
            WHERE 
            l_leavestatus = 'Pending' 
        AND l_subgroupid IN (${subgroupid})`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              LEAVESCount: result[0].LEAVES,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countotmealcard", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `    
    SELECT 
    count(*) AS OTMEAL
    FROM 
    ot_meal_allowances
    INNER JOIN master_employee ON ot_meal_allowances.oma_employeeid = me_id
    INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = ot_meal_allowances.oma_subgroupid AND
                aprroval_stage_settings.ats_count = ot_meal_allowances.oma_approvalcount
    WHERE 
        oma_status = 'Applied' 
        AND oma_subgroupid IN (${subgroupid})`;
    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              OTMEALCount: result[0].OTMEAL,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countrestdayotcard", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `    
    SELECT 
    count(*) AS RDOT
    FROM 
    restday_ot_approval
    INNER JOIN master_employee ON restday_ot_approval.roa_employeeid = me_id
    INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = restday_ot_approval.roa_subgroupid AND
                aprroval_stage_settings.ats_count = restday_ot_approval.roa_approvalcount
    WHERE 
        roa_status = 'Applied' 
        AND roa_subgroupid IN (${subgroupid})`;
    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              RDOTCount: result[0].RDOT,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countholidaycard", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `    
    SELECT 
    count(*) AS HOLIDAY
    FROM 
    payroll_holiday
    INNER JOIN master_employee ON payroll_holiday.ph_employeeid = me_id
    INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = payroll_holiday.ph_subgroupid AND
                aprroval_stage_settings.ats_count = payroll_holiday.ph_approvalcount
    WHERE 
        ph_status = 'Applied' 
        AND ph_subgroupid IN (${subgroupid})`;
    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              HOLIDAYCount: result[0].HOLIDAY,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countattendancebadge", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT
    COUNT(*) AS LATE
FROM
    master_attendance ma
JOIN
    master_shift ms ON ma.ma_employeeid = ms.ms_employeeid
JOIN master_employee me ON ma.ma_employeeid = me.me_id
WHERE
    ma.ma_attendancedate = CURDATE()
    AND me.me_department = '${departmentid}'
    AND ma.ma_clockin IS NOT NULL
    AND (
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END
    ) IS NOT NULL
    AND ma.ma_clockin > CONCAT(CAST(ma.ma_attendancedate AS DATE), ' ', 
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END)`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              LATECount: result[0].LATE,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/totalcoa", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
    concat(me_lastname,' ',me_firstname) as ar_employeeid,
    DATE_FORMAT(ar_attendace_date, '%W, %M %e, %Y') AS ar_attendace_date,
    TIME_FORMAT(ar_timein, '%h:%i %p') ar_timein, 
    TIME_FORMAT(ar_timeout, '%h:%i %p') ar_timeout,
    ar_total,
    ar_reason
    FROM attendance_request
    INNER JOIN master_employee ON attendance_request.ar_employeeid = me_id
    INNER JOIN 
        aprroval_stage_settings ON 
            aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
            aprroval_stage_settings.ats_subgroupid = attendance_request.ar_subgroupid AND
            aprroval_stage_settings.ats_count = attendance_request.ar_approvalcount
     WHERE 
        ar_status = 'Pending' 
        AND ar_subgroupid IN (${subgroupid})`;

    console.log(departmentid);
    console.log(subgroupid);
    console.log(accesstypeid);
    console.log(sql);

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ar_");

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

router.get("/totalotmeal", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
    concat(me_lastname,' ',me_firstname) as oma_employeeid,
    DATE_FORMAT(oma_attendancedate, '%W, %M %e, %Y') AS oma_attendancedate,
    TIME_FORMAT(oma_clockin, '%h:%i %p') oma_clockin, 
    TIME_FORMAT(oma_clockin, '%h:%i %p') oma_clockin,
    oma_totalovertime,
    oma_otmeal_amount
    FROM ot_meal_allowances
    INNER JOIN master_employee ON ot_meal_allowances.oma_employeeid = me_id
    INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = ot_meal_allowances.oma_subgroupid AND
                aprroval_stage_settings.ats_count = ot_meal_allowances.oma_approvalcount
    WHERE 
        oma_status = 'Applied' 
        AND oma_subgroupid IN (${subgroupid})`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");

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

router.get("/totalot", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
    pao_fullname,
    DATE_FORMAT(pao_attendancedate, '%W, %M %e, %Y') AS pao_attendancedate,
    TIME_FORMAT(pao_clockin, '%h:%i %p') pao_clockin, 
    TIME_FORMAT(pao_clockout, '%h:%i %p') pao_clockout,
    pao_total_hours,
    pao_reason
    FROM payroll_approval_ot
    INNER JOIN master_employee ON payroll_approval_ot.pao_employeeid = me_id
    INNER JOIN 
    aprroval_stage_settings ON 
        aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
        aprroval_stage_settings.ats_subgroupid = payroll_approval_ot.pao_subgroupid AND
        aprroval_stage_settings.ats_count = payroll_approval_ot.pao_approvalcount
    WHERE 
    pao_status = 'Applied' 
        AND pao_subgroupid IN (${subgroupid})`;

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
      if (err) console.error("Error :!!", err);

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

router.get("/totalleave", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
    concat(me_lastname,' ',me_firstname) as FullName,
    DATE_FORMAT(l_leavestartdate, '%W, %M %e, %Y') AS startdate,
    DATE_FORMAT(l_leaveenddate, '%W, %M %e, %Y') AS enddate,
    l_leavetype as leavetype,
    l_leaveapplieddate as applieddate,
    l_leavereason as leavereason,
    CASE
        WHEN DATEDIFF(l_leaveenddate, l_leavestartdate) = 1 THEN '1 day'
        ELSE CONCAT(DATEDIFF(l_leaveenddate, l_leavestartdate), ' days')
    END AS leave_duration
FROM 
    leaves
INNER JOIN 
    master_employee ON leaves.l_employeeid = me_id
    INNER JOIN 
    aprroval_stage_settings ON 
        aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
        aprroval_stage_settings.ats_subgroupid = leaves.l_subgroupid AND
        aprroval_stage_settings.ats_count = leaves.l_approvalcount
        WHERE 
        l_leavestatus = 'Pending' 
    AND l_subgroupid IN (${subgroupid})`;

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

router.get("/totalrestdayot", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
    concat(me_lastname,' ',me_firstname) as roa_employeeid,
    DATE_FORMAT(roa_attendancedate, '%W, %M %e, %Y') AS roa_attendancedate,
    TIME_FORMAT(roa_timein, '%h:%i %p') roa_timein, 
    TIME_FORMAT(roa_timeout, '%h:%i %p') roa_timeout,
    roa_total_hours
    FROM restday_ot_approval
    INNER JOIN master_employee ON restday_ot_approval.roa_employeeid = me_id
    INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = restday_ot_approval.roa_subgroupid AND
                aprroval_stage_settings.ats_count = restday_ot_approval.roa_approvalcount
    WHERE 
        roa_status = 'Applied' 
        AND roa_subgroupid IN (${subgroupid})`;

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

router.get("/totalholiday", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
    concat(me_lastname,' ',me_firstname) as ph_employeeid,
    DATE_FORMAT(ph_attendancedate, '%W, %M %e, %Y') AS ph_attendancedate,
    TIME_FORMAT(ph_timein, '%h:%i %p') ph_timein, 
    TIME_FORMAT(ph_timeout, '%h:%i %p') ph_timeout,
    ph_total_hours
    FROM payroll_holiday
    INNER JOIN master_employee ON payroll_holiday.ph_employeeid = me_id
    INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = payroll_holiday.ph_subgroupid AND
                aprroval_stage_settings.ats_count = payroll_holiday.ph_approvalcount
    WHERE 
        ph_status = 'Applied' 
        AND ph_subgroupid IN (${subgroupid})`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");

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

router.post("/searchemployee", (req, res) => {
  try {
    const { search } = req.body;
    let departmentid = req.session.departmentid;
    let firstName = "";
    let lastName = "";

    const lastSpaceIndex = search.lastIndexOf(" ");
    if (lastSpaceIndex !== -1) {
      firstName = search.substring(0, lastSpaceIndex);
      lastName = search.substring(lastSpaceIndex + 1);
    } else {
      firstName = search;
    }

    let sql = `SELECT me_id, me_firstname, me_lastname, me_profile_pic FROM master_employee WHERE 1 AND me_department = '${departmentid}'`;

    if (firstName) {
      sql += ` AND me_firstname LIKE '%${firstName}%'`;
    }

    if (lastName) {
      sql += ` AND me_lastname LIKE '%${lastName}%'`;
    }

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        const employees = result.map((employee) => ({
          employeeid: employee.me_id,
          name: `${employee.me_firstname} ${employee.me_lastname}`,
          profilePic: employee.me_profile_pic,
        }));
        res.json({
          msg: "success",
          data: employees,
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
