var express = require('express');
const { Encrypter } = require('./repository/crytography');
var router = express.Router();
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('loginlayout', { title: 'Express' });
});

module.exports = router;

router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    Encrypter(password, (err, encrypted) => {
      if (err) console.error("Error: ", err);

      console.log(encrypted);

      let condition = [username, encrypted];
      let statement = SelectStatement(
        `select 
        mu_employeeid as employeeid,
        concat(me_firstname,'',me_lastname) as fullname,
        mu_accesstype as accesstype
        from master_user
        inner join master_access on mu_accesstype = ma_accessid
        left join master_employee on mu_employeeid = me_id
        where mu_username = ? and mu_password = ?`,
        condition
      );

      SelectParameter(statement, condition, (err, result) => {
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
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});
// function SelectStatement(sql, params) {
//   return statement(sql, params);
// }

// function SelectParameter(statement, params, callback) {
//   statement.execute(params, callback);
// }

// function UserLogin(result) {
//   // Process the database query result to extract user data
//   return result.map((row) => ({
//     employeeid: row.employeeid,
//     fullname: row.fullname,
//     accesstype: row.accesstype,
//   }));
// }