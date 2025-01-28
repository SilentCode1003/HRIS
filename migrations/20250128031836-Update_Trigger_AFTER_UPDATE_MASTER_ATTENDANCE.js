'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS after_update_attendance;
    `);
    // Add stored procedure
    await queryInterface.sequelize.query(`
      CREATE TRIGGER after_update_attendance AFTER UPDATE ON master_attendance FOR EACH ROW BEGIN
          DECLARE attendance_duration INT;
          DECLARE holiday_date DATE;
          DECLARE holiday_type VARCHAR(50);
          DECLARE regular_nightdiff_holiday DECIMAL(10, 2);
          DECLARE regular_normalot_holiday DECIMAL(10, 2);
          DECLARE special_nightdiff_holiday DECIMAL(10, 2);
          DECLARE special_normalot_holiday DECIMAL(10, 2);
          DECLARE normal_ot_total DECIMAL(10, 2);
          DECLARE nightdiff_ot_total DECIMAL(10, 2);
          DECLARE prev_date DATE;
          DECLARE prev_day_of_week INT;
          DECLARE prev_shift JSON;
          DECLARE prev_time_in TIME;
          DECLARE prev_time_out TIME;
          DECLARE is_rest_day BOOLEAN DEFAULT FALSE;
            DECLARE is_rest_day_ot BOOLEAN DEFAULT FALSE;
            DECLARE fullName VARCHAR (100);
            DECLARE total_restdayot_pay DECIMAL(10, 5);
            DECLARE shift_for_today DATETIME;
            DECLARE shift_clockin DATETIME;
            IF NEW.ma_clockout IS NOT NULL AND OLD.ma_clockout IS NULL THEN
                SET attendance_duration = TIMESTAMPDIFF(HOUR, OLD.ma_clockin, NEW.ma_clockout);
                SET holiday_date = (SELECT mh_date FROM master_holiday WHERE mh_date = NEW.ma_attendancedate);
                SET holiday_type = (SELECT mh_type FROM master_holiday WHERE mh_date = NEW.ma_attendancedate);
                SET regular_nightdiff_holiday = (SELECT ((CASE WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly / 8) ELSE (s.ms_monthly / 313 * 12 / 8) END) * 2 * 1.10 )FROM master_salary s WHERE ms_employeeid = NEW.ma_employeeid);
                SET regular_normalot_holiday = (SELECT ((CASE WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly / 8) ELSE (s.ms_monthly / 313 * 12 / 8) END) * 1.30 )FROM master_salary s WHERE ms_employeeid = NEW.ma_employeeid);
                SET special_nightdiff_holiday = (SELECT ((CASE WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly / 8) ELSE (s.ms_monthly / 313 * 12 / 8) END) * 1.30 )FROM master_salary s WHERE ms_employeeid = NEW.ma_employeeid);
                SET special_normalot_holiday = (SELECT ((CASE WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly / 8) ELSE (s.ms_monthly / 313 * 12 / 8) END) * 1.50 * 1.30)FROM master_salary s WHERE ms_employeeid = NEW.ma_employeeid);
                SET normal_ot_total = (SELECT
                CASE
                            WHEN ma.ma_clockout <= CAST(CONCAT(ma.ma_attendancedate, ' ', '22:00:00') AS DATETIME) 
                                AND ma.ma_clockout >= CAST(CONCAT(ma.ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
                            THEN COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, CAST(CONCAT(ma.ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
                            WHEN ma.ma_clockout >= CAST(CONCAT(ma.ma_attendancedate, ' ', '22:00:00') AS DATETIME)
                            THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT(ma.ma_attendancedate, ' ', '22:00:00') AS DATETIME), CAST(CONCAT(ma.ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
                            ELSE 0
                        END
                  FROM master_salary s
                    INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                    INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                    INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                    WHERE 
                        s.ms_employeeid = NEW.ma_employeeid 
                        AND ma.ma_attendancedate = NEW.ma_attendancedate);
            SET nightdiff_ot_total = (SELECT
            LEAST(
                            CASE
                                WHEN ((ma.ma_clockout >= CAST(CONCAT(ma.ma_attendancedate, ' ', '22:00:00') AS DATETIME)) 
                                    AND (CAST(CONCAT(DATE(ma.ma_clockout), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE(ma.ma_clockout), ' ', '06:00:00') AS DATETIME))
                                THEN COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, CAST(CONCAT(ma.ma_attendancedate, ' ', '22:00:00') AS DATETIME))))
                                ELSE 0
                            END,
                            8
                        )
                    FROM master_salary s
                    INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                    INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                    INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                    WHERE 
                        s.ms_employeeid = NEW.ma_employeeid 
                        AND ma.ma_attendancedate = NEW.ma_attendancedate);
              SET prev_date = DATE_SUB(NEW.ma_attendancedate, INTERVAL 1 DAY);
                  SET prev_day_of_week = DAYOFWEEK(prev_date);
                  SET fullName = (SELECT CONCAT(me_lastname,' ',me_firstname) FROM master_employee WHERE me_id = NEW.ma_employeeid);
                  SET total_restdayot_pay = (
              SELECT 
                CASE 
                  WHEN attendance_duration  <= 3 THEN 0
                  WHEN attendance_duration <= 8 THEN
                    CASE 
                      WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly * 1.30) / 2
                      ELSE (s.ms_monthly / 313 * 12 * 1.30) / 2
                    END
                  ELSE
                    CASE 
                      WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly * 1.30)
                      ELSE (s.ms_monthly / 313 * 12 * 1.30)
                    END
                END
              FROM master_salary s 
              WHERE s.ms_employeeid = NEW.ma_employeeid);
                SET is_rest_day_ot = (
                  SELECT 
                    CASE WHEN EXISTS (
                      SELECT 1
                      FROM change_shift
                      WHERE cs_employeeid = NEW.ma_employeeid
                      AND (cs_actualrd = NEW.ma_attendancedate OR cs_changerd = NEW.ma_attendancedate))
                    THEN CASE WHEN NEW.ma_attendancedate = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)
                      THEN FALSE
                      ELSE CASE WHEN NEW.ma_attendancedate = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_changerd = NEW.ma_attendancedate)
                        THEN TRUE
                        ELSE CASE
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 2 AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00' THEN TRUE
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 3 AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00' THEN TRUE
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 4 AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00' THEN TRUE
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 5 AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00' THEN TRUE
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 6 AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00' THEN TRUE
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 7 AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00' THEN TRUE
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 1 AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00' THEN TRUE
                            ELSE FALSE
                          END
                        END
                      END
                    ELSE CASE
                        WHEN DAYOFWEEK(NEW.ma_attendancedate) = 2 AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00' THEN TRUE
                        WHEN DAYOFWEEK(NEW.ma_attendancedate) = 3 AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00' THEN TRUE
                        WHEN DAYOFWEEK(NEW.ma_attendancedate) = 4 AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00' THEN TRUE
                        WHEN DAYOFWEEK(NEW.ma_attendancedate) = 5 AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00' THEN TRUE
                        WHEN DAYOFWEEK(NEW.ma_attendancedate) = 6 AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00' THEN TRUE
                        WHEN DAYOFWEEK(NEW.ma_attendancedate) = 7 AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00' THEN TRUE
                        WHEN DAYOFWEEK(NEW.ma_attendancedate) = 1 AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00' THEN TRUE
                        ELSE FALSE
                      END
                    END
                  FROM master_shift
                  WHERE ms_employeeid = NEW.ma_employeeid
                LIMIT 1);
                  SET shift_for_today = (SELECT 
                  CASE WHEN EXISTS (
                      SELECT 1
                      FROM change_shift
                      WHERE cs_employeeid = NEW.ma_employeeid
                      AND (cs_actualrd = NEW.ma_attendancedate OR cs_changerd = NEW.ma_attendancedate)) 
                  THEN CASE WHEN NEW.ma_attendancedate = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)
                    THEN ADDTIME(
                        CONCAT(
                          NEW.ma_attendancedate, ' ', 
                          CASE 
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 2 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 3 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 4 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 5 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 6 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 7 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 1 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out'))
                          END
                        ),
                        '00:00:00'
                      ) 
                    ELSE ADDTIME(
                        CONCAT(
                          NEW.ma_attendancedate, ' ', 
                          CASE 
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 2 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 3 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 4 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 5 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 6 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 7 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 1 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out'))
                          END
                        ),
                        '00:00:00'
                      ) 
                    END
                  ELSE ADDTIME(
                      CONCAT(
                        NEW.ma_attendancedate, ' ', 
                        CASE 
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 2 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 3 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 4 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 5 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 6 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 7 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 1 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out'))
                        END
                      ),
                      '00:00:00'
                    ) 
                  END
                  AS shift_for_today
                  FROM master_shift
                  WHERE ms_employeeid = NEW.ma_employeeid 
                  LIMIT 1);
                        
                        SET shift_clockin = (
                  SELECT 
                  CASE WHEN EXISTS (
                      SELECT 1
                      FROM change_shift
                      WHERE cs_employeeid = NEW.ma_employeeid
                      AND (cs_actualrd = NEW.ma_attendancedate OR cs_changerd = NEW.ma_attendancedate)) 
                  THEN CASE WHEN NEW.ma_attendancedate = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)
                    THEN ADDTIME(
                        CONCAT(
                          NEW.ma_attendancedate, ' ', 
                          CASE 
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 2 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 3 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 4 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 5 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 6 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 7 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in'))
                            WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_employeeid = NEW.ma_employeeid AND cs_actualrd = NEW.ma_attendancedate)) = 1 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in'))
                          END
                        ),
                        '00:00:00'
                      ) 
                    ELSE ADDTIME(
                        CONCAT(
                          NEW.ma_attendancedate, ' ', 
                          CASE 
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 2 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 3 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 4 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 5 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 6 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 7 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in'))
                            WHEN DAYOFWEEK(NEW.ma_attendancedate) = 1 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in'))
                          END
                        ),
                        '00:00:00'
                      ) 
                    END
                  ELSE ADDTIME(
                      CONCAT(
                        NEW.ma_attendancedate, ' ', 
                        CASE 
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 2 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 3 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 4 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 5 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 6 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 7 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in'))
                          WHEN DAYOFWEEK(NEW.ma_attendancedate) = 1 THEN JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in'))
                        END
                      ),
                      '00:00:00'
                    ) 
                  END
                  AS shift_clockin
                  FROM master_shift
                  WHERE ms_employeeid = NEW.ma_employeeid 
                  LIMIT 1);

                      
                -- Insert into attendance_logs
                        INSERT INTO attendance_logs (
                        al_attendanceid,
                        al_employeeid,
                        al_logdatetime,
                        al_logtype,
                        al_latitude,
                        al_longitude,
                        al_device,
                        al_geofenceid,
                        al_location
                    ) VALUES (
                        NEW.ma_attendanceid,
                        NEW.ma_employeeid,
                        NEW.ma_clockout,
                        'ClockOut',
                        NEW.ma_latitudeout,
                        NEW.ma_longitudeout,
                        NEW.ma_deviceout,
                        NEW.ma_geofenceidOut,
                        NEW.ma_locationOut
                    );
            IF EXISTS (SELECT 1 FROM master_holiday WHERE mh_date = NEW.ma_attendancedate) THEN
                SET prev_shift = (
                    SELECT 
                        CASE prev_day_of_week
                            WHEN 1 THEN ms_sunday
                            WHEN 2 THEN ms_monday
                            WHEN 3 THEN ms_tuesday
                            WHEN 4 THEN ms_wednesday
                            WHEN 5 THEN ms_thursday
                            WHEN 6 THEN ms_friday
                            WHEN 7 THEN ms_saturday
                        END
                    FROM master_shift
                    WHERE ms_employeeid = NEW.ma_employeeid
                );
            
                SET prev_time_in = JSON_UNQUOTE(JSON_EXTRACT(prev_shift, '$.time_in'));
                SET prev_time_out = JSON_UNQUOTE(JSON_EXTRACT(prev_shift, '$.time_out'));
                
                IF prev_time_in = '00:00:00' AND prev_time_out = '00:00:00' THEN
                    SET is_rest_day = TRUE;
                END IF;
                
                IF is_rest_day_ot = TRUE THEN
                    SET is_rest_day = TRUE;
                END IF;

            IF EXISTS (
                    SELECT 1
                    FROM master_attendance
                    WHERE ma_employeeid = NEW.ma_employeeid
                      AND ma_attendancedate = prev_date
                ) OR is_rest_day THEN
                    CALL RequestHoliday(
                        NEW.ma_clockin,
                        NEW.ma_clockout,
                        NEW.ma_attendancedate,
                        NEW.ma_employeeid,
                        NULL,
                        'Pending',
                        NULL,
                        NULL,
                        NULL,
                        0
                      );
                  END IF;
                END IF;
                
            IF attendance_duration > 9 AND NOT EXISTS (SELECT 1 FROM master_holiday
                  WHERE mh_date = NEW.ma_attendancedate) AND TIMESTAMPDIFF(MINUTE,NEW.ma_clockin, shift_clockin) >= 30 OR
              TIMESTAMPDIFF(MINUTE, shift_for_today, NEW.ma_clockout) >= 30 THEN
                  
                  CALL RequestOvertime(
                    NEW.ma_clockin,
                    NEW.ma_clockout,
                    NEW.ma_attendancedate,
                    NEW.ma_employeeid,
                    NULL,
                    'Pending',
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    0
                  ); 

                  
                END IF;
                    IF is_rest_day_ot = TRUE THEN
                      CALL RequestRestDayOt(
                        NEW.ma_clockin,
                        NEW.ma_clockout,
                        NEW.ma_shift_timein,
                        NEW.ma_shift_timeout,
                        NEW.ma_attendancedate,
                        NEW.ma_employeeid,
                        NULL, 
                        'Pending',
                        NULL, 
                        NULL,  
                        NULL,  
                        0 
                      );
                    END IF;
                END IF;
      END
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS after_update_attendance;
    `);
  }

};
