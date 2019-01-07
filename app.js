var createError = require('http-errors');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var debug = require('debug')('app:server');
var terminal = require('./routes/terminal')
var port = Number(process.env.PORT || 3000)
var server = app.listen(port)
var os = require('os')
var fs = require('fs')

try {
    if (!fs.existsSync(`${os.tmpdir()}/tecnico`)){
        fs.mkdirSync(`${os.tmpdir()}/tecnico`);
    }
} catch (e) {
    console.error('no se pudo crear /tmp/tecnico', e)
}

var io = require('socket.io')(server, {path: '/terminal-connection'});
io.set('transports', ['websocket']);
io.use(terminal.socketAuth)
io.on('connection', terminal.connectionCB)


server.on('error', onError);
server.on('listening', onListening);

// view engine setup
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser())

app.use('/temporal', express.static(`${os.tmpdir()}/tecnico`))

app.use(express.static(`${__dirname}/public`, {
    setHeaders: res => {
        res.setHeader('Cache-Control', 'private, max-age=3600') //60*60
        res.setHeader('X-Desarrollado-Por', 'Edgar Carvajal efcu93@gmail.com')
    }
}))

app.use((req, res, next) => {
    res.set('X-Desarrollado-Por', 'Edgar Carvajal efcu93@gmail.com');
    next()
})

app.use('/', require('./routes/index'));
app.use('/', require('./routes/login').router);
app.use('/', terminal.router);
app.use('/', require('./routes/packin'));
app.use('/', require('./routes/plugin'));
//app.use('/', require('./routes/impresion'));
app.use('/', require('./routes/induvis'));

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

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

module.exports = app;