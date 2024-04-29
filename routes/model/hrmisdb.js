const { OJTAttendanceModel } = require("./model");

exports.Master_Employee = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      newEmployeeId: key.me_id,
      firstname: key.me_firstname,
      middlename: key.me_middlename,
      lastname: key.me_lastname,
      birthday: key.me_birthday,
      gender: key.me_gender,
      civilstatus: key.me_civilstatus,
      phone: key.me_phone,
      email: key.me_email,
      hiredate: key.me_hiredate,
      jobstatus: key.me_jobstatus,
      ercontactname: key.me_ercontactname,
      ercontactphone: key.me_ercontactphone,
      department: key.me_department,
      position: key.me_position,
      address: key.me_address,
      profilePicturePath: key.me_profile_pic,
    });
  });

  return dataResult;
};

exports.Master_Resigned = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      resignedid: key.mr_resignedid,
      employeeid: key.mr_employeeid,
      reason: key.mr_reason,
      dateresigned: key.mr_dateresigned,
      status: key.mr_status,
      createby: key.mr_createby,
      createdate: key.mr_createdate,
    });
  });

  return dataResult;
};

exports.Master_Department = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      departmentid: key.md_departmentid,
      departmentname: key.md_departmentname,
      departmenthead: key.md_departmenthead,
      createdby: key.md_createdby,
      createdate: key.md_createddate,
      status: key.md_status,
    });
  });

  return dataResult;
};

exports.Leaves = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      leaveid: key.l_leaveid,
      employeeid: key.l_employeeid,
      leavestartdate: key.l_leavestartdate,
      leaveenddate: key.l_leaveenddate,
      leavetype: key.l_leavetype,
      reason: key.l_leavereason,
      status: key.l_leavestatus,
      applieddate: key.l_leaveapplieddate,
    });
  });

  return dataResult;
};

exports.Eportal_Leaves = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      leaveid: key.l_leaveid,
      employeeid: key.l_employeeid,
      leavestartdate: key.l_leavestartdate,
      leaveenddate: key.l_leaveenddate,
      leavetype: key.l_leavetype,
      reason: key.l_leavereason,
      status: key.l_leavestatus,
      applieddate: key.l_leaveapplieddate,
      comment: key.l_comment,
    });
  });

  return dataResult;
};

exports.Cash_Advance = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      cashadvanceid: key.ca_cashadvanceid,
      employeeid: key.ca_employeeid,
      requestdate: key.ca_requestdate,
      amount: key.ca_amount,
      purpose: key.ca_purpose,
      status: key.ca_status,
      approvaldate: key.ca_approvaldate,
    });
  });

  return dataResult;
};

exports.Master_Access = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      accessid: key.ma_accessid,
      accessname: key.ma_accessname,
      createby: key.ma_createby,
      createdate: key.ma_createdate,
      status: key.ma_status,
    });
  });

  return dataResult;
};

exports.Master_Attendance = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      attendanceid: key.ma_attendanceid,
      employeeid: key.ma_employeeid,
      attendancedate: key.ma_attendancedate,
      clockin: key.ma_clockin,
      clockout: key.ma_clockout,
      latitudein: key.ma_latitudeIn,
      longitudein: key.ma_longitudein,
      latitudeout: key.ma_latitudeout,
      geofencelatitude: key.ma_geofencelatitude,
      geofencelongitude: key.ma_geofencelongitude,
      geofenceradius: key.ma_geofenceradius,
      devicein: key.ma_devicein,
      deviceout: key.ma_deviceout,
    });
  });

  return dataResult;
};

exports.Master_Bulletin = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.mb_image,
      bulletinid: key.mb_bulletinid,
      tittle: key.mb_tittle,
      type: key.mb_type,
      targetdate: key.mb_targetdate,
      description: key.mb_description,
      createby: key.mb_createby,
      createdate: key.mb_createdate,
      status: key.mb_status,
    });
  });

  return dataResult;
};

exports.Master_Disciplinary_Action = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      actionid: key.mda_actionid,
      actioncode: key.mda_actioncode,
      offenseid: key.mda_offenseid,
      description: key.mda_description,
      createdate: key.mda_createdate,
      createby: key.mda_createby,
      status: key.mda_status,
    });
  });

  return dataResult;
};

exports.Master_GovId = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      governmentid: key.mg_governmentid,
      employeeid: key.mg_employeeid,
      idtype: key.mg_idtype,
      idnumber: key.mg_idnumber,
      issuedate: key.mg_issuedate,
      createby: key.mg_createby,
      createdate: key.mg_createdate,
      status: key.mg_status,
    });
  });

  return dataResult;
};

exports.Master_Health = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      healthid: key.mh_healthid,
      employeeid: key.mh_employeeid,
      bloodtype: key.mh_bloodtype,
      medicalcondition: key.mh_medicalcondition,
      prescribemedications: key.mh_prescribemedications,
      ercontactname: key.mh_ercontactname,
      ercontactphone: key.mh_ercontactphone,
      lastcheckup: key.mh_lastcheckup,
      insurance: key.mh_insurance,
      insurancenumber: key.mh_insurancenumber,
    });
  });

  return dataResult;
};

exports.Master_Holiday = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      holidayid: key.mh_holidayid,
      day: key.mh_day,
      name: key.mh_name,
      date: key.mh_date,
      type: key.mh_type,
      status: key.mh_status,
    });
  });

  return dataResult;
};

exports.Master_HolidayRate = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      holidayrateid: key.mhr_holidayrateid,
      holidaydate: key.mhr_holidaydate,
      holidayrate: key.mhr_holidayrate,
      holidaystatus: key.mhr_holidaystatus,
      createby: key.mhr_createby,
      createdate: key.mhr_createdate,
    });
  });

  return dataResult;
};

exports.Master_Offense = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      offenseid: key.mo_offenseid,
      offensename: key.mo_offensename,
      createdby: key.mo_createdby,
      createdate: key.mo_createdate,
      status: key.mo_status,
    });
  });

  return dataResult;
};

exports.Master_Performance_Emp = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      performanceid: key.mpe_performanceid,
      employeeid: key.mpe_employeeid,
      appraisaldate: key.mpe_appraisaldate,
      appraisaltype: key.mpe_appraisaltype,
      rating: key.mpe_rating,
      comments: key.mpe_comments,
    });
  });

  return dataResult;
};

exports.Master_Position = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      positionid: key.mp_positionid,
      positionname: key.mp_positionname,
      createdby: key.mp_createdby,
      createdate: key.mp_createdate,
      status: key.mp_status,
    });
  });

  return dataResult;
};

exports.Master_Shift = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      shiftid: key.ms_id,
      employeeid: key.ms_employeeid,
      department: key.ms_department,
      monday: key.ms_monday,
      tuesday: key.ms_tuesday,
      wednesday: key.ms_wednesday,
      thursday: key.ms_thursday,
      friday: key.ms_friday,
      saturday: key.ms_saturday,
      sunday: key.ms_sunday,
    });
  });

  return dataResult;
};

exports.Master_Training = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.me_profile_pic,
      trainingid: key.mt_trainingid,
      name: key.mt_name,
      employeeid: key.mt_employeeid,
      startdate: key.mt_startdate,
      enddate: key.mt_enddate,
      location: key.mt_location,
      status: key.mt_status,
    });
  });

  return dataResult;
};

exports.Master_Violation = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      violationid: key.mv_violationid,
      description: key.mv_description,
      actionid: key.mv_actionid,
      createby: key.mv_createby,
      createdate: key.mv_createdate,
      status: key.mv_status,
    });
  });

  return dataResult;
};

