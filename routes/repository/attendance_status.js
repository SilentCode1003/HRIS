const cron = require("node-cron");
const moment = require("moment");
const mysql = require("./hrmisdb");
const { InsertStatement } = require("./customhelper");
const { InsertTable } = require("./dbconnect");

// exports.insertDailyAttendanceStatus = () => {
//   const todayDate = moment().format("YYYY-MM-DD");
//   const todayDayOfWeek = moment().format("dddd").toLowerCase(); // Get current day of the week (e.g., "monday")

//   console.log(`[${todayDate}] - Starting attendance status insertion.`);

//   const fetchEmployeesQuery = `
//     SELECT ms.ms_employeeid, ms.ms_monday, ms.ms_tuesday, ms.ms_wednesday, 
//            ms.ms_thursday, ms.ms_friday, ms.ms_saturday, ms.ms_sunday
//     FROM master_employee me
//     JOIN master_shift ms ON me.me_id = ms.ms_employeeid
//     WHERE me.me_jobstatus IN ('regular', 'apprentice', 'probationary')
//   `;

//   const fetchLeaveDatesQuery = `
//     SELECT ld_employeeid FROM leave_dates 
//     WHERE ld_leavedates = '${todayDate}'
//   `;

//   const fetchHolidayQuery = `
//     SELECT mh_date FROM master_holiday 
//     WHERE mh_date = '${todayDate}'`;

//   // Execute query to get employees, leave dates, and holidays
//   mysql
//     .mysqlQueryPromise(fetchEmployeesQuery)
//     .then((employees) => {
//       console.log("Employees and shift data fetched:", employees);
//       if (employees.length === 0) {
//         console.log("No employees found with the specified job statuses.");
//         return;
//       }

//       // Check for employees on leave
//       mysql.mysqlQueryPromise(fetchLeaveDatesQuery)
//         .then((leaveDates) => {
//           const onLeaveEmployees = leaveDates.map(ld => ld.ld_employeeid);

//           // Check if today is a holiday
//           mysql.mysqlQueryPromise(fetchHolidayQuery)
//             .then((holidays) => {
//               const isHoliday = holidays.length > 0;

//               const insertAttendanceStatusQuery = InsertStatement(
//                 "attendance_status",
//                 "as",
//                 ["attendance_date", "employeeid", "status", "minutes", "hours"]
//               );

//               const data = employees.map((employee) => {
//                 const shiftForToday = JSON.parse(employee[`ms_${todayDayOfWeek}`]); // Get today's shift
//                 const isRestDay =
//                   shiftForToday.time_in === "00:00:00" &&
//                   shiftForToday.time_out === "00:00:00";

//                 let status = "Absent"; // Default to "Absent"

//                 if (isRestDay) {
//                   status = "Rest Day";
//                 } else if (onLeaveEmployees.includes(employee.ms_employeeid)) {
//                   status = "On Leave";
//                 } else if (isHoliday) {
//                   status = "Holiday";
//                 }

//                 return [
//                   todayDate,
//                   employee.ms_employeeid,
//                   status, // Status: "Rest Day", "On Leave", "Holiday", or "Absent"
//                   0, // Default minutes
//                   0, // Default hours
//                 ];
//               });

//               console.log("Insert query:", insertAttendanceStatusQuery);
//               console.log("Data to be inserted:", data);

//               // Insert the attendance status for all employees
//               InsertTable(insertAttendanceStatusQuery, data, (err, result) => {
//                 if (err) {
//                   console.error("Error inserting attendance status:", err);
//                 } else {
//                   console.log(
//                     "Successfully inserted daily attendance status for employees.",
//                     result
//                   );
//                 }
//               });
//             })
//             .catch((holidayError) => {
//               console.error("Error fetching holidays:", holidayError);
//             });
//         })
//         .catch((leaveError) => {
//           console.error("Error fetching leave dates:", leaveError);
//         });
//     })
//     .catch((error) => {
//       console.error("Error fetching employees and shifts:", error);
//     });
// };

exports.insertDailyAttendanceStatus = () => {
  const todayDate = moment().format("YYYY-MM-DD");
  const todayDayOfWeek = moment().format("dddd").toLowerCase(); // Get current day of the week (e.g., "monday")

  console.log(`[${todayDate}] - Starting attendance status insertion.`);

  const fetchEmployeesQuery = `
    SELECT ms.ms_employeeid, ms.ms_monday, ms.ms_tuesday, ms.ms_wednesday, 
           ms.ms_thursday, ms.ms_friday, ms.ms_saturday, ms.ms_sunday
    FROM master_employee me
    JOIN master_shift ms ON me.me_id = ms.ms_employeeid
    WHERE me.me_jobstatus IN ('regular', 'apprentice', 'probitionary')
  `;

  const fetchLeaveDatesQuery = `
    SELECT ld_employeeid FROM leave_dates 
    WHERE ld_leavedates = '${todayDate}'
  `;

  const fetchHolidayQuery = `
    SELECT mh_date FROM master_holiday 
    WHERE mh_date = '${todayDate}'`;

  // Execute query to get employees, leave dates, and holidays
  mysql
    .mysqlQueryPromise(fetchEmployeesQuery)
    .then((employees) => {
      console.log("Employees and shift data fetched:", employees);
      if (employees.length === 0) {
        console.log("No employees found with the specified job statuses.");
        return;
      }

      // Check for employees on leave
      mysql.mysqlQueryPromise(fetchLeaveDatesQuery)
        .then((leaveDates) => {
          const onLeaveEmployees = leaveDates.map(ld => ld.ld_employeeid);

          // Check if today is a holiday
          mysql.mysqlQueryPromise(fetchHolidayQuery)
            .then((holidays) => {
              const isHoliday = holidays.length > 0;

              const insertAttendanceStatusQuery = InsertStatement(
                "attendance_status",
                "as",
                ["attendance_date", "employeeid", "status", "minutes", "hours", "scheduled_timein"]
              );

              const data = employees.map((employee) => {
                const shiftForToday = JSON.parse(employee[`ms_${todayDayOfWeek}`]); // Get today's shift
                const isRestDay =
                  shiftForToday.time_in === "00:00:00" &&
                  shiftForToday.time_out === "00:00:00";

                let status = "Absent"; // Default to "Absent"
                let scheduledTimeIn = shiftForToday.time_in; // Set the scheduled time_in for today

                if (isRestDay) {
                  status = "Rest Day";
                } else if (onLeaveEmployees.includes(employee.ms_employeeid)) {
                  status = "On Leave";
                } else if (isHoliday) {
                  status = "Holiday";
                }

                return [
                  todayDate,
                  employee.ms_employeeid,
                  status, // Status: "Rest Day", "On Leave", "Holiday", or "Absent"
                  0, // Default minutes
                  0, // Default hours
                  scheduledTimeIn // Scheduled time_in for the employee
                ];
              });

              console.log("Insert query:", insertAttendanceStatusQuery);
              console.log("Data to be inserted:", data);

              // Insert the attendance status for all employees
              InsertTable(insertAttendanceStatusQuery, data, (err, result) => {
                if (err) {
                  console.error("Error inserting attendance status:", err);
                } else {
                  console.log(
                    "Successfully inserted daily attendance status for employees.",
                    result
                  );
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
