"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE NewGeneratePayroll(
      in startdate varchar(20),
      in enddate varchar(20)
      )
      BEGIN

      set @startdate = startdate;
      set @enddate = enddate;

      INSERT INTO new_generate_payroll (
          ngp_employeeid,
          ngp_attendancedate,
          ngp_day_types,
          ngp_startdate,
          ngp_enddate,
          ngp_payrolldate,
          ngp_cutoff,
          ngp_clockin,
          ngp_clockout,
          ngp_timein_schedule,
          ngp_timeout_schedule,
          ngp_late,
          ngp_latedeductions,
          ngp_overtime,
          ngp_allowances,
          ngp_basic_adjustments,
          ngp_percutoff,
          ngp_per_cutoff_with_allowances,
          ngp_per_day,
          ngp_per_hour,
          ngp_total_hours,
          ngp_total_minutes,
          ngp_night_differentials,
          ngp_normal_ot,
          ngp_early_ot,
          ngp_nightdiff_pay_per_ot,
          ngp_basic_pay_per_ot,
          ngp_status,
          ngp_total_nd_pay,
        ngp_regular_holiday_ot,
        ngp_regular_holiday_day,
          ngp_special_holiday_ot,
          ngp_special_holiday_day,
          ngp_total_normal_ot_pay,
          ngp_total_early_ot_pay,
          ngp_regular_hours
      )
      SELECT
          employee_ids.ma_employeeid as gp_employeeid,
          date_range_table.date_range_date AS gp_attendancedate,
        CASE WHEN date_range_table.date_range_date = (SELECT as_attendance_date FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date)
              THEN CASE WHEN (SELECT as_status FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date) = 'Exempted'
                        THEN 'Exempted'
                WHEN (SELECT as_status FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date) = 'On Leave'
                        THEN CASE WHEN (SELECT ld_leave_pay FROM leave_dates WHERE ld_employeeid = employee_ids.ma_employeeid AND ld_leavedates = date_range_table.date_range_date) = TRUE 
                                  THEN 'On Leave'
                                  ELSE 'On Leave W/O Pay'
                  END
                WHEN (SELECT as_status FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date) = 'Rest Day'
                        THEN 'Rest Day'
                        WHEN (SELECT as_status FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date) = 'Rest Day OT'
                        THEN CASE WHEN EXISTS ( SELECT 1 FROM restday_ot_approval WHERE roa_attendancedate = date_range_table.date_range_date AND roa_employeeid = employee_ids.ma_employeeid AND roa_status = 'Approved') 
                                  THEN 'Rest Day OT'
                    ELSE 'Rest Day'
                  END
                WHEN (SELECT as_status FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date) = 'Holiday'
                          THEN CASE WHEN (SELECT mh_type FROM master_holiday WHERE mh_date = date_range_table.date_range_date) = 'Regular Holiday' 
                                  THEN 'Regular Holiday'
                    ELSE (SELECT mh_type FROM master_holiday WHERE mh_date = date_range_table.date_range_date)
                  END
                  WHEN (SELECT as_status FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date) = 'Undertime'
                          THEN 'Undertime'
                          WHEN (SELECT as_status FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date) = 'Official Business'
                          THEN 'Official Business'
                          WHEN (SELECT as_status FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date) = 'Absent'
                          THEN 'Absent'
                          WHEN (TIMESTAMPDIFF(HOUR, ma.ma_clockin, ma.ma_clockout) > 22 OR TIMESTAMPDIFF(MINUTE, ma.ma_clockin, ma.ma_clockout) < 5 ) 
                          AND NOT (SELECT COUNT(*) FROM payroll_approval_ot where pao_attendancedate = date_range_table.date_range_date and pao_status = 'Approved' and pao_employeeid = employee_ids.ma_employeeid ) > 0
                THEN 'Missed Logs'
                          WHEN (SELECT as_status FROM attendance_status WHERE as_employeeid = employee_ids.ma_employeeid AND as_attendance_date = date_range_table.date_range_date) IN ('Early', 'Late','On Time')
                          THEN 'Normal Day'
              END 
              ELSE 'Undefined Day'
          END AS gp_day_types,
        @startdate AS gp_startdate,
        @enddate AS gp_enddate,
          pd.pd_payrolldate as gp_payrolldate,
          pd.pd_cutoff as gp_cutoff,
        COALESCE(ma.ma_clockin, '0001-01-01 00:00:00') AS gp_clockin,
        COALESCE(ma.ma_clockout, '0001-01-01 00:00:00') AS gp_clockout,
          COALESCE(
              CASE
                  WHEN date_range_table.date_range_date IN (
                      SELECT cs_changerd 
                      FROM change_shift 
                      WHERE cs_employeeid = employee_ids.ma_employeeid
                  ) THEN '00:00:00'
          WHEN date_range_table.date_range_date IN (
            SELECT cs_actualrd 
              FROM change_shift 
              WHERE cs_employeeid = employee_ids.ma_employeeid
            ) THEN 
              CASE 
                -- Use the cs_changerd day to determine the time_in schedule
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 2 THEN 
                  CASE WHEN ms.ms_MONDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_in', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 3 THEN 
                  CASE WHEN ms.ms_TUESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_in', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 4 THEN 
                  CASE WHEN ms.ms_WEDNESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_in', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 5 THEN 
                  CASE WHEN ms.ms_THURSDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_in', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 6 THEN 
                  CASE WHEN ms.ms_FRIDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_in', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 7 THEN 
                  CASE WHEN ms.ms_SATURDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_in', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 1 THEN 
                  CASE WHEN ms.ms_SUNDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_in', '%H:%i:%s') END
                ELSE '00:00:00'
              END
            ELSE 
                      CASE 
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                              CASE WHEN ms.ms_MONDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_in', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                              CASE WHEN ms.ms_TUESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_in', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                              CASE WHEN ms.ms_WEDNESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_in', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                              CASE WHEN ms.ms_THURSDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_in', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                              CASE WHEN ms.ms_FRIDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_in', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                              CASE WHEN ms.ms_SATURDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_in', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                              CASE WHEN ms.ms_SUNDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_in', '%H:%i:%s') END
                          ELSE '00:00:00'
                      END
              END,
              '00:00:00'
          ) AS gp_timein_schedule,
      COALESCE(
          CASE
              WHEN date_range_table.date_range_date IN (
                  SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_employeeid = employee_ids.ma_employeeid
              ) THEN '00:00:00'
              WHEN date_range_table.date_range_date IN (
            SELECT cs_actualrd 
              FROM change_shift 
              WHERE cs_employeeid = employee_ids.ma_employeeid
            ) THEN 
              CASE 
                -- Use the cs_changerd day to determine the time_in schedule
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 2 THEN 
                  CASE WHEN ms.ms_MONDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_out', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 3 THEN 
                  CASE WHEN ms.ms_TUESDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_out', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 4 THEN 
                  CASE WHEN ms.ms_WEDNESDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_out', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 5 THEN 
                  CASE WHEN ms.ms_THURSDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_out', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 6 THEN 
                  CASE WHEN ms.ms_FRIDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_out', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 7 THEN 
                  CASE WHEN ms.ms_SATURDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_out', '%H:%i:%s') END
                WHEN DAYOFWEEK(
                  (SELECT cs_changerd 
                  FROM change_shift 
                  WHERE cs_actualrd = date_range_table.date_range_date 
                  AND cs_employeeid = employee_ids.ma_employeeid)
                ) = 1 THEN 
                  CASE WHEN ms.ms_SUNDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_out', '%H:%i:%s') END
                ELSE '00:00:00'
              END
                  ELSE 
                      CASE 
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                              CASE WHEN ms.ms_MONDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_out', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                              CASE WHEN ms.ms_TUESDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_out', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                              CASE WHEN ms.ms_WEDNESDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_out', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                              CASE WHEN ms.ms_THURSDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_out', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                              CASE WHEN ms.ms_FRIDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_out', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                              CASE WHEN ms.ms_SATURDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_out', '%H:%i:%s') END
                          WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                              CASE WHEN ms.ms_SUNDAY->>'$.time_out' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_out', '%H:%i:%s') END
                          ELSE '00:00:00'
                      END
              END,
          '00:00:00'
      ) AS gp_timeout_schedule,
      CASE 
          WHEN COALESCE(
              CASE
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                      CASE 
                          WHEN ms.ms_MONDAY->>'$.time_out' = 'Exempted' OR ms.ms_MONDAY->>'$.time_out' = '00:00:00' THEN '00:00:00' 
                          ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_out', '%H:%i:%s') 
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                      CASE 
                          WHEN ms.ms_TUESDAY->>'$.time_out' = 'Exempted' OR ms.ms_TUESDAY->>'$.time_out' = '00:00:00' THEN '00:00:00' 
                          ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_out', '%H:%i:%s') 
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                      CASE 
                          WHEN ms.ms_WEDNESDAY->>'$.time_out' = 'Exempted' OR ms.ms_WEDNESDAY->>'$.time_out' = '00:00:00' THEN '00:00:00' 
                          ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_out', '%H:%i:%s') 
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                      CASE 
                          WHEN ms.ms_THURSDAY->>'$.time_out' = 'Exempted' OR ms.ms_THURSDAY->>'$.time_out' = '00:00:00' THEN '00:00:00' 
                          ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_out', '%H:%i:%s') 
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                      CASE 
                          WHEN ms.ms_FRIDAY->>'$.time_out' = 'Exempted' OR ms.ms_FRIDAY->>'$.time_out' = '00:00:00' THEN '00:00:00' 
                          ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_out', '%H:%i:%s') 
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                      CASE 
                          WHEN ms.ms_SATURDAY->>'$.time_out' = 'Exempted' OR ms.ms_SATURDAY->>'$.time_out' = '00:00:00' THEN '00:00:00' 
                          ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_out', '%H:%i:%s') 
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                      CASE 
                          WHEN ms.ms_SUNDAY->>'$.time_out' = 'Exempted' OR ms.ms_SUNDAY->>'$.time_out' = '00:00:00' THEN '00:00:00' 
                          ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_out', '%H:%i:%s') 
                      END
                  ELSE '00:00:00'
              END,
              '00:00:00'
          ) = '00:00:00' THEN '00:00:00'
          ELSE IFNULL(
              CASE 
                  WHEN EXISTS (
                      SELECT 1 
                      FROM change_shift 
                      WHERE cs_actualrd = date_range_table.date_range_date 
                        AND cs_employeeid = ma.ma_employeeid
                  ) THEN 
                      CASE 
                      -- CASE WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN ms.ms_MONDAY->>'$.time_in'
                      
                          WHEN TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', CASE 
                  WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 1  THEN ms.ms_SUNDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 2  THEN ms.ms_MONDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 3  THEN ms.ms_TUESDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 4  THEN ms.ms_WEDNESDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 5  THEN ms.ms_THURSDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 6  THEN ms.ms_FRIDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 7  THEN ms.ms_SATURDAY->>'$.time_out' 
                              END
                          )) < '00:00:00' 
                          THEN '00:00:00' 
                          ELSE TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', 
                              CASE 
                  WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 1  THEN ms.ms_SUNDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 2  THEN ms.ms_MONDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 3  THEN ms.ms_TUESDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 4  THEN ms.ms_WEDNESDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 5  THEN ms.ms_THURSDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 6  THEN ms.ms_FRIDAY->>'$.time_out' 
                              WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = date_range_table.date_range_date AND cs_employeeid = ma.ma_employeeid)) = 7  THEN ms.ms_SATURDAY->>'$.time_out'
                              END))
                END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                      CASE 
                          WHEN TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_MONDAY->'$.time_in'))) < '00:00:00' 
                          THEN '00:00:00' 
                          ELSE TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_MONDAY->'$.time_in')))
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                      CASE 
                          WHEN TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_TUESDAY->'$.time_in'))) < '00:00:00' 
                          THEN '00:00:00' 
                          ELSE TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_TUESDAY->'$.time_in')))
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                      CASE 
                          WHEN TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_WEDNESDAY->'$.time_in'))) < '00:00:00' 
                          THEN '00:00:00' 
                          ELSE TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_WEDNESDAY->'$.time_in')))
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                      CASE 
                          WHEN TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_THURSDAY->'$.time_in'))) < '00:00:00' 
                          THEN '00:00:00' 
                          ELSE TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_THURSDAY->'$.time_in')))
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                      CASE 
                          WHEN TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_FRIDAY->'$.time_in'))) < '00:00:00' 
                          THEN '00:00:00' 
                          ELSE TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_FRIDAY->'$.time_in')))
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                      CASE 
                          WHEN TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_SATURDAY->'$.time_in'))) < '00:00:00' 
                          THEN '00:00:00' 
                          ELSE TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_SATURDAY->'$.time_in')))
                      END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                      CASE 
                          WHEN TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_SUNDAY->'$.time_in'))) < '00:00:00' 
                          THEN '00:00:00' 
                          ELSE TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', JSON_UNQUOTE(ms.ms_SUNDAY->'$.time_in')))
                      END
                  ELSE '00:00:00'
              END,
              '00:00:00'
          )
      END AS gp_late,
      COALESCE(s.ms_monthly / 2 / 13 / 8, 0) / 60 AS gp_latedeductions,
      CASE 
          WHEN COALESCE(
              CASE
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                      CASE WHEN ms.ms_MONDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                      CASE WHEN ms.ms_TUESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                      CASE WHEN ms.ms_WEDNESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                      CASE WHEN ms.ms_THURSDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                      CASE WHEN ms.ms_FRIDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                      CASE WHEN ms.ms_SATURDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                      CASE WHEN ms.ms_SUNDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_in', '%H:%i:%s') END
                  ELSE '00:00:00'
              END,
              '00:00:00'
          ) = 'Exempted' THEN '00:00:00'
          ELSE IFNULL(
          CASE 
              WHEN GREATEST(
                  TIMEDIFF(
                      ma.ma_clockout,
                      CONCAT(
                          ma.ma_attendancedate, 
                          ' ', 
                          CASE 
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN COALESCE(ms.ms_MONDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN COALESCE(ms.ms_TUESDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN COALESCE(ms.ms_WEDNESDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN COALESCE(ms.ms_THURSDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN COALESCE(ms.ms_FRIDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN COALESCE(ms.ms_SATURDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN COALESCE(ms.ms_SUNDAY->>'$.time_out', '00:00:00')
                              ELSE '00:00:00'
                          END
                      )
                  ),
                  '00:00:00'
              ) > '19:00:00' 
              THEN '00:00:00' 
              ELSE GREATEST(
                  TIMEDIFF(
                      ma.ma_clockout,
                      CONCAT(
                          ma.ma_attendancedate, 
                          ' ', 
                          CASE 
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN COALESCE(ms.ms_MONDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN COALESCE(ms.ms_TUESDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN COALESCE(ms.ms_WEDNESDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN COALESCE(ms.ms_THURSDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN COALESCE(ms.ms_FRIDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN COALESCE(ms.ms_SATURDAY->>'$.time_out', '00:00:00')
                              WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN COALESCE(ms.ms_SUNDAY->>'$.time_out', '00:00:00')
                              ELSE '00:00:00'
                          END
                      )
                  ),
                  '00:00:00'
              ) 
          END,
          '00:00:00'
      ) END AS gp_overtime,
          COALESCE(s.ms_allowances / 2 , 0) AS gp_allowances,
          COALESCE(s.ms_basic_adjustments / 2 , 0) AS gp_basic_adjustments,
          COALESCE(
          CASE 
              WHEN s.ms_payrolltype = 'Daily' 
              THEN 313 * s.ms_monthly / 12 / 2
              ELSE s.ms_monthly / 2  END, 0) AS gp_percutoff,
          COALESCE(
          CASE
              WHEN s.ms_payrolltype = 'Daily' 
          THEN 313 * s.ms_monthly / 12 / 2
              ELSE (s.ms_monthly + s.ms_allowances + s.ms_basic_adjustments) / 2 END, 0) AS gp_per_cutoff_with_allowances,
          COALESCE(
          CASE
              WHEN s.ms_payrolltype = 'Daily' THEN s.ms_monthly
              ELSE s.ms_monthly / 313 * 12 END,0) AS gp_per_day,
          COALESCE( 
          CASE 
              WHEN s.ms_payrolltype = 'Daily' THEN s.ms_monthly / 8 
              ELSE s.ms_monthly / 313 * 12 / 8 END, 0) AS gp_per_hour,
          COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) AS gp_total_hours,
          COALESCE(MINUTE(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) AS gp_total_minutes,
          LEAST(
              CASE
                  WHEN ((ma.ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME)) 
                      AND (CAST(CONCAT(DATE(ma_clockout), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE(ma_clockout), ' ', '06:00:00') AS DATETIME))
                      THEN COALESCE(HOUR( TIMEDIFF(ma.ma_clockout,CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME))))
                  ELSE
                      0
              END,
              8
          ) AS gp_night_differentials,
          CASE 
          WHEN COALESCE(
              CASE
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                      CASE WHEN ms.ms_MONDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                      CASE WHEN ms.ms_TUESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                      CASE WHEN ms.ms_WEDNESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                      CASE WHEN ms.ms_THURSDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                      CASE WHEN ms.ms_FRIDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                      CASE WHEN ms.ms_SATURDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                      CASE WHEN ms.ms_SUNDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_in', '%H:%i:%s') END
                  ELSE '00:00:00'
              END,
              '00:00:00'
          ) = 'Exempted' THEN '0'
          ELSE (CASE
          WHEN ma.ma_clockout <= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME) 
            AND ma.ma_clockout >= CAST(
              CONCAT(
                ma_attendancedate, ' ',
                CASE
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN COALESCE(ms.ms_MONDAY->>'$.time_out', '00:00:00')
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN COALESCE(ms.ms_TUESDAY->>'$.time_out', '00:00:00')
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN COALESCE(ms.ms_WEDNESDAY->>'$.time_out', '00:00:00')
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN COALESCE(ms.ms_THURSDAY->>'$.time_out', '00:00:00')
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN COALESCE(ms.ms_FRIDAY->>'$.time_out', '00:00:00')
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN COALESCE(ms.ms_SATURDAY->>'$.time_out', '00:00:00')
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN COALESCE(ms.ms_SUNDAY->>'$.time_out', '00:00:00')
                  ELSE '00:00:00'
                END
              ) AS DATETIME
            )
          THEN COALESCE(
            HOUR(
              TIMEDIFF(
                ma.ma_clockout,
                CAST(
                  CONCAT(
                    ma_attendancedate, ' ',
                    CASE
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN COALESCE(ms.ms_MONDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN COALESCE(ms.ms_TUESDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN COALESCE(ms.ms_WEDNESDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN COALESCE(ms.ms_THURSDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN COALESCE(ms.ms_FRIDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN COALESCE(ms.ms_SATURDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN COALESCE(ms.ms_SUNDAY->>'$.time_out', '00:00:00')
                      ELSE '00:00:00'
                    END
                  ) AS DATETIME
                )
              )
            )
          )
          WHEN ma.ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME)
          THEN COALESCE(
            HOUR(
              TIMEDIFF(
                CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME),
                CAST(
                  CONCAT(
                    ma_attendancedate, ' ',
                    CASE
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN COALESCE(ms.ms_MONDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN COALESCE(ms.ms_TUESDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN COALESCE(ms.ms_WEDNESDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN COALESCE(ms.ms_THURSDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN COALESCE(ms.ms_FRIDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN COALESCE(ms.ms_SATURDAY->>'$.time_out', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN COALESCE(ms.ms_SUNDAY->>'$.time_out', '00:00:00')
                      ELSE '00:00:00'
                    END
                  ) AS DATETIME
                )
              )
            )
          )
          ELSE 0
        END) END AS gp_normal_ot,
          CASE 
          WHEN COALESCE(
              CASE
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                      CASE WHEN ms.ms_MONDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                      CASE WHEN ms.ms_TUESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                      CASE WHEN ms.ms_WEDNESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                      CASE WHEN ms.ms_THURSDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                      CASE WHEN ms.ms_FRIDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                      CASE WHEN ms.ms_SATURDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_in', '%H:%i:%s') END
                  WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                      CASE WHEN ms.ms_SUNDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_in', '%H:%i:%s') END
                  ELSE '00:00:00'
              END,
              '00:00:00'
          ) = 'Exempted' THEN '0'
          ELSE (
          CASE
          WHEN ma.ma_clockin <= CAST(
              CONCAT(
                  ma_attendancedate, ' ',
                  CASE
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN COALESCE(ms.ms_MONDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN COALESCE(ms.ms_TUESDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN COALESCE(ms.ms_WEDNESDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN COALESCE(ms.ms_THURSDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN COALESCE(ms.ms_FRIDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN COALESCE(ms.ms_SATURDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN COALESCE(ms.ms_SUNDAY->>'$.time_in', '00:00:00')
                      ELSE '00:00:00'
                  END
              ) AS DATETIME
          )
          THEN COALESCE(
            HOUR(
              TIMEDIFF(
                ma.ma_clockin,
                CAST(
                  CONCAT(
                    ma_attendancedate, ' ',
                    CASE
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN COALESCE(ms.ms_MONDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN COALESCE(ms.ms_TUESDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN COALESCE(ms.ms_WEDNESDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN COALESCE(ms.ms_THURSDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN COALESCE(ms.ms_FRIDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN COALESCE(ms.ms_SATURDAY->>'$.time_in', '00:00:00')
                      WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN COALESCE(ms.ms_SUNDAY->>'$.time_in', '00:00:00')
                      ELSE '00:00:00'
                    END
                  ) AS DATETIME
                )
              )
            )
          )
          ELSE 0
        END)END AS gp_early_ot,
          ROUND(COALESCE(
          CASE 
              WHEN s.ms_payrolltype = 'Daily' 
              THEN s.ms_monthly / 8 * 1.25 * 1.10
              ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10 END, 0),2) AS gp_nightdiff_pay_per_ot,
          ROUND(COALESCE(
          CASE 
              WHEN s.ms_payrolltype = 'Daily' 
              THEN s.ms_monthly / 8 * 1.25 
              ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 END,  0),2) AS gp_basic_pay_per_ot,
                CASE 
              WHEN COALESCE(
            CASE
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                CASE WHEN ms.ms_MONDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                CASE WHEN ms.ms_TUESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                CASE WHEN ms.ms_WEDNESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                CASE WHEN ms.ms_THURSDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                CASE WHEN ms.ms_FRIDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                CASE WHEN ms.ms_SATURDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                CASE WHEN ms.ms_SUNDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_in', '%H:%i:%s') END
              ELSE '00:00:00'
            END,
              '00:00:00'
          ) = 'Exempted' THEN 1
          ELSE (
          CASE
            WHEN COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) = 0 THEN 0 -- Set status to 0 if total hours is 0
            ELSE
              IFNULL(
                CASE
                  WHEN COALESCE(HOUR(
                    TIMEDIFF(
                      COALESCE(
                        ma.ma_clockout,
                        CASE
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 2 THEN ms.ms_MONDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 3 THEN ms.ms_TUESDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 4 THEN ms.ms_WEDNESDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 5 THEN ms.ms_THURSDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 6 THEN ms.ms_FRIDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 7 THEN ms.ms_SATURDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 1 THEN ms.ms_SUNDAY->>'$.time_out'
                          ELSE NULL
                        END
                      ),
                      COALESCE(
                        ma.ma_clockin,
                        CASE
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 2 THEN ms.ms_MONDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 3 THEN ms.ms_TUESDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 4 THEN ms.ms_WEDNESDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 5 THEN ms.ms_THURSDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 6 THEN ms.ms_FRIDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 7 THEN ms.ms_SATURDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 1 THEN ms.ms_SUNDAY->>'$.time_in'
                          ELSE NULL
                        END
                      )
                    )
                  ), 0) >= 7 THEN 1
                  WHEN COALESCE(HOUR(
                    TIMEDIFF(
                      COALESCE(
                        ma.ma_clockout,
                        CASE
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 2 THEN ms.ms_MONDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 3 THEN ms.ms_TUESDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 4 THEN ms.ms_WEDNESDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 5 THEN ms.ms_THURSDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 6 THEN ms.ms_FRIDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 7 THEN ms.ms_SATURDAY->>'$.time_out'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 1 THEN ms.ms_SUNDAY->>'$.time_out'
                          ELSE NULL
                        END
                      ),
                      COALESCE(
                        ma.ma_clockin,
                        CASE
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 2 THEN ms.ms_MONDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 3 THEN ms.ms_TUESDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 4 THEN ms.ms_WEDNESDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 5 THEN ms.ms_THURSDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 6 THEN ms.ms_FRIDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 7 THEN ms.ms_SATURDAY->>'$.time_in'
                          WHEN DAYOFWEEK(ma.ma_attendancedate) = 1 THEN ms.ms_SUNDAY->>'$.time_in'
                          ELSE NULL
                        END
                      )
                    )
                  ), 0) < 9
                  AND COALESCE(HOUR(
                    TIMEDIFF(
                      ma.ma_clockout,
                      ma.ma_clockin
                    )
                  ), 0) >= 4 THEN 0.5
                  WHEN (9 - HOUR(
                    TIMEDIFF(ma.ma_clockout, ma.ma_clockin)
                  )) * 60 + MINUTE(
                    TIMEDIFF(ma.ma_clockout, ma.ma_clockin)
                  ) >= 60 THEN 0.5
                  WHEN COALESCE(MINUTE(
                    TIMEDIFF(ma.ma_clockout, ma.ma_clockin)
                  ), 0) >= 5 THEN 0.5
                  ELSE 0
                END,
                0
              )
          END)END AS gp_status,
          ROUND(
              COALESCE(
              CASE 
                  WHEN s.ms_payrolltype = 'Daily'  
            THEN s.ms_monthly / 8 * 1.25 * 1.10
                  ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 END,  0) * LEAST(
                  CASE
                      WHEN ((ma.ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME)) 
                          AND (CAST(CONCAT(DATE(ma_clockout), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE(ma_clockout), ' ', '06:00:00') AS DATETIME))
                          THEN COALESCE(HOUR( TIMEDIFF(ma.ma_clockout,CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME))))
                      ELSE
                          0
                  END,
                  8
              ),
              2
          ) AS gp_total_nd_pay,
        COALESCE(
              CASE
                  WHEN mh.mh_type = 'Regular Holiday' THEN COALESCE(
                  CASE 
                      WHEN s.ms_payrolltype = 'Daily' 
                      THEN s.ms_monthly / 8 * 2 * 1.30
                      ELSE s.ms_monthly / 313 * 12 / 8 END, 0) * 2 * 1.30
                  ELSE 0
              END,
              0
          ) AS gp_regular_holiday_ot,
          COALESCE(
              CASE
                  WHEN mh.mh_type = 'Regular Holiday' THEN COALESCE(
                  CASE 
                      WHEN s.ms_payrolltype = 'Daily'
                      THEN s.ms_monthly * 2
              ELSE s.ms_monthly / 313 * 12 END, 0) * 2
                  ELSE 0
              END,
              0
          ) AS gp_regular_holiday_day,
          COALESCE(
              CASE
                  WHEN mh.mh_type IN ('Non-Working Holiday', 'Special Holiday') THEN COALESCE(
                  CASE 
                      WHEN s.ms_payrolltype = 'Daily'
                      THEN s.ms_monthly / 8 * 2 * 1.30 
                      ELSE s.ms_monthly / 313 * 12 / 8 END, 0) * 1.30
                  ELSE 0
              END,
              0
          ) AS gp_special_holiday_ot,
          COALESCE(
              CASE
                  WHEN mh.mh_type IN ('Non-Working Holiday', 'Special Holiday') THEN COALESCE(
                  CASE 
                      WHEN s.ms_payrolltype = 'Daily' 
                      THEN s.ms_monthly * 1.30
                      ELSE s.ms_monthly / 313 * 12 END, 0) * 1.30
                  ELSE 0
              END,
              0
          ) AS gp_special_holiday_day,
          CASE 
              WHEN COALESCE(
            CASE
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                CASE WHEN ms.ms_MONDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                CASE WHEN ms.ms_TUESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                CASE WHEN ms.ms_WEDNESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                CASE WHEN ms.ms_THURSDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                CASE WHEN ms.ms_FRIDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                CASE WHEN ms.ms_SATURDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                CASE WHEN ms.ms_SUNDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_in', '%H:%i:%s') END
              ELSE '00:00:00'
            END,
              '00:00:00'
          ) = 'Exempted' THEN '0'
          ELSE (ROUND(
            COALESCE(
              CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 
                ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 
              END, 
              0
            ) * 
            CASE
              WHEN ma.ma_clockout <= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME)
                AND ma.ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', 
                  COALESCE(
                    CASE DAYOFWEEK(ma_attendancedate)
                      WHEN 2 THEN ms.ms_MONDAY->>'$.time_out'
                      WHEN 3 THEN ms.ms_TUESDAY->>'$.time_out'
                      WHEN 4 THEN ms.ms_WEDNESDAY->>'$.time_out'
                      WHEN 5 THEN ms.ms_THURSDAY->>'$.time_out'
                      WHEN 6 THEN ms.ms_FRIDAY->>'$.time_out'
                      WHEN 7 THEN ms.ms_SATURDAY->>'$.time_out'
                      WHEN 1 THEN ms.ms_SUNDAY->>'$.time_out'
                      ELSE NULL
                    END, '00:00:00'
                  )
                ) AS DATETIME)
              THEN COALESCE(
                HOUR(
                  TIMEDIFF(
                    ma.ma_clockout,
                    CAST(CONCAT(ma_attendancedate, ' ', 
                      COALESCE(
                        CASE DAYOFWEEK(ma_attendancedate)
                          WHEN 2 THEN ms.ms_MONDAY->>'$.time_out'
                          WHEN 3 THEN ms.ms_TUESDAY->>'$.time_out'
                          WHEN 4 THEN ms.ms_WEDNESDAY->>'$.time_out'
                          WHEN 5 THEN ms.ms_THURSDAY->>'$.time_out'
                          WHEN 6 THEN ms.ms_FRIDAY->>'$.time_out'
                          WHEN 7 THEN ms.ms_SATURDAY->>'$.time_out'
                          WHEN 1 THEN ms.ms_SUNDAY->>'$.time_out'
                          ELSE NULL
                        END, '00:00:00'
                      )
                    ) AS DATETIME)
                  )
                ), 0
              )
              WHEN ma.ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME)
              THEN COALESCE(
                HOUR(
                  TIMEDIFF(
                    CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME),
                    CAST(CONCAT(ma_attendancedate, ' ', 
                      COALESCE(
                        CASE DAYOFWEEK(ma_attendancedate)
                          WHEN 2 THEN ms.ms_MONDAY->>'$.time_out'
                          WHEN 3 THEN ms.ms_TUESDAY->>'$.time_out'
                          WHEN 4 THEN ms.ms_WEDNESDAY->>'$.time_out'
                          WHEN 5 THEN ms.ms_THURSDAY->>'$.time_out'
                          WHEN 6 THEN ms.ms_FRIDAY->>'$.time_out'
                          WHEN 7 THEN ms.ms_SATURDAY->>'$.time_out'
                          WHEN 1 THEN ms.ms_SUNDAY->>'$.time_out'
                          ELSE NULL
                        END, '00:00:00'
                      )
                    ) AS DATETIME)
                  )
                ), 0
              )
              ELSE 0
            END, 
            2
          )) END AS gp_total_normal_ot_pay,
                CASE 
              WHEN COALESCE(
            CASE
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN 
                CASE WHEN ms.ms_MONDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_MONDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN 
                CASE WHEN ms.ms_TUESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_TUESDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN 
                CASE WHEN ms.ms_WEDNESDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN 
                CASE WHEN ms.ms_THURSDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_THURSDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN 
                CASE WHEN ms.ms_FRIDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_FRIDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN 
                CASE WHEN ms.ms_SATURDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SATURDAY->>'$.time_in', '%H:%i:%s') END
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN 
                CASE WHEN ms.ms_SUNDAY->>'$.time_in' = 'Exempted' THEN 'Exempted' ELSE TIME_FORMAT(ms.ms_SUNDAY->>'$.time_in', '%H:%i:%s') END
              ELSE '00:00:00'
            END,
              '00:00:00'
          ) = 'Exempted' THEN '0'
          ELSE (
          ROUND(
          COALESCE(
            CASE 
              WHEN s.ms_payrolltype = 'Daily' 
              THEN s.ms_monthly / 8 * 1.25 
              ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 
            END, 
            0
          ) * 
          CASE
            WHEN ma.ma_clockin <= CAST(CONCAT(ma_attendancedate, ' ', 
              CASE DAYOFWEEK(ma_attendancedate)
                WHEN 2 THEN ms.ms_MONDAY->>'$.time_in'
                WHEN 3 THEN ms.ms_TUESDAY->>'$.time_in'
                WHEN 4 THEN ms.ms_WEDNESDAY->>'$.time_in'
                WHEN 5 THEN ms.ms_THURSDAY->>'$.time_in'
                WHEN 6 THEN ms.ms_FRIDAY->>'$.time_in'
                WHEN 7 THEN ms.ms_SATURDAY->>'$.time_in'
                WHEN 1 THEN ms.ms_SUNDAY->>'$.time_in'
                ELSE NULL
              END
            ) AS DATETIME)
            THEN COALESCE(HOUR(
              TIMEDIFF(
                CAST(CONCAT(ma_attendancedate, ' ', 
                  CASE DAYOFWEEK(ma_attendancedate)
                    WHEN 2 THEN ms.ms_MONDAY->>'$.time_in'
                    WHEN 3 THEN ms.ms_TUESDAY->>'$.time_in'
                    WHEN 4 THEN ms.ms_WEDNESDAY->>'$.time_in'
                    WHEN 5 THEN ms.ms_THURSDAY->>'$.time_in'
                    WHEN 6 THEN ms.ms_FRIDAY->>'$.time_in'
                    WHEN 7 THEN ms.ms_SATURDAY->>'$.time_in'
                    WHEN 1 THEN ms.ms_SUNDAY->>'$.time_in'
                    ELSE NULL
                  END
                ) AS DATETIME),
                ma.ma_clockin
              )
            ), 0)
            ELSE 0
          END, 
          2
        )) END AS gp_total_early_ot_pay,
            LEAST(
              CASE
                  WHEN COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) > 9 THEN 9
                  ELSE COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0)
              END,
              9
          ) AS gp_regular_hours
      FROM (
          SELECT DATE_ADD( @startdate, INTERVAL (t4.i*10000 + t3.i*1000 + t2.i*100 + t1.i*10 + t0.i) DAY) AS date_range_date
          FROM 
              (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t0,
              (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t1,
              (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t2,
              (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t3,
              (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t4
          WHERE 
              DATE_ADD( @startdate, INTERVAL (t4.i*10000 + t3.i*1000 + t2.i*100 + t1.i*10 + t0.i) DAY) BETWEEN  @startdate AND @enddate 
      ) AS date_range_table
      CROSS JOIN (
          SELECT DISTINCT me_id AS ma_employeeid FROM master_employee WHERE me_jobstatus IN ('probitionary', 'regular','apprentice')
      ) AS employee_ids
      LEFT JOIN master_attendance ma ON date_range_table.date_range_date = ma.ma_attendancedate AND employee_ids.ma_employeeid = ma.ma_employeeid
      JOIN master_employee me ON employee_ids.ma_employeeid = me.me_id
      JOIN master_shift ms ON me.me_id = ms.ms_employeeid
      LEFT JOIN change_shift ON cs_employeeid = employee_ids.ma_employeeid AND (cs_changerd = date_range_table.date_range_date OR cs_actualrd = date_range_table.date_range_date)
      LEFT JOIN master_salary s ON me.me_id = s.ms_employeeid
      LEFT JOIN master_holiday mh ON date_range_table.date_range_date = mh.mh_date
      LEFT JOIN payroll_date pd ON date_range_table.date_range_date BETWEEN pd.pd_startdate AND pd.pd_enddate
      ORDER BY ma_attendancedate DESC; END
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.dropFunction("NewGeneratePayroll");
  },
};
