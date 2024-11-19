const cron = require("node-cron");
const moment = require("moment");
const mysql = require("./hrmisdb");
const { InsertStatement } = require("./customhelper");
const { InsertTable } = require("./dbconnect");

// exports.insertDailyAttendanceStatus = () => {
//   const todayDate = moment().format("YYYY-MM-DD");
//   const todayDayOfWeek = moment().format("dddd").toLowerCase(); 

//   console.log(`[${todayDate}] - Starting attendance status insertion.`);

//   const fetchEmployeesQuery = `
//     SELECT ms.ms_employeeid, ms.ms_monday, ms.ms_tuesday, ms.ms_wednesday, 
//            ms.ms_thursday, ms.ms_friday, ms.ms_saturday, ms.ms_sunday
//     FROM master_employee me
//     JOIN master_shift ms ON me.me_id = ms.ms_employeeid
//     WHERE me.me_jobstatus IN ('regular', 'apprentice', 'probitionary')
//   `;

//   const fetchLeaveDatesQuery = `
//     SELECT ld_employeeid FROM leave_dates 
//     WHERE ld_leavedates = '${todayDate}'
//   `;

//   const fetchHolidayQuery = `
//     SELECT mh_date FROM master_holiday 
//     WHERE mh_date = '${todayDate}'`;

//   mysql
//     .mysqlQueryPromise(fetchEmployeesQuery)
//     .then((employees) => {
//       console.log("Employees and shift data fetched:", employees);
//       if (employees.length === 0) {
//         console.log("No employees found with the specified job statuses.");
//         return;
//       }

//       mysql.mysqlQueryPromise(fetchLeaveDatesQuery)
//         .then((leaveDates) => {
//           const onLeaveEmployees = leaveDates.map(ld => ld.ld_employeeid);

//           mysql.mysqlQueryPromise(fetchHolidayQuery)
//             .then((holidays) => {
//               const isHoliday = holidays.length > 0;

//               const insertAttendanceStatusQuery = InsertStatement(
//                 "attendance_status",
//                 "as",
//                 ["attendance_date", "employeeid", "status", "minutes", "hours", "scheduled_timein"]
//               );

//               const data = employees.map((employee) => {
//                 const shiftForToday = JSON.parse(employee[`ms_${todayDayOfWeek}`]); 
//                 const isRestDay =
//                   shiftForToday.time_in === "00:00:00" &&
//                   shiftForToday.time_out === "00:00:00";

//                 let status = "Absent";
//                 let scheduledTimeIn = shiftForToday.time_in; 

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
//                   status, 
//                   0, 
//                   0, 
//                   scheduledTimeIn 
//                 ];
//               });

//               console.log("Insert query:", insertAttendanceStatusQuery);
//               console.log("Data to be inserted:", data);

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
  const todayDayOfWeek = moment().format("dddd").toLowerCase(); 

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

  mysql
    .mysqlQueryPromise(fetchEmployeesQuery)
    .then((employees) => {
      console.log("Employees and shift data fetched:", employees);
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
                ["attendance_date", "employeeid", "status", "minutes", "hours", "scheduled_timein"]
              );

              const data = employees.map((employee) => {
                const shiftForToday = JSON.parse(employee[`ms_${todayDayOfWeek}`]); 
                
                const isRestDay =
                  shiftForToday.time_in === "00:00:00" &&
                  shiftForToday.time_out === "00:00:00";
                
                const isExempted =
                  shiftForToday.time_in === "Exempted" &&
                  shiftForToday.time_out === "Exempted";

                let status = "Absent";
                let scheduledTimeIn = shiftForToday.time_in; 

                if (isExempted) {
                  status = "Exempted";
                  scheduledTimeIn = "00:00:00"; // Insert "00:00:00" for exempted shifts
                } else if (isRestDay) {
                  status = "Rest Day";
                  scheduledTimeIn = "00:00:00"; // Insert "00:00:00" for rest days as well
                } else if (onLeaveEmployees.includes(employee.ms_employeeid)) {
                  status = "On Leave";
                } else if (isHoliday) {
                  status = "Holiday";
                }

                return [
                  todayDate,
                  employee.ms_employeeid,
                  status, 
                  0, 
                  0, 
                  scheduledTimeIn 
                ];
              });

              console.log("Insert query:", insertAttendanceStatusQuery);
              console.log("Data to be inserted:", data);

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

