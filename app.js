var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { SetMongo } = require('./routes/controller/mongoose');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var employeeRouter = require('./routes/employee');
var employeeprofileRouter = require('./routes/employeeprofile');
var departmentRouter = require('./routes/department');
var allleaveRouter = require('./routes/alleave');
var pendingleaveRouter = require('./routes/pendingleave');
var approvedleaveRouter = require('./routes/approvedleave');
var rejectedleaveRouter = require('./routes/rejectedleave');
var attendanceRouter = require('./routes/attendance');
var shiftRouter = require('./routes/shift');
var trainingsRouter = require('./routes/trainings');
var positionRouter = require('./routes/position');
var disciplinaryRouter = require('./routes/disciplinary');
var disciplinaryactionRouter = require('./routes/disciplinaryaction');
var offensesRouter = require('./routes/offenses');
var violationRouter = require('./routes/violation');
var healthrecordRouter = require('./routes/healthrecord');
var govermentidRouter = require('./routes/govermentid');
var performanceRouter = require('./routes/performance');
var holidayRouter = require('./routes/holiday');
var holidayrateRouter = require('./routes/holidayrate');
var ojtRouter = require('./routes/ojt');
var ovetimeRouter = require('./routes/ovetime');
var announcementRouter = require('./routes/announcement');
var settingsRouter = require('./routes/settings');
var eportalsettingsRouter = require('./routes/eportalsettings');
var accessRouter = require('./routes/access');
var salaryRouter = require('./routes/salary');
var requestcashadvanceRouter = require('./routes/requestcashadvance');
var resignedRouter = require('./routes/resigned');
var deductionRouter = require('./routes/deduction');
var eportalindexRouter = require('./routes/eportalindex');
var eportalrequestleaveRouter = require('./routes/eportalrequestleave');
var eportaldisciplinaryactionRouter = require('./routes/eportaldisciplinaryaction');
var eportalprofileRouter = require('./routes/eportalprofile');
var eportalsalaryRouter = require('./routes/eportalsalary');
var eportalcashadvanceRouter = require('./routes/eportalcashadvance');
var eportalcoopRouter = require('./routes/eportalcoop');
var eportalpayslipRouter = require('./routes/eportalpayslip');
var eportalattendancelayoutRouter = require('./routes/eportalattendance');
var loginlayoutRouter = require('./routes/login');
var candidateRouter = require('./routes/candidate');
var loanRouter = require('./routes/loan');
var paymentRouter = require('./routes/payment');
var interestRouter = require('./routes/interest');
var depositRouter = require('./routes/deposit');
var memberRouter = require('./routes/member');
var registerRouter = require('./routes/register');
var ojtuserRouter = require('./routes/ojtuser');
var geofencesettingsRouter = require('./routes/geofencesettings');
var salaryhistoryRouter = require('./routes/salaryhistory');
var timelogsRouter = require('./routes/timelogs');
var payslipRouter = require('./routes/payslip');
var generatepayrollRouter = require('./routes/generatepayroll');
var apprenticeRouter = require('./routes/apprentice');
var ojtindexRouter = require('./routes/ojtindex');
var ojtloginRouter = require('./routes/ojtlogin');
var ojtattendanceRouter = require('./routes/ojtattendance');
var ojtprofileRouter = require('./routes/ojtprofile');
var ojtreqabsentRouter = require('./routes/ojtreqabsent');
var attendanceojtRouter = require('./routes/attendanceojt');



var app = express();

SetMongo(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 500000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/employee', employeeRouter);
app.use('/employeeprofile', employeeprofileRouter);
app.use('/department', departmentRouter);
app.use('/allleave', allleaveRouter);
app.use('/pendingleave', pendingleaveRouter);
app.use('/approvedleave', approvedleaveRouter);
app.use('/rejectedleave', rejectedleaveRouter);
app.use('/attendance', attendanceRouter);
app.use('/shift', shiftRouter);
app.use('/trainings', trainingsRouter);
app.use('/position', positionRouter);
app.use('/disciplinary', disciplinaryRouter);
app.use('/disciplinaryaction', disciplinaryactionRouter);
app.use('/offenses', offensesRouter);
app.use('/violation', violationRouter);
app.use('/healthrecord', healthrecordRouter);
app.use('/govermentid', govermentidRouter);
app.use('/performance', performanceRouter);
app.use('/holiday', holidayRouter);
app.use('/holidayrate', holidayrateRouter);
app.use('/ojt', ojtRouter);
app.use('/ovetime', ovetimeRouter);
app.use('/announcement', announcementRouter);
app.use('/settings', settingsRouter);
app.use('/eportalsettings', eportalsettingsRouter);
app.use('/access', accessRouter);
app.use('/salary', salaryRouter);
app.use('/deduction', deductionRouter);
app.use('/requestcashadvance', requestcashadvanceRouter);
app.use('/resigned', resignedRouter);
app.use('/eportalindex', eportalindexRouter);
app.use('/eportalrequestleave', eportalrequestleaveRouter);
app.use('/eportaldisciplinaryaction', eportaldisciplinaryactionRouter);
app.use('/eportalprofile', eportalprofileRouter);
app.use('/eportalsalary', eportalsalaryRouter);
app.use('/eportalcashadvance', eportalcashadvanceRouter);
app.use('/eportalcoop', eportalcoopRouter);
app.use('/eportalpayslip', eportalpayslipRouter);
app.use('/eportalattendance', eportalattendancelayoutRouter);
app.use('/login', loginlayoutRouter);
app.use('/candidate', candidateRouter);
app.use('/loan', loanRouter);
app.use('/payment', paymentRouter);
app.use('/interest', interestRouter);
app.use('/deposit', depositRouter);
app.use('/member', memberRouter);
app.use('/register', registerRouter);
app.use('/ojtuser', ojtuserRouter);
app.use('/geofencesettings', geofencesettingsRouter);
app.use('/salaryhistory', salaryhistoryRouter);
app.use('/timelogs',timelogsRouter);
app.use('/payslip', payslipRouter);
app.use('/generatepayroll', generatepayrollRouter);
app.use('/apprentice', apprenticeRouter);
app.use('/ojtindex', ojtindexRouter);
app.use('/ojtlogin', ojtloginRouter);
app.use('/ojtattendance', ojtattendanceRouter);
app.use('/ojtprofile', ojtprofileRouter);
app.use('/ojtreqabsent', ojtreqabsentRouter);
app.use('/attendanceojt', attendanceojtRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
