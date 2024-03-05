var roleacess = [
  {
    role: "Admin",
    routes: [
      {
        layout: "otherdeductionsIDlayout",
      },
      {
        layout: "otherdeductionslayout",
      },
      {
        layout: "appsdetailslayout",
      },
      {
        layout: "otapprovallayout",
      },
      {
        layout: "attendanceojtlayout",
      },
      {
        layout: "settingslayout",
      },
      {
        layout: "indexlayout",
      },
      {
        layout: "accesslayout",
      },
      {
        layout: "allleavelayout",
      },
      {
        layout: "announcementlayout",
      },
      {
        layout: "approvedleavelayout",
      },
      {
        layout: "attendancelayout",
      },
      {
        layout: "departmentlayout",
      },
      {
        layout: "disciplinarylayout",
      },
      {
        layout: "disciplinaryactionlayout",
      },
      {
        layout: "employeelayout",
      },
      {
        layout: "govermentidlayout",
      },
      {
        layout: "healthrecordlayout",
      },
      {
        layout: "holidaylayout",
      },
      {
        layout: "holidayratelayout",
      },
      {
        layout: "offenseslayout",
      },
      {
        layout: "ojtlayout",
      },
      {
        layout: "pendingleavelayout",
      },
      {
        layout: "performancelayout",
      },
      {
        layout: "positionlayout",
      },
      {
        layout: "rejectedleavelayout",
      },
      {
        layout: "requestcashadvancelayout",
      },
      {
        layout: "resignedlayout",
      },
      {
        layout: "salarylayout",
      },
      {
        layout: "shiftlayout",
      },
      {
        layout: "trainingslayout",
      },
      {
        layout: "userslayout",
      },
      {
        layout: "violationlayout",
      },
      {
        layout: "deductionlayout",
      },
      {
        layout: "candidatelayout",
      },
      {
        layout: "loanlayout",
      },
      {
        layout: "paymentlayout",
      },
      {
        layout: "interestlayout",
      },
      {
        layout: "depositlayout",
      },
      {
        layout: "memberlayout",
      },
      {
        layout: "ojtuserlayout",
      },
      {
        layout: "geofencesettingslayout",
      },
      {
        layout: "salaryhistorylayout",
      },
      {
        layout: "timelogslayout",
      },
      {
        layout: "generatepayrolllayout",
      },
      {
        layout: "paysliplayout",
      },
      {
        layout: "apprenticelayout",
      },
    ],
  },
  {
    role: "Employee",
    routes: [
      {
        layout: "eportalsettingslayout",
      },
      {
        layout: "eportalindexlayout",
      },
      {
        layout: "eportalattendancelayout",
      },
      {
        layout: "eportalcashadvancelayout",
      },
      {
        layout: "eportalcooplayout",
      },
      {
        layout: "eportaldisciplinaryactionlayout",
      },
      {
        layout: "eportalpaysliplayout",
      },
      {
        layout: "eportalrequestleavelayout",
      },
      {
        layout: "eportalprofilelayout",
      },
      {
        layout: "eportalsalarylayout",
      },
    ],
  },
  {
    role: "OJT",
    routes: [
      {
        layout: "ojtindexlayout",
      },
      {
        layout: "ojtattendancelayout",
      },
      {
        layout: "ojtreqabsentlayout",
      },
      {
        layout: "ojtprofilelayout",
      },
    ],
  },
  {
    role: "HR",
    routes: [
      {
        layout: "settingslayout",
      },
      {
        layout: "indexlayout",
      },
      {
        layout: "allleavelayout",
      },
      {
        layout: "announcementlayout",
      },
      {
        layout: "approvedleavelayout",
      },
      {
        layout: "attendancelayout",
      },
      {
        layout: "disciplinarylayout",
      },
      {
        layout: "disciplinaryactionlayout",
      },
      {
        layout: "employeelayout",
      },
      {
        layout: "govermentidlayout",
      },
      {
        layout: "healthrecordlayout",
      },
      {
        layout: "holidaylayout",
      },
      {
        layout: "holidayratelayout",
      },
      {
        layout: "offenseslayout",
      },
      {
        layout: "ojtlayout",
      },
      {
        layout: "pendingleavelayout",
      },
      {
        layout: "performancelayout",
      },
      {
        layout: "positionlayout",
      },
      {
        layout: "rejectedleavelayout",
      },
      {
        layout: "shiftlayout",
      },
      {
        layout: "trainingslayout",
      },
      {
        layout: "violationlayout",
      },
      {
        layout: "resignedlayout",
      },
      {
        layout: "loanlayout",
      },
      {
        layout: "paymentlayout",
      },
      {
        layout: "interestlayout",
      },
      {
        layout: "depositlayout",
      },
      {
        layout: "memberlayout",
      },
    ],
  },
];

exports.Validator = function (req, res, layout) {
  // console.log(layout);

  let ismatch = false;
  let counter = 0;
  // //console.log(roleacess.length)
  if (req.session.accesstype == "Employee" && layout == "eportalindexlayout") {
    console.log("hit");
    return res.render(`${layout}`, {
      image: req.session.image,
      employeeid: req.session.employeeid,
      fullname: req.session.fullname,
      accesstype: req.session.accesstype,
      geofenceid: req.session.geofenceid,
      departmentid: req.session.departmentid,
    });
  } else {
    roleacess.forEach((key, item) => {
      counter += 1;
      var routes = key.routes;

      routes.forEach((value, index) => {
        // console.log(`${key.role} - ${value.layout}`);

        if (key.role == req.session.accesstype && value.layout == layout) {
          console.log("Role: ", req.session.accesstype, "Layout: ", layout);
          ismatch = true;

          return res.render(`${layout}`, {
            image: req.session.image,
            employeeid: req.session.employeeid,
            fullname: req.session.fullname,
            accesstype: req.session.accesstype,
            departmentid: req.session.departmentid,
            departmentname: req.session.departmentname,
            position: req.session.position,
            geofenceid: req.session.geofenceid,
          });
        }
      });

      if (counter == roleacess.length) {
        if (!ismatch) {
          res.redirect("/login");
        }
      }
    });
  }
};

exports.ValidatorforOjt = function (req, res, layout) {
  // console.log(layout);

  let ismatch = false;
  let counter = 0;
  // //console.log(roleacess.length)
  if (req.session.accesstype == "OJT" && layout == "ojtindexlayout") {
    console.log("hit");
    return res.render(`${layout}`, {
      image: req.session.image,
      ojtid: req.session.ojtid,
      fullname: req.session.fullname,
      accesstype: req.session.accesstype,
      departmentid: req.session.departmentid,
    });
  } else {
    roleacess.forEach((key, item) => {
      counter += 1;
      var routes = key.routes;

      routes.forEach((value, index) => {
        // console.log(`${key.role} - ${value.layout}`);

        if (key.role == req.session.accesstype && value.layout == layout) {
          console.log("Role: ", req.session.accesstype, "Layout: ", layout);
          ismatch = true;

          return res.render(`${layout}`, {
            image: req.session.image,
            ojtid: req.session.ojtid,
            fullname: req.session.fullname,
            accesstype: req.session.accesstype,
            department: req.session.department,
            status: req.session.status,
            geofenceid: req.session.geofenceid,
          });
        }
      });

      if (counter == roleacess.length) {
        if (!ismatch) {
          res.redirect("/ojtlogin");
        }
      }
    });
  }
};
