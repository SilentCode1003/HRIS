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

    employerLevels.forEach((level) => {
      if (!careerData[level]) return;

      const {
        name: carrer_employer,
        dateFrom: career_start_date,
        dateTo: career_end_date,
        position: carrer_position,
        reason: carrer_reason,
        natureEmployer: career_supervisor,
      } = careerData[level];
      let sql = InsertStatement("applicant_career", "ac", [
        "applicantid",
        "attainment",
        "employer",
        "start",
        "end",
        "position",
        "supervisor",
        "reason",
      ]);
      let data = [
        [
          applicantId,
          level,
          carrer_employer,
          career_start_date,
          career_end_date,
          carrer_position,
          career_supervisor,
          carrer_reason,
        ],
      ];
      let checkStatement = SelectStatement(
        "select * from applicant_career where ac_applicantid=? and ac_employer=? and ac_position=?",
        [applicantId, carrer_employer, carrer_position]
      );
      const promise = Check(checkStatement)
        .then((result) => {
          if (result.length !== 0) {
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
        .catch((error) => {
          console.log(`Error checking ${level}:`, error);
          return JsonErrorResponse(error);
        });

      careerPromises.push(promise);
    });

    const seminarList = [
      { data: seminars, attainment: "seminar" },
      { data: secondSeminars, attainment: "secondSeminars" },
      { data: thirdSeminars, attainment: "thirdSeminars" },
      { data: fourthSeminars, attainment: "fourthSeminars" },
      { data: fifthSeminars, attainment: "fifthSeminars" },
    ];

    seminarList.forEach(({ data: seminar, attainment }) => {
      if (!seminar) return;

      const { seminarName: as_seminar_name, dateSeminar: as_seminar_date } =
        seminar;

      let sql = InsertStatement("applicant_seminar", "as", [
        "applicantid",
        "attainment",
        "seminar_name",
        "seminar_date",
      ]);

      let data = [
        [
          applicantId,
          attainment, 
          as_seminar_name,
          as_seminar_date,
        ],
      ];
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
    const { applicantId, 
      father, 
      mother, 
      siblings, 
      siblings2, 
      siblings3, 
      siblings4, 
      siblings5, 
      siblings6, 
      siblings7, 
      siblings8, 
      spouse, 
      children,
      children2, 
      children3,  
      children4, 
      children5, 
      children6, 
      children7, 
      children8
    } = req.body;
    const familyMembers = [
      { ...father, relation: "father" },
      { ...mother, relation: "mother" },
      { ...siblings, relation: "siblings" },
      { ...siblings2, relation: "siblings2" },
      { ...siblings3, relation: "siblings3" },
      { ...siblings4, relation: "siblings4" },
      { ...siblings5, relation: "siblings5" },
      { ...siblings6, relation: "siblings6" },
      { ...siblings7, relation: "siblings7" },
      { ...siblings8, relation: "siblings8" },
      { ...spouse, relation: "spouse" },
      { ...children, relation: "children" },
      { ...children2, relation: "children2" },
      { ...children3, relation: "children3" },
      { ...children4, relation: "children4" },
      { ...children5, relation: "children5" },
      { ...children6, relation: "children6" },
      { ...children7, relation: "children7" },
      { ...children8, relation: "children8" },
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
    const { applicantId, ...references } = req.body;
    const referencesPromises = [];

    const referencesLevels = [
      "references",
      "references2",
      "references3",
    ];

    referencesLevels.forEach((level) => {
      if (!references[level]) return;

      const {
        name: reference_name,
        occupation: reference_occupation,
        address: reference_complete_address,
        telephone: reference_contact_no,
      } = references[level];

      let sql = InsertStatement("applicant_references", "ar", [
        "applicantid",
        "attainment",
        "references_name",
        "occupation",
        "complete_address",
        "contact_no",
      ]);
  
      let data = [
        [
          applicantId,
          level,
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

      const promise = Check(checkStatement)
        .then((result) => {
          if (result.length !== 0) {
            return Promise.resolve(JsonWarningResponse(MessageStatus.EXIST));
          } else {
            return new Promise((resolve, reject) => {
              InsertTable(sql, data, (err, result) => {
                if (err) {
                  console.log(`Error inserting ${level}:`, err);
                  return reject(JsonErrorResponse(err));
                }
                resolve(JsonSuccess());
              });
            });
          }
        })
        .catch((error) => {
          console.log(`Error checking ${level}:`, error);
          return JsonErrorResponse(error);
        });

        referencesPromises.push(promise);
    });

    Promise.all([...referencesPromises])
      .then((results) => {
        res.json(results);
      })
      .catch((error) => {
        console.log(`Error in Promise.all:`, error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

//#endregion

//#region UPDATE DATA

router.post("/viewdata", (req, res) => {
  try {
    let applicant_id = req.body.applicantId;
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
          ac_attainment AS map_ac_attainment,
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
                  ar_attainment AS map_ar_attainment,
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
                    as_attainment AS map_as_attainment,
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

router.put("/update_education", (req, res) => {
  try {
    const educationLevels = [
      "elementary",
      "highschool",
      "college",
      "graduate",
      "others",
    ];
    let updateCount = 0;

    educationLevels.forEach((level) => {
      const section = req.body[level];
      if (section && section.ae_education_id) {
        let data = [];
        let columns = [];
        let arguments = ["education_id"];

        if (section.ae_schoolname) {
          data.push(section.ae_schoolname);
          columns.push("schoolname");
        }
        if (section.ae_start) {
          data.push(section.ae_start);
          columns.push("start");
        }
        if (section.ae_end) {
          data.push(section.ae_end);
          columns.push("end");
        }
        if (section.ae_isgraduate) {
          data.push(section.ae_isgraduate);
          columns.push("isgraduate");
        }
        if (section.ae_highest_level) {
          data.push(section.ae_highest_level);
          columns.push("highest_level");
        }

        data.push(section.ae_education_id);

        if (columns.length > 0) {
          const updateStatement = UpdateStatement(
            "applicant_education",
            "ae",
            columns,
            arguments
          );

          Update(updateStatement, data, (err, result) => {
            if (err) {
              console.error(`Error updating ${level}:`, err);
              return res.status(500).json({ error: "Database update failed." });
            }

            updateCount++;

            if (
              updateCount ===
              educationLevels.filter(
                (level) => req.body[level]?.ae_education_id
              ).length
            ) {
              res.json({
                success: true,
                message: "Records updated successfully!",
              });
            }
          });
        }
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error." });
  }
});

router.put("/update_career", (req, res) => {
  try {
    const {
      present,
      second,
      third,
      fourth,
      fifth,
      sixth,
      seminars,
      secondSeminars,
      thirdSeminars,
      fourthSeminars,
      fifthSeminars,
    } = req.body;
    const careerEntries = [present, second, third, fourth, fifth, sixth];
    const seminarEntries = [seminars, secondSeminars, thirdSeminars, fourthSeminars, fifthSeminars];

    const careerPromises = [];
    const seminarPromises = [];

    careerEntries.forEach((career) => {
      if (career && career.ac_employer) {
        let data = [];
        let columns = [];
        let arguments = [];

        if (career.ac_employer) {
          data.push(career.ac_employer);
          columns.push("employer");
        }
        
        if (career.ac_start) {
          data.push(career.ac_start);
          columns.push("start");
        }

        if (career.ac_end) {
          data.push(career.ac_end);
          columns.push("end");
        }

        if (career.ac_position) {
          data.push(career.ac_position);
          columns.push("position");
        }

        if (career.ac_supervisor) {
          data.push(career.ac_supervisor);
          columns.push("supervisor");
        }

        if (career.ac_reason) {
          data.push(career.ac_reason);
          columns.push("reason");
        }

        if (career.ac_career_id) {
          data.push(career.ac_career_id);
          arguments.push("career_id");
        }

        let updateStatement = UpdateStatement(
          "applicant_career",
          "ac",
          columns,
          arguments);

        careerPromises.push(
          new Promise((resolve, reject) => {
            Update(updateStatement, data, (err, result) => {
              if (err) {
                console.error("Error updating career:", err);
                return reject(JsonErrorResponse(err));
              }
              resolve(JsonSuccess());
            });
          })
        );
      }
    });

    seminarEntries.forEach((seminar) => {
      if (seminar && seminar.as_seminar_name) {
        let data = [];
        let columns = [];
        let arguments = [];

        if (seminar.as_seminar_name) {
          data.push(seminar.as_seminar_name);
          columns.push("seminar_name");
        }
        if (seminar.as_seminar_date) {
          data.push(seminar.as_seminar_date);
          columns.push("seminar_date");
        }

        if (seminar.as_seminarid) {
          data.push(seminar.as_seminarid);
          arguments.push("seminarid");
        }

        let updateStatement = UpdateStatement("applicant_seminar", "as", columns, arguments);

        seminarPromises.push(
          new Promise((resolve, reject) => {
            Update(updateStatement, data, (err, result) => {
              if (err) {
                console.error("Error updating seminar:", err);
                return reject(JsonErrorResponse(err));
              }
              resolve(JsonSuccess());
            });
          })
        );
      }
    });

    Promise.all([...careerPromises, ...seminarPromises])
      .then((results) => {
        res.json(results);
      })
      .catch((error) => {
        console.error("Error in Promise.all:", error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.error("Catch block error:", error);
    res.json(JsonErrorResponse(error));
  }
});

router.put("/update_family", (req, res) => {
  try {
    const {
      father,
      mother,
      siblings,
      siblings2,
      siblings3,
      siblings4,
      siblings5,
      siblings6,
      siblings7,
      siblings8,
      spouse,
      children,
      children2,
      children3,
      children4,
      children5,
      children6,
      children7,
      children8,
    } = req.body;

    const familyEntries = [
      father,
      mother,
      siblings,
      siblings2,
      siblings3,
      siblings4,
      siblings5,
      siblings6,
      siblings7,
      siblings8,
      spouse,
      children,
      children2,
      children3,
      children4,
      children5,
      children6,
      children7,
      children8,
    ];

    const familyPromises = [];

    familyEntries.forEach((familyMember) => {
      if (familyMember && familyMember.af_name) {
        let data = [];
        let columns = [];
        let arguments = [];

        if (familyMember.af_name) {
          data.push(familyMember.af_name);
          columns.push("name");
        }
        if (familyMember.af_age) {
          data.push(familyMember.af_age);
          columns.push("age");
        }
        if (familyMember.af_birthday) {
          data.push(familyMember.af_birthday);
          columns.push("birthday");
        }
        if (familyMember.af_company_position) {
          data.push(familyMember.af_company_position);
          columns.push("company_position");
        }
        if (familyMember.af_occupation) {
          data.push(familyMember.af_occupation);
          columns.push("occupation");
        }

        if (familyMember.af_familyid) {
          data.push(familyMember.af_familyid);
          arguments.push("familyid");
        }

        let updateStatement = UpdateStatement("applicant_family", "af", columns, arguments);
        familyPromises.push(
          new Promise((resolve, reject) => {
            Update(updateStatement, data, (err, result) => {
              if (err) {
                console.error("Error updating family member:", err);
                return reject(JsonErrorResponse(err));
              }
              resolve(JsonSuccess());
            });
          })
        );
      }
    });

    Promise.all(familyPromises)
      .then((results) => {
        res.json(results);
      })
      .catch((error) => {
        console.error("Error in Promise.all:", error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.error("Catch block error:", error);
    res.json(JsonErrorResponse(error));
  }
});

router.put("/update_references", (req, res) => {
  try {
    const { references, references2, references3 } = req.body;
    const referenceEntries = [references, references2, references3];
    const referencePromises = [];
    referenceEntries.forEach((reference) => {
      if (reference && reference.ar_references_name) {
        let data = [];
        let columns = [];
        let arguments = [];

        if (reference.ar_references_name) {
          data.push(reference.ar_references_name);
          columns.push("references_name");
        }
        if (reference.ar_complete_address) {
          data.push(reference.ar_complete_address);
          columns.push("complete_address");
        }
        if (reference.ar_contact_no) {
          data.push(reference.ar_contact_no);
          columns.push("contact_no");
        }
        if (reference.ar_occupation) {
          data.push(reference.ar_occupation);
          columns.push("occupation");
        }

        if (reference.ar_referencesid) {
          data.push(reference.ar_referencesid);
          arguments.push("referencesid");
        }

        let updateStatement = UpdateStatement("applicant_references", "ar", columns, arguments);

        referencePromises.push(
          new Promise((resolve, reject) => {
            Update(updateStatement, data, (err, result) => {
              if (err) {
                console.error("Error updating reference:", err);
                return reject(JsonErrorResponse(err));
              }
              resolve(JsonSuccess());
            });
          })
        );
      }
    });

    Promise.all(referencePromises)
      .then((results) => {
        res.json(results);
      })
      .catch((error) => {
        console.error("Error in Promise.all:", error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.error("Catch block error:", error);
    res.json(JsonErrorResponse(error));
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
  return new Promise((resolve, reject) => {
    const maxIdQuery = `SELECT count(*) as count FROM master_applicant_personal WHERE map_applicantid LIKE '${year}${month}%'`;
    mysql
      .mysqlQueryPromise(maxIdQuery)
      .then((result) => {
        let currentCount = parseInt(result[0].count) + 1;
        const paddedNumericPart = String(currentCount).padStart(2, "0");

        let newApprenticeID = `${year}${month}${paddedNumericPart}`;
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
//#endregion
