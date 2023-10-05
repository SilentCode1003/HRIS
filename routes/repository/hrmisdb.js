const model = require('../model/hrmisdb')
const mysql = require('mysql');
require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env._HOST_ADMIN,
    user: process.env._USER_ADMIN,
    password: process.env._PASSWORD_ADMIN,
    database: process.env._DATABASE_ADMIN,
    port:3306
  });

  exports.CheckConnection = () => {
    connection.connect((err) => {
        if (err) {
            console.error("Error connection to MYSQL database: ", err);
            return;
        }
        console.log("MySQL database connection established successfully!");
    });
  };

  exports.Select = (sql, table, callback) => {
    try {
      connection.connect((err) => {
        return err;
      });
      connection.query(sql, (error, results, fields) => {
        //console.log(results);

        if (error) {
          callback(error, null);
        }

        if (table == "Master_Employee") {
          callback(null, model.Master_Employee(results));
        }

        if (table == "Master_Department") {
          callback(null, model.Master_Department(results));
        }

        if (table == "Leaves") {
          callback(null, model.Leaves(results));
        }

        if (table == "Cash_Advance") {
          callback(null, model.Cash_Advance(results));
        }

        if (table == "Master_Access") {
          callback(null, model.Master_Access(results));
        }

        if (table == "Master_Attendance") {
          callback(null, model.Master_Attendance(results));
        }

        if (table == "Master_Bulletin") {
          callback(null, model.Master_Bulletin(results));
        }

        if (table == "Master_Disciplinary_Action") {
          callback(null, model.Master_Disciplinary_Action(results));
        }

        if (table == "Master_GovId") {
          callback(null, model.Master_GovId(results));
        }

        if (table == "Master_Health") {
          callback(null, model.Master_GovId(results));
        }

        if (table == "Master_Holiday") {
          callback(null, model.Master_Holiday(results));
        }

        if (table == "Master_HolidayRate") {
          callback(null, model.Master_HolidayRate(results));
        }

        if (table == "Master_Offense") {
          callback(null, model.Master_Offense(results));
        }

        if (table == "Master_Performance_Emp") {
          callback(null, model.Master_Performance_Emp(results));
        }

        if (table == "Master_Position") {
          callback(null, model.Master_Position(results));
        }

        if (table == "Master_Shift") {
          callback(null, model.Master_Shift(results));
        }

        if (table == "Master_Training") {
          callback(null, model.Master_Training(results));
        }

        if (table == "Master_Violation") {
          callback(null, model.Master_Violation(results));
        }

        if (table == "Offense_Disciplinary_Actions") {
          callback(null, model.Offense_Disciplinary_Actions(results));
        }

        if (table == "Payslip") {
          callback(null, model.Payslip(results));
        }

        if (table == "Salary") {
          callback(null, model.Salary(results));
        }

      });
    } catch (error) {
      
    }
  };

  exports.Insert = (stmt, todos, callback) => {
    try {
      connection.connect((err) => {
        return err;
      });

      connection.query(stmt, [todos], (err, results, fields) => {
        if (err) {
          callback(err, null);
        }

        callback(null, `Row inserted ${results,affectedRows}`);
      });
    } catch (error) {
      console.log(error);
    }
  };

  exports.InsertTable = (tablename, data, callback) => {
    if (tablename == "cash_advance") {
      let sql = `INSERT INTO cash_advance(
        ca_employeeid,
        ca_requestdate,
        ca_amount,
        ca_purpose,
        ca_status,
        ca_approvaldate) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "leaves") {
      let sql = `INSERT INTO leaves(
        l_employeeid,
        l_leavestartdate,
        l_leaveenddate,
        l_leavetype,
        l_leavereason,
        l_leavestatus,
        l_leaveapplieddate) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_access") {
      let sql = `INSERT INTO master_access(
        ma_accessname,
        ma_createby,
        ma_createdate,
        ma_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_attendance") {
      let sql = `INSERT INTO master_attendance(
        ma_employeeid,
        ma_attendancedate,
        ma_clockin,
        ma_clockout,
        ma_latitudeIn,
        ma_longitudein,
        ma_latitudeout,
        ma_geofencelatitude,
        ma_geofencelongitude,
        ma_geofenceradius,
        ma_devicein,
        ma_deviceout) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_bulletin") {
      let sql = `INSERT INTO master_bulletin(
        mb_description,
        mb_createby,
        mb_createdate,
        mb_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_department") {
      let sql = `INSERT INTO master_department(
        md_departmentname,
        md_createdby,
        md_createddate,
        md_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_disciplinary_action") {
      let sql = `INSERT INTO master_disciplinary_action(
        mda_actioncode,
        mda_offenseid,
        mada_description,
        mda_createdate,
        mda_createby,
        mda_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_employee") {
      let sql = `INSERT INTO master_employee(
        me_id,
        me_firstname,
        me_lastname,
        me_birthday,
        me_gender,
        me_phone,
        me_email,
        me_hiredate,
        me_jobstatus,
        me_ercontactname,
        me_ercontactphone,
        me_department,
        me_position,
        me_address) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_govid") {
      let sql = `INSERT INTO master_govid(
        mg_employeeid,
        mg_idtype,
        mg_idnumber,
        mg_issuedate,
        mg_expirydate,
        mg_createby,
        mg_createdate) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_health") {
      let sql = `INSERT INTO master_health(
        mh_employeeid,
        mh_bloodtype,
        mh_medicalcondition,
        mh_prescribemedications,
        mh_ercontactname,
        mh_ercontactphone,
        mh_lastcheckup,
        mh_insurance,
        mh_insurancenumber) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_holiday") {
      let sql = `INSERT INTO master_holiday(
        mh_date,
        mh_description,
        mh_createdate,
        mh_createby,
        mh_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_holidayrate") {
      let sql = `INSERT INTO master_holidayrate(
        mhr_holidaydate,
        mhr_holidayrate,
        mhr_holidaystatus,
        mhr_createby,
        mhr_createdate) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_offense") {
      let sql = `INSERT INTO master_offense(
        mo_offensename,
        mo_createdby,
        mo_createdate,
        mo_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_performance_emp") {
      let sql = `INSERT INTO master_performance_emp(
        mpe_employeeid,
        mpe_appraisaldate,
        mpe_appraisaltype,
        mpe_rating,
        mpe_comments) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_position") {
      let sql = `INSERT INTO master_position(
        mp_positionname,
        mp_createdby,
        mp_createdate,
        mp_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_shift") {
      let sql = `INSERT INTO master_shift(
        ms_shiftname,
        ms_status,
        ms_department,
        ms_createby,
        ms_createdate) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_training") {
      let sql = `INSERT INTO master_training(
        mt_name,
        mt_employeeid,
        mt_startdate,
        mt_enddate,
        mt_location,
        mt_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_user") {
      let sql = `INSERT INTO master_user(
        mu_employeeid,
        mu_username,
        mu_password,
        mu_accesstype,
        mu_createby,
        mu_createdate,
        mu_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "master_violation") {
      let sql = `INSERT INTO master_violation(
        mv_description,
        mv_actionid,
        mv_createby,
        mv_createdate,
        mv_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "offense_disciplinary_actions") {
      let sql = `INSERT INTO offense_disciplinary_actions(
        oda_employeeid,
        oda_offenseid,
        oda_actionid,
        oda_date,
        oda_createby,
        oda_createdate,
        oda_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "payslip") {
      let sql = `INSERT INTO payslip(
        p_employeeid,
        p_paystartday,
        p_payenddate,
        p_salarymonth,
        p_basicsalary,
        p_allowances,
        p_deductions,
        p_overtime,
        p_netsalary) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
    if (tablename == "salary") {
      let sql = `INSERT INTO salary(
        s_employeeid,
        s_salarymonth,
        s_allowances,
        s_deductions,
        s_netsalary,
        s_paymentdate,
        s_status) VALUES ?`;
  
      this.Insert(sql, data, (err, result) => {
        if (err) {
          callback(err, null);
        }
        callback(null, result);
      });
    }
  };

  exports.Update = async (sql, callback) => {
    try {
      connection.query(sql, (error, results, fields) => {
        if (error) {
          callback(error, null);
        }
        // console.log('Rows affected:', results.affectedRows);
  
        callback(null, `Rows affected: ${results.affectedRows}`);
      });
    } catch (error) {
      callback(error, null);
    }
  };
  
  exports.UpdateMultiple = async (sql, data, callback) => {
    try {
      connection.query(sql, data, (error, results, fields) => {
        if (error) {
          callback(error, null);
        }
        // console.log('Rows affected:', results.affectedRows);
  
        callback(null, `Rows affected: ${results.affectedRows}`);
      });
    } catch (error) {
      console.log(error);
    }
  };
  
  exports.UpdateMultiple = async (sql, data, callback) => {
    try {
      connection.query(sql, data, (error, results, fields) => {
        if (error) {
          callback(error, null);
        }
        console.log("Rows affected:", results.affectedRows);
  
        callback(null, `Rows affected: ${results.affectedRows}`);
      });
    } catch (error) {
      console.log(error);
    }
  };