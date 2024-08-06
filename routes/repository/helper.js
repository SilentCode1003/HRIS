exports.generateUsernameAndPassword = (employee) => {
  try {
    const {
      me_id: employeeid,
      me_firstname: firstname,
      me_lastname: lastname,
      me_birthday: birthday,
    } = employee;

    // const username = (firstname.charAt(0) + lastname).toLowerCase();

    // const password = employeeid + birthday.replace(/-/g, "");

    function sanitizeName(name) {
      return name.replace(/\s+/g, '').replace(/(jr|sr)$/i, '');
    }

    const sanitizedFirstname = sanitizeName(firstname.charAt(0).toLowerCase());
    const sanitizedLastname = sanitizeName(lastname.toLowerCase());


    const username = sanitizedFirstname + sanitizedLastname;
    const password = employeeid + birthday.replace(/-/g, "");

    return { username, password };
  } catch (error) {
    console.log(error);
  }
};

// exports.generateUsernameAndPasswordforemployee = (employee) => {
//   try {
//     const {
//       me_id: newEmployeeId,
//       me_firstname: firstname,
//       me_lastname: lastname,
//       me_birthday: birthday,
//     } = employee;

//     const username = firstname.toLowerCase() + lastname.charAt(0).toLowerCase();

//     const password = newEmployeeId + birthday.replace(/-/g, "");

//     return { username, password };
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.generateUsernameAndPasswordforemployee = (employee) => {
  try {
    const {
      me_id: newEmployeeId,
      me_firstname: firstname,
      me_lastname: lastname,
      me_birthday: birthday,
    } = employee;

    function sanitizeName(name) {
      return name.replace(/\s+/g, '').replace(/(jr|sr)$/i, '');
    }

    const sanitizedFirstname = sanitizeName(firstname.charAt(0).toLowerCase());
    const sanitizedLastname = sanitizeName(lastname.toLowerCase());


    const username = sanitizedFirstname + sanitizedLastname;
    const password = newEmployeeId + birthday.replace(/-/g, "");

    return { username, password };
  } catch (error) {
    console.log(error);
  }
};



exports.generateUsernameAndPasswordForApprentice = (apprentice) => {
  try {
    const {
      apprentice_id: newApprenticeId,
      apprentice_firstname: firstname,
      apprentice_lastname: lastname,
      apprentice_birthday: birthday,
    } = apprentice;

    // Generate username by combining the first name and the first letter of the last name
    const username = firstname.charAt(0).toLowerCase() + lastname.toLowerCase();

    // Generate the password by combining apprentice id and birthday
    const password = newApprenticeId + birthday.replace(/-/g, "");

    return { username, password };
  } catch (error) {
    console.log(error);
  }
};

exports.generateUsernamefoApplicant = (applicant) => {
  try {
    const { map_applicantid: newApplicantId, map_nickname: nickname } =
      applicant;

    const username = nickname.toLowerCase() + newApplicantId;

    return { username };
  } catch (error) {
    console.log(error);
  }
};

exports.UserLogin = (result, callback) => {
  try {
    const userData = [];

    result.forEach((row) => {
      userData.push({
        employeeid: row.employeeid,
        fullname: row.fullname,
        accesstype: row.accesstype,
        departmentid: row.departmentid,
        isgeofence: row.isgeofence,
        departmentname: row.departmentname,
        position: row.position,
        jobstatus: row.jobstatus,
        geofenceid: row.geofenceid,
        accesstypeid: row.accesstypeid,
        subgroupid: row.subgroupid,
        image: row.image,
      });
    });

    return userData;
  } catch (error) {
    console.log(error);
    callback(error);
  }
};

// exports.TeamLeadLogin = (result, callback) => {
//   try {
//     const tlData = [];

//     result.forEach((row) => {
//       tlData.push({
//         image: row.image,
//         employeeid: row.employeeid,
//         fullname: row.fullname,
//         accesstype: row.accesstype,
//         departmentid: row.departmentid,
//         departmentname: row.departmentname,
//         position: row.position,
//         jobstatus: row.jobstatus,
//         geofenceid: row.geofenceid,
//         subgroupid: row.subgroupid,
//         accesstypeid: row.accesstypeid,
//       });
//     });

//     return tlData;
//   } catch (error) {
//     console.log(error);
//     callback(error);
//   }
// };

exports.OjtLogin = (result, callback) => {
  try {
    const ojtData = [];

    result.forEach((row) => {
      ojtData.push({
        image: row.image,
        ojtid: row.ojtid,
        fullname: row.fullname,
        accesstype: row.accesstype,
        departmentid: row.departmentid,
        status: row.status,
      });
    });

    return ojtData;
  } catch (error) {
    console.log(error);
    callback(error);
  }
};

exports.showSweetAlert = (title, text, icon, buttonText) => {
  try {
    swal({
      title: title,
      text: text,
      icon: icon,
      button: buttonText,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.generateUsernameAndPasswordforOjt = (ojt) => {
  try {
    const {
      mo_name: firstname,
      mo_lastname: lastname,
      mo_id: ojtID,
      mo_birthday: birthday,
    } = ojt;

    // Generate username by combining the first name and the first letter of the last name
    const username = firstname.toLowerCase() + lastname.charAt(0).toLowerCase();

    // Generate the password by combining employee id and birthday
    const password = ojtID + birthday.replace(/-/g, "");

    return { username, password };
  } catch (error) {
    console.log(error);
  }
};

// Example of how to use the custom function:
// showSweetAlert("success", "Log in Successfully", "success", "Let's go!");
// showSweetAlert("incorrect", "Incorrect Credentials. Please try again!", "error", "AWW NO!!!");