exports.Offense_Disciplinary_Actions = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.me_profile_pic,
      disciplinaryid: key.oda_disciplinaryid,
      employeeid: key.oda_employeeid,
      offenseid: key.oda_offenseid,
      actionid: key.oda_actionid,
      violation: key.oda_violation,
      date: key.oda_date,
      createby: key.oda_createby,
      createdate: key.oda_createdate,
      status: key.oda_status,
    });
  });

  return dataResult;
};

exports.Payslip = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      payslipid: key.p_payslipid,
      employeeid: key.p_employeeid,
      paystartday: key.p_paystartday,
      payenddate: key.p_payenddate,
      salarymonth: key.p_salarymonth,
      basicsalary: key.p_basicsalary,
      allowances: key.p_allowances,
      deductions: key.p_deductions,
      overtime: key.p_overtime,
      netsalary: key.p_netsalary,
    });
  });

  return dataResult;
};

exports.Master_User = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.me_profile_pic,
      userid: key.mu_userid,
      employeeid: key.mu_employeeid,
      username: key.mu_username,
      password: key.mu_password,
      accesstype: key.mu_accesstype,
      createby: key.mu_createby,
      createdate: key.mu_createdate,
      status: key.mu_status,
    });
  });

  return dataResult;
};

exports.Master_Ojt = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      ojtid: key.mo_id,
      image: key.mo_image,
      firstname: key.mo_name,
      lastname: key.mo_lastname,
      address: key.mo_address,
      status: key.mo_status,
      birthday: key.mo_birthday,
      gender: key.mo_gender,
      phone: key.mo_cpnumber,
      ercontact: key.mo_ercontact,
      ercontactnumber: key.mo_ercontactnumber,
      school: key.mo_school,
      department: key.mo_department,
      startdate: key.mo_startdate,
      hours: key.mo_hours,
    });
  });

  return dataResult;
};

exports.Ojt_User = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      ojtuserid: key.ou_userid,
      ojtid: key.ou_ojtid,
      username: key.ou_username,
      password: key.ou_password,
      accesstype: key.ou_accesstype,
      createby: key.ou_createby,
      createdate: key.ou_createdate,
      status: key.ou_status,
    });
  });

  return dataResult;
};

exports.Loan = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      loanid: key.l_id,
      employeeid: key.l_employeeid,
      amount: key.l_amount,
      interest: key.l_interest,
      amountdue: key.l_amountdue,
      datedue: key.l_datedue,
      period: key.l_period,
      status: key.l_status,
      approvedby: key.l_approvedby,
      approveddate: key.l_approveddate,
      purpose: key.l_purpose,
    });
  });

  return dataResult;
};

exports.Loan_Interest = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      interestid: key.li_id,
      loanid: key.li_loanid,
      interest: key.li_interest,
      rebate: key.li_rebate,
    });
  });

  return dataResult;
};

exports.Deposit = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      depositid: key.d_id,
      employeeid: key.d_employeeid,
      date: key.d_date,
      amount: key.d_amount,
    });
  });

  return dataResult;
};

exports.Member_Recievable_Record = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      recordid: key.mrb_id,
      employeeid: key.mrb_employeeid,
      date: key.mrb_date,
      totaldeposit: key.mrb_totaldeposit,
      totalinterest: key.mrb_totalinterest,
      status: key.mrb_status,
    });
  });

  return dataResult;
};

exports.Loan_Payment = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      paymentid: key.lp_id,
      loanid: key.lp_loanid,
      date: key.lp_date,
      loanamount: key.lp_amount,
      remarks: key.lp_remarks,
    });
  });

  return dataResult;
};

exports.Master_Geofence_Settings = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      geofenceid: key.mgs_id,
      geofencename: key.mgs_geofencename,
      departmentid: key.mgs_departmentid,
      latitude: key.mgs_latitude,
      longitude: key.mgs_longitude,
      radius: key.mgs_radius,
      location: key.mgs_location,
      status: key.mgs_status,
    });
  });

  return dataResult;
};

exports.Attendance_Logs = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      logid: key.al_logid,
      attendanceid: key.al_attendanceid,
      employeeid: key.al_employeeid,
      longdatetime: key.al_logdatetime,
      logtype: key.al_logtype,
      latitude: key.al_latitude,
      longitude: key.al_longitude,
      device: key.al_device,
    });
  });

  return dataResult;
};

exports.Master_Salary = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.me_profile_pic,
      salaryid: key.ms_id,
      employeeid: key.ms_employeeid,
      monthly: key.ms_monthly,
      allowances: key.ms_allowances,
      adjustments: key.ms_basic_adjustments,
      payrolltype: key.ms_payrolltype,
    });
  });

  return dataResult;
};

exports.Government_Deductions = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.me_profile_pic,
      govdeduct: key.gd_id,
      employeeid: key.gd_employeeid,
      type: key.gd_idtype,
      amount: key.gd_amount,
      period: key.gd_period,
      cutoff: key.gd_cutoff,
    });
  });

  return dataResult;
};

exports.Salary_History = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.me_profile_pic,
      historyid: key.sh_id,
      date: key.sh_date,
      salaryid: key.sh_salaryid,
      employeeid: key.sh_employeeid,
      monthly: key.sh_monthly,
      allowances: key.sh_allowances,
      adjustments: key.sh_basic_adjustments,
      payrolltype: key.sh_payrolltype,
    });
  });

  return dataResult;
};

exports.Salary = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.me_profile_pic,
      salaryid: key.s_salaryid,
      employeeid: key.s_employeeid,
      salarymonth: key.s_mssalaryid,
      cutoff: key.s_cutoff,
      netpay: key.s_netpay,
      totalhours: key.s_totalhours,
      totaldeductions: key.s_totaldeductions,
      payrolldate: key.s_payrolldate,
      allowances: key.s_allowances,
      adjustnent: key.s_adjustment,
      spholiday: key.s_spholiday,
      restdayot: key.s_restdayot,
      legalholiday: key.s_legalholiday,
    });
  });

  return dataResult;
};

exports.Ojt_Attendance_Logs = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      logid: key.oal_logid,
      attendanceid: key.oal_attendanceid,
      ojtid: key.oal_ojtid,
      longdatetime: key.oal_logdatetime,
      logtype: key.oal_logtype,
      latitude: key.oal_latitude,
      longitude: key.oal_longitude,
      device: key.oal_device,
    });
  });

  return dataResult;
};


exports.Apps_Details = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      appid: key.ad_id,
      appimage: key.ad_image,
      appname: key.ad_name,
      appsdetails: key.ad_details,
      appversion: key.ad_version,
      appdate: key.ad_date,
      appcreateby: key.ad_createby,
    });
  });

  return dataResult;
};


exports.Payroll_Approval_Ot = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      approveot_id: key.pao_id,
      image: key.pao_image,
      fullname: key.pao_fullname,
      employeeid: key.pao_employeeid,
      attendancedate: key.pao_attendancedate,
      clockin: key.pao_clockin,
      clockout: key.pao_clockout,
      totalhours: key.pao_total_hours,
      night_ot: key.pao_night_differentials,
      earlyot: key.pao_early_ot,
      normal_ot: key.pao_normal_ot,
      night_pay: key.pao_night_pay,
      normal_pay: key.pao_normal_pay,
      earlyot_pay: key.pao_early_ot_pay,
      night_pay_perhour: key.pao_night_hours_pay,
      normal_pay_perhour: key.pao_normal_ot_pay,
      totalot_pay: key.pao_total_ot_net_pay,
      payrolldate: key.pao_payroll_date,
      reason: key.pao_reason,
      overtimestatus: key.pao_status,
    });
  });

  return dataResult;
};



exports.Payroll_Date = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      payrolldate_id: key.pd_payrollid,
      payroll_name: key.pd_name,
      payroll_cutoff: key.pd_cutoff,
      payroll_startdate: key.pd_startdate,
      payroll_enddate: key.pd_enddate,
      payrolldate: key.pd_payrolldate,
    });
  });

  return dataResult;
};


exports.Other_Deductions = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.me_profile_pic,
      otherdeduct: key.od_id,
      employeeid: key.od_employeeid,
      idtype: key.od_idtype,
      amount: key.od_amount,
      period: key.od_period,
      cutoff: key.od_cutoff,
    });
  });

  return dataResult;
};


exports.Master_Deductions = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      otherdeductid: key.md_deductionid,
      employeeid: key.md_employeeid,
      idtype: key.md_idtype,
      idnumber: key.md_idnumber,
      issuedate: key.md_issuedate,
      createby: key.md_createby,
      createdate: key.md_createdate,
      status: key.md_status,
    });
  });

  return dataResult;
};


exports.Attendance_Request = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      emp_id: key.me_id,
      image: key.me_profile_pic,
      requestid: key.ar_requestid,
      employeeid: key.ar_employeeid,
      attendancedate: key.ar_attendace_date,
      timein: key.ar_timein,
      timeout: key.ar_timeout,
      total: key.ar_total,
      createdate: key.ar_createdate,
      createby: key.ar_createby,
      requeststatus: key.ar_status,
      reason: key.ar_reason,
      file: key.ar_file,
    });
  });

  return dataResult;
};

exports.Master_Notification = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      notificationid: key.mn_notificationid,
      employeeid: key.mn_employeeid,
      date: key.mn_date,
      tittle: key.mn_tittle,
      description: key.mn_description,
      subdescription: key.mn_subdescription,
      image: key.mn_image,
      isrecieved: key.mn_isReceived,
      isread: key.mn_isRead,
      isdelete: key.mn_isDeleate,
    });
  });

  return dataResult;
};


exports.Admin_Notification = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      notificationid: key.an_notificationid,
      employeeid: key.an_employeeid,
      date: key.an_date,
      tittle: key.an_tittle,
      description: key.an_description,
      subdescription: key.an_subdescription,
      isrecieved: key.an_isReceived,
      isread: key.an_isRead,
      isdelete: key.an_isDeleate,
    });
  });

  return dataResult;
};

exports.TeamLeader_User = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      image: key.me_profile_pic,
      tluserid: key.tu_userid,
      employeeid: key.tu_employeeid,
      username: key.tu_username,
      password: key.tu_password,
      accesstype: key.tu_accesstype,
      createby: key.tu_createby,
      createdate: key.tu_createdate,
      status: key.tu_status,
    });
  });

  return dataResult;
};


exports.Master_Shift_Settings = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      shiftsettingsid: key.mss_shiftid,
      shiftname: key.mss_shiftname,
      startshift: key.mss_startshift,
      endshift: key.mss_endshift,
      restday: key.mss_restday,
      exemptedday: key.mss_exemptedday,
      createdate: key.mss_createdate,
      createby: key.mss_createby,
      status: key.mss_shiftstatus,
    });
  });

  return dataResult;
};


exports.Master_Employee_Background = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      backgroundid: key.meb_id,
      employeeid: key.meb_employeeid,
      attainment: key.meb_attainment,
      tittle: key.meb_tittle,
      status: key.meb_status,
      start: key.meb_start,
      end: key.meb_end,
    });
  });

  return dataResult;
};








//#region Remodeling

exports.OJTAttendance = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      id: key.id,
      date: key.date,
      time: key.time,
      latitude: key.latitude,
      longitude: key.longitude,
      device: key.device,
    });
  });

  return dataResult.map(
    (key) =>
      new OJTAttendanceModel(
        key["id"],
        key["date"],
        key["time"],
        key["latitude"],
        key["longitude"],
        key["device"]
      )
  );
};
//#endregion
