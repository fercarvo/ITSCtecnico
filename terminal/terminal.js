var pty = require('pty.js');
var cookieParser = require('cookie-parser');


function socketAuth(socket, next) {
    var headers = socket.request.headers;
    console.log('cookies', cookieParser.JSONCookies(headers.cookie))
    console.log(headers)
    next()
}

function terminal (socket) {
    var sshuser = '';
    var request = socket.request;
    console.log((new Date()) + ' Connection accepted.');

    var term = pty.spawn('/usr/bin/env', ['login'], {
        name: 'xterm-256color',
        cols: 80,
        rows: 30
    })

    console.log((new Date()) + " PID=" + term.pid + " STARTED on behalf of user=")
    term.on('data', function(data) {
        socket.emit('output', data);
    });
    term.on('exit', function(code) {
        console.log((new Date()) + " PID=" + term.pid + " ENDED")
    });
    socket.on('resize', function(data) {
        term.resize(data.col, data.row);
    });
    socket.on('input', function(data) {
        term.write(data);
    });
    socket.on('disconnect', function() {
        term.end();
    });
}


module.exports = {
    socketAuth,
    terminal
}