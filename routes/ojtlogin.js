var express = require("express");
const { Encrypter, EncrypterString } = require("./repository/cryptography");
const mysql = require("./repository/hrmisdb");
const { error } = require("jquery");
const { OjtLogin } = require("./repository/helper");
const jwt = require("jsonwebtoken");
var router = express.Router();
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("ojtloginlayout", { title: "Express" });
});

module.exports = router;

router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    Encrypter(password, (err, encrypted) => {
      if (err) console.error("Error: ", err);

      let sql = `
      select 
mo_id as ojtid,
concat(mo_lastname,' ',mo_name) as fullname,
ma_accessname as accesstype,
mo_status as status,
mo_image as image,
mo_department as departmentid
from ojt_user
inner join master_access on ou_accesstype = ma_accessid
left join master_ojt on ou_ojtid = mo_id
left join master_department on md_departmentid = mo_department
where ou_username = '${username}' and ou_password = '${encrypted}'`;

      mysql
        .mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length !== 0) {
            const user = result[0];

            if (user.status === "Active") {
              let data = OjtLogin(result);

              data.forEach((user) => {
                req.session.image = user.image;
                req.session.ojtid = user.ojtid;
                req.session.fullname = user.fullname;
                req.session.accesstype = user.accesstype;
                req.session.departmentid = user.departmentid;
                req.session.status = user.status;

                req.session.jwt = EncrypterString(
                  jwt.sign(
                    JSON.stringify({
                      employeeid: user.ojtid,
                      fullname: user.fullname,
                    }),
                    process.env._SECRET_KEY
                  ),
                  {}
                );

                res.cookie(
                  "token",
                  EncrypterString(
                    jwt.sign(
                      JSON.stringify({
                        employeeid: user.ojtid,
                        fullname: user.fullname,
                      }),
                      process.env._SECRET_KEY
                    ),
                    {}
                  ),
                  {
                    secure: true,
                    sameSite: "None", // Allow cross-origin
                    domain: ".5lsolutions.com", // For subdomains
                  }
                );
              });

              return res.json({
                msg: "success",
                data: data,
              });
            } else {
              return res.json({
                msg: "inactive",
                data: result,
              });
            }
          } else {
            return res.json({
              msg: "incorrect",
            });
          }
        })
        .catch((error) => {
          res.json({
            msg: error,
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
