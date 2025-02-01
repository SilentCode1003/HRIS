const {
  SelectStatement,
  GetCurrentDate,
} = require("../repository/customhelper");
const { Check } = require("../repository/dbconnect");

const GenerateEmployeeGovernmentDeduction = () => {
  async function Execute() {
    let sql = SelectStatement(
      "select ds_description as description, ds_employee_id as employee_id  from  deduction_schedule where ds_date = ?",
      [GetCurrentDate()]
    );

    let result = await Check(sql);

    if (result.length > 0) {
      console.log("Deduction schedule found");
      const { description, employee_id } = result[0];
      let executeStoreProc = SelectStatement(
        "call hrmis.GenerateEmployeeGovernmentDeductions(?, ?)",
        [employee_id, description]
      );

      await Check(executeStoreProc);
    }
  }

  Execute();
};

module.exports = GenerateEmployeeGovernmentDeduction;
