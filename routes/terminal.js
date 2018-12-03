var express = require('express');
var router = express.Router();
var { router, readToken } = require('./login')
//var pty = require('pty.js');

router.get('/terminal', function(req, res, next) {
    res.render('terminal');
})

function socketAuth(socket, next) {
    try {
        var cookies = socket.request.headers.cookie;
        readToken(getCookie('session_itsc', cookies))
        next()

    } catch (e) {
        console.log(e.message)
        next(new Error("401 Unauthorized"))
    }
}

function connectionCB (socket) {
    console.log(`${new Date()} Connection accepted`)

    var term/* = pty.spawn('/usr/bin/env', ['login'], {
        name: 'xterm-256color',
        cols: 80,
        rows: 30
    })*/

    console.log(new Date(), `PID=${term.pid} STARTED`)

    term.on('data', function(data) {
        socket.emit('output', data);
    });
    term.on('exit', function(code) {
        console.log((new Date()) + " PID=" + term.pid + " ENDED")
        socket.disconnect(true)
    })
    
    socket.on('resize', function(data) {
        term.resize(data.col, data.row);
    })

    socket.on('input', function(data) {
        term.write(data);
    })

    socket.on('disconnect', function() {
        try {
            term.end();
            process.kill(term.pid, 'SIGKILL');  
        } catch (e) {
            ;
        }
    })
}

//obtiene una cookie de los headers
function getCookie (name, cookies) {
    if (cookies.length === 0)
        return null;

    var c_start = cookies.indexOf(`${name}=`);
    if (c_start === -1)
        return null;

    c_start = c_start + name.length + 1;
    var c_end = cookies.indexOf(';', c_start);		
    if (c_end == -1)
        c_end = cookies.length;

    return decodeURIComponent( cookies.substring(c_start, c_end) );
}


module.exports = {
    router,
    socketAuth,
    connectionCB
}