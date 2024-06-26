var createError = require('http-errors');
const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const jsdom = require('jsdom');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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

// Start the Express server on port 3000
server.listen(3000, 'autopool.local', () => {
  console.log('Express server listening on autopool.local:3000');
});

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
    // Broadcast the received message to all clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
  });

  ws.on('close', () => {
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