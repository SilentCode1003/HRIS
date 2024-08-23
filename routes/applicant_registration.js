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

//#endregion
