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
                  scheduledTimeIn = "00:00:00";
                } else if (isRestDay) {
                  status = "Rest Day";
                  scheduledTimeIn = "00:00:00";
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
              InsertTable(insertAttendanceStatusQuery, data, (err, result) => {
                if (err) {
                  console.error("Error inserting attendance status:", err);
                } else {
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



// exports.insertDailyAttendanceStatus = () => {
//   const todayDate = moment().format("YYYY-MM-DD");
//   const todayDayOfWeek = moment().format("dddd").toLowerCase(); 

//   console.log(`[${todayDate}] - Starting attendance status insertion.`);

//   const fetchEmployeesQuery = `
//     SELECT ms.ms_employeeid, ms.ms_monday, ms.ms_tuesday, ms.ms_wednesday, 
//           ms.ms_thursday, ms.ms_friday, ms.ms_saturday, ms.ms_sunday,
//           msal.ms_payrolltype
//     FROM master_employee me
//     JOIN master_shift ms ON me.me_id = ms.ms_employeeid
//     LEFT JOIN master_salary msal ON ms.ms_employeeid = msal.ms_employeeid
//     WHERE me.me_jobstatus IN ('regular', 'apprentice', 'probitionary')
//   `;

//   const fetchLeaveDatesQuery = `
//     SELECT ld_employeeid, ld_leave_pay, ld_leavedates FROM leave_dates 
//     WHERE ld_leavedates = '${todayDate}'
//   `;

//   const fetchHolidayQuery = `
//     SELECT mh_date, mh_type FROM master_holiday 
//     WHERE mh_date = '${todayDate}'
//   `;

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
//           const onLeaveEmployees = leaveDates.filter(ld => ld.ld_leave_pay).map(ld => ld.ld_employeeid);
//           const unpaidLeaveEmployees = leaveDates.filter(ld => !ld.ld_leave_pay).map(ld => ld.ld_employeeid);

//           mysql.mysqlQueryPromise(fetchHolidayQuery)
//             .then((holidays) => {
//               const isHoliday = holidays.length > 0;
//               const holidayTypes = holidays.reduce((acc, holiday) => {
//                 if (holiday.mh_type === "Special Holiday" || holiday.mh_type === "Non-Working Holiday") {
//                   acc.isSpecialHoliday = true;
//                 } 
//                 if (holiday.mh_type === "Regular Holiday") {
//                   acc.isRegularHoliday = true;
//                 }
//                 return acc;
//               }, {});

//               const insertAttendanceStatusQuery = InsertStatement(
//                 "attendance_status",
//                 "as",
//                 [
//                   "attendance_date",
//                   "employeeid",
//                   "scheduled_timein",
//                   "sched_timeout",
//                   "minutes",
//                   "hours",
//                   "is_Late",
//                   "is_Early",
//                   "is_On_Time",
//                   "is_Rest_Day",
//                   "is_Exempted",
//                   "is_Absent",
//                   "is_Paid_Leaves",
//                   "is_Unpaid_Leaves",
//                   "is_Regular_Holiday",
//                   "is_Special_Holiday",
//                   "is_Missed_Logs"
//                 ]
//               );

//               const data = employees.map((employee) => {
//                 const shiftForToday = JSON.parse(employee[`ms_${todayDayOfWeek}`]);
              
//                 let scheduledTimeIn = shiftForToday.time_in;
//                 let scheduledTimeOut = shiftForToday.time_out;
//                 let isLate = false; // Default to False
//                 let isEarly = false; // Default to False
//                 let isOnTime = false; // Default to False
//                 let isAbsent = false; // Default, will compute below
//                 let isOnLeave = false;
//                 let is_Missed_Logs = false;
              
//                 const minutes = 0; // Always 0
//                 const hours = 0; // Always 0
              
//                 Handle Exempted case
//                 const isExempted = (scheduledTimeIn === "Exempted" && scheduledTimeOut === "Exempted");
//                 const as_is_Exempted = isExempted ? 1 : 0;
              
//                 if (isExempted) {
//                   scheduledTimeIn = null;
//                   scheduledTimeOut = null;
//                 }
              
//                 const isRestDay = (scheduledTimeIn === "00:00:00" && scheduledTimeOut === "00:00:00");
//                 const as_is_Rest_Day = isRestDay ? 1 : 0;
              
//                 if (onLeaveEmployees.includes(employee.ms_employeeid)) {
//                   isOnLeave = true;
//                 } else if (unpaidLeaveEmployees.includes(employee.ms_employeeid)) {
//                   isOnLeave = true;
//                 }
              
//                 const as_is_Paid_Leaves = onLeaveEmployees.includes(employee.ms_employeeid) ? 1 : 0;
//                 const as_is_Unpaid_Leaves = unpaidLeaveEmployees.includes(employee.ms_employeeid) ? 1 : 0;
              
//                 const isHolidayStatus = holidayTypes.isRegularHoliday || holidayTypes.isSpecialHoliday;

//                 console.log(employee.msal_ms_payrolltype,'Payroll Type');
                
              
//                 Check payroll type and adjust is_Absent logic
//                 if (employee.ms_payrolltype === "Monthly") {
//                   if (holidayTypes.isRegularHoliday || holidayTypes.isSpecialHoliday) {
//                     isAbsent = false; // Holiday types true -> not absent
//                   } else if (as_is_Paid_Leaves || as_is_Unpaid_Leaves || as_is_Exempted) {
//                     isAbsent = false; // Leaves or Exempted -> not absent
//                   } else {
//                     isAbsent = true; // None of the above -> absent
//                   }
//                 } else {
//                   For non-Monthly payroll types, fallback to the existing logic
//                   if (!isOnLeave && !isHolidayStatus) {
//                     isAbsent = true; // Employee is absent if no valid attendance, leave, or holiday condition
//                   }
//                 }
              
//                 return [
//                   todayDate,
//                   employee.ms_employeeid,
//                   scheduledTimeIn,
//                   scheduledTimeOut,
//                   minutes, // Always 0
//                   hours, // Always 0
//                   isLate ? 1 : 0, // Convert Boolean to 0/1 for DB
//                   isEarly ? 1 : 0, // Convert Boolean to 0/1 for DB
//                   isOnTime ? 1 : 0, // Convert Boolean to 0/1 for DB
//                   as_is_Rest_Day,
//                   as_is_Exempted,
//                   isAbsent ? 1 : 0, // Convert Boolean to 0/1 for DB
//                   as_is_Paid_Leaves,
//                   as_is_Unpaid_Leaves,
//                   holidayTypes.isRegularHoliday ? 1 : 0,
//                   holidayTypes.isSpecialHoliday ? 1 : 0,
//                   is_Missed_Logs ? 1 : 0
//                 ];
//               });
              

//               InsertTable(insertAttendanceStatusQuery, data, (err, result) => {
//                 if (err) {
//                   console.error("Error inserting attendance status:", err);
//                 } else {
//                   console.log("Attendance status insertion complete.");
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

