const cron = require("node-cron");
const moment = require("moment");
const mysql = require("./hrmisdb");
const { InsertStatement } = require("./customhelper");
const { InsertTable } = require("./dbconnect");

exports.insertDailyAttendanceStatus = () => {
  const todayDate = moment().format("YYYY-MM-DD");
  const todayDayOfWeek = moment().format("dddd").toLowerCase();

  console.log(`[${todayDate}] - Starting attendance status insertion.`);

  const fetchEmployeesQuery = `
    SELECT ms.ms_employeeid, ms.ms_monday, ms.ms_tuesday, ms.ms_wednesday, 
           ms.ms_thursday, ms.ms_friday, ms.ms_saturday, ms.ms_sunday,
           cs.cs_actualrd, cs.cs_changerd
    FROM master_employee me
    JOIN master_shift ms ON me.me_id = ms.ms_employeeid
    LEFT JOIN change_shift cs ON cs.cs_employeeid = ms.ms_employeeid
                               AND (cs.cs_actualrd = '${todayDate}' OR cs.cs_changerd = '${todayDate}')
    WHERE me.me_jobstatus IN ('regular', 'apprentice', 'probitionary')
  `;

  const fetchLeaveDatesQuery = `
    SELECT ld_employeeid FROM leave_dates 
    WHERE ld_leavedates = '${todayDate}'
  `;

  const fetchHolidayQuery = `
    SELECT mh_date FROM master_holiday 
    WHERE mh_date = '${todayDate}'
  `;

  mysql
    .mysqlQueryPromise(fetchEmployeesQuery)
    .then((employees) => {
      // console.log("Employees and shift data fetched:", employees);
      if (employees.length === 0) {
        console.log("No employees found with the specified job statuses.");
        return;
      }

      mysql.mysqlQueryPromise(fetchLeaveDatesQuery)
        .then((leaveDates) => {
          const onLeaveEmployees = leaveDates.map(ld => ld.ld_employeeid);

          mysql.mysqlQueryPromise(fetchHolidayQuery)
            .then((holidays) => {
              const isHoliday = holidays.length > 0;

              const insertAttendanceStatusQuery = InsertStatement(
                "attendance_status",
                "as",
                [
                  "attendance_date",
                  "employeeid",
                  "status",
                  "minutes",
                  "hours",
                  "scheduled_timein",
                  "scheduled_timeout"
                ]
              );

              const data = employees.map((employee) => {
                let shiftForToday;
                let status = "Absent";
                let scheduledTimeIn = "00:00:00";
                let scheduledTimeOut = "00:00:00";

                if (employee.cs_actualrd === todayDate) {
                  // Use the shift of the cs_changerd date
                  shiftForToday = JSON.parse(employee[`ms_${moment(employee.cs_changerd).format("dddd").toLowerCase()}`]);
                } else {
                  // Fallback to the current day's shift
                  shiftForToday = JSON.parse(employee[`ms_${todayDayOfWeek}`]);
                }

                const isRestDay =
                  shiftForToday.time_in === "00:00:00" &&
                  shiftForToday.time_out === "00:00:00";

                const isExempted =
                  shiftForToday.time_in === "Exempted" &&
                  shiftForToday.time_out === "Exempted";

                if (employee.cs_changerd === todayDate) {
                  status = "Rest Day";
                } else if (isExempted) {
                  status = "Exempted";
                  scheduledTimeIn = "00:00:00";
                  scheduledTimeOut = "00:00:00";
                } else if (isRestDay) {
                  status = "Rest Day";
                } else if (onLeaveEmployees.includes(employee.ms_employeeid)) {
                  status = "On Leave";
                } else if (isHoliday) {
                  status = "Holiday";
                  scheduledTimeIn = shiftForToday.time_in;
                  scheduledTimeOut = shiftForToday.time_out;
                } else {
                  scheduledTimeIn = shiftForToday.time_in;
                  scheduledTimeOut = shiftForToday.time_out;
                }

                return [
                  todayDate,
                  employee.ms_employeeid,
                  status,
                  0,
                  0,
                  scheduledTimeIn,
                  scheduledTimeOut
                ];
              });

              InsertTable(insertAttendanceStatusQuery, data, (err, result) => {
                if (err) {
                  console.error("Error inserting attendance status:", err);
                } else {
                  console.log("Attendance status inserted successfully.");
                }
              });
            })
            .catch((holidayError) => {
              console.error("Error fetching holidays:", holidayError);
            });
        })
        .catch((leaveError) => {
          console.error("Error fetching leave dates:", leaveError);
        });
    })
    .catch((error) => {
      console.error("Error fetching employees and shifts:", error);
    });
};
