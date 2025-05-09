const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { Server } = require('socket.io');
const createError = require('http-errors');
const basicAuth = require('express-basic-auth');
require('dotenv').config(); // For environment variables

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  transports: ['websocket'],
});

// Basic authentication for Express routes
app.use(basicAuth({
  users: { 'admin': process.env.AUTH_PASSWORD || 'yourpassword' }, // Use env variable
  challenge: true,
  realm: 'PoolController',
}));

// Socket.IO authentication (optional, uncomment to enable)
io.use((socket, next) => {
  const auth = socket.handshake.auth;
  if (auth && auth.username === 'admin' && auth.password === process.env.AUTH_PASSWORD) {
    return next();
  }
  return next(new Error('Authentication error'));
});

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Static file serving
app.use('/stylesheets', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/js/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use('/js/app', express.static(path.join(__dirname, 'public/javascripts/appCalls')));

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Start the HTTP server
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('message', (message) => {
    console.log(`Received message => ${message}`);
    socket.broadcast.send(message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

module.exports = app;