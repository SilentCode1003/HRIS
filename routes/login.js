var express = require("express");
const { Encrypter, EncrypterString } = require("./repository/cryptography");
const mysql = require("./repository/hrmisdb");
var router = express.Router();
const nodemailer = require("nodemailer");
const { UserLogin } = require("./repository/helper");
const jwt = require("jsonwebtoken");
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("loginlayout", { title: "Express" });
});

module.exports = router;

router.post("/login", (req, res) => {
  try {
    const { username, password, accesstypeid } = req.body;

    Encrypter(password, (err, encrypted) => {
      if (err) console.error("Error: ", err);

      let sql = `SELECT 
          mu_employeeid AS employeeid,
          CONCAT(me_firstname, ' ', me_lastname) AS fullname,
          ma_accessname AS accesstype,
          mu_status AS status,
          me_profile_pic AS image,
          me_jobstatus AS jobstatus,
          md_departmentid AS departmentid,
          mu_isgeofence AS isgeofence,
          md_departmentname AS departmentname,
          mp_positionname AS position,
          ma_accessid AS accesstypeid,
          mgs_id AS geofenceid,
          (SELECT 
          GROUP_CONCAT(us_subgroupid) AS subgroupids
        FROM 
          user_subgroup
          WHERE 
          us_userid = (SELECT mu_userid 
                      FROM master_user 
                      WHERE mu_username = '${username}'
                      AND mu_password = '${encrypted}'
                      AND mu_accesstype = '${accesstypeid}')) as subgroupid
      FROM 
          master_user
      INNER JOIN 
          master_access ON mu_accesstype = ma_accessid
      LEFT JOIN 
          master_employee ON mu_employeeid = me_id
      LEFT JOIN 
          master_department ON md_departmentid = me_department
      LEFT JOIN 
          master_position ON mp_positionid = me_position
      LEFT JOIN 
          user_subgroup us ON mu_userid = us.us_userid
      LEFT JOIN master_geofence_settings ON mgs_departmentid = me_department 
      WHERE 
          mu_username = '${username}' 
          AND mu_password = '${encrypted}'
          AND mu_accesstype = '${accesstypeid}'
      GROUP BY 
          mu_employeeid,
          me_firstname,
          me_lastname,
          ma_accessname,
          mu_status,
          me_profile_pic,
          me_jobstatus,
          md_departmentid,
          mu_isgeofence,
          md_departmentname,
          mp_positionname,
          ma_accessid,
          mgs_id
      LIMIT 1`;

      mysql
        .mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length !== 0) {
            const user = result[0];

            if (
              user.jobstatus === "probitionary" ||
              user.jobstatus === "regular" ||
              user.jobstatus === "apprentice"
            ) {
              if (user.status === "Active") {
                let data = UserLogin(result);

                data.forEach((user) => {
                  req.session.jwt = EncrypterString(
                    jwt.sign(
                      JSON.stringify({
                        employeeid: user.employeeid,
                        fullname: user.fullname,
                      }),
                      process.env._SECRET_KEY
                    ),
                    {}
                  );
                  req.session.employeeid = user.employeeid;
                  req.session.fullname = user.fullname;
                  req.session.accesstype = user.accesstype;
                  req.session.image = user.image;
                  req.session.departmentid = user.departmentid;
                  req.session.isgeofence = user.isgeofence;
                  req.session.departmentname = user.departmentname;
                  req.session.position = user.position;
                  req.session.jobstatus = user.jobstatus;
                  req.session.geofenceid = user.geofenceid;
                  req.session.accesstypeid = user.accesstypeid;
                  req.session.subgroupid = user.subgroupid;
                  req.session.clientip = req.body.client_ipaddress

                  res.cookie("employeeid", user.employeeid, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "None", // Allow cross-origin
                    domain: ".5lsolutions.com", // For subdomains
                  });
                  res.cookie("employeeid", user.departmentname, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "None", // Allow cross-origin
                    domain: ".5lsolutions.com", // For subdomains
                  });
                });

                // console.log("accesstype", req.session.accesstype);
                // console.log(req.session.jwt, "JWT");
                // console.log(req.session.isgeofence, "data");

                return res.json({
                  msg: "success",
                  data: data,
                });
              } else {
                return res.json({
                  msg: "inactive",
                });
              }
            } else {
              return res.json({
                msg: "resigned",
              });
            }
          } else {
            return res.json({
              msg: "incorrect",
            });
          }
        })
        .catch((error) => {
          return res.json({
            msg: "error",
            data: error,
          });
        });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err)
      res.json({
        msg: err,
      });
    res.json({
      msg: "success",
    });
  });
});

let transporter = nodemailer.createTransport({
  host: "smtp.example.com", // Your SMTP server
  port: 587,
  secure: false, // false for TLS; true for SSL
  auth: {
    user: "your_email@example.com", // Your email
    pass: "your_email_password", // Your email password
  },
});

router.post("/forgotpass", (req, res) => {
  try {
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

//#region Reserved Login

// router.post("/login", (req, res) => {
//   try {
//     const { username, password } = req.body;

//     Encrypter(password, (err, encrypted) => {
//       if (err) console.error("Error: ", err);

//       let sql = `SELECT
//       mu_employeeid AS employeeid,
//       CONCAT(me_firstname, ' ', me_lastname) AS fullname,
//       ma_accessname AS accesstype,
//       mu_status AS status,
//       me_profile_pic AS image,
//       me_jobstatus AS jobstatus,
//       md_departmentid AS departmentid,
//       md_departmentname AS departmentname,
//       mp_positionname AS position,
//       mgs_id AS geofenceid
//       FROM master_user
//       INNER JOIN master_access ON mu_accesstype = ma_accessid
//       LEFT JOIN master_employee ON mu_employeeid = me_id
//       LEFT JOIN master_department ON md_departmentid = me_department
//       LEFT JOIN master_position ON mp_positionid = me_position
//       LEFT JOIN master_geofence_settings ON mgs_departmentid = me_department
//       WHERE mu_username = '${username}' AND mu_password = '${encrypted}'`;

//       mysql.mysqlQueryPromise(sql)
//         .then((result) => {
//           if (result.length !== 0) {
//             const user = result[0];

//             if (
//               user.jobstatus === "probitionary" ||
//               user.jobstatus === "regular" ||
//               user.jobstatus === "apprentice"
//             ) {
//               if (user.status === "Active") {
//                 let data = UserLogin(result);

//                 data.forEach((user) => {
//                   req.session.employeeid = user.employeeid;
//                   req.session.fullname = user.fullname;
//                   req.session.accesstype = user.accesstype;
//                   req.session.image = user.image;
//                   req.session.departmentid = user.departmentid;
//                   req.session.departmentname = user.departmentname;
//                   req.session.position = user.position;
//                   req.session.jobstatus = user.jobstatus;
//                   req.session.geofenceid = user.geofenceid;
//                 });

//                 let genNotifSql = `call hrmis.GetNotification('${req.session.employeeid}')`;

//                 mysql.StoredProcedure(genNotifSql, (err, result) => {
//                   if (err) {
//                     console.error("Error: ", err);
//                     return res.json({
//                       msg: 'error',
//                       data: err,
//                     });
//                   }

//                   return res.json({
//                     msg: "success",
//                     data: data,
//                     notification: result,
//                   });
//                 });
//               } else {
//                 return res.json({
//                   msg: "inactive",
//                 });
//               }
//             } else {
//               return res.json({
//                 msg: "resigned",
//               });
//             }
//           } else {
//             return res.json({
//               msg: "incorrect",
//             });
//           }
//         })
//         .catch((error) => {
//           return res.json({
//             msg: "error",
//             data: error,
//           });
//         });
//     });
//   } catch (error) {
//     res.json({
//       msg: error,
//     });
//   }
// });

//#endregion
