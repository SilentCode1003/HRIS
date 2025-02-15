const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HRMIS API Documentation",
      version: "1.0.0",
      description: "API documentation for HRMIS WITH PAYROLL",
    },
  },
  apis: ["./document/*.js"], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
module.exports = swaggerDocs;

//#region EMPLOYEE API

/**
 * @swagger
 * /employee/save:
 *   post:
 *     summary: Save a new employee record
 *     description: Adds a new employee record to the database, generates an ID, username, and password, and encrypts the password before saving the user record.
 *     tags:
 *       - Employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 description: First name of the employee.
 *                 example: "John"
 *               middlename:
 *                 type: string
 *                 description: Middle name of the employee.
 *                 example: "Michael"
 *               lastname:
 *                 type: string
 *                 description: Last name of the employee.
 *                 example: "Doe"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: Date of birth of the employee.
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 description: Gender of the employee.
 *                 example: "Male"
 *               civilstatus:
 *                 type: string
 *                 description: Civil status of the employee.
 *                 example: "Single"
 *               phone:
 *                 type: string
 *                 description: Phone number of the employee.
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 description: Email address of the employee.
 *                 example: "john.doe@example.com"
 *               hiredate:
 *                 type: string
 *                 format: date
 *                 description: Date when the employee was hired.
 *                 example: "2024-01-01"
 *               jobstatus:
 *                 type: string
 *                 description: Job status of the employee (e.g., "apprentice", "permanent").
 *                 example: "apprentice"
 *               ercontactname:
 *                 type: string
 *                 description: Emergency contact name of the employee.
 *                 example: "Jane Doe"
 *               ercontactphone:
 *                 type: string
 *                 description: Emergency contact phone number of the employee.
 *                 example: "+0987654321"
 *               departmentName:
 *                 type: string
 *                 description: Name of the department the employee belongs to.
 *                 example: "HR"
 *               positionName:
 *                 type: string
 *                 description: Position name of the employee.
 *                 example: "Manager"
 *               address:
 *                 type: string
 *                 description: Address of the employee.
 *                 example: "123 Main St, City, Country"
 *               profilePicturePath:
 *                 type: string
 *                 description: The profile picture needs to be converted to base64 and sent here.
 *                 example: "ashdausihdagsdiknasdiashdasoidhsyduashdaoisuhdasuasduha"
 *     responses:
 *       200:
 *         description: Success message indicating the result.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Status of the operation.
 *                   example: "success"
 *       400:
 *         description: Bad request due to invalid data.
 *       500:
 *         description: Server error.
 */

//#endregion

//#region TRAINING API

/**
 * @swagger
 * /trainings/load:
 *   get:
 *     summary: Retrieve training details
 *     description: Fetches a list of training sessions along with associated employee details.
 *     tags:
 *       - Training
 *     responses:
 *       200:
 *         description: A successful response with training details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       mt_trainingid:
 *                         type: integer
 *                         description: The unique ID of the training.
 *                         example: 101
 *                       mt_name:
 *                         type: string
 *                         description: The name of the training session.
 *                         example: Leadership Workshop
 *                       me_id:
 *                         type: integer
 *                         description: The ID of the employee associated with the training.
 *                         example: 2001
 *                       mt_employeeid:
 *                         type: string
 *                         description: The employee's full name.
 *                         example: John Doe
 *                       mt_startdate:
 *                         type: string
 *                         format: date
 *                         description: Start date of the training.
 *                         example: "2024-11-01"
 *                       mt_enddate:
 *                         type: string
 *                         format: date
 *                         description: End date of the training.
 *                         example: "2024-11-03"
 *                       mt_location:
 *                         type: string
 *                         description: Location of the training.
 *                         example: New York Office
 *                       mt_status:
 *                         type: string
 *                         description: Current status of the training.
 *                         example: Scheduled
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "An error occurred while processing your request."
 */

/**
 * @swagger
 * /trainings/save:
 *   post:
 *     summary: Save a new training record
 *     description: Adds a new training record for an employee if it doesn't already exist.
 *     tags:
 *       - Training
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the training session.
 *                 example: "Leadership Workshop"
 *               employeeid:
 *                 type: string
 *                 description: ID of the employee attending the training.
 *                 example: "EMP12345"
 *               startdate:
 *                 type: string
 *                 format: date
 *                 description: Start date of the training session.
 *                 example: "2024-11-01"
 *               enddate:
 *                 type: string
 *                 format: date
 *                 description: End date of the training session.
 *                 example: "2024-11-07"
 *               location:
 *                 type: string
 *                 description: Location of the training session.
 *                 example: "Conference Room B"
 *     responses:
 *       200:
 *         description: Success message indicating the result.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Status of the operation.
 *                   example: "success"
 *       400:
 *         description: Bad request due to invalid data.
 *       500:
 *         description: Server error.
 */

//#endregion

//#region Daily Allowannce

/**
 * @swagger
 * /allowance/get-daily-allowance:
 *   get:
 *     tags:
 *       - Daily Allowance
 *     summary: Get Daily Allowance
 *     description: Get Daily Allowance
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error.
 * 
 * components:
 *   schemas:
 *     DailyAllowance:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for a Daily Allowance.
 * 
 */

//#endregion