const model = require("../model/hrmisdb");
const mysql = require("mysql");
const { Encrypter, Decrypter } = require("./cryptography");
const { logger } = require("../../middleware/logger");
require("dotenv").config();

let password = "";
Decrypter(process.env._PASSWORD_ADMIN, (err, encrypted) => {
  if (err) console.error("Error: ", err);
  // console.log(encrypted);
  password = encrypted;
});

Decrypter("e2754fc9a6bb0577f975d0de90022f4d", (err, encrypted) => {
  if (err) console.error("Error: ", err);
  console.log(encrypted);
});

// Encrypter('101520122321', (err, encrypted) => {
//   if (err) console.error("Error: ", err);
//   console.log(encrypted);
// });

// Encrypter("5lsolutions101520", (err, encrypted) => {
//   if (err) console.error("Error: ", err);
//   console.log(encrypted);
// });

const connection = mysql.createConnection({
  host: process.env._HOST_ADMIN,
  user: process.env._USER_ADMIN,
  password: password,
  database: process.env._DATABASE_ADMIN,
  timezone: "PST",
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
      if (error) {
        logger.error(error);
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

      if (table == "Eportal_Leaves") {
        callback(null, model.Eportal_Leaves(results));
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
        callback(null, model.Master_Health(results));
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

      if (table == "Master_User") {
        callback(null, model.Master_User(results));
      }

      if (table == "Master_Resigned") {
        callback(null, model.Master_Resigned(results));
      }

      if (table == "Master_Ojt") {
        callback(null, model.Master_Ojt(results));
      }

      if (table == "Ojt_User") {
        callback(null, model.Ojt_User(results));
      }

      if (table == "Loan") {
        callback(null, model.Loan(results));
      }

      if (table == "Loan_Payment") {
        callback(null, model.Loan_Payment(results));
      }

      if (table == "Loan_Interest") {
        callback(null, model.Loan_Interest(results));
      }

      if (table == "Deposit") {
        callback(null, model.Deposit(results));
      }

      if (table == "Member_Recievable_Record") {
        callback(null, model.Member_Recievable_Record(results));
      }

      if (table == "Master_Geofence_Settings") {
        callback(null, model.Master_Geofence_Settings(results));
      }
      if (table == "Attendance_Logs") {
        callback(null, model.Attendance_Logs(results));
      }

      if (table == "Master_Salary") {
        callback(null, model.Master_Salary(results));
      }

      if (table == "Government_Deductions") {
        callback(null, model.Government_Deductions(results));
      }

      if (table == "Salary_History") {
        callback(null, model.Salary_History(results));
      }

      if (table == "Ojt_Attendance_Logs") {
        callback(null, model.Ojt_Attendance_Logs(results));
      }

      if (table == "Ojt_Attendance") {
        callback(null, model.Ojt_Attendance(results));
      }

      if (table == "Apps_Details") {
        callback(null, model.Apps_Details(results));
      }

      if (table == "Payroll_Approval_Ot") {
        callback(null, model.Payroll_Approval_Ot(results));
      }

      if (table == "Payroll_Date") {
        callback(null, model.Payroll_Date(results));
      }

      if (table == "Other_Deductions") {
        callback(null, model.Other_Deductions(results));
      }

      if (table == "Master_Deductions") {
        callback(null, model.Master_Deductions(results));
      }

      if (table == "Attendance_Request") {
        callback(null, model.Attendance_Request(results));
      }

      if (table == "Master_Notification") {
        callback(null, model.Master_Notification(results));
      }

      if (table == "Admin_Notification") {
        callback(null, model.Admin_Notification(results));
      }

      if (table == "TeamLeader_User") {
        callback(null, model.TeamLeader_User(results));
      }

      if (table == "Master_Shift_Settings") {
        callback(null, model.Master_Shift_Settings(results));
      }

      if (table == "Master_Employee_Background") {
        callback(null, model.Master_Employee_Background(results));
      }

      if (table == "Master_Leaves") {
        callback(null, model.Master_Leaves(results));
      }

      if (table == "Subgroup") {
        callback(null, model.Subgroup(results));
      }

      if (table == "Approval_Stage_Settings") {
        callback(null, model.Approval_Stage_Settings(results));
      }

      if (table == "Request_Approval_Settings") {
        callback(null, model.Request_Approval_Settings(results));
      }

      if (table == "Attendance_Request_Activity") {
        callback(null, model.Attendance_Request_Activity(results));
      }
    });
  } catch (error) {
    logger.error(error);
    console.log(error);
  }
};

