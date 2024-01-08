var express = require('express');
const { Encrypter } = require('./repository/crytography');
const { Select, mysqlQueryPromise } = require('./repository/hrmisdb');
const { UserLogin } = require('./helper');
var router = express.Router();
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('loginlayout', { title: 'Express' });
});

module.exports = router;

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    Encrypter(password, (err, encrypted) => {
      if (err) console.error("Error: ", err);

      console.log(encrypted);

      let sql = `SELECT 
      mu_employeeid as employeeid,
      CONCAT(me_firstname, ' ', me_lastname) as fullname,
      ma_accessname as accesstype,
      mu_status as status,
      me_profile_pic as image
      FROM master_user
      INNER JOIN master_access ON mu_accesstype = ma_accessid
      LEFT JOIN master_employee ON mu_employeeid = me_id
      WHERE mu_username ='${username}'  AND mu_password = '${encrypted}'`;

      // console.log(sql);

      mysqlQueryPromise(sql).then((result) => {
        if (result.length !== 0) {
          const user = result[0];

          if (user.status === 'Active') {
            let data = UserLogin(result);

            console.log(result);

            data.forEach((user) => {
              req.session.employeeid = user.employeeid;
              req.session.fullname = user.fullname;
              req.session.accesstype = user.accesstype;
              req.session.image = user.image
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
            msg: "incorrect",
          });
        }
      }).catch((error) => {
        return res.json({
          msg: "error",
        });
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});


router.post('/logout',(req, res) => {
  req.session.destroy((err) => {
    if(err) res.json({
      msg: err
    })
    res.json({
      msg: 'success',
    })
  })
})
