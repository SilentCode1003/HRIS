const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('employeeprofilelayout', { title: 'Express' });

  Validator(req, res, 'empbackgroundlayout');
});

module.exports = router;


router.get('/load' , (req, res) => {
  try {
    let sql = `SELECT
    meb_id,
    CONCAT(me_lastname, ' ', me_firstname) AS meb_employeeid,
    meb_type,
    meb_attainment,
    meb_tittle,
    meb_status,
    meb_start,
    meb_end
    FROM
    master_employee_background 
    INNER JOIN
    master_employee  ON meb_employeeid = me_id`;

    mysql.Select(sql , "Master_Employee_Background", (err, result) => {
      if (err) console.error("Error :" , err);

      console.log(result);

      res.json({
        msg:'success',
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});


router.post('/save', (req, res) => {
  try {
      let employeeName = req.body.employeeName;
      let initialDataEducation = JSON.parse(req.body.initialDataEducation);
      let initialDataExperience = JSON.parse(req.body.initialDataExperience);
      let educationData = JSON.parse(req.body.educationData); 
      let experienceData = JSON.parse(req.body.experienceData);
      
      
      let employeeRecords = [];

      if (initialDataExperience && Object.values(initialDataExperience).every(val => val !== null)) {
        employeeRecords.push([
          employeeName,
          "Work Background",
          initialDataExperience.workAttainment || "No Experience",
          initialDataExperience.companyName || "No Experience",
          initialDataExperience.workTittle || "No Experience",
          initialDataExperience.workStartYear || "No Experience",
          initialDataExperience.workEndYear || "No Experience"
        ]);
      } else {
        employeeRecords.push([
          employeeName,
          "Work Background",
          "No Experience",
          "No Experience",
          "No Experience",
          "No Experience",
          "No Experience"
        ]);
      }

      if (initialDataEducation && Object.values(initialDataEducation).every(val => val !== null)) {
        employeeRecords.push([
          employeeName,
          "Educational Background",
          initialDataEducation.schoolAttainment || "No Education",
          initialDataEducation.schoolName || "No Education",
          initialDataEducation.schoolAchievements || "No Education",
          initialDataEducation.schoolStartYear || "No Education",
          initialDataEducation.schoolEndYear || "No Education"
        ]);
      } else {
        employeeRecords.push([
          employeeName,
          "Educational Background",
          "No Education",
          "No Education",
          "No Education",
          "No Education",
          "No Education"
        ]);
      }
      

      for (let education of educationData) {
        if (education.schoolName && education.schoolAttainment && education.schoolAchievements && education.schoolStartYear && education.schoolEndYear) {
            employeeRecords.push([
                employeeName,
                "Educational Background",
                education.schoolAttainment,
                education.schoolName,
                education.schoolAchievements,
                education.schoolStartYear,
                education.schoolEndYear,
            ]);
        }
    }
    

      for (let experience of experienceData) {
          if (experience.companyName && experience.workAttainment && experience.workTittle && experience.workStartYear && experience.workEndYear) {
              employeeRecords.push([
                  employeeName,
                  "Work Background",
                  experience.workAttainment,
                  experience.companyName,
                  experience.workTittle,
                  experience.workStartYear,
                  experience.workEndYear,
              ]);
          }
      }

      if (employeeRecords.length === 0) {
          res.json({ msg: 'no valid data to insert' });
          return;
      }

      mysql.InsertTable("master_employee_background", employeeRecords, (err, result) => {
          if (err) {
              console.error('Error inserting records: ', err);
              res.json({ msg: 'insert failed' });
          } else {
              console.log(result);
              res.json({ msg: 'success' });
          }
      });
  } catch (error) {
      res.json({
          msg: 'error',
          data: error,
      });
  }
});


router.post('/getbackground' , (req, res) => {
  try {
    let backgroundid = req.body.backgroundid;
    let sql = `SELECT
    meb_id,
  	meb_employeeid,
    meb_type,
    meb_attainment,
    meb_tittle,
    meb_status,
    meb_start,
    meb_end
    FROM
    master_employee_background 
    INNER JOIN
    master_employee  ON meb_employeeid = me_id
    where meb_id = '${backgroundid}'`;

    mysql.Select(sql , "Master_Employee_Background", (err, result) => {
      if (err) console.error("Error :" , err);

      console.log(result);

      res.json({
        msg:'success',
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});


router.post('/update', (req, res) => {
  try {
    let backgroundid = req.body.backgroundid;
    let backstatus = req.body.backstatus;
    let tittle = req.body.tittle;
    let attainment = req.body.attainment;
    let start = req.body.start;
    let end = req.body.end;

    let sql = `UPDATE master_employee_background SET 
    meb_status = '${backstatus}',
    meb_tittle = '${tittle}',
    meb_attainment = '${attainment}',
    meb_start = '${start}',
    meb_end = '${end}'
    WHERE meb_id = '${backgroundid}'`;

    mysql.Update(sql)
      .then((result) =>{
        console.log(result);
    
        res.json({
          msg: 'success'
        })
      })
      .catch((error) =>{
        res.json({
          msg:error
        })
        
      });
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});




