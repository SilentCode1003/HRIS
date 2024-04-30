const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const e = require("express");
var router = express.Router();
const currentDate = moment();
const XLSX = require("xlsx");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('attendancelayout', { title: 'Express' });

  Validator(req, res, "attendancelayout");
});

module.exports = router;

router.post("/set-geofence", async (req, res) => {
  const { geofenceLatitude, geofenceLongitude, geofenceRadius } = req.body;

  try {
    const GeoFenceSettings = mongoose.model("GeoFenceSettings", {
      latitude: Number,
      longitude: Number,
      radius: Number,
    });

    const existingSettings = await GeoFenceSettings.findOne();

    if (existingSettings) {
      existingSettings.latitude = geofenceLatitude;
      existingSettings.longitude = geofenceLongitude;
      existingSettings.radius = geofenceRadius;
      await existingSettings.save();
    } else {
      const newSettings = new GeoFenceSettings({
        latitude: geofenceLatitude,
        longitude: geofenceLongitude,
        radius: geofenceRadius,
      });
      await newSettings.save();
    }

    res
      .status(200)
      .json({ message: "Geo-fence settings updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
        ma_attendanceid as attendanceid,
        CONCAT(me_lastname, " ", me_firstname) as employeeid,
        DATE_FORMAT(ma_attendancedate, '%W, %M %e, %Y') as attendancedate,
        TIME_FORMAT(ma_clockin, '%H:%i:%s') as clockin,
        TIME_FORMAT(ma_clockout, '%H:%i:%s') as clockout,
        ma_devicein as devicein,
        ma_deviceout as deviceout,
        CONCAT(
            FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
            FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
        ) AS totalhours
        FROM master_attendance
        LEFT JOIN master_employee ON ma_employeeid = me_id
        ORDER BY ma_attendancedate DESC`;

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
    console.log("error", error);
  }
});

router.post("/missedlogs", (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql = ` SELECT 
    ma_attendanceid as attendanceid,
    CONCAT(me_lastname, " ", me_firstname) as employeeid,
    DATE_FORMAT(ma_attendancedate, '%W, %M %e, %Y') as attendancedate,
    TIME_FORMAT(ma_clockin, '%h:%i %p') as clockin,
    TIME_FORMAT(ma_clockout, '%h:%i %p') as clockout,
    ma_devicein as devicein,
    ma_deviceout as deviceout,
     CONCAT(
            FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
            FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
        ) AS totalhours
    FROM master_attendance 
    LEFT JOIN master_employee ON ma_employeeid = me_id
    WHERE ma_attendancedate BETWEEN 
    '${startdate}' AND '${enddate}' AND ma_clockout IS NULL OR ma_clockin IS NULL`;

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

router.post("/daterange", (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql = ` SELECT 
    ma_attendanceid as attendanceid,
    CONCAT(me_lastname, " ", me_firstname) as employeeid,
    DATE_FORMAT(ma_attendancedate, '%W, %M %e, %Y') as attendancedate,
    TIME_FORMAT(ma_clockin, '%h:%i %p') as clockin,
    TIME_FORMAT(ma_clockout, '%h:%i %p') as clockout,
    ma_devicein as devicein,
    ma_deviceout as deviceout,
     CONCAT(
            FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
            FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
        ) AS totalhours
    FROM master_attendance 
    LEFT JOIN master_employee ON ma_employeeid = me_id
    WHERE ma_attendancedate BETWEEN 
    '${startdate}' AND '${enddate}'`;

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

router.post("/getloadforapp", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `       
  SELECT
  CONCAT(me_lastname, " ", me_firstname) as employeeid,
  TIME_FORMAT(ma_clockin, '%H:%i:%s') as clockin,
  TIME_FORMAT(ma_clockout, '%H:%i:%s') as clockout,
  DATE_FORMAT(ma_clockout, '%Y-%m-%d') as attendancedateout,
  DATE_FORMAT(ma_clockin, '%Y-%m-%d') as attendancedatein,
  ma_devicein as devicein,
  ma_deviceout as deviceout,
  CONCAT(
  FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
  FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
  ) AS totalhours,
  mgsIn.mgs_geofencename AS geofencenameIn,
  mgsOut.mgs_geofencename AS geofencenameOut
  FROM master_attendance
  INNER JOIN master_employee ON ma_employeeid = me_id
  LEFT JOIN
  master_geofence_settings mgsIn ON ma_gefenceidIn = mgsIn.mgs_id
  LEFT JOIN
  master_geofence_settings mgsOut ON ma_geofenceidOut = mgsOut.mgs_id
  where ma_employeeid='${employeeid}'
  ORDER BY ma_attendancedate DESC
  limit 2`;

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
    console.log("error", error);
  }
});

router.post("/filterforapp", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `       
    SELECT
    CONCAT(me_lastname, " ", me_firstname) as employeeid,
    TIME_FORMAT(ma_clockin, '%H:%i:%s') as clockin,
    TIME_FORMAT(ma_clockout, '%H:%i:%s') as clockout,
    DATE_FORMAT(ma_clockout, '%Y-%m-%d') as attendancedateout,
    DATE_FORMAT(ma_clockin, '%Y-%m-%d') as attendancedatein,
    ma_devicein as devicein,
    ma_deviceout as deviceout,
    mgsIn.mgs_geofencename AS geofencenameIn,
    mgsOut.mgs_geofencename AS geofencenameOut,
    CONCAT(
    FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
    FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
    ) AS totalhours
    FROM master_attendance
    INNER JOIN master_employee ON ma_employeeid = me_id
    LEFT JOIN
    master_geofence_settings mgsIn ON ma_gefenceidIn = mgsIn.mgs_id
    LEFT JOIN
    master_geofence_settings mgsOut ON ma_geofenceidOut = mgsOut.mgs_id
    where ma_employeeid='${employeeid}'
    ORDER BY ma_attendancedate DESC`;

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
    console.log("error", error);
  }
});

router.post("/logs", (req, res) => {
  try {
    let attendanceid = req.body.attendanceid;
    let sql = `select 
    me_profile_pic as image,
    concat(me_lastname,' ',me_firstname) as fullname,
	  DATE_FORMAT(al_logdatetime, '%W, %M %e, %Y') AS logdate,
	  TIME(al_logdatetime) AS logtime,
    al_logtype AS logtype,
	  al_latitude AS latitude,
    al_longitude AS longitude,
	  al_device AS device,
    mgs_geofencename as location
    from attendance_logs
    inner join master_employee on attendance_logs.al_employeeid = me_id
    inner join master_geofence_settings on attendance_logs.al_geofenceid = mgs_id
    where al_attendanceid = '${attendanceid}'`;

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

router.post("/gethomestatus2", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let attendancedate = req.body.attendancedate;
    let sql = `select 
		DATE_FORMAT(ma_clockin, '%W, %M %e, %Y') AS logdatein,
        TIME(ma_clockin) AS logtimein,
        DATE_FORMAT(ma_clockout, '%W, %M %e, %Y') AS logdateout,
        TIME(ma_clockout) AS logtimeout
        from master_attendance
        where ma_employeeid = '${employeeid}' and ma_attendancedate = '${attendancedate}'
        order by ma_attendancedate desc 
        limit 1`;
    console.log(sql);

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
    console.log("error", error);
  }
});

// router.post("/exportfile", async (req, res) => {
//   try {
//     let startdate = req.body.startdate;
//     let enddate = req.body.enddate;
//     let sql = `call hrmis.ExportAttendance('${startdate}', '${enddate}');`;

//     const result = await mysql.mysqlQueryPromise(sql);

//     const jsonData = JSON.parse(JSON.stringify(result[0]));

//     if (jsonData.length === 0) {
//       return res.status(404).json({ msg: "No data found" });
//     }

//     const headers = Object.keys(jsonData[0]);

//     const worksheet = XLSX.utils.json_to_sheet(jsonData, { header: headers });
//     const workbook = XLSX.utils.book_new();
//     const worksheetName = `${startdate}_${enddate}`;
//     XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

//     const columnCount = XLSX.utils.decode_range(worksheet["!ref"]).e.c + 1;
//     worksheet["!cols"] = [];
//     for (let i = 0; i < columnCount; i++) {
//       if (i === 0) {
//         worksheet["!cols"].push({ wch: 30 });
//       } else {
//         worksheet["!cols"].push({ wch: 20 });
//       }
//     }
//     const excelBuffer = XLSX.write(workbook, { type: "buffer" });

//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="Attendance_data_${startdate}_${enddate}.xlsx"`
//     );
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.send(excelBuffer);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ msg: "error", data: error });
//   }
// });

router.post("/exportfile", async (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sqlExportAttendance = `call hrmis.ExportAttendance('${startdate}', '${enddate}');`;
    let sqlExportAttendanceDetailed = `call hrmis.ExportAttendanceDetailed('${startdate}', '${enddate}');`;

    const resultExportAttendance = await mysql.mysqlQueryPromise(sqlExportAttendance);
    const resultExportAttendanceDetailed = await mysql.mysqlQueryPromise(sqlExportAttendanceDetailed);

    const jsonDataExportAttendance = JSON.parse(JSON.stringify(resultExportAttendance[0]));
    const jsonDataExportAttendanceDetailed = JSON.parse(JSON.stringify(resultExportAttendanceDetailed[0]));

    if (jsonDataExportAttendance.length === 0) {
      return res.status(404).json({ msg: "No data found for ExportAttendance" });
    }

    if (jsonDataExportAttendanceDetailed.length === 0) {
      return res.status(404).json({ msg: "No data found for ExportAttendanceDetailed" });
    }

    const workbook = XLSX.utils.book_new();
    const worksheetExportAttendanceFirst = XLSX.utils.json_to_sheet(jsonDataExportAttendance, { header: Object.keys(jsonDataExportAttendance[0]) });
    XLSX.utils.book_append_sheet(workbook, worksheetExportAttendanceFirst, 'Attendance Summary');
    const columnCountExportAttendance = XLSX.utils.decode_range(worksheetExportAttendanceFirst["!ref"]).e.c + 1;
    worksheetExportAttendanceFirst["!cols"] = [];
    for (let i = 0; i < columnCountExportAttendance; i++) {
      if (i === 0) {
        worksheetExportAttendanceFirst["!cols"].push({ wch: 30 });
      } else {
        worksheetExportAttendanceFirst["!cols"].push({ wch: 20 });
      }
    }

    const groupedData = {};
    jsonDataExportAttendanceDetailed.forEach((employeeData) => {
      const employeeId = employeeData.EmployeeId;
      if (!groupedData[employeeId]) {
        groupedData[employeeId] = [];
      }
      groupedData[employeeId].push(employeeData);
    });

    Object.keys(groupedData).forEach((employeeId) => {
      const sheetName = `Employee_${employeeId}`;
      const worksheet = XLSX.utils.json_to_sheet(groupedData[employeeId], { header: Object.keys(groupedData[employeeId][0]) });


      const columnCount = XLSX.utils.decode_range(worksheet["!ref"]).e.c + 1;
      worksheet["!cols"] = [];
      for (let i = 0; i < columnCount; i++) {
        if (i === 0) {
          worksheet["!cols"].push({ wch: 30 });
        } else {
          worksheet["!cols"].push({ wch: 20 });
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const excelBuffer = XLSX.write(workbook, { type: "buffer" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Attendance_data_${startdate}_${enddate}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ msg: "error", data: error });
  }
});







router.post("/exportfileperemployee", async (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.ExportAttendancePerEmployee('${startdate}', '${enddate}', '${employeeid}')`;

    const result = await mysql.mysqlQueryPromise(sql);

    const jsonData = JSON.parse(JSON.stringify(result[0]));

    if (jsonData.length === 0) {
      return res.status(404).json({ msg: "No data found" });
    }

    const headers = Object.keys(jsonData[0]);

    const worksheet = XLSX.utils.json_to_sheet(jsonData, { header: headers });
    const workbook = XLSX.utils.book_new();
    const worksheetName = `${startdate}_${enddate}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    const columnCount = XLSX.utils.decode_range(worksheet["!ref"]).e.c + 1;
    worksheet["!cols"] = [];
    for (let i = 0; i < columnCount; i++) {
      if (i === 0) {
        worksheet["!cols"].push({ wch: 30 });
      } else {
        worksheet["!cols"].push({ wch: 20 });
      }
    }
    const excelBuffer = XLSX.write(workbook, { type: "buffer" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Attendance_data_${startdate}_${enddate}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ msg: "error", data: error });
  }
});
