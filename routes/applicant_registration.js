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
      firstname,
      lastname,
      middlename,
      nickname,
      phone_no,
      address,
      provincial_address,
      provincial_phone_address,
      gender,
      civil_status,
      age,
      birthday,
      birthplace,
      citizenship,
      height,
      weight,
      physical_limit,
      sss_no,
      tin_no,
      pagibig_no,
      related_emp,
      related_date,
      contact_person,
      relationship,
      realation_address,
      realation_phone,
      language,
      otherskills,
      isdriver,
      vehicle_type,
      islicense,
      salary_desired,
      position_preferred,
      isallowedassigned,
      reasonnotallowed,
      isdischargedposition,
      date_avail,
      relative,
      relative_dept,
      recomended_by,
      referred_to,
      image,
    } = req.body;

    console.log(req.body);

    const applicantExists = await checkApplicantExists(
      firstname,
      lastname,
      middlename
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
      map_nickname: nickname,
      map_applicantid: applicantId,
    });

    const sql = InsertStatement("master_applicant_personal", "map", [
      "applicantid",
      "firstname",
      "lastname",
      "middlename",
      "nickname",
      "phone_no",
      "address",
      "provincial_address",
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
      "pagibig_no",
      "related_emp",
      "related_date",
      "contact_person",
      "relationship",
      "realation_address",
      "realation_phone",
      "language",
      "otherskills",
      "isdriver",
      "vehicle_type",
      "islicense",
      "salary_desired",
      "position_preferred",
      "isallowedassigned",
      "reasonnotallowed",
      "isdischargedposition",
      "date_avail",
      "relative",
      "relative_dept",
      "recomended_by",
      "referred_to",
      "image",
    ]);

    const data = [
      [
        applicantId,
        firstname,
        lastname,
        middlename,
        nickname,
        phone_no,
        address,
        provincial_address,
        provincial_phone_address,
        gender,
        civil_status,
        age,
        birthday,
        birthplace,
        citizenship,
        height,
        weight,
        physical_limit,
        sss_no,
        tin_no,
        pagibig_no,
        related_emp,
        related_date,
        contact_person,
        relationship,
        realation_address,
        realation_phone,
        language,
        otherskills,
        isdriver,
        vehicle_type,
        islicense,
        salary_desired,
        position_preferred,
        isallowedassigned,
        reasonnotallowed,
        isdischargedposition,
        date_avail,
        relative,
        relative_dept,
        recomended_by,
        referred_to,
        image,
      ],
    ];

    const checkStatement = SelectStatement(
      "SELECT * FROM master_applicant_personal WHERE map_firstname=? AND map_lastname=? AND map_middlename=?",
      [firstname, lastname, middlename]
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

    res.json(JsonSuccess());
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});


router.post("/register_education", (req, res) => {
  try {
    const {
      applicantId,
      attainment,
      school_name,
      school_start_date,
      school_end_date,
      isgraduated,
    } = req.body;

    let sql = InsertStatement("applicant_education", "ae", [
      "applicantid",
      "attainment",
      "schoolname",
      "start",
      "end",
      "isgraduate",
    ]);
    let data = [
      [
        applicantId,
        attainment,
        school_name,
        school_start_date,
        school_end_date,
        isgraduated,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from applicant_education where ae_applicantid=? and ae_attainment=? and ae_schoolname=?",
      [applicantId, attainment, school_name]
    );

    Check(checkStatement)
      .then((result) => {
        console.log(result);
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

router.post("/register_career", (req, res) => {
  try {
    const {
      applicantId,
      carrer_employer,
      carrer_start_date,
      career_end_date,
      carrer_position,
      career_supervisor,
      carrer_reason,
    } = req.body;

    let sql = InsertStatement("aplicant_career", "ac", [
      "applicantid",
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
        carrer_employer,
        carrer_start_date,
        career_end_date,
        carrer_position,
        career_supervisor,
        carrer_reason,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from aplicant_career where ac_applicantid=? and ac_employer=? and ac_position=?",
      [applicantId, carrer_employer, carrer_position]
    );

    Check(checkStatement)
      .then((result) => {
        console.log(result);
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
        console.log(result);
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
    const {
      applicantId,
      family_name,
      family_relation,
      family_age,
      family_ocupation,
      family_company_position,
      family_birthday,
    } = req.body;

    let sql = InsertStatement("applicant_family", "af", [
      "applicantid",
      "name",
      "relation",
      "age",
      "company_position",
      "birthday",
    ]);
    let data = [
      [
        applicantId,
        family_name,
        family_relation,
        family_age,
        family_ocupation,
        family_company_position,
        family_birthday,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from applicant_family where af_applicantid=? and af_name=? and af_relation=?",
      [applicantId, family_name, family_relation]
    );

    Check(checkStatement)
      .then((result) => {
        console.log(result);
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

router.post("/register_reference", (req, res) => {
  try {
    const {
      applicantId,
      reference_name,
      reference_occupation,
      reference_complete_address,
      reference_contact_no,
    } = req.body;

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
        console.log(result);
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

        console.log(result);
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
