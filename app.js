var createError = require('http-errors');
const express = require('express');
const path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jsdom = require('jsdom');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/stylesheets', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/javascripts', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/javascripts', express.static(path.join(__dirname, 'node_modules/jquery/dist')))
app.use('/javascripts', express.static(path.join(__dirname, 'public/javascripts/appCalls')))

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

const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', () => { /* … */ }); 
server.listen(3000);