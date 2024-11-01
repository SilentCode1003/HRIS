var express = require("express");
var router = express.Router();
const mysql = require("./repository/hrmisdb");
const moment = require("moment");
const multer = require("multer");
const XLSX = require("xlsx");
const { Validator } = require("./controller/middleware");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  JsonSuccess,
  MessageStatus,
} = require("./repository/response");
const { Select, Update, InsertTable } = require("./repository/dbconnect");
const { GetValue, ACT, INACT } = require("./repository/dictionary");
const {
  GetCurrentDatetime,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { generateUsernamefoApplicant } = require("./repository/helper");
const { DataModeling, RawData } = require("./model/hrmisdb");
const applicantcurrentYear = moment().format("YYYY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("applicant_registration", { title: "Express" });
  // Validator(req, res, "applicant_registrationlayout", "applicant_registration");
});

module.exports = router;

//#region SAVING DATA

router.post("/register_personal", async (req, res) => {
  console.log("hit");
  try {
    const {
      firstName,
      lastName,
      middleName,
      nickName,
      presentAddress,
      provincialAddress,
      presentPhoneNumber,
      provincialPhoneNumber,
      gender,
      civilStatus,
      age,
      dateOfBirth,
      placeOfBirth,
      citizenship,
      height,
      weight,
      physicalLimitations,
      sss,
      tin,
      language,
      isRelated,
      isRelatedYes,
      isApplied,
      isAppliedYes,
      isCharged,
      isChargedYes,
      isIllness,
      isDrive,
      isDriveYes,
      isLicense,
      specialSkills,
      hobbies,
      positionPreferred,
      salary,
      dateAvailable,
      isAccept,
      isAcceptNo,
      isDischarged,
      relative,
      deptReferences,
      recommendedBy,
      referredTo,
      personEmergency,
      relationship,
      emergencyAddress,
      emergencyPhoneNumber,
    } = req.body;

    console.log(req.body);
    console.log(firstName, "firstname");
    console.log(lastName, "lastname");

    const applicantExists = await checkApplicantExists(
      firstName,
      lastName,
      middleName
    );

    if (applicantExists) {
      return res.json({ msg: "exist" });
    }

    const applicantcurrentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const applicantId = await generateApplicantId(
      applicantcurrentYear,
      currentMonth
    );

    const { username } = generateUsernamefoApplicant({
      map_nickname: nickName,
      map_applicantid: applicantId,
    });

    const sql = InsertStatement("master_applicant_personal", "map", [
      "applicantid",
      "firstname",
      "lastname",
      "middlename",
      "nickname",
      "address",
      "provincial_address",
      "phone_no",
      "provincial_phone_address",
      "gender",
      "civil_status",
      "age",
      "birthday",
      "birthplace",
      "citizenship",
      "height",
      "weight",
      "physical_limit",
      "sss_no",
      "tin_no",
      "language",
      "isrelated",
      "related_emp",
      "isApplied",
      "isAppliedYes",
      "isCharged",
      "isChargedYes",
      "isIllness",
      "isDrive",
      "isDriveYes",
      "isLicense",
      "specialSkills",
      "hobbies",
      "positionPreferred",
      "salary",
      "dateAvailable",
      "isAccept",
      "isAcceptNo",
      "isDischarged",
      "relative",
      "deptReferences",
      "recommendedBy",
      "referredTo",
      "personEmergency",
      "relationship",
      "emergencyAddress",
      "emergencyPhoneNumber",
    ]);

    const data = [
      [
        applicantId,
        firstName,
        lastName,
        middleName,
        nickName,
        presentAddress,
        provincialAddress,
        presentPhoneNumber,
        provincialPhoneNumber,
        gender,
        civilStatus,
        age,
        dateOfBirth,
        placeOfBirth,
        citizenship,
        height,
        weight,
        physicalLimitations,
        sss,
        tin,
        language,
        isRelated,
        isRelatedYes,
        isApplied,
        isAppliedYes,
        isCharged,
        isChargedYes,
        isIllness,
        isDrive,
        isDriveYes,
        isLicense,
        specialSkills,
        hobbies,
        positionPreferred,
        salary,
        dateAvailable,
        isAccept,
        isAcceptNo,
        isDischarged,
        relative,
        deptReferences,
        recommendedBy,
        referredTo,
        personEmergency,
        relationship,
        emergencyAddress,
        emergencyPhoneNumber,
      ],
    ];

    console.log(data, "data");

    const checkStatement = SelectStatement(
      "SELECT * FROM master_applicant_personal WHERE map_firstname=? AND map_lastname=? AND map_middlename=?",
      [firstName, lastName, middleName]
    );

    const checkResult = await Check(checkStatement);

    if (checkResult.length !== 0) {
      return res.json(JsonWarningResponse(MessageStatus.EXIST));
    }

    await new Promise((resolve, reject) => {
      InsertTable(sql, data, async (err, result) => {
        if (err) {
          console.log(err);
          return reject(err);
        }

        try {
          const saveUserRecordResult = await saveUserRecord(
            req,
            res,
            applicantId,
            username
          );
          if (saveUserRecordResult.error) {
            return reject(saveUserRecordResult);
          }
          resolve(saveUserRecordResult);
        } catch (saveError) {
          console.log(saveError);
          reject(saveError);
        }
      });
    });
    res.json({ success: true, applicantId });
    //res.json(JsonSuccess(applicantId));
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/register_education", (req, res) => {
  try {
    const {
      applicantId,
      exam,
      list,
      secondList,
      thirdList,
      fourthList,
      fifthList,
      ...educationLevels
    } = req.body;

    console.log(req.body, "req.body");

    const educationPromises = [];
    const seminarPromises = [];
    const examPromises = [];

    for (const [attainment, details] of Object.entries(educationLevels)) {
      if (!details) continue;

      const {
        name: school_name,
        dateFrom: school_start_date,
        dateTo: school_end_date,
        graduated: isgraduated,
        highestLevel: highest_level,
      } = details;

      let sql = InsertStatement("applicant_education", "ae", [
        "applicantid",
        "attainment",
        "schoolname",
        "start",
        "end",
        "isgraduate",
        "highest_level",
      ]);

      let data = [
        [
          applicantId,
          attainment,
          school_name,
          school_start_date,
          school_end_date,
          isgraduated,
          highest_level,
        ],
      ];

      let checkStatement = SelectStatement(
        "select * from applicant_education where ae_applicantid=? and ae_attainment=? and ae_schoolname=?",
        [applicantId, attainment, school_name]
      );

      const promise = Check(checkStatement)
        .then((result) => {
          if (result.length != 0) {
            return Promise.resolve(JsonWarningResponse(MessageStatus.EXIST));
          } else {
            return new Promise((resolve, reject) => {
              InsertTable(sql, data, (err, result) => {
                if (err) {
                  return reject(JsonErrorResponse(err));
                }
                resolve(JsonSuccess());
              });
            });
          }
        })
        .catch((error) => JsonErrorResponse(error));

      educationPromises.push(promise);
    }
    const seminarList = [list, secondList, thirdList, fourthList, fifthList];
    seminarList.forEach((seminar, index) => {
      if (!seminar) return;

      const { listName: as_seminar_name, listDate: as_seminar_date } = seminar;

      let sql = InsertStatement("applicant_seminar", "as", [
        "applicantid",
        "seminar_name",
        "seminar_date",
      ]);

      let data = [[applicantId, as_seminar_name, as_seminar_date]];

      seminarPromises.push(
        new Promise((resolve, reject) => {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              return reject(JsonErrorResponse(err));
            }
            resolve(JsonSuccess());
          });
        })
      );
    });

    if (exam) {
      const {
        typeOfExamination: aoe_examname,
        dateExam: aoe_exam_date,
        placeTaken: aoe_placetaken,
      } = exam;

      let sql = InsertStatement("applicant_other_exam", "aoe", [
        "applicantid",
        "examname",
        "exam_date",
        "placetaken",
      ]);

      let data = [[applicantId, aoe_examname, aoe_exam_date, aoe_placetaken]];

      examPromises.push(
        new Promise((resolve, reject) => {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              return reject(JsonErrorResponse(err));
            }
            resolve(JsonSuccess());
          });
        })
      );
    }

    Promise.all([...educationPromises, ...seminarPromises, ...examPromises])
      .then((results) => {
        res.json(results);
      })
      .catch((error) => {
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/register_career", (req, res) => {
  try {
    const {
      applicantId,
      seminars,
      secondSeminars,
      thirdSeminars,
      fourthSeminars,
      fifthSeminars,
      ...careerData
    } = req.body;

    console.log("Request Body:", req.body);

    const careerPromises = [];
    const seminarPromises = [];

    const employerLevels = [
      "present",
      "second",
      "third",
      "fourth",
      "fifth",
      "sixth",
    ];

    for (const level of employerLevels) {
      if (!careerData[level]) continue;

      const {
        name: carrer_employer,
        dateFrom: career_start_date,
        dateTo: career_end_date,
        position: carrer_position,
        reason: carrer_reason,
        natureEmployer: career_supervisor,
      } = careerData[level];

      console.log(`Processing ${level} - Employer: ${carrer_employer}`);

      let sql = InsertStatement("applicant_career", "ac", [
        "applicantid",
        "employer",
        "start",
        "end",
        "position",
        "supervisor",
        "reason",
      ]);

      console.log(`SQL Statement for ${level}:`, sql);

      let data = [
        [
          applicantId,
          carrer_employer,
          career_start_date,
          career_end_date,
          carrer_position,
          career_supervisor,
          carrer_reason,
        ],
      ];

      console.log(`Data for ${level}:`, data);

      let checkStatement = SelectStatement(
        "select * from applicant_career where ac_applicantid=? and ac_employer=? and ac_position=?",
        [applicantId, carrer_employer, carrer_position]
      );

      console.log(`Check Statement for ${level}:`, checkStatement);

      const promise = Check(checkStatement)
        .then((result) => {
          console.log(`Check Result for ${level}:`, result);

          if (result.length != 0) {
            console.log(`Entry already exists for ${level}`);
            return Promise.resolve(JsonWarningResponse(MessageStatus.EXIST));
          } else {
            return new Promise((resolve, reject) => {
              InsertTable(sql, data, (err, result) => {
                if (err) {
                  console.log(`Error inserting ${level}:`, err);
                  return reject(JsonErrorResponse(err));
                }
                console.log(`Successfully inserted ${level}`);
                resolve(JsonSuccess());
              });
            });
          }
        })
        .catch((error) => {
          console.log(`Error checking ${level}:`, error);
          return JsonErrorResponse(error);
        });

      careerPromises.push(promise);
    }

    const seminarList = [
      seminars,
      secondSeminars,
      thirdSeminars,
      fourthSeminars,
      fifthSeminars,
    ];
    seminarList.forEach((seminar, index) => {
      if (!seminar) return;

      const { seminarName: as_seminar_name, dateSeminar: as_seminar_date } =
        seminar;

      let sql = InsertStatement("applicant_seminar", "as", [
        "applicantid",
        "seminar_name",
        "seminar_date",
      ]);

      console.log(`SQL Statement for seminar ${index + 1}:`, sql);

      let data = [[applicantId, as_seminar_name, as_seminar_date]];

      seminarPromises.push(
        new Promise((resolve, reject) => {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(`Error inserting seminar ${index + 1}:`, err);
              return reject(JsonErrorResponse(err));
            }
            console.log(`Successfully inserted seminar ${index + 1}`);
            resolve(JsonSuccess());
          });
        })
      );
    });

    Promise.all([...careerPromises, ...seminarPromises])
      .then((results) => {
        res.json(results);
      })
      .catch((error) => {
        console.log(`Error in Promise.all:`, error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(`Catch block error:`, error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/register_seminar", (req, res) => {
  try {
    const { applicantId, seminar_name, seminar_date } = req.body;

    let sql = InsertStatement("applicant_seminar", "as", [
      "applicantid",
      "seminar_name",
      "seminar_date",
    ]);
    let data = [[applicantId, seminar_name, seminar_date]];
    let checkStatement = SelectStatement(
      "select * from applicant_seminar where as_applicantid=? and as_seminar_name=? and as_seminar_date=?",
      [applicantId, seminar_name, seminar_date]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              res.json(JsonErrorResponse(err));
            }

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(err);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/register_family", (req, res) => {
  try {
    const { applicantId, mother, siblings, spouse, children } = req.body;

    const familyMembers = [
      { ...mother, relation: "mother" },
      { ...siblings, relation: "siblings" },
      { ...spouse, relation: "spouse" },
      { ...children, relation: "children" },
    ];

    let sql = InsertStatement("applicant_family", "af", [
      "applicantid",
      "name",
      "relation",
      "age",
      "occupation",
      "company_position",
      "birthday",
    ]);

    const promises = familyMembers.map((member) => {
      const {
        name,
        age,
        birthdate: birthday,
        occupation,
        company: company_position,
        relation,
      } = member;

      let data = [
        [
          applicantId,
          name,
          relation,
          age,
          occupation,
          company_position,
          birthday,
        ],
      ];

      let checkStatement = SelectStatement(
        "select * from applicant_family where af_applicantid=? and af_name=? and af_relation=?",
        [applicantId, name, relation]
      );

      return Check(checkStatement)
        .then((result) => {
          if (result.length != 0) {
            return JsonWarningResponse(MessageStatus.EXIST);
          } else {
            return new Promise((resolve, reject) => {
              InsertTable(sql, data, (err, result) => {
                if (err) {
                  return reject(JsonErrorResponse(err));
                }
                resolve(JsonSuccess());
              });
            });
          }
        })
        .catch((error) => {
          return JsonErrorResponse(error);
        });
    });

    Promise.all(promises)
      .then((results) => {
        res.json(results);
      })
      .catch((error) => {
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/register_reference", (req, res) => {
  try {
    const { applicantId, references } = req.body;

    const {
      name: reference_name,
      occupation: reference_occupation,
      address: reference_complete_address,
      telephone: reference_contact_no,
    } = references;

    let sql = InsertStatement("applicant_references", "ar", [
      "applicantid",
      "references_name",
      "occupation",
      "complete_address",
      "contact_no",
    ]);

    let data = [
      [
        applicantId,
        reference_name,
        reference_occupation,
        reference_complete_address,
        reference_contact_no,
      ],
    ];

    let checkStatement = SelectStatement(
      "select * from applicant_references where ar_applicantid=? and ar_references_name=? and ar_occupation=?",
      [applicantId, reference_name, reference_occupation]
    );

    Check(checkStatement)
      .then((result) => {
        if (result.length != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              return res.json(JsonErrorResponse(err));
            }
            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

//#endregion

//#region UPDATE DATA

// router.post("/viewdata", (req, res) => {
//   try {
//     let applicant_id = req.body.applicantId;

//     console.log(req.body.applicantId);
    
//     let sql = `
//       SELECT 
//         -- Master Applicant Personal
//         map.map_applicantid AS map_applicantid,
//         map.map_firstname AS map_firstname,
//         map.map_lastname AS map_lastname,
//         map.map_middlename AS map_middlename,
//         map.map_nickname AS map_nickname,
//         map.map_phone_no AS map_phone_no,
//         map.map_address AS map_address,
//         map.map_provincial_address AS map_provincial_address,
//         map.map_provincial_phone_address AS map_provincial_phone_address,
//         map.map_gender AS map_gender,
//         map.map_civil_status AS map_civil_status,
//         map.map_age AS map_age,
//         DATE_FORMAT(map.map_birthday, '%Y-%m-%d') AS map_birthday,
//         map.map_birthplace AS map_birthplace,
//         map.map_citizenship AS map_citizenship,
//         map.map_height AS map_height,
//         map.map_weight AS map_weight,
//         map.map_physical_limit AS map_physical_limit,
//         map.map_sss_no AS map_sss_no,
//         map.map_tin_no AS map_tin_no,
//         map.map_language AS map_language,
//         map.map_isrelated AS map_isrelated,
//         map.map_related_emp AS map_related_emp,
//         map.map_isApplied AS map_isApplied,
//         map.map_isAppliedYes AS map_isAppliedYes,
//         map.map_isCharged AS map_isCharged,
//         map.map_isChargedYes AS map_isChargedYes,
//         map.map_isIllness AS map_isIllness,
//         map.map_isDrive AS map_isDrive,
//         map.map_isDriveYes AS map_isDriveYes,
//         map.map_isLicense AS map_isLicense,
//         map.map_specialSkills AS map_specialSkills,
//         map.map_hobbies AS map_hobbies,
//         map.map_positionPreferred AS map_positionPreferred,
//         map.map_salary AS map_salary,
//         DATE_FORMAT(map.map_dateAvailable, '%Y-%m-%d') AS map_dateAvailable,
//         map.map_isAccept AS map_isAccept,
//         map.map_isAcceptNo AS map_isAcceptNo,
//         map.map_isDischarged AS map_isDischarged,
//         map.map_relative AS map_relative,
//         map.map_deptReferences AS map_deptReferences,
//         map.map_recommendedBy AS map_recommendedBy,
//         map.map_referredTo AS map_referredTo,
//         map.map_personEmergency AS map_personEmergency,
//         map.map_relationship AS map_relationship,
//         map.map_emergencyAddress AS map_emergencyAddress,
//         map.map_emergencyPhoneNumber AS map_emergencyPhoneNumber,

//         -- Applicant Career
//         ac.ac_career_id AS map_ac_career_id,
//         ac.ac_employer AS map_ac_employer,
//         ac.ac_start AS map_ac_start,
//         ac.ac_end AS map_ac_end,
//         ac.ac_position AS map_ac_position,
//         ac.ac_supervisor AS map_ac_supervisor,
//         ac.ac_reason AS map_ac_reason,

//         -- Applicant Education
//         ae.ae_education_id AS map_ae_education_id,
//         ae.ae_attainment AS map_ae_attainment,
//         ae.ae_schoolname AS map_ae_schoolname,
//         ae.ae_start AS map_ae_start,
//         ae.ae_end AS map_ae_end,
//         ae.ae_isgraduate AS map_ae_isgraduate,
//         ae.ae_highest_level AS map_ae_highest_level,

//         -- Applicant Family
//         af.af_familyid AS map_af_familyid,
//         af.af_name AS map_af_name,
//         af.af_relation AS map_af_relation,
//         af.af_age AS map_af_age,
//         af.af_occupation AS map_af_occupation,
//         af.af_company_position AS map_af_company_position,
//         af.af_birthday AS map_af_birthday,

//         -- Applicant Other Exam
//         aoe.aoe_examid AS map_aoe_examid,
//         aoe.aoe_examname AS map_aoe_examname,
//         aoe.aoe_exam_date AS map_aoe_exam_date,
//         aoe.aoe_placetaken AS map_aoe_placetaken,

//         -- Applicant References
//         ar.ar_referencesid AS map_ar_referencesid,
//         ar.ar_references_name AS map_ar_references_name,
//         ar.ar_occupation AS map_ar_occupation,
//         ar.ar_complete_address AS map_ar_complete_address,
//         ar.ar_contact_no AS map_ar_contact_no,

//         -- Applicant Seminar
//         sa.as_seminarid AS map_as_seminarid,
//         sa.as_seminar_name AS map_as_seminar_name,
//         sa.as_seminar_date AS map_as_seminar_date,

//         -- Applicant User
//         au.au_userid AS map_au_userid,
//         au.au_username AS map_au_username,
//         au.au_status AS map_au_status,
//         au.au_createdate AS map_au_createdate

//       FROM 
//         master_applicant_personal map
//       LEFT JOIN applicant_career ac ON map.map_applicantid = ac.ac_applicantid
//       LEFT JOIN applicant_education ae ON map.map_applicantid = ae.ae_applicantid
//       LEFT JOIN applicant_family af ON map.map_applicantid = af.af_applicantid
//       LEFT JOIN applicant_other_exam aoe ON map.map_applicantid = aoe.aoe_applicantid
//       LEFT JOIN applicant_references ar ON map.map_applicantid = ar.ar_applicantid
//       LEFT JOIN applicant_seminar sa ON map.map_applicantid = sa.as_applicantid
//       LEFT JOIN applicant_user au ON map.map_applicantid = au.au_applicantid
//       WHERE map.map_applicantid = '${applicant_id}'`;

//     Select(sql, (err, result) => {
//       if (err) {
//         console.error(err);
//         res.json(JsonErrorResponse(err));
//       }

//       if (result.length > 0) {
//         let data = DataReturn(result, "map_");
//         res.json(JsonDataResponse(data));
//         console.log(data,'structure');  
//       } else {
//         res.json(JsonDataResponse([]));
//       }
//     });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

// router.post("/viewdata", (req, res) => {
//   try {
//     let applicant_id = req.body.applicantId;

//     console.log(req.body.applicantId);
    
//     // List to store results from each table
//     let resultsList = [];

//     // Master Applicant Personal query
//     let sqlPersonal = `
//       SELECT 
//         map_applicantid AS map_applicantid,
//         map_firstname AS map_firstname,
//         map_lastname AS map_lastname,
//         map_middlename AS map_middlename,
//         map_nickname AS map_nickname,
//         map_phone_no AS map_phone_no,
//         map_address AS map_address,
//         map_provincial_address AS map_provincial_address,
//         map_provincial_phone_address AS map_provincial_phone_address,
//         map_gender AS map_gender,
//         map_civil_status AS map_civil_status,
//         map_age AS map_age,
//         DATE_FORMAT(map_birthday, '%Y-%m-%d') AS map_birthday,
//         map_birthplace AS map_birthplace,
//         map_citizenship AS map_citizenship,
//         map_height AS map_height,
//         map_weight AS map_weight,
//         map_physical_limit AS map_physical_limit,
//         map_sss_no AS map_sss_no,
//         map_tin_no AS map_tin_no,
//         map_language AS map_language,
//         map_isrelated AS map_isrelated,
//         map_related_emp AS map_related_emp,
//         map_isApplied AS map_isApplied,
//         map_isAppliedYes AS map_isAppliedYes,
//         map_isCharged AS map_isCharged,
//         map_isChargedYes AS map_isChargedYes,
//         map_isIllness AS map_isIllness,
//         map_isDrive AS map_isDrive,
//         map_isDriveYes AS map_isDriveYes,
//         map_isLicense AS map_isLicense,
//         map_specialSkills AS map_specialSkills,
//         map_hobbies AS map_hobbies,
//         map_positionPreferred AS map_positionPreferred,
//         map_salary AS map_salary,
//         DATE_FORMAT(map_dateAvailable, '%Y-%m-%d') AS map_dateAvailable,
//         map_isAccept AS map_isAccept,
//         map_isAcceptNo AS map_isAcceptNo,
//         map_isDischarged AS map_isDischarged,
//         map_relative AS map_relative,
//         map_deptReferences AS map_deptReferences,
//         map_recommendedBy AS map_recommendedBy,
//         map_referredTo AS map_referredTo,
//         map_personEmergency AS map_personEmergency,
//         map_relationship AS map_relationship,
//         map_emergencyAddress AS map_emergencyAddress,
//         map_emergencyPhoneNumber AS map_emergencyPhoneNumber
//       FROM master_applicant_personal
//       WHERE map_applicantid = '${applicant_id}'`;

//     Select(sqlPersonal, (err, personalResult) => {
//       if (err) {
//         console.error(err);
//         res.json(JsonErrorResponse(err));
//         return;
//       }

//       if (personalResult.length > 0) {
//         let personalData = DataReturn(personalResult, "map_");
//         resultsList.push({ personal_info: personalData });
//       }

//       // Continue with other queries after the personal result is fetched
      
//       // Applicant Career query
//       let sqlCareer = `
//         SELECT 
//           ac_career_id AS map_ac_career_id,
//           ac_employer AS map_ac_employer,
//           ac_start AS map_ac_start,
//           ac_end AS map_ac_end,
//           ac_position AS map_ac_position,
//           ac_supervisor AS map_ac_supervisor,
//           ac_reason AS map_ac_reason
//         FROM applicant_career
//         WHERE ac_applicantid = '${applicant_id}'`;

//       Select(sqlCareer, (err, careerResult) => {
//         if (err) {
//           console.error(err);
//           res.json(JsonErrorResponse(err));
//           return;
//         }

//         if (careerResult.length > 0) {
//           let careerData = DataReturn(careerResult, "map_");
//           resultsList.push({ applicant_career: careerData });
//         }

//         // Continue with other queries...

//         // Applicant Education query
//         let sqlEducation = `
//           SELECT 
//             ae_education_id AS map_ae_education_id,
//             ae_attainment AS map_ae_attainment,
//             ae_schoolname AS map_ae_schoolname,
//             ae_start AS map_ae_start,
//             ae_end AS map_ae_end,
//             ae_isgraduate AS map_ae_isgraduate,
//             ae_highest_level AS map_ae_highest_level
//           FROM applicant_education
//           WHERE ae_applicantid = '${applicant_id}'`;

//         Select(sqlEducation, (err, educationResult) => {
//           if (err) {
//             console.error(err);
//             res.json(JsonErrorResponse(err));
//             return;
//           }

//           if (educationResult.length > 0) {
//             let educationData = DataReturn(educationResult, "map_");
//             resultsList.push({ applicant_education: educationData });
//           }

//           // After fetching all data, send response with all results
//           res.json(JsonDataResponse(resultsList));

//           console.log(resultsList);
          
//         });
//       });
//     });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

router.post("/viewdata", (req, res) => {
  try {
    let applicant_id = req.body.applicantId;
    console.log(req.body.applicantId);
    let resultsList = [];
    let sqlPersonal = `
      SELECT 
        map_applicantid AS map_applicantid,
        map_firstname AS map_firstName,
        map_lastname AS map_lastName,
        map_middlename AS map_middleName,
        map_nickname AS map_nickName,
        map_phone_no AS map_presentPhoneNumber,
        map_address AS map_presentAddress,
        map_provincial_address AS map_provincialAddress,
        map_provincial_phone_address AS map_provincialPhoneNumber,
        map_gender AS map_gender,
        map_civil_status AS map_civilStatus,
        map_age AS map_age,
        map_birthday AS map_dateOfBirth,
        map_birthplace AS map_placeOfBirth,
        map_citizenship AS map_citizenship,
        map_height AS map_height,
        map_weight AS map_weight,
        map_physical_limit AS map_physicalLimitations,
        map_sss_no AS map_sss,
        map_tin_no AS map_tin,
        map_language AS map_language,
        map_isrelated AS map_isRelatedYes,
        map_related_emp AS map_isRelated,
        map_isApplied AS map_isApplied,
        map_isAppliedYes AS map_isAppliedYes,
        map_isCharged AS map_isCharged,
        map_isChargedYes AS map_isChargedYes,
        map_isIllness AS map_isIllness,
        map_isDrive AS map_isDrive,
        map_isDriveYes AS map_isDriveYes,
        map_isLicense AS map_isLicense,
        map_specialSkills AS map_specialSkills,
        map_hobbies AS map_hobbies,
        map_positionPreferred AS map_positionPreferred,
        map_salary AS map_salary,
        DATE_FORMAT(map_dateAvailable, '%Y-%m-%d') AS map_dateAvailable,
        map_isAccept AS map_isAccept,
        map_isAcceptNo AS map_isAcceptNo,
        map_isDischarged AS map_isDischarged,
        map_relative AS map_relative,
        map_deptReferences AS map_deptReferences,
        map_recommendedBy AS map_recommendedBy,
        map_referredTo AS map_referredTo,
        map_personEmergency AS map_personEmergency,
        map_relationship AS map_relationship,
        map_emergencyAddress AS map_emergencyAddress,
        map_emergencyPhoneNumber AS map_emergencyPhoneNumber
      FROM master_applicant_personal
      WHERE map_applicantid = '${applicant_id}'`;

    Select(sqlPersonal, (err, personalResult) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
        return;
      }

      if (personalResult.length > 0) {
        let personalData = DataModeling(personalResult, "map_");
        resultsList.push({ personal_info: personalData });
      }

      let sqlCareer = `
        SELECT 
          ac_career_id AS map_ac_career_id,
          ac_employer AS map_ac_employer,
          ac_start AS map_ac_start,
          ac_end AS map_ac_end,
          ac_position AS map_ac_position,
          ac_supervisor AS map_ac_supervisor,
          ac_reason AS map_ac_reason
        FROM applicant_career
        WHERE ac_applicantid = '${applicant_id}'`;

      Select(sqlCareer, (err, careerResult) => {
        if (err) {
          console.error(err);
          res.json(JsonErrorResponse(err));
          return;
        }

        if (careerResult.length > 0) {
          let careerData = DataModeling(careerResult, "map_");
          resultsList.push({ applicant_career: careerData });
        }

        let sqlEducation = `
          SELECT 
            ae_education_id AS map_ae_education_id,
            ae_attainment AS map_ae_attainment,
            ae_schoolname AS map_ae_schoolname,
            ae_start AS map_ae_start,
            ae_end AS map_ae_end,
            ae_isgraduate AS map_ae_isgraduate,
            ae_highest_level AS map_ae_highest_level
          FROM applicant_education
          WHERE ae_applicantid = '${applicant_id}'`;

        Select(sqlEducation, (err, educationResult) => {
          if (err) {
            console.error(err);
            res.json(JsonErrorResponse(err));
            return;
          }

          if (educationResult.length > 0) {
            let educationData = DataModeling(educationResult, "map_");
            resultsList.push({ applicant_education: educationData });
          }

          let sqlFamily = `
            SELECT 
              af_familyid AS map_af_familyid,
              af_name AS map_af_name,
              af_relation AS map_af_relation,
              af_age AS map_af_age,
              af_occupation AS map_af_occupation,
              af_company_position AS map_af_company_position,
              af_birthday AS map_af_birthday
            FROM applicant_family
            WHERE af_applicantid = '${applicant_id}'`;

          Select(sqlFamily, (err, familyResult) => {
            if (err) {
              console.error(err);
              res.json(JsonErrorResponse(err));
              return;
            }

            if (familyResult.length > 0) {
              let familyData = DataModeling(familyResult, "map_");
              resultsList.push({ applicant_family: familyData });
            }

            let sqlOtherExam = `
              SELECT 
                aoe_examid AS map_aoe_examid,
                aoe_examname AS map_aoe_examname,
                DATE_FORMAT(aoe_exam_date, '%Y-%m-%d') AS map_aoe_exam_date,
                aoe_placetaken AS map_aoe_placetaken
              FROM applicant_other_exam
              WHERE aoe_applicantid = '${applicant_id}'`;

            Select(sqlOtherExam, (err, otherExamResult) => {
              if (err) {
                console.error(err);
                res.json(JsonErrorResponse(err));
                return;
              }

              if (otherExamResult.length > 0) {
                let otherExamData = DataModeling(otherExamResult, "map_");
                resultsList.push({ applicant_other_exam: otherExamData });
              }

              let sqlReferences = `
                SELECT 
                  ar_referencesid AS map_ar_referencesid,
                  ar_references_name AS map_ar_references_name,
                  ar_occupation AS map_ar_occupation,
                  ar_complete_address AS map_ar_complete_address,
                  ar_contact_no AS map_ar_contact_no
                FROM applicant_references
                WHERE ar_applicantid = '${applicant_id}'`;

              Select(sqlReferences, (err, referencesResult) => {
                if (err) {
                  console.error(err);
                  res.json(JsonErrorResponse(err));
                  return;
                }

                if (referencesResult.length > 0) {
                  let referencesData = DataModeling(referencesResult, "map_");
                  resultsList.push({ applicant_references: referencesData });
                }

                let sqlSeminar = `
                  SELECT 
                    as_seminarid AS map_as_seminarid,
                    as_seminar_name AS map_as_seminar_name,
                    DATE_FORMAT(as_seminar_date, '%Y-%m-%d') AS map_as_seminar_date
                  FROM applicant_seminar
                  WHERE as_applicantid = '${applicant_id}'`;

                Select(sqlSeminar, (err, seminarResult) => {
                  if (err) {
                    console.error(err);
                    res.json(JsonErrorResponse(err));
                    return;
                  }

                  if (seminarResult.length > 0) {
                    let seminarData = DataModeling(seminarResult, "map_");
                    resultsList.push({ applicant_seminar: seminarData });
                  }

                  let sqlUser = `
                    SELECT 
                      au_userid AS map_au_userid,
                      au_username AS map_au_username,
                      au_status AS map_au_status,
                      au_createdate AS map_au_createdate
                    FROM applicant_user
                    WHERE au_applicantid = '${applicant_id}'`;

                  Select(sqlUser, (err, userResult) => {
                    if (err) {
                      console.error(err);
                      res.json(JsonErrorResponse(err));
                      return;
                    }

                    if (userResult.length > 0) {
                      let userData = DataModeling(userResult, "map_");
                      resultsList.push({ applicant_user: userData });
                    }
                    res.json(JsonDataResponse(resultsList));
                    console.log(resultsList);
                  });
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.put("/update_personal", (req, res) => {
  try {
    const { 
      applicantId,
      firstName,
      lastName,
      middleName,
      nickName,
      presentAddress,
      provincialAddress,
      presentPhoneNumber,
      provincialPhoneNumber,
      gender,
      civilStatus,
      age,
      language,
      dateOfBirth,
      placeOfBirth,
      citizenship,
      height,
      weight,
      physicalLimitations,
      sss,
      tin,
      isRelated,
      isRelatedYes,
      isApplied,
      isAppliedYes,
      isCharged,
      isChargedYes,
      isIllness,
      isDrive,
      isDriveYes,
      isLicense,
      specialSkills,
      hobbies,
      positionPreferred,
      salary,
      dateAvailable,
      isAccept,
      isAcceptNo,
      isDischarged,
      relative,
      deptReferences,
      recommendedBy,
      referredTo,
      personEmergency,
      relationship,
      emergencyAddress,
      emergencyPhoneNumber,
    } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (firstName) {
      data.push(firstName);
      columns.push("firstname");
    }

    if (lastName) {
      data.push(lastName);
      columns.push("lastname");
    }

    if (middleName) {
      data.push(middleName);
      columns.push("middlename");
    }

    if (nickName) {
      data.push(nickName);
      columns.push("nickname");
    }

    if (presentPhoneNumber) {
      data.push(presentPhoneNumber);
      columns.push("phone_no");
    }

    if (presentAddress) {
      data.push(presentAddress);
      columns.push("address");
    }

    if (provincialAddress) {
      data.push(provincialAddress);
      columns.push("provincial_address");
    }

    if (provincialPhoneNumber) {
      data.push(provincialPhoneNumber);
      columns.push("provincial_phone_address");
    }

    if (gender) {
      data.push(gender);
      columns.push("gender");
    }

    if (civilStatus) {
      data.push(civilStatus);
      columns.push("civil_status");
    }

    if (age) {
      data.push(age);
      columns.push("age");
    }

    if (dateOfBirth) {
      data.push(dateOfBirth);
      columns.push("birthday");
    }

    if (placeOfBirth) {
      data.push(placeOfBirth);
      columns.push("birthplace");
    }

    if (citizenship) {
      data.push(citizenship);
      columns.push("citizenship");
    }

    if (height) {
      data.push(height);
      columns.push("height");
    }

    if (weight) {
      data.push(weight);
      columns.push("weight");
    }

    if (physicalLimitations) {
      data.push(physicalLimitations);
      columns.push("physical_limit");
    }

    if (sss) {
      data.push(sss);
      columns.push("sss_no");
    }

    if (tin) {
      data.push(tin);
      columns.push("tin_no");
    }

    if (language) {
      data.push(language);
      columns.push("language");
    }

    if (isRelated) {
      data.push(isRelated);
      columns.push("isrelated");
    }

    if (isRelatedYes) {
      data.push(isRelatedYes);
      columns.push("related_emp");
    }

    if (isApplied) {
      data.push(isApplied);
      columns.push("isApplied");
    }

    if (isAppliedYes) {
      data.push(isAppliedYes);
      columns.push("isAppliedYes");
    }

    if (isCharged) {
      data.push(isCharged);
      columns.push("isCharged");
    }

    if (isChargedYes) {
      data.push(isChargedYes);
      columns.push("isChargedYes");
    }

    if (isIllness) {
      data.push(isIllness);
      columns.push("isIllness");
    }

    if (isDrive) {
      data.push(isDrive);
      columns.push("isDrive");
    }

    if (isDriveYes) {
      data.push(isDriveYes);
      columns.push("isDriveYes");
    }

    if (isLicense) {
      data.push(isLicense);
      columns.push("isLicense");
    }

    if (specialSkills) {
      data.push(specialSkills);
      columns.push("specialSkills");
    }

    if (hobbies) {
      data.push(hobbies);
      columns.push("hobbies");
    }

    if (positionPreferred) {
      data.push(positionPreferred);
      columns.push("positionPreferred");
    }

    if (salary) {
      data.push(salary);
      columns.push("salary");
    }

    if (dateAvailable) {
      data.push(dateAvailable);
      columns.push("dateAvailable");
    }

    if (isAccept) {
      data.push(isAccept);
      columns.push("isAccept");
    }

    if (isAcceptNo) {
      data.push(isAcceptNo);
      columns.push("isAcceptNo");
    }

    if (isDischarged) {
      data.push(isDischarged);
      columns.push("isDischarged");
    }

    if (relative) {
      data.push(relative);
      columns.push("relative");
    }

    if (deptReferences) {
      data.push(deptReferences);
      columns.push("deptReferences");
    }

    if (recommendedBy) {
      data.push(recommendedBy);
      columns.push("recommendedBy");
    }

    if (referredTo) {
      data.push(referredTo);
      columns.push("referredTo");
    }

    if (personEmergency) {
      data.push(personEmergency);
      columns.push("personEmergency");
    }

    if (relationship) {
      data.push(relationship);
      columns.push("relationship");
    }

    if (emergencyAddress) {
      data.push(emergencyAddress);
      columns.push("emergencyAddress");
    }

    if (emergencyPhoneNumber) {
      data.push(emergencyPhoneNumber);
      columns.push("emergencyPhoneNumber");
    }

    if (applicantId) {
      data.push(applicantId);
      arguments.push("applicantid");
    }

    let updateStatement = UpdateStatement(
      "master_applicant_personal",
      "map",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from master_applicant_personal where map_firstname = ? and map_lastname = ? and map_middlename = ?",
      [firstName, lastName, middleName]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);
            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.put("/update_career", (req, res) => {
  try {
    const { 
      
    } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (firstName) {
      data.push(firstName);
      columns.push("employer");
    }

    if (lastName) {
      data.push(lastName);
      columns.push("start");
    }

    if (middleName) {
      data.push(middleName);
      columns.push("end");
    }

    if (nickName) {
      data.push(nickName);
      columns.push("position");
    }

    if (presentPhoneNumber) {
      data.push(presentPhoneNumber);
      columns.push("supervisor");
    }

    if (presentAddress) {
      data.push(presentAddress);
      columns.push("reason");
    }

    if (applicantId) {
      data.push(applicantId);
      arguments.push("career_id");
    }

    let updateStatement = UpdateStatement(
      "applicant_career",
      "ac",
      columns,
      arguments
    );

    console.log(updateStatement);

    Update(updateStatement, data, (err, result) => {
      if (err) console.error("Error: ", err);
      res.json(JsonSuccess());
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

// router.put("/update_education", (req, res) => {
//   try {
//     const { 
      
//     } = req.body;

//     let data = [];
//     let columns = [];
//     let arguments = [];

//     if (firstName) {
//       data.push(firstName);
//       columns.push("attainment");
//     }

//     if (lastName) {
//       data.push(lastName);
//       columns.push("schoolname");
//     }

//     if (middleName) {
//       data.push(middleName);
//       columns.push("start");
//     }

//     if (nickName) {
//       data.push(nickName);
//       columns.push("end");
//     }

//     if (presentPhoneNumber) {
//       data.push(presentPhoneNumber);
//       columns.push("isgraduate");
//     }

//     if (presentAddress) {
//       data.push(presentAddress);
//       columns.push("highest_level");
//     }

//     if (applicantId) {
//       data.push(applicantId);
//       arguments.push("education_id");
//     }

//     let updateStatement = UpdateStatement(
//       "applicant_education",
//       "ae",
//       columns,
//       arguments
//     );

//     console.log(updateStatement);

//     Update(updateStatement, data, (err, result) => {
//       if (err) console.error("Error: ", err);
//       res.json(JsonSuccess());
//     });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

router.put("/update_education", (req, res) => {
  try {
    const {
      ae_education_id,   // Unique ID for the record
      ae_applicantid,     // Applicant ID
      ae_attainment,      // Education level (e.g., College, Highschool)
      ae_schoolname,      // School name
      ae_start,           // Start year
      ae_end,             // End year
      ae_isgraduate,      // Graduation status
      ae_highest_level    // Highest level or honors
    } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    // Populate columns and data based on provided values
    if (ae_attainment) {
      data.push(ae_attainment);
      columns.push("ae_attainment");
    }

    if (ae_schoolname) {
      data.push(ae_schoolname);
      columns.push("ae_schoolname");
    }

    if (ae_start) {
      data.push(ae_start);
      columns.push("ae_start");
    }

    if (ae_end) {
      data.push(ae_end);
      columns.push("ae_end");
    }

    if (ae_isgraduate) {
      data.push(ae_isgraduate);
      columns.push("ae_isgraduate");
    }

    if (ae_highest_level) {
      data.push(ae_highest_level);
      columns.push("ae_highest_level");
    }

    if (ae_education_id) {
      arguments.push(`ae_education_id = ?`);
      data.push(ae_education_id);  // Use ae_education_id in the WHERE clause
    }

    if (arguments.length === 0) {
      return res.status(400).json({ error: "No ID provided for the update." });
    }

    // Dynamically construct the update SQL statement
    let updateStatement = UpdateStatement(
      "applicant_education",
      "ae",
      columns,
      arguments
    );

    console.log(updateStatement); // For debugging

    // Perform the update
    Update(updateStatement, data, (err, result) => {
      if (err) {
        console.error("Error: ", err);
        return res.status(500).json({ error: "Database update failed." });
      }

      res.json({ success: true, message: "Record updated successfully!" });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error." });
  }
});


//#endregion

//#region FUNCTION
function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}

function generateApplicantId(year, month) {
  console.log(year, month);
  return new Promise((resolve, reject) => {
    const maxIdQuery = `SELECT count(*) as count FROM master_applicant_personal WHERE map_applicantid LIKE '${year}${month}%'`;
    console.log(maxIdQuery);
    mysql
      .mysqlQueryPromise(maxIdQuery)
      .then((result) => {
        let currentCount = parseInt(result[0].count) + 1;
        const paddedNumericPart = String(currentCount).padStart(2, "0");

        let newApprenticeID = `${year}${month}${paddedNumericPart}`;

        console.log(newApprenticeID);

        resolve(newApprenticeID);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function checkApplicantExists(firstname, lastname, middlename) {
  return new Promise((resolve, reject) => {
    const checkQuery = `SELECT COUNT(*) AS count 
    FROM master_applicant_personal 
    WHERE map_firstname = '${firstname}' 
    AND map_lastname = '${lastname}' 
    AND map_middlename = '${middlename}'`;

    mysql
      .mysqlQueryPromise(checkQuery)
      .then((result) => {
        const count = parseInt(result[0].count);

        if (count > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

async function saveUserRecord(req, res, applicantid, username) {
  try {
    let status = GetValue(ACT());
    let createdate = GetCurrentDatetime();

    let sql = InsertStatement("applicant_user", "au", [
      "applicantid",
      "username",
      "status",
      "createdate",
    ]);
    let data = [[applicantid, username, status, createdate]];
    let checkStatement = SelectStatement(
      "select * from applicant_user where au_applicantid=? and au_username=?",
      [applicantid, username]
    );

    const result = await Check(checkStatement);

    if (result.length !== 0) {
      return JsonWarningResponse(MessageStatus.EXIST);
    }

    await new Promise((resolve, reject) => {
      InsertTable(sql, data, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    return JsonSuccess();
  } catch (error) {
    console.log(error);
    return JsonErrorResponse(error);
  }
}

// function DataReturn(result) {
//   let data = {};

//   // Structure the personal info
//   data.personal_info = {
//     applicantid: result[0].map_applicantid,
//     firstName: result[0].map_firstname,
//     lastName: result[0].map_lastname,
//     middleName: result[0].map_middlename,
//     nickName: result[0].map_nickname,
//     presentPhoneNumber: result[0].map_phone_no,
//     provincialPhoneNumber: result[0].map_provincial_phone_address,
//     presentAddress: result[0].map_address,
//     provincialAddress: result[0].map_provincial_address,
//     gender: result[0].map_gender,
//     civil_status: result[0].map_civil_status,
//     age: result[0].map_age,
//     language: result[0].map_language,
//     dateOfBirth: result[0].map_birthday,
//     placeOfBirth: result[0].map_birthplace,
//     citizenship: result[0].map_citizenship,
//     height: result[0].map_height,
//     weight: result[0].map_weight,
//     physicalLimitations: result[0].map_physical_limit,
//     sss: result[0].map_sss_no,
//     tin: result[0].map_tin_no,
//     isRelated: result[0].map_isrelated,
//     relatedEmployee: result[0].map_related_emp,
//     isApplied: result[0].map_isApplied,
//     isAppliedYes: result[0].map_isAppliedYes,
//     isCharged: result[0].map_isCharged,
//     isChargedYes: result[0].map_isChargedYes,
//     isIllness: result[0].map_isIllness,
//     isDrive: result[0].map_isDrive,
//     isDriveYes: result[0].map_isDriveYes,
//     isLicense: result[0].map_isLicense,
//     specialSkills: result[0].map_specialSkills,
//     hobbies: result[0].map_hobbies,
//     positionPreferred: result[0].map_positionPreferred,
//     salary: result[0].map_salary,
//     dateAvailable: result[0].map_dateAvailable,
//     isAccept: result[0].map_isAccept,
//     isAcceptNo: result[0].map_isAcceptNo,
//     isDischarged: result[0].map_isDischarged,
//     relative: result[0].map_relative,
//     deptReferences: result[0].map_deptReferences,
//     recommendedBy: result[0].map_recommendedBy,
//     referredTo: result[0].map_referredTo,
//     personEmergency: result[0].map_personEmergency,
//     relationship: result[0].map_relationship,
//     emergencyAddress: result[0].map_emergencyAddress,
//     emergencyPhoneNumber: result[0].map_emergencyPhoneNumber,
//   };

//   // Group applicant career data
//   data.applicant_career = result.map(row => ({
//     career_id: row.map_ac_career_id,
//     employer: row.map_ac_employer,
//     start: row.map_ac_start,
//     end: row.map_ac_end,
//     position: row.map_ac_position,
//     supervisor: row.map_ac_supervisor,
//     reason: row.map_ac_reason
//   })).filter(career => career.career_id); // Filter out null career entries

//   // Group applicant education data
//   data.applicant_education = result.map(row => ({
//     education_id: row.map_ae_education_id,
//     attainment: row.map_ae_attainment,
//     schoolname: row.map_ae_schoolname,
//     start: row.map_ae_start,
//     end: row.map_ae_end,
//     isgraduate: row.map_ae_isgraduate,
//     highest_level: row.map_ae_highest_level
//   })).filter(edu => edu.education_id); // Filter out null education entries

//   // Group applicant family data
//   data.applicant_family = result.map(row => ({
//     familyid: row.map_af_familyid,
//     name: row.map_af_name,
//     relation: row.map_af_relation,
//     age: row.map_af_age,
//     occupation: row.map_af_occupation,
//     company_position: row.map_af_company_position,
//     birthday: row.map_af_birthday
//   })).filter(family => family.familyid); // Filter out null family entries

//   // Group applicant other exam data
//   data.applicant_other_exam = result.map(row => ({
//     examid: row.map_aoe_examid,
//     examname: row.map_aoe_examname,
//     exam_date: row.map_aoe_exam_date,
//     placetaken: row.map_aoe_placetaken
//   })).filter(exam => exam.examid); // Filter out null exam entries

//   // Group applicant references data
//   data.applicant_references = result.map(row => ({
//     referencesid: row.map_ar_referencesid,
//     references_name: row.map_ar_references_name,
//     occupation: row.map_ar_occupation,
//     complete_address: row.map_ar_complete_address,
//     contact_no: row.map_ar_contact_no
//   })).filter(ref => ref.referencesid); // Filter out null references entries

//   // Group applicant seminar data
//   data.applicant_seminar = result.map(row => ({
//     seminarid: row.map_as_seminarid,
//     seminar_name: row.map_as_seminar_name,
//     seminar_date: row.map_as_seminar_date
//   })).filter(seminar => seminar.seminarid); // Filter out null seminar entries

//   // Add more sections as necessary...

//   return data;
// }

// function DataReturn(result, key) {
//   let data = {};

//   // Structure the personal info
//   data.personal_info = {
//     applicantid: result[0].map_applicantid,
//     firstname: result[0].map_firstname,
//     lastname: result[0].map_lastname,
//     middlename: result[0].map_middlename,
//     nickname: result[0].map_nickname,
//     phone_no: result[0].map_phone_no,
//     address: result[0].map_address,
//     provincial_address: result[0].map_provincial_address,
//     gender: result[0].map_gender,
//     civil_status: result[0].map_civil_status,
//     age: result[0].map_age,
//     birthday: result[0].map_birthday,
//     birthplace: result[0].map_birthplace,
//     citizenship: result[0].map_citizenship,
//     height: result[0].map_height,
//     weight: result[0].map_weight,
//     physical_limit: result[0].map_physical_limit,
//     sss_no: result[0].map_sss_no,
//     tin_no: result[0].map_tin_no,
//     // add more fields if necessary
//   };

//   // Group applicant career data
//   data.applicant_career = result.map(row => ({
//     career_id: row.map_ac_career_id,
//     employer: row.map_ac_employer,
//     start: row.map_ac_start,
//     end: row.map_ac_end,
//     position: row.map_ac_position,
//     supervisor: row.map_ac_supervisor,
//     reason: row.map_ac_reason
//   })).filter(career => career.career_id); // Filter out null career entries

//   // Group applicant education data
//   data.applicant_education = result.map(row => ({
//     education_id: row.map_ae_education_id,
//     attainment: row.map_ae_attainment,
//     schoolname: row.map_ae_schoolname,
//     start: row.map_ae_start,
//     end: row.map_ae_end,
//     isgraduate: row.map_ae_isgraduate,
//     highest_level: row.map_ae_highest_level
//   })).filter(edu => edu.education_id); // Filter out null education entries

//   // Group applicant family data
//   data.applicant_family = result.map(row => ({
//     familyid: row.map_af_familyid,
//     name: row.map_af_name,
//     relation: row.map_af_relation,
//     age: row.map_af_age,
//     occupation: row.map_af_occupation,
//     company_position: row.map_af_company_position,
//     birthday: row.map_af_birthday
//   })).filter(family => family.familyid); // Filter out null family entries

//   // Group applicant other exam data
//   data.applicant_other_exam = result.map(row => ({
//     examid: row.map_aoe_examid,
//     examname: row.map_aoe_examname,
//     exam_date: row.map_aoe_exam_date,
//     placetaken: row.map_aoe_placetaken
//   })).filter(exam => exam.examid); // Filter out null exam entries

//   // Group applicant references data
//   data.applicant_references = result.map(row => ({
//     referencesid: row.map_ar_referencesid,
//     references_name: row.map_ar_references_name,
//     occupation: row.map_ar_occupation,
//     complete_address: row.map_ar_complete_address,
//     contact_no: row.map_ar_contact_no
//   })).filter(ref => ref.referencesid); // Filter out null references entries

//   // Group applicant seminar data
//   data.applicant_seminar = result.map(row => ({
//     seminarid: row.map_as_seminarid,
//     seminar_name: row.map_as_seminar_name,
//     seminar_date: row.map_as_seminar_date
//   })).filter(seminar => seminar.seminarid); // Filter out null seminar entries

//   // Add more sections as necessary...

//   return data;
// }




//#endregion
