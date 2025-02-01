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
      CREATE PROCEDURE GenerateEmployeeGovernmentDeductions(
        IN employee_id VARCHAR(9),
        IN government_type VARCHAR(300)
        )
      BEGIN
        DECLARE id INT;
          DECLARE employeeid varchar(9);
          DECLARE monthly decimal(10,2);
          DECLARE idtype varchar(300);
          DECLARE idnumber varchar(300);

        DECLARE DONE INT DEFAULT FALSE;
        
        DECLARE compensationStarting INT DEFAULT 5250;
          DECLARE regularSalaryBase INT DEFAULT 5000;
          DECLARE compensationIterationRange INT DEFAULT 0;
        DECLARE compensationIterationStaertingRange INT DEFAULT 0;
          
        DECLARE i INT DEFAULT 0;
          DECLARE maxIterations INT DEFAULT 300;
          
        DECLARE salary_list CURSOR FOR
        SELECT
        ms_id as id,
        ms_employeeid as employeeid,
        CASE WHEN ms_payrolltype = 'Daily' THEN (ms_monthly *(313/12)) ELSE ms_monthly END as monthly,
        mg_idtype as idtype,
        mg_governmentid as idnumber
        FROM master_salary
        INNER JOIN master_govid ON ms_employeeid = mg_employeeid
        WHERE ms_employeeid = employee_id
        AND mg_idtype = government_type;
          
          DECLARE CONTINUE HANDLER FOR NOT FOUND SET DONE = TRUE;
          
          DROP TABLE IF EXISTS sss_contribution_table;
          CREATE TEMPORARY TABLE sss_contribution_table
          (
          sct_starting decimal(10,2),
          sct_ending decimal(10,2),
          sct_base decimal(10,2),
          sct_ee decimal(10,2)
          );
          
        DROP TABLE IF EXISTS employee_contribution;
          CREATE TEMPORARY TABLE employee_contribution
          (
          ec_id varchar(9),
              ec_govermentid int,
          ec_ee decimal(10,2),
              ec_period int,
              ec_cutoff varchar(300)
          );
          
          WHILE i < maxIterations DO
          SET i = i + 1;
              
              
          IF i = 1 THEN
            INSERT INTO sss_contribution_table 
            SELECT
            (compensationStarting) as sct_starting, 
            (compensationStarting + compensationIterationRange) as sct_ending, 
            (regularSalaryBase + compensationIterationStaertingRange) as sct_base,
            CASE WHEN regularSalaryBase >= 20000 THEN 1000
              ELSE (regularSalaryBase * 0.05) 
              END as sct_ee;
                
            SET compensationStarting = compensationStarting + 500;
            SET compensationIterationStaertingRange =+ 499.99;
            SET regularSalaryBase = regularSalaryBase + compensationIterationStaertingRange;
          ELSE
            INSERT INTO sss_contribution_table 
            SELECT
            (compensationStarting - 500) as sct_starting, 
            (compensationStarting + compensationIterationRange) as sct_ending, 
            (regularSalaryBase + compensationIterationStaertingRange) as sct_base,
            CASE WHEN regularSalaryBase >= 20000 THEN 1000
              ELSE (regularSalaryBase * 0.05) 
              END as sct_ee;

            SET compensationStarting = compensationStarting + 500;
            SET compensationIterationStaertingRange =+ 499.99;
            SET regularSalaryBase = regularSalaryBase + compensationIterationStaertingRange;
              END IF;
          
        END WHILE;
          
          OPEN salary_list;
          myloop: WHILE NOT DONE do
            FETCH salary_list INTO id, employeeid, monthly,idtype,idnumber;
            IF NOT DONE = false
          THEN LEAVE myloop;
          END IF;
              
              delete from government_deductions;
          alter table government_deductions auto_increment = 1;
              
              SET @id = id;
              SET @employeeid = employeeid;
              SET @monthly = monthly;
              SET @idtype = government_type;
              SET @idnumber = idnumber;
              
              INSERT INTO employee_contribution
              SELECT
              @employeeid,
              @idnumber,
          CASE WHEN @idtype = 'SSS'
            THEN 
              CASE WHEN @monthly >= 20000 THEN 1000
                WHEN @monthly BETWEEN sct_starting AND sct_ending AND @monthly < 20000 THEN sct_ee
              END
            WHEN @idtype = 'PhilHealth'
                  THEN 
              CASE WHEN @monthly = 10000 THEN 500
                WHEN @monthly  > 10000 THEN (@monthly / 2) * 0.05
              END
            WHEN @idtype = 'PagIbig'
                  THEN 
              CASE WHEN @monthly >= 1500 THEN 200
              END
            WHEN @idtype = 'TIN'
                  THEN 
              CASE WHEN (@monthly*12) > 250000 THEN ((((@monthly*12)-250000) * 0.15)/12)
                WHEN (@monthly*12) > 400000 THEN ((((@monthly*12)-400000) * 0.20)/12)
                WHEN (@monthly*12) > 800000 THEN ((((@monthly*12)-800000) * 0.25)/12)
                WHEN (@monthly*12) > 2000000 THEN ((((@monthly*12)-2000000) * 0.30)/12)
                          WHEN (@monthly*12) > 8000000 THEN ((((@monthly*12)-8000000) * 0.35)/12)
                          ELSE
                  0
              END
                  ELSE
              0
            END as tax_conpensation,
              CASE WHEN @idtype = 'SSS'THEN 2
              WHEN @idtype = 'PhilHealth'THEN 1
              WHEN @idtype = 'PagIbig'THEN 1
                      WHEN @idtype = 'TIN'THEN 2
            END as period,
              CASE WHEN @idtype = 'SSS'THEN '1st Cut Off and 2nd Cut Off'
              WHEN @idtype = 'PhilHealth'THEN '2nd Cut Off'
              WHEN @idtype = 'PagIbig'THEN '1st Cut Off'
                      WHEN @idtype = 'TIN'THEN '1st Cut Off and 2nd Cut Off'
            END as cutoff
              FROM sss_contribution_table
              WHERE @monthly BETWEEN sct_starting AND sct_ending;
              
          END WHILE;
          CLOSE salary_list;

          INSERT INTO government_deductions(gd_employeeid, gd_idtype, gd_amount, gd_period, gd_cutoff)
          SELECT ec_id, ec_govermentid, ec_ee, ec_period, ec_cutoff
          FROM employee_contribution;
          
          SELECT * FROM government_deductions where gd_employeeid = employee_id;
          
          END`);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.dropFunction("GenerateEmployeeGovernmentDeductions");
  },
};
