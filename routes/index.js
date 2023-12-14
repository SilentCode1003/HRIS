const mysql = require('./repository/hrmisdb');
//const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get('/', function (req, res, next) {
  // res.render('indexlayout', { title: 'Express' });

  Validator(req, res, 'indexlayout');
});

module.exports = router;

 //<<<<<<<<<<<<<<<load table dashboard>>>>>>>>>>>>>>>>>>>>

router.get('/load', (req, res,) => {try {
let sql = `select 
    concat(me_firstname,'',me_lastname) as l_employeeid,
    l_leavestartdate,
    l_leaveenddate,
    l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    where l_leavestatus = 'Pending'`;

    mysql.Select(sql, 'Leaves', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: 'success', data: result
      });
    });
  } catch (error) {
    console.log(error);
  }
});

router.post('/getleave', (req, res) => {
  try {
    let leaveid = req.body.leaveid;
    let sql = `select 
    concat(me_firstname,' ',me_lastname) as employeeid,
    me_email as email,
    me_gender as gender,
    me_phone as phone,
    l_leavetype as leavetype,
    l_leaveapplieddate as applieddate,
    l_leavestartdate as leavestartdate,
    l_leaveenddate as leaveenddate,
    l_leavereason as reason,
    l_leavestatus as status
    from leaves
    right join master_employee on leaves.l_employeeid = me_id
    where l_leaveid = '${leaveid}'`;

    mysql.mysqlQueryPromise(sql)
    //console.log(sql)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          msg: "success",
          data: result
        });
      } else {
        res.status(404).json({
          msg: "Department not found"
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        msg: "Error fetching department data",
        error: error
      });
    });  
  } catch (error) {
    res.json({
      msg:error
    })
    
  }
});

router.get('/loadCA', (req, res) => {
  try {
    let sql = `SELECT * FROM cash_advance`;

    mysql.Select(sql, 'Cash_Advance', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: 'success', data: result
      });
    });
  } catch (error) {
    res.json({
      msg:error
    })
    
  }
});


router.post('/getbulletin', (req, res) => {
  try {
      let bulletinid = req.body.bulletinid;
      let sql = `
          SELECT
              mb_image AS image,
              mb_tittle AS title,
              mb_description AS description
          FROM master_bulletin
          WHERE mb_bulletinid = '${bulletinid}'`;
      console.log(sql);

      mysql.mysqlQueryPromise(sql)
      //console.log(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: result
          });
        } else {
          res.status(404).json({
            msg: "Department not found"
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching department data",
          error: error
        });
      });  
    } catch (error) {
      res.json({
        msg:error
      })
      
    }
  });

  //<<<<<<<<<<<<<<<counting dashboard>>>>>>>>>>>>>>>>>>>>

  
  router.get('/countreqleavebadge', (req, res) => {
    try {
      let sql = `    
      SELECT count(*) as pending
      from leaves 
      where 
      l_leavestatus = 'Pending'`;
  
      mysql.mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length > 0) {
            res.status(200).json({
              msg: "success",
              data: {
                leavereqCount: result[0].pending
              }
            });
          } else {
            res.status(404).json({
              msg: "Data not found"
            });
          }
        })
        .catch((error) => {
          res.status(500).json({
            msg: "Error fetching employee data",
            error: error
          });
        });
    } catch (error) {
      console.log(error);
    }
  });
  
  router.get('/countcashreqbadge', (req, res) => {
    try {
      let sql = `    
      SELECT count(*) as pending
      from cash_advance 
      where 
      ca_status = 'Pending'`;
  
      mysql.mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length > 0) {
            res.status(200).json({
              msg: "success",
              data: {
                CAreqCount: result[0].pending
              }
            });
          } else {
            res.status(404).json({
              msg: "Data not found"
            });
          }
        })
        .catch((error) => {
          res.status(500).json({
            msg: "Error fetching employee data",
            error: error
          });
        });
    } catch (error) {
      console.log(error);
    }
  });

  router.get('/countactive', (req, res) => {
    try {
      let sql = `    
      SELECT 
        count(*) AS Active
        FROM 
        master_employee
        WHERE 
        me_jobstatus IN ('regular', 'probitionary')`;
  
      mysql.mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length > 0) {
            res.status(200).json({
              msg: "success",
              data: {
                activeCount: result[0].Active
              }
            });
          } else {
            res.status(404).json({
              msg: "Data not found"
            });
          }
        })
        .catch((error) => {
          res.status(500).json({
            msg: "Error fetching employee data",
            error: error
          });
        });
    } catch (error) {
      console.log(error);
    }
  });
  

  router.get('/countresigned', (req, res,) => {
    try {
      let sql = `    
      SELECT 
      COUNT(*) AS Resigned
      FROM 
      master_resigned
      WHERE 
      mr_status = 'resigned';`;
  
  
      mysql.mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              resignedCount: result[0].Resigned
            }
          });
        } else {
          res.status(404).json({
            msg: "Department not found"
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching department data",
          error: error
        });
      });  
    } catch (error) {
      console.log(error);
    }
  });

router.get('/countprobitionary', (req, res,) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS Probitionary
    FROM 
    master_employee
    WHERE 
    me_jobstatus = 'probitionary'`;


    mysql.mysqlQueryPromise(sql)
    //console.log(sql)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          msg: "success",
          data: {
            probitionaryCount: result[0].Probitionary
          }
        });
      } else {
        res.status(404).json({
          msg: "Department not found"
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        msg: "Error fetching department data",
        error: error
      });
    });  
  } catch (error) {
    console.log(error);
  }
});

router.get('/countregular', (req, res,) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS Regular
    FROM 
    master_employee
    WHERE 
    me_jobstatus = 'regular'`;


    mysql.mysqlQueryPromise(sql)
    //console.log(sql)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          msg: "success",
          data: {
            regularCount: result[0].Regular
          }
        });
      } else {
        res.status(404).json({
          msg: "Department not found"
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        msg: "Error fetching department data",
        error: error
      });
    });  
  } catch (error) {
    console.log(error);
  }
});

router.get('/countadmin', (req, res,) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS Admin
    FROM 
    master_employee
    WHERE 
    me_department = '1'
    and  me_jobstatus IN ('regular', 'probitionary')`;


    mysql.mysqlQueryPromise(sql)
    //console.log(sql)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          msg: "success",
          data: {
            adminCount: result[0].Admin
          }
        });
      } else {
        res.status(404).json({
          msg: "Department not found"
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        msg: "Error fetching department data",
        error: error
      });
    });  
  } catch (error) {
    console.log(error);
  }
});

router.get('/countit', (req, res,) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS IT
    FROM 
    master_employee
    WHERE 
    me_department = '2'
    and  me_jobstatus IN ('regular', 'probitionary')`;


    mysql.mysqlQueryPromise(sql)
    //console.log(sql)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          msg: "success",
          data: {
            ITCount: result[0].IT
          }
        });
      } else {
        res.status(404).json({
          msg: "Department not found"
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        msg: "Error fetching department data",
        error: error
      });
    });  
  } catch (error) {
    console.log(error);
  }
});

router.get('/countcabling', (req, res,) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS Cabling
    FROM 
    master_employee
    WHERE 
    me_department = '3'
    and  me_jobstatus IN ('regular', 'probitionary')`;


    mysql.mysqlQueryPromise(sql)
    //console.log(sql)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          msg: "success",
          data: {
            CablingCount: result[0].Cabling
          }
        });
      } else {
        res.status(404).json({
          msg: "Department not found"
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        msg: "Error fetching department data",
        error: error
      });
    });  
  } catch (error) {
    console.log(error);
  }
});


router.get('/getbday', (req, res) => {
  try {
    let sql = ` 
    SELECT 
    me_profile_pic as profilePicturePath,
    CONCAT(me_firstname, ' ', me_lastname) AS firstname,
    DATE_FORMAT(me_birthday, '%M %e') AS birthday
    FROM 
    master_employee
    WHERE 
    MONTH(me_birthday) = MONTH(CURRENT_DATE)
    ORDER BY 
    me_birthday;`;

    mysql.mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: result
          });
        } else {
          res.status(404).json({
            msg: "Data not found"
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error
        });
      });
  } catch (error) {
    console.log(error);
  }
});


router.get("/totaladmin", (req, res) => {
  try {
   let sql = `SELECT
   me_profile_pic AS profilePicturePath,
   me_id AS newEmployeeId,
   CONCAT(me_firstname, ' ', me_lastname) AS firstname,
   me_phone AS phone,
   me_email AS email,
   mp_positionname AS position,
   CONCAT(
       TIMESTAMPDIFF(YEAR, me_hiredate, CURDATE()),
       ' years ',
       TIMESTAMPDIFF(MONTH, me_hiredate, CURDATE()) % 12,
       ' months ',
       DATEDIFF(CURDATE(), me_hiredate) % 30,
       ' days'
   ) AS tenure
FROM
   master_employee
LEFT JOIN
   master_position ON master_employee.me_position = mp_positionid
WHERE
   me_department = '1'
   and  me_jobstatus IN ('regular', 'probitionary');`;
  
  mysql.mysqlQueryPromise(sql)
  .then((result) => {
    res.json({
      msg:"success",
      data: result,
    })
  }).catch((error) => {
    res.json({
      msg:"error",
      error,
    });
  });

  } catch (error) {
    res.json({
      msg:"error",
      error,
    });
    
  }
});

router.get("/totalIT", (req, res) => {
  try {
   let sql = `SELECT
   me_profile_pic AS profilePicturePath,
   me_id AS newEmployeeId,
   CONCAT(me_firstname, ' ', me_lastname) AS firstname,
   me_phone AS phone,
   me_email AS email,
   mp_positionname AS position,
   CONCAT(
       TIMESTAMPDIFF(YEAR, me_hiredate, CURDATE()),
       ' years ',
       TIMESTAMPDIFF(MONTH, me_hiredate, CURDATE()) % 12,
       ' months ',
       DATEDIFF(CURDATE(), me_hiredate) % 30,
       ' days'
   ) AS tenure
FROM
   master_employee
LEFT JOIN
   master_position ON master_employee.me_position = mp_positionid
WHERE
   me_department = '2'
   and  me_jobstatus IN ('regular', 'probitionary');`;
  
  mysql.mysqlQueryPromise(sql)
  .then((result) => {
    res.json({
      msg:"success",
      data: result,
    })
  }).catch((error) => {
    res.json({
      msg:"error",
      error,
    });
  });

  } catch (error) {
    res.json({
      msg:"error",
      error,
    });
    
  }
});


router.get("/totalcabling", (req, res) => {
  try {
   let sql = `SELECT
   me_profile_pic AS profilePicturePath,
   me_id AS newEmployeeId,
   CONCAT(me_firstname, ' ', me_lastname) AS firstname,
   me_phone AS phone,
   me_email AS email,
   mp_positionname AS position,
   CONCAT(
       TIMESTAMPDIFF(YEAR, me_hiredate, CURDATE()),
       ' years ',
       TIMESTAMPDIFF(MONTH, me_hiredate, CURDATE()) % 12,
       ' months ',
       DATEDIFF(CURDATE(), me_hiredate) % 30,
       ' days'
   ) AS tenure
FROM
   master_employee
LEFT JOIN
   master_position ON master_employee.me_position = mp_positionid
WHERE
   me_department = '3'
   and  me_jobstatus IN ('regular', 'probitionary');`;
  
  mysql.mysqlQueryPromise(sql)
  .then((result) => {
    res.json({
      msg:"success",
      data: result,
    })
  }).catch((error) => {
    res.json({
      msg:"error",
      error,
    });
  });

  } catch (error) {
    res.json({
      msg:"error",
      error,
    });
    
  }
});