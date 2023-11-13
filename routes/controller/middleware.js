var roleacess = [
  {
    role: "Admin",
    routes: [
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
    ],
  },
  {
    role: "Employee",
    routes: [
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
    role: "HR",
    routes: [
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
    ],
  },
];

exports.Validator = function (req, res, layout) {
  console.log(layout);
  //console.log(roleacess.length);

  if (req.session.accesstype == "Employee" && layout == "eportalindexlayout") {
    console.log('hit');
      return res.render(`${layout}`, {
        employeeid: req.session.employeeid,
        fullname: req.session.fullname,
        accesstype: req.session.accesstype,
      });
    
  } else {
    roleacess.forEach((key, item) => {
      var routes = key.routes;

      routes.forEach((value, index) => {
        console.log(`${key.role} - ${value.layout}`);

        if (key.role == req.session.accesstype && value.layout == layout) {
          return res.render(`${layout}`, {
            employeeid: req.session.employeeid,
            fullname: req.session.fullname,
            accesstype: req.session.accesstype,
          });
        }
      });
    });

    res.redirect("/login");
  }
};
