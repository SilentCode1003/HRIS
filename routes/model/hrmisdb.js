
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
            bulletinid: key.mb_bulletinid,
            tittle: key.mb_tittle,
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