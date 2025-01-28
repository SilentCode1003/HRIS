'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add stored procedure
    await queryInterface.sequelize.query(`
      CREATE UpdateRequestRestDayOt(
        IN clockIn DATETIME,
        IN clockOut DATETIME,
        IN shiftTimeIn TIME,
        IN shiftTimeOut TIME,
        IN attendanceDate DATE,
        IN employeeId VARCHAR (9),
        IN payrollDate DATE,
        IN rdotStatus VARCHAR (50),
        IN subGroup INT,
        IN rdotImage LONGTEXT,
        IN appliedDate VARCHAR (50),
        IN approveCount INT,
        IN requestId INT

        )
      BEGIN

        DECLARE attendanceDuration TIME;
        DECLARE attendanceStatus VARCHAR (50);
        DECLARE rdotPayDay DECIMAL(10,2);
        DECLARE createdBy VARCHAR(500);
        DECLARE rdotType VARCHAR(100);


        DECLARE ndot_hour DECIMAL(10,2);
        DECLARE not_hour DECIMAL(10,2);
        DECLARE eot_hour DECIMAL(10,2);
        DECLARE ndot_min DECIMAL(10,2);
        DECLARE not_min DECIMAL(10,2);
        DECLARE eot_min DECIMAL(10,2);



        DECLARE normalOverTimeHours INT;
        DECLARE normalOverTimeMinutes INT;
        DECLARE nightDifferentialHours INT;
        DECLARE nightDifferentialMinutes INT;
        DECLARE earlyOvertimeHours INT;
        DECLARE earlyOvertimeMinutes INT;


        SET attendanceDuration = TIMEDIFF(clockOut, clockIn);
        SET createdBy = (SELECT CONCAT(me_lastname,' ',me_firstname) FROM master_employee WHERE me_id = employeeId);
        SET rdotType = (SELECT 
                        CASE 
                          WHEN (SELECT COUNT(1) FROM master_holiday WHERE mh_date = attendanceDate) > 0 THEN
                            CASE 
                              WHEN (SELECT mh_type FROM master_holiday WHERE mh_date = attendanceDate) = 'Regular Holiday' 
                              THEN 'RDOT W/ Regular Holiday'
                              ELSE 'RDOT W/ Special Holiday'
                            END
                          ELSE 'NORMAL RDOT'
                        END
                      );
        SET rdotPayDay = (SELECT 
                      CASE 
                        WHEN HOUR(attendanceDuration) <= 3
                          THEN CASE WHEN ms_payrolltype = 'Daily'
                              THEN ((ms_monthly / 8) * HOUR(attendanceDuration)) * 1.3
                              ELSE (((ms_monthly / 313 * 12) / 8) * HOUR(attendanceDuration)) * 1.3
                              END
                        WHEN HOUR(attendanceDuration) <= 7 
                          THEN CASE WHEN ms_payrolltype = 'Daily'
                              THEN (ms_monthly / 2) * 1.3
                              ELSE ((ms_monthly / 313 * 12) / 2) * 1.3
                              END
                        WHEN HOUR(attendanceDuration) >= 9 
                          THEN CASE WHEN ms_payrolltype = 'Daily'
                              THEN ms_monthly * 1.3
                              ELSE (ms_monthly / 313 * 12) * 1.3 
                              END
                        ELSE 0 
                      END
                      FROM master_attendance
                      INNER JOIN master_salary ON master_attendance.ma_employeeid = ms_employeeid
                      WHERE ma_attendancedate = attendanceDate
                      AND ma_employeeid = employeeId);
                                    

        SET normalOverTimeHours = (SELECT 
                      IFNULL((CASE 
                        WHEN shiftTimeIn = '00:00:00' AND shiftTimeOut = '00:00:00' THEN 0
                        ELSE 
                          CASE 
                            WHEN clockOut <= CAST(CONCAT(attendanceDate, ' ', '22:00:00') AS DATETIME) AND 
                                                    clockOut >= CAST(CONCAT(attendanceDate, ' ', shiftTimeOut) AS DATETIME) THEN 
                              HOUR(TIMEDIFF(clockOut, CAST(CONCAT(attendanceDate, ' ', shiftTimeOut) AS DATETIME)))
                            WHEN clockOut >= CAST(CONCAT(attendanceDate, ' ', '22:00:00') AS DATETIME) THEN 
                              HOUR(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', '22:00:00') AS DATETIME), CAST(CONCAT(attendanceDate, ' ', shiftTimeOut)AS DATETIME)))
                            ELSE 
                              0
                          END
                      END),0)
                    FROM master_attendance
                    WHERE ma_employeeid = employeeId
                    AND ma_attendancedate = attendanceDate);
                                
        SET normalOverTimeMinutes = (SELECT 
                      IFNULL((CASE 
                        WHEN shiftTimeIn = '00:00:00' AND shiftTimeOut = '00:00:00' THEN 0
                        ELSE 
                          CASE 
                            WHEN clockOut <= CAST(CONCAT(attendanceDate, ' ', '22:00:00') AS DATETIME) AND 
                                                    clockOut >= CAST(CONCAT(attendanceDate, ' ', shiftTimeOut) AS DATETIME) THEN 
                              MINUTE(TIMEDIFF(clockOut, CAST(CONCAT(attendanceDate, ' ', shiftTimeOut) AS DATETIME)))
                            WHEN clockOut >= CAST(CONCAT(attendanceDate, ' ', '22:00:00') AS DATETIME) THEN 
                              MINUTE(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', '22:00:00') AS DATETIME), CAST(CONCAT(attendanceDate, ' ', shiftTimeOut)AS DATETIME)))
                            ELSE 
                              0
                          END
                      END),0)
                    FROM master_attendance
                    WHERE ma_employeeid = employeeId
                    AND ma_attendancedate = attendanceDate);
        SET nightDifferentialHours = (SELECT LEAST(
                        CASE
                          WHEN ((clockOut >= CAST(CONCAT(attendanceDate, ' ', '22:00:00') AS DATETIME)) 
                            AND (CAST(CONCAT(DATE(clockOut), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE(clockOut), ' ', '06:00:00') AS DATETIME))
                          THEN COALESCE(HOUR(TIMEDIFF(clockOut, CAST(CONCAT(attendanceDate, ' ', '22:00:00') AS DATETIME))))
                          ELSE 0
                        END,
                        8
                      ) + 
                      LEAST(
                        CASE
                          WHEN ((clockIn <= CAST(CONCAT(attendanceDate, ' ', '06:00:00') AS DATETIME)) 
                            AND (CAST(CONCAT(DATE(clockIn), ' ', '22:00:00') AS DATETIME)) >=  CAST(CONCAT(DATE(clockIn), ' ', '00:00:00') AS DATETIME))
                          THEN COALESCE(HOUR(TIMEDIFF(clockIn, CAST(CONCAT(attendanceDate, ' ', '06:00:00') AS DATETIME))))
                          ELSE 0
                        END,
                        8
                      ) FROM master_salary s
                      INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                      INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                      INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                      WHERE me_id = employeeId
                      LIMIT 1);
        SET nightDifferentialMinutes = (SELECT COALESCE(
                        CASE 
                          WHEN clockIn < CAST(CONCAT(DATE(attendanceDate), ' 06:00:00') AS DATETIME) 
                          THEN MINUTE(TIMEDIFF(clockIn, CONCAT(DATE(attendanceDate), ' 06:00:00')))
                          ELSE 0 
                        END, 0
                        ) +
                      COALESCE(
                        CASE 
                          WHEN clockOut > CAST(CONCAT(DATE(attendanceDate), ' 22:00:00') AS DATETIME) 
                          THEN MINUTE(TIMEDIFF(clockOut, CONCAT(DATE(attendanceDate), ' 22:00:00')))
                          ELSE 0 
                        END, 0
                        ) FROM master_salary s
                      INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                      INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                      INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                      WHERE me_id = employeeId
                      LIMIT 1);
                                    
        SET earlyOvertimeHours = (SELECT 
                      IFNULL(((CASE 
                        WHEN shiftTimeIn = '00:00:00' AND shiftTimeOut = '00:00:00' 
                        THEN 0
                        WHEN clockIn < CAST(CONCAT(attendanceDate, ' ', '06:00:00') AS DATETIME)  
                        THEN HOUR(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', shiftTimeIn) AS DATETIME), CONCAT(attendanceDate, ' 06:00:00'))) 
                        ELSE CASE WHEN clockIn <= CAST(CONCAT(attendanceDate, ' ', shiftTimeIn) AS DATETIME)
                          THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', shiftTimeIn) AS DATETIME) , clockIn)))
                          ELSE 0
                          END
                      END) 
                      + 
                      (CASE 
                        WHEN shiftTimeIn = '00:00:00' AND shiftTimeOut = '00:00:00' 
                        THEN 0
                        WHEN CAST(CONCAT(attendanceDate, ' ', TIME(clockOut)) AS DATETIME) < CAST(CONCAT(attendanceDate, ' ', '06:00:00') AS DATETIME)  
                        THEN HOUR(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', TIME(clockOut)) AS DATETIME), CONCAT(DATE(attendanceDate), ' 06:00:00'))) 
                        ELSE CASE WHEN CAST(CONCAT(attendanceDate, ' ', TIME(clockOut)) AS DATETIME) <= CAST(CONCAT(attendanceDate, ' ', shiftTimeIn) AS DATETIME)
                          THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', '06:00:00') AS DATETIME) , CAST(CONCAT(attendanceDate, ' ', TIME(clockOut)) AS DATETIME))))
                          ELSE 0
                          END
                      END)),0)
                    FROM master_attendance
                    WHERE ma_employeeid = employeeId
                    AND ma_attendancedate = attendanceDate);
                                
        SET earlyOvertimeMinutes = (SELECT 
                      IFNULL(((CASE 
                        WHEN shiftTimeIn = '00:00:00' AND shiftTimeOut = '00:00:00' 
                        THEN 0
                        WHEN clockIn < CAST(CONCAT(attendanceDate, ' ', '06:00:00') AS DATETIME)  
                        THEN MINUTE(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', shiftTimeIn) AS DATETIME), CONCAT(attendanceDate, ' 06:00:00'))) 
                        ELSE CASE WHEN clockIn <= CAST(CONCAT(attendanceDate, ' ', shiftTimeIn) AS DATETIME)
                          THEN COALESCE(MINUTE(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', shiftTimeIn) AS DATETIME) , clockIn)))
                          ELSE 0
                          END
                      END) 
                      + 
                      (CASE 
                        WHEN shiftTimeIn = '00:00:00' AND shiftTimeOut = '00:00:00' 
                        THEN 0
                        WHEN CAST(CONCAT(attendanceDate, ' ', TIME(clockOut)) AS DATETIME) < CAST(CONCAT(attendanceDate, ' ', '06:00:00') AS DATETIME)  
                        THEN MINUTE(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', TIME(clockOut)) AS DATETIME), CONCAT(DATE(attendanceDate), ' 06:00:00'))) 
                        ELSE CASE WHEN CAST(CONCAT(attendanceDate, ' ', TIME(clockOut)) AS DATETIME) <= CAST(CONCAT(attendanceDate, ' ', shiftTimeIn) AS DATETIME)
                          THEN COALESCE(MINUTE(TIMEDIFF(CAST(CONCAT(attendanceDate, ' ', '06:00:00') AS DATETIME) , CAST(CONCAT(attendanceDate, ' ', TIME(clockOut)) AS DATETIME))))
                          ELSE 0
                          END
                      END)),0)
                    FROM master_attendance
                    WHERE ma_employeeid = employeeId
                    AND ma_attendancedate = attendanceDate);
                                
                                
        SET ndot_hour = (SELECT ROUND(COALESCE(
                    CASE 
                      WHEN s.ms_payrolltype = 'Daily' 
                      THEN (s.ms_monthly / 8 * 1.25) * 1.10 * 1.3
                      ELSE ((s.ms_monthly / 313 * 12 / 8 ) * 1.25 ) * 1.10 * 1.3
                    END, 0), 2) FROM master_salary s
                    INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                    INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                    INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                    WHERE me_id = employeeId
                    LIMIT 1);

        SET not_hour = (SELECT ROUND(COALESCE(
                    CASE 
                      WHEN s.ms_payrolltype = 'Daily' 
                      THEN s.ms_monthly / 8 * 1.25 * 1.3
                      ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.3
                    END, 0), 2) FROM master_salary s
                    INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                    INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                    INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                    WHERE me_id = employeeId
                    LIMIT 1);

        SET eot_hour = (SELECT ROUND(COALESCE(
                    CASE 
                      WHEN s.ms_payrolltype = 'Daily' 
                      THEN s.ms_monthly / 8 * 1.25 * 1.3
                      ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.3
                    END, 0), 2) FROM master_salary s
                    INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                    INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                    INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                    WHERE me_id = employeeId
                    LIMIT 1);



        SET ndot_min = (SELECT ROUND(COALESCE(
                    CASE 
                      WHEN s.ms_payrolltype = 'Daily' 
                      THEN s.ms_monthly / 8 * 1.25 * 1.10 * 1.3 / 60
                      ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 * 1.3 / 60 
                    END, 0), 2) FROM master_salary s
                    INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                    INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                    INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                    WHERE me_id = employeeId
                    LIMIT 1);



        SET not_min = (SELECT ROUND(COALESCE(
              CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 * 1.3 / 60
                ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.3 / 60
              END, 0), 2) FROM master_salary s
                    INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                    INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                    INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                    WHERE me_id = employeeId
                    LIMIT 1);



        SET eot_min = (SELECT ROUND(COALESCE(
              CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 * 1.3 / 60
                ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.3 / 60
              END, 0), 2) FROM master_salary s
                    INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                    INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                    INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                    WHERE me_id = employeeId
                    LIMIT 1);
                    
                    
                    
        UPDATE restday_ot_approval
        SET 
            roa_employeeid = employeeId,
            roa_fullname = createdBy,
            roa_timein = clockIn,
            roa_timeout = clockOut,
            roa_attendancedate = attendanceDate,
            roa_status = rdotStatus,
            roa_total_hours = attendanceDuration,
            roa_rdotpayday = COALESCE(CASE 
            WHEN rdotType = 'RDOT W/ Regular Holiday' THEN rdotPayDay * 2
            WHEN rdotType = 'RDOT W/ Special Holiday' THEN rdotPayDay * 1.3
            ELSE rdotPayDay
            END, 0),
            roa_rdot_type = rdotType,
            roa_nightdiff_hour = nightDifferentialHours,
            roa_normal_ot_hour = normalOverTimeHours,
            roa_early_ot_hour = earlyOvertimeHours,
            roa_nightdiff_minutes = nightDifferentialMinutes,
            roa_normal_ot_minutes = normalOverTimeMinutes,
            roa_early_ot_minutes = earlyOvertimeMinutes,
            roa_nightdiff_pay_hour = COALESCE(CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (nightDifferentialHours * ndot_hour) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (nightDifferentialHours * ndot_hour) * 1.3
                ELSE nightDifferentialHours * ndot_hour
            END, 0),
            roa_normal_ot_pay_hour = COALESCE(CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (normalOverTimeHours * not_hour) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (normalOverTimeHours * not_hour) * 1.3
                ELSE normalOverTimeHours * not_hour
            END, 0),
            roa_early_ot_pay_hour = COALESCE(CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (earlyOvertimeHours * eot_hour) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (earlyOvertimeHours * eot_hour) * 1.3
                ELSE earlyOvertimeHours * eot_hour
            END, 0),
            roa_nightdiff_pay_minutes = COALESCE(CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (nightDifferentialMinutes * ndot_min) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (nightDifferentialMinutes * ndot_min) * 1.3
                ELSE nightDifferentialMinutes * ndot_min
            END, 0),
            roa_normal_ot_pay_minutes = COALESCE(CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (normalOverTimeMinutes * not_min) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (normalOverTimeMinutes * not_min) * 1.3
                ELSE normalOverTimeMinutes * not_min
            END, 0),
            roa_early_ot_pay_minutes = COALESCE(CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (earlyOvertimeMinutes * eot_min) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (earlyOvertimeMinutes * eot_min) * 1.3
                ELSE earlyOvertimeMinutes * eot_min
            END, 0),
            roa_total_nightdiff = COALESCE((CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (nightDifferentialHours * ndot_hour) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (nightDifferentialHours * ndot_hour) * 1.3
                ELSE nightDifferentialHours * ndot_hour
            END + CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (nightDifferentialMinutes * ndot_min) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (nightDifferentialMinutes * ndot_min) * 1.3
                ELSE nightDifferentialMinutes * ndot_min
            END), 0),
            roa_total_normal = COALESCE((CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (normalOverTimeHours * not_hour) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (normalOverTimeHours * not_hour) * 1.3
                ELSE normalOverTimeHours * not_hour
            END + CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (normalOverTimeMinutes * not_min) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (normalOverTimeMinutes * not_min) * 1.3
                ELSE normalOverTimeMinutes * not_min
            END), 0),
            roa_total_early = COALESCE((CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (earlyOvertimeHours * eot_hour) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (earlyOvertimeHours * eot_hour) * 1.3
                ELSE earlyOvertimeHours * eot_hour
            END + CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (earlyOvertimeMinutes * eot_min) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (earlyOvertimeMinutes * eot_min) * 1.3
                ELSE earlyOvertimeMinutes * eot_min
            END), 0),
            roa_ot_total = COALESCE(((CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (nightDifferentialHours * ndot_hour) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (nightDifferentialHours * ndot_hour) * 1.3
                ELSE nightDifferentialHours * ndot_hour
            END + CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (nightDifferentialMinutes * ndot_min) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (nightDifferentialMinutes * ndot_min) * 1.3
                ELSE nightDifferentialMinutes * ndot_min
            END) + (CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (normalOverTimeHours * not_hour) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (normalOverTimeHours * not_hour) * 1.3
                ELSE normalOverTimeHours * not_hour
            END + CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (normalOverTimeMinutes * not_min) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (normalOverTimeMinutes * not_min) * 1.3
                ELSE normalOverTimeMinutes * not_min
            END) + (CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (earlyOvertimeHours * eot_hour) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (earlyOvertimeHours * eot_hour) * 1.3
                ELSE earlyOvertimeHours * eot_hour
            END + CASE 
                WHEN rdotType = 'RDOT W/ Regular Holiday' THEN (earlyOvertimeMinutes * eot_min) * 2
                WHEN rdotType = 'RDOT W/ Special Holiday' THEN (earlyOvertimeMinutes * eot_min) * 1.3
                ELSE earlyOvertimeMinutes * eot_min
            END) + (COALESCE(CASE 
            WHEN rdotType = 'RDOT W/ Regular Holiday' THEN rdotPayDay * 2
            WHEN rdotType = 'RDOT W/ Special Holiday' THEN rdotPayDay * 1.3
            ELSE rdotPayDay
            END, 0))), 0),
            roa_file = rdotImage,
            roa_createdate = appliedDate,
            roa_createby =createdBy,
            roa_payrolldate = payrollDate,
            roa_subgroupid = subGroup,
            roa_approvalcount = 0
        WHERE 
            roa_rdotid = requestId;
     END
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop stored procedure
    await queryInterface.sequelize.query(`
      DROP PROCEDURE IF EXISTS UpdateRequestRestDayOt;
    `);
  }
};
