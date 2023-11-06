var roleacess = [
    {
      role: "Administartor",
      routes: [
        {
          layout: "dashboard",
        },
        {
          layout: "allleave",
        },
        {
          layout: "announcement",
        },
        {
          layout: "approvedleave",
        },
        {
          layout: "attendance",
        },
        {
          layout: "department",
        },
        {
          layout: "disciplinary",
        },
        {
          layout: "disciplinaryaction",
        },
        {
          layout: "employee",
        },
        {
          layout: "governmentid",
        },
        {
          layout: "healthrecord",
        },
        {
          layout: "holiday",
        },
        {
          layout: "holidayrate",
        },
        {
          layout: "index",
        },
        {
          layout: "offenses",
        },
        {
          layout: "ojt",
        },
        {
          layout: "pendingleave",
        },
        {
          layout: "performance",
        },
        {
          layout: "position",
        },
        {
            layout: "rejectedleave",
          },
          {
            layout: "shift",
          },
          {
            layout: "trainings",
          },
          {
            layout: "users",
          },
          {
            layout: "violation",
          },
      ],
    },
    {
      role: "Employee",
      routes: [
        {
          layout: "employeedashboard",
        },
        {
          layout: "eportalcashadvance",
        },
        {
          layout: "eportaldisciplinaryaction",
        },
        {
          layout: "eprotalindex",
        },
        {
          layout: "eportalpayslip",
        },
        {
          layout: "eportalrequestleave",
        },
        {
          layout: "eportalprofile",
        },
        {
          layout: "eportalsalary",
        },
      ],
    },
  ];
  
  exports.Validator = function (req, res, layout) {
    console.log(layout);
    console.log(roleacess.length);
  
    if (req.session.accesstype == "User" && layout == "index") {
      return res.redirect("/dashboard");
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
  