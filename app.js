var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

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
var announcementRouter = require('./routes/announcement');
var eportalindexRouter = require('./routes/eportalindex');
var eportalrequestleaveRouter = require('./routes/eportalrequestleave');
var eportaldisciplinaryactionRouter = require('./routes/eportaldisciplinaryaction');
var eportalprofileRouter = require('./routes/eportalprofile');
var eportalsalaryRouter = require('./routes/eportalsalary');
var eportalcashadvanceRouter = require('./routes/eportalcashadvance');
var eportalpayslipRouter = require('./routes/eportalpayslip');
var hrindexRouter = require('./routes/hrindex');
var hremployeeRouter = require('./routes/hremployee');
var hrshiftRouter = require('./routes/hrshift');
var hrtrainingRouter = require('./routes/hrtraining');
var hrperformanceRouter = require('./routes/hrperformance');
var hrdisciplinaryRouter = require('./routes/hrdisciplinary');
var hrhealthrecordRouter  = require('./routes/hrhealthrecord');
var hrgovermentidRouter = require('./routes/hrgovermentid');
var hrattendanceRouter = require('./routes/hrattendance');
var hrojtRouter = require('./routes/hrojt');
var hrallleaveRouter = require('./routes/hrallleave');
var hrpendingleaveRouter = require('./routes/hrpendingleave');
var hrapprovedleaveRouter = require('./routes/hrapprovedleave');
var hrrejectedleaveRouter = require('./routes/hrrejectedleave');
var hroffensesRouter = require('./routes/hroffenses');
var hrviolationRouter = require('./routes/hrviolation');
var hrdiscriplinaryactionRouter = require('./routes/hrdisciplinaryaction');

var app = express();

const session = require('express-session');
const mongoose = require('mongoose');
const MongoDBSession = require('connect-mongodb-session')(session);

const mysql = require('./routes/repository/hrmisdb');

//mongodb
mongoose.connect('mongodb://localhost:27017/HRMIS')
  .then((res) => {
    console.log("MongoDB Connected!");
  });

const store = new MongoDBSession({
  uri: 'mongodb://localhost:27017/HRMIS',
  collection: 'HRMISSessions',
});

//Session
app.use(
  session({
    secret: "5L Secret Key",
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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
app.use('/announcement', announcementRouter);
app.use('/eportalindex', eportalindexRouter);
app.use('/eportalrequestleave', eportalrequestleaveRouter);
app.use('/eportaldisciplinaryaction', eportaldisciplinaryactionRouter);
app.use('/eportalprofile', eportalprofileRouter);
app.use('/eportalsalary', eportalsalaryRouter);
app.use('/eportalcashadvance', eportalcashadvanceRouter);
app.use('/eportalpayslip', eportalpayslipRouter);
app.use('/hrindex', hrindexRouter);
app.use('/hremployee', hremployeeRouter);
app.use('/hrshift', hrshiftRouter);
app.use('/hrtraining', hrtrainingRouter);
app.use('/hrperformance', hrperformanceRouter);
app.use('/hrdisciplinary', hrdisciplinaryRouter);
app.use('/hrhealthrecord', hrhealthrecordRouter);
app.use('/hrgovermentid', hrgovermentidRouter);
app.use('/hrattendance', hrattendanceRouter);
app.use('/hrojt', hrojtRouter);
app.use('/hrallleave', hrallleaveRouter);
app.use('/hrpendingleave', hrpendingleaveRouter);
app.use('/hrapprovedleave', hrapprovedleaveRouter);
app.use('/hrrejectedleave', hrrejectedleaveRouter);
app.use('/hroffenses', hroffensesRouter);
app.use('/hrviolation', hrviolationRouter);
app.use('/hrdiscriplinaryaction', hrdiscriplinaryactionRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
