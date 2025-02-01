# HRIS

## Introduction

HRIS is a web application that provides a comprehensive solution for managing human resources information. It is designed to streamline the HR process, making it easier for employees to access and manage their information.

## Features

- Employee Management
  - Create, update, and delete employee records
  - Generate employee reports
  - Manage employee attendance
  - Manage employee leave
  - Manage employee payroll
- Payroll Management
  - Generate payroll reports
  - Manage payroll deductions
  - Manage payroll taxes
  - Manage payroll allowances
  - Manage payroll basic adjustments
  - Manage payroll payroll adjustments
  - Manage payroll overtime
  - Manage payroll leave pay
  - Manage payroll regular holidays
  - Manage payroll special holidays
  - Manage payroll rest days
  - Manage payroll late days
  - Manage payroll early days
  - Manage payroll sick days
  - Manage payroll vacation days
  - Manage payroll holidays
- Government Loans Management
  - Create, update, and delete government loans
  - Generate government loans reports

## Getting Started

To get started with HRIS, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/5L-Solutions/HRIS.git
```

2. Install the required dependencies:

```bash
npm install
```

3. Configure the database connection:

   Create a new file named `config.js` in the root directory of the project and add the following code:

```javascript
module.exports = {
  database: {
    host: "localhost",
    user: "root",
    password: "password",
    database: "hris",
    port: 3306,
  },
};
```

4. Start the application:

```bash
npm start
```

5. Access the application in your web browser at `http://localhost:3000/`.

## Contributing

Contributions are welcome! If you have any suggestions or improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.    


## Commands

### npm start

Starts the application in development mode.

### npm run build

Builds the application for production.

### npm test

Runs the test suite.

### npm run lint

Runs the linter.

### npm run lint:fix

Fixes any linting issues.

### npm run format

Formats the code.

### npm run format:fix

Fixes any formatting issues.

npx sequelize-cli migration:generate --name <migration-name>
npm run migrations:status
npx sequelize-cli db:migrate