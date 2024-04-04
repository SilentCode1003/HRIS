var express = require("express");
const { Encrypter } = require("./repository/crytography");
const mysql = require("./repository/hrmisdb");
const { UserLogin } = require("./helper");
var router = express.Router();
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("loginlayout", { title: "Express" });
});

module.exports = router;

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

router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

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
        md_departmentname AS departmentname,
        mp_positionname AS position,
        mgs_id AS geofenceid
        FROM master_user
        INNER JOIN master_access ON mu_accesstype = ma_accessid
        LEFT JOIN master_employee ON mu_employeeid = me_id
        LEFT JOIN master_department ON md_departmentid = me_department
        LEFT JOIN master_position ON mp_positionid = me_position
        LEFT JOIN master_geofence_settings ON mgs_departmentid = me_department 
        WHERE mu_username = '${username}' AND mu_password = '${encrypted}'`;

      mysql.mysqlQueryPromise(sql)
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
                  req.session.employeeid = user.employeeid;
                  req.session.fullname = user.fullname;
                  req.session.accesstype = user.accesstype;
                  req.session.image = user.image;
                  req.session.departmentid = user.departmentid;
                  req.session.departmentname = user.departmentname;
                  req.session.position = user.position;
                  req.session.jobstatus = user.jobstatus;
                  req.session.geofenceid = user.geofenceid;
                });
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
