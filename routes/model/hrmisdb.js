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
      ma_devicein: key.ma_devicein,
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
      expirydate: key.mg_expirydate,
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
      shiftid: key.ms_shiftid,
      shiftname: key.ms_shiftname,
      status: key.ms_status,
      department: key.ms_department,
      createby: key.ms_createby,
      createdate: key.ms_createdate,
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

exports.Salary = (data) => {
  let dataResult = [];

  data.forEach((key, item) => {
    dataResult.push({
      salaryid: key.s_salaryid,
      employeeid: key.s_employeeid,
      salarymonth: key.s_salarymonth,
      allowances: key.s_allowances,
      deductions: key.s_deductions,
      netsalary: key.s_netsalary,
      paymentdate: key.s_paymentdate,
      status: key.s_status,
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
      salaryid: key.ms_id,
      employeeid: key.ms_employeeid,
      monthly: key.ms_monthly,
      allowances: key.ms_allowances,
    });
  });

  return dataResult;
};
