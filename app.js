const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { Server } = require('socket.io');

// Load SSL certificate
const privateKey = fs.readFileSync('/ssl/key.pem', 'utf8');
const certificate = fs.readFileSync('/ssl/cert.pem', 'utf8');
const ca = fs.readFileSync('/ssl/csr.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

const app = express();
const httpsServer = https.createServer(credentials, app);
const io = new Server(httpsServer, {
  path: '/socket.io',
  transports: ['websocket'],
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

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

app.use('/stylesheets', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/javascripts', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/javascripts', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use('/javascripts', express.static(path.join(__dirname, 'public/javascripts/appCalls')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the HTTPS server on port 3000
httpsServer.listen(3000, () => {
  console.log('Express server listening on port 3000');
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('message', (message) => {
    console.log(`Received message => ${message}`);
    // Broadcast the received message to all clients
    socket.broadcast.send(message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
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