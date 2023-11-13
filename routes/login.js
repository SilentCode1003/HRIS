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

      let sql = `select 
      mu_employeeid as employeeid,
      concat(me_firstname,'',me_lastname) as fullname,
      ma_accessname as accesstype
      from master_user
      inner join master_access on mu_accesstype = ma_accessid
      left join master_employee on mu_employeeid = me_id
        where mu_username ='${username}'  and mu_password = '${encrypted}'`;

      console.log(sql);

      mysqlQueryPromise(sql).then((result) => {
        if (err) console.error("Error: ", err);
        if (result.length != 0) {
          let data = UserLogin(result);

          console.log(result);

          //<%= fullname%>
          data.forEach((user) => {
            req.session.employeeid = user.employeeid;
            req.session.fullname = user.fullname;
            req.session.accesstype = user.accesstype;
          });

          return res.json({
            msg: "success",
            data: data,
          });
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