exports.Insert = (stmt, todos, callback) => {
  try {
    connection.connect((err) => {
      return err;
    });

    connection.query(stmt, [todos], (err, results, fields) => {
      if (err) {
        //logger.error(error);
        callback(err, null);
      }

      callback(null, `Row inserted ${results.affectedRows}`);
    });
  } catch (error) {
    logger.error(error);
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
        l_image,
        l_leavestatus,
        l_leaveapplieddate,
        l_leaveduration,
        l_leavepaiddays,
        l_leaveunpaiddays,
        l_subgroupid,
        l_approvalcount) VALUES ?`;

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
        ma_latitudein,
        ma_longitudein,
        ma_devicein,
        ma_gefenceidIn,
        ma_locationIn) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "master_attendance_request") {
    let sql = `INSERT INTO master_attendance(
        ma_employeeid,
        ma_attendancedate,
        ma_clockin,
        ma_clockout,
        ma_latitudeIn,
        ma_longitudein,
        ma_latitudeout,
        ma_longitudeout,
        ma_gefenceidIn,
        ma_geofenceidOut,
        ma_devicein,
        ma_deviceout,
        ma_locationIn,
        ma_locationOut) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }
  if (tablename == "master_bulletin") {
    let sql = `INSERT INTO master_bulletin(
        mb_image,
        mb_tittle,
        mb_type,
        mb_targetdate,
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
        md_departmenthead,
        md_departmenticon,
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
        mda_description,
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
        me_middlename,
        me_lastname,
        me_birthday,
        me_gender,
        me_civilstatus,
        me_phone,
        me_email,
        me_hiredate,
        me_jobstatus,
        me_ercontactname,
        me_ercontactphone,
        me_department,
        me_position,
        me_address,
        me_profile_pic) VALUES ?`;

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
        mg_createby,
        mg_createdate,
        mg_status) VALUES ?`;

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
        mh_name,
        mh_day,
        mh_type,
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
        ms_employeeid,
        ms_department,
        ms_monday,
        ms_tuesday,
        ms_wednesday,
        ms_thursday,
        ms_friday,
        ms_saturday,
        ms_sunday) VALUES ?`;

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
        mu_isgeofence,
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
        oda_violation,
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
        s_mssalaryid,
        s_cutoff,
        s_netpay,
        s_totalhours,
        s_totaldeductions,
        s_payrolldate,
        s_allowances,
        s_adjustment,
        s_spholiday,
        s_restdayot,
        s_legalholiday) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "master_resigned") {
    let sql = `INSERT INTO master_resigned(
        mr_employeeid,
        mr_reason,
        mr_dateresigned,
        mr_status,
        mr_createby,
        mr_createdate) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }
  if (tablename == "master_ojt") {
    let sql = `INSERT INTO master_ojt(
        mo_id,
        mo_name,
        mo_lastname,
        mo_address,
        mo_status,
        mo_birthday,
        mo_gender,
        mo_cpnumber,
        mo_ercontact,
        mo_ercontactnumber,
        mo_school,
        mo_department,
        mo_startdate,
        mo_hours,
        mo_image) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }
  if (tablename == "ojt_user") {
    let sql = `INSERT INTO ojt_user(
        ou_ojtid,
        ou_username,
        ou_password,
        ou_accesstype,
        ou_createby,
        ou_createdate,
        ou_status) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "loan") {
    let sql = `INSERT INTO loan(
        l_employeeid,
        l_amount,
        l_interest,
        l_amountdue,
        l_datedue,
        l_period,
        l_status,
        l_approvedby,
        l_approveddate,
        l_purpose) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "loan_interest") {
    let sql = `INSERT INTO loan_interest(
        li_loanid,
        li_interest,
        li_rebate) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "deposit") {
    let sql = `INSERT INTO deposit(
        d_employeeid,
        d_date,
        d_amount) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "member_recievable_record") {
    let sql = `INSERT INTO member_recievable_record(
        mrb_employeeid,
        mrb_date,
        mrb_totaldeposit,
        mrb_totalinterest,
        mrb_status) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "loan_payment") {
    let sql = `INSERT INTO loan_payment(
        lp_loanid,
        lp_date,
        lp_amount,
        lp_remarks) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "master_geofence_settings") {
    let sql = `INSERT INTO master_geofence_settings(
        mgs_geofencename,
        mgs_departmentid,
        mgs_latitude,
        mgs_longitude,
        mgs_radius,
        mgs_location,
        mgs_status) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "master_salary") {
    let sql = `INSERT INTO master_salary(
      ms_employeeid,
      ms_monthly,
      ms_allowances,
      ms_basic_adjustments,
      ms_payrolltype) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "government_deductions") {
    let sql = `INSERT INTO government_deductions(
      gd_employeeid,
      gd_idtype,
      gd_amount,
      gd_period,
      gd_cutoff) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }
  if (tablename == "ojt_attendance") {
    let sql = `INSERT INTO ojt_attendance(
        oa_ojtid,
        oa_attendancedate,
        oa_clockin,
        oa_latitudein,
        oa_longitudein,
        oa_devicein,
        oa_gefenceidIn) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }
  if (tablename == "apps_details") {
    let sql = `INSERT INTO apps_details(
        ad_image,
        ad_name,
        ad_details,
        ad_version,
        ad_date,
        ad_createby) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "master_deductions") {
    let sql = `INSERT INTO master_deductions(
        md_employeeid,
        md_idtype,
        md_idnumber,
        md_issuedate,
        md_createby,
        md_createdate,
        md_status) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "other_deductions") {
    let sql = `INSERT INTO other_deductions(
      od_employeeid,
      od_idtype,
      od_amount,
      od_period,
      od_cutoff) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "attendance_request") {
    let sql = `INSERT INTO attendance_request(
      ar_employeeid,
      ar_attendace_date,
      ar_timein,
      ar_timeout,
      ar_total,
      ar_subgroupid,
      ar_reason,
      ar_file,
      ar_createdate,
      ar_createby,
      ar_status,
      ar_approvalcount) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "payroll_date") {
    let sql = `INSERT INTO payroll_date(
      pd_name,
      pd_cutoff,
      pd_startdate,
      pd_enddate,
      pd_payrolldate) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "teamlead_user") {
    let sql = `INSERT INTO teamlead_user(
       tu_employeeid,
       tu_username,
       tu_password,
       tu_accesstype,
       tu_subgroupid,
       tu_createby,
       tu_createdate,
       tu_status) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "master_shift_settings") {
    let sql = `INSERT INTO master_shift_settings(
       mss_shiftname,
       mss_startshift,
       mss_endshift,
       mss_restday,
       mss_exemptedday,
       mss_createdate,
       mss_createby,
       mss_shiftstatus) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      callback(null, result);
    });
  }

  if (tablename == "master_employee_background") {
    let sql = `INSERT INTO master_employee_background(
       meb_employeeid,
       meb_type,
       meb_courseandstatus,
       meb_attainment,
       meb_tittle,
       meb_status,
       meb_start,
       meb_end) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      console.log(err);
      callback(null, result);
    });
  }

  if (tablename == "master_leaves") {
    let sql = `INSERT INTO master_leaves(
      ml_employeeid,
      ml_tenure,
      ml_leavetype,
      ml_year,
      ml_totalleavedays,
      ml_unusedleavedays,
      ml_usedleavedays,
      ml_status) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      console.log(err);
      callback(null, result);
    });
  }

  if (tablename == "attendance_request_activity") {
    let sql = `INSERT INTO attendance_request_activity(
      ara_employeeid,
      ara_departmentid,
      ara_requestid,
      ara_subgroupid,
      ara_status,
      ara_date) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      console.log(err);
      callback(null, result);
    });
  }

  if (tablename == "aprroval_stage_settings") {
    let sql = `INSERT INTO aprroval_stage_settings(
      ats_accessid,
      ats_count,
      ats_createdby,
      ats_createddate) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      console.log(err);
      callback(null, result);
    });
  }

  if (tablename == "request_approval_settings") {
    let sql = `INSERT INTO request_approval_settings(
      ras_departmentid,
      ras_count,
      ras_createdby,
      ras_createdate,
      ras_status,
      ras_subgroupid) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      console.log(err);
      callback(null, result);
    });
  }

  if (tablename == "subgroup") {
    let sql = `INSERT INTO subgroup(
      s_departmentid,
      s_name,
      s_createby,
      s_createdate,
      s_status) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      console.log(err);
      callback(null, result);
    });
  }

  if (tablename == "leave_request_activity") {
    let sql = `INSERT INTO leave_request_activity(
      lra_employeeid,
      lra_departmentid,
      lra_leaveid,
      lra_subgroupid,
      lra_status,
      lra_date,
      lra_comment) VALUES ?`;

    this.Insert(sql, data, (err, result) => {
      if (err) {
        callback(err, null);
      }
      console.log(err);
      callback(null, result);
    });
  }
};

exports.Update = async (sql) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, (error, results, fields) => {
      if (error) {
        logger.error(error, null);
        reject(error);
      } else {
        resolve(`Rows affected: ${results.affectedRows}`);
      }
    });
  });
};

exports.UpdateMultiple = async (sql, data, callback) => {
  try {
    connection.query(sql, data, (error, results, fields) => {
      if (error) {
        logger.error(error);
        callback(error, null);
      }

      callback(null, `Rows affected: ${results.affectedRows}`);
    });
  } catch (error) {
    logger.error(error);
    console.log(error);
  }
};

// Helper function to promisify MySQL queries that modify data (e.g., INSERT, UPDATE, DELETE)
exports.mysqlQueryPromise = (sql) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, (error, results) => {
      if (error) {
        logger.error(error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

exports.StoredProcedure = (sql, callback) => {
  try {
    connection.query(sql, (error, results, fields) => {
      if (error) {
        logger.error(error);
        callback(error.message, null);
      }
      callback(null, results[0]);
    });
  } catch (error) {
    callback(error, null);
  }
};
