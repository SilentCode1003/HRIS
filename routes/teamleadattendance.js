const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  JsonSuccess,
  MessageStatus,
} = require("./repository/response");
const { Select, Update, InsertTable } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, ACT, INACT } = require("./repository/dictionary");
const {
  GetCurrentDatetime,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();
const XLSX = require("xlsx");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(
    req,
    res,
    "teamleadattendancelayout",
    "teamleadattendance"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
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
      WHERE me_department = '${departmentid}'
      AND ma_attendancedate = CURDATE()
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

router.get("/loadexport", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = ` 
    SELECT 
    me_id,
    CONCAT(master_employee.me_lastname, " ", master_employee.me_firstname) AS me_fullname,
    me_phone,
    me_email,
    me_jobstatus,
    md_departmentname AS me_department,
    mp_positionname AS me_position
    FROM
    master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    WHERE
    me_jobstatus IN ('regular', 'probitionary','apprentice')
    AND me_department = '${departmentid}'`;


    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      //console.log(result);

      if (result != 0) {
        let data = DataModeling(result, "me_");

        //console.log(data);
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


router.post("/daterange", (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let departmentid = req.session.departmentid;
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
    '${startdate}' AND '${enddate}' AND me_department = '${departmentid}'`;

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


router.post('/exportreports', async (req, res) => {
  try {
    const { startdate, enddate } = req.body;

    // Define the SQL command to call the stored procedure
    const sqlExportAttendance = `CALL hrmis.ExportAttendanceData('${startdate}', '${enddate}')`;

    // Execute the stored procedure and get the results
    const resultExportAttendance = await mysql.mysqlQueryPromise(sqlExportAttendance);

    // Ensure that resultExportAttendance is an array and has at least two elements
    if (!Array.isArray(resultExportAttendance) || resultExportAttendance.length < 2) {
      throw new Error('Invalid result structure from stored procedure');
    }

    // Fetch TempAttendanceSummary (first result set)
    const summaryResults = resultExportAttendance[0];
    if (!summaryResults) {
      throw new Error('No summary results found');
    }
    const summaryData = JSON.parse(JSON.stringify(summaryResults));

    // Fetch TempAttendance (second result set)
    const attendanceResults = resultExportAttendance[1];
    if (!attendanceResults) {
      throw new Error('No attendance results found');
    }
    const attendanceData = JSON.parse(JSON.stringify(attendanceResults));

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create and append a sheet for TempAttendanceSummary
    if (summaryData.length > 0) {
      const worksheetSummary = XLSX.utils.json_to_sheet(summaryData, { header: Object.keys(summaryData[0]) });
      adjustColumnWidths(worksheetSummary, summaryData);
      formatHeaders(worksheetSummary);
      XLSX.utils.book_append_sheet(workbook, worksheetSummary, 'Attendance Summary');
    }

    // Group TempAttendance by employeeid
    const groupedData = {};
    attendanceData.forEach((record) => {
      const { employeeid, fullname } = record; // Ensure these fields exist in your data
      if (!employeeid || !fullname) {
        console.warn('Missing employeeid or fullname in record:', record);
        return;
      }
      if (!groupedData[employeeid]) {
        groupedData[employeeid] = { data: [], name: fullname };
      }
      groupedData[employeeid].data.push(record);
    });

    // Convert groupedData to an array and sort by fullname
    const sortedEmployeeData = Object.keys(groupedData)
      .map(employeeId => ({ id: employeeId, ...groupedData[employeeId] }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Create and append sheets for each employee with their full name
    sortedEmployeeData.forEach(({ id, data, name }) => {
      if (data.length > 0) {
        const worksheetEmployee = XLSX.utils.json_to_sheet(data, { header: Object.keys(data[0]) });

        // Adjust the column widths and format the headers
        adjustColumnWidths(worksheetEmployee, data);
        formatHeaders(worksheetEmployee);

        // Apply date format to the 'attendancedate' column (index 2 which is 'C' in Excel)
        const range = XLSX.utils.decode_range(worksheetEmployee['!ref']);
        for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
          const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: 3 }); // Column 'C' is index 2
          const cell = worksheetEmployee[cellAddress];
          if (cell && cell.t === 's') { // Check if the cell is a string
            // Parse the date string and reformat it to 'yyyy-mm-dd'
            const date = new Date(cell.v);
            cell.v = date.toISOString().split('T')[0]; // Convert to 'YYYY-MM-DD'
            cell.t = 's'; // Ensure the cell is treated as a string
          }
        }

        XLSX.utils.book_append_sheet(workbook, worksheetEmployee, `${name}`);
      }
    });

    // Write to buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer' });

    // Send the file to client
    res.setHeader('Content-Disposition', `attachment; filename="Attendance_data_${startdate}_${enddate}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'error', data: error.message });
  }
});



function adjustColumnWidths(worksheet, data) {
  const cols = [];
  
  // Determine the maximum length of each column
  data.forEach(row => {
    Object.keys(row).forEach((key, index) => {
      const length = (row[key] ? row[key].toString().length : 10) + 2; // Adding some padding
      if (!cols[index] || cols[index] < length) {
        cols[index] = length;
      }
    });
  });

  // Adjust column width considering headers
  const headerKeys = Object.keys(data[0]);
  headerKeys.forEach((key, index) => {
    const headerLength = key.length + 2; // Adding some padding for headers
    if (!cols[index] || cols[index] < headerLength) {
      cols[index] = headerLength;
    }
  });

  // Apply the width to each column
  worksheet['!cols'] = cols.map(width => ({ wpx: width * 10 })); // Adjust wpx for better readability
}
function formatHeaders(worksheet) {
  const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
  if (!headerRow) return;

  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const headerCellIndices = headerRow.map((_, index) => index);

  headerCellIndices.forEach(index => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
    if (!worksheet[cellAddress]) return;

    const cell = worksheet[cellAddress];
    cell.s = {
      font: {
        bold: true,
        color: { rgb: "FFFFFF" }
      },
      fill: {
        fgColor: { rgb: "000000" }
      },
      alignment: {
        horizontal: "center"
      }
    };

    // Convert text to uppercase
    cell.v = cell.v.toString().toUpperCase();
  });
}

