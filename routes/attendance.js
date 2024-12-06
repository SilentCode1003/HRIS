const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const e = require("express");
var router = express.Router();
const currentDate = moment();
const XLSX = require("xlsx");
const {
  AddDayTime,
  AddDay,
  InsertStatement,
  UpdateStatement,
  ConvertToDate,
  ConvertTo24Formart,
} = require("./repository/customhelper");
const { Insert, Update } = require("./repository/dbconnect");
//const XLSX = require('xlsx-style'); // Note the use of 'xlsx-style'

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('attendancelayout', { title: 'Express' });

  Validator(req, res, "attendancelayout", "attendance");
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
        WHERE
        ma_attendancedate = CURDATE()
        ORDER BY ma_attendanceid DESC`;

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
    ma_locationIn as geofencenameIn,
    ma_locationOut as geofencenameOut, 
    CONCAT(
    FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
    FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
    ) AS totalhours
    FROM master_attendance
    INNER JOIN master_employee ON ma_employeeid = me_id
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
    al_location as location
    from attendance_logs
    inner join master_employee on attendance_logs.al_employeeid = me_id
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

router.post("/exportfile", async (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sqlExportAttendance = `call hrmis.ExportAttendance('${startdate}', '${enddate}');`;
    let sqlExportAttendanceDetailed = `call hrmis.ExportAttendanceDetailed('${startdate}', '${enddate}');`;

    const resultExportAttendance = await mysql.mysqlQueryPromise(
      sqlExportAttendance
    );
    const resultExportAttendanceDetailed = await mysql.mysqlQueryPromise(
      sqlExportAttendanceDetailed
    );

    const jsonDataExportAttendance = JSON.parse(
      JSON.stringify(resultExportAttendance[0])
    );
    const jsonDataExportAttendanceDetailed = JSON.parse(
      JSON.stringify(resultExportAttendanceDetailed[0])
    );

    if (jsonDataExportAttendance.length === 0) {
      return res
        .status(404)
        .json({ msg: "No data found for ExportAttendance" });
    }

    if (jsonDataExportAttendanceDetailed.length === 0) {
      return res
        .status(404)
        .json({ msg: "No data found for ExportAttendanceDetailed" });
    }

    const workbook = XLSX.utils.book_new();
    const worksheetExportAttendanceFirst = XLSX.utils.json_to_sheet(
      jsonDataExportAttendance,
      { header: Object.keys(jsonDataExportAttendance[0]) }
    );
    XLSX.utils.book_append_sheet(
      workbook,
      worksheetExportAttendanceFirst,
      "Attendance Summary"
    );
    const columnCountExportAttendance =
      XLSX.utils.decode_range(worksheetExportAttendanceFirst["!ref"]).e.c + 1;
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
      const worksheet = XLSX.utils.json_to_sheet(groupedData[employeeId], {
        header: Object.keys(groupedData[employeeId][0]),
      });

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

router.post("/exportreports", async (req, res) => {
  try {
    const { startdate, enddate, departmentids } = req.body;

    const sqlExportAttendance = `CALL hrmis.ExportAttendanceData('${startdate}', '${enddate}')`;

    const resultExportAttendance = await mysql.mysqlQueryPromise(
      sqlExportAttendance
    );

    if (
      !Array.isArray(resultExportAttendance) ||
      resultExportAttendance.length < 2
    ) {
      throw new Error("Invalid result structure from stored procedure");
    }

    const summaryResults = resultExportAttendance[0];
    if (!summaryResults) {
      throw new Error("No summary results found");
    }
    const summaryData = JSON.parse(JSON.stringify(summaryResults));

    const attendanceResults = resultExportAttendance[1];
    if (!attendanceResults) {
      throw new Error("No attendance results found");
    }
    const attendanceData = JSON.parse(JSON.stringify(attendanceResults));
    const filteredSummaryData = departmentids.includes("all")
      ? summaryData
      : summaryData.filter((record) => departmentids.includes(record.departmentId.toString()));

    const filteredAttendanceData = departmentids.includes("all")
      ? attendanceData
      : attendanceData.filter((record) => departmentids.includes(record.departmentId.toString()));

    const workbook = XLSX.utils.book_new();

    if (filteredSummaryData.length > 0) {
      const worksheetSummary = XLSX.utils.json_to_sheet(filteredSummaryData, {
        header: Object.keys(filteredSummaryData[0]),
      });
      adjustColumnWidths(worksheetSummary, filteredSummaryData);
      formatHeaders(worksheetSummary);
      XLSX.utils.book_append_sheet(
        workbook,
        worksheetSummary,
        "Attendance Summary"
      );
    }

    const groupedData = {};
    filteredAttendanceData.forEach((record) => {
      const { employeeid, fullname } = record;
      if (!employeeid || !fullname) {
        console.warn("Missing employeeid or fullname in record:", record);
        return;
      }
      if (!groupedData[employeeid]) {
        groupedData[employeeid] = { data: [], name: fullname };
      }
      groupedData[employeeid].data.push(record);
    });

    const sortedEmployeeData = Object.keys(groupedData)
      .map((employeeId) => ({ id: employeeId, ...groupedData[employeeId] }))
      .sort((a, b) => a.name.localeCompare(b.name));

    sortedEmployeeData.forEach(({ id, data, name }) => {
      if (data.length > 0) {
        const worksheetEmployee = XLSX.utils.json_to_sheet(data, {
          header: Object.keys(data[0]),
        });

        adjustColumnWidths(worksheetEmployee, data);
        formatHeaders(worksheetEmployee);

        const range = XLSX.utils.decode_range(worksheetEmployee["!ref"]);
        for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
          const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: 2 });
          const cell = worksheetEmployee[cellAddress];
          if (cell && cell.t === "s") {
            const date = new Date(cell.v);
            cell.v = date.toISOString().split("T")[0];
            cell.t = "s";
          }
        }

        XLSX.utils.book_append_sheet(workbook, worksheetEmployee, `${name}`);
      }
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
    res.status(500).json({ msg: "error", data: error.message });
  }
});


function adjustColumnWidths(worksheet, data) {
  const cols = [];

  data.forEach((row) => {
    Object.keys(row).forEach((key, index) => {
      const length = (row[key] ? row[key].toString().length : 10) + 2; 
      if (!cols[index] || cols[index] < length) {
        cols[index] = length;
      }
    });
  });


  const headerKeys = Object.keys(data[0]);
  headerKeys.forEach((key, index) => {
    const headerLength = key.length + 2;
    if (!cols[index] || cols[index] < headerLength) {
      cols[index] = headerLength;
    }
  });

  worksheet["!cols"] = cols.map((width) => ({ wpx: width * 10 })); 
}
function formatHeaders(worksheet) {
  const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
  if (!headerRow) return;

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  const headerCellIndices = headerRow.map((_, index) => index);

  headerCellIndices.forEach((index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
    if (!worksheet[cellAddress]) return;

    const cell = worksheet[cellAddress];
    cell.s = {
      font: {
        bold: true,
        color: { rgb: "FFFFFF" },
      },
      fill: {
        fgColor: { rgb: "000000" },
      },
      alignment: {
        horizontal: "center",
      },
    };

    cell.v = cell.v.toString().toUpperCase();
  });
}

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

router.post("/migrateattendance", (req, res) => {
  try {
    const { data } = req.body;
    const json = JSON.parse(data);
    for (const row of json) {
      if (row.logs.includes("NO LOGS")) continue;
      const { id, attendancedate, logs } = row;
      let date = ConvertToDate(attendancedate);
      let log = logs.split(" TO ");
      let logouttype = log[1].slice(6, 8);
      let timein = `${date} ${ConvertTo24Formart(log[0])}`;
      let timeout =
        logouttype == "AM"
          ? `${AddDay(date, 1)} ${ConvertTo24Formart(log[1])}`
          : `${date} ${ConvertTo24Formart(log[1])}`;

      let logindata = [[id, date, timein, 0.0, 0.0, 0, "SPROUT", "MIGRATED"]];
      let logoutdata = [timeout, 0.0, 0.0, 0, "SPROUT", "MIGRATED", id, date];

      let insertQuery = InsertStatement("master_attendance", "ma", [
        "employeeid",
        "attendancedate",
        "clockin",
        "latitudein",
        "longitudein",
        "gefenceidIn",
        "devicein",
        "locationin",
      ]);

      Insert(insertQuery, logindata, (err, result) => {
        if (err) {
          console.log(err);
        }
      });

      let updateQuery = UpdateStatement(
        "master_attendance",
        "ma",
        [
          "clockout",
          "latitudeout",
          "longitudeout",
          "geofenceidOut",
          "deviceout",
          "locationout",
        ],
        ["employeeid", "attendancedate"]
      );

      Update(updateQuery, logoutdata, (err, result) => {
        if (err) {
          console.log(err);
        }
      });
    }

    res.status(200).json({ msg: "success" });
  } catch (error) {
    res.status(500).json({ msg: "error" });
  }
});
