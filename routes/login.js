var express = require('express');
var router = express.Router();
var { users, secret, sign_alg } = require('../util/DB.js');
var cookies = require('cookie-parser');
const crypto = require('crypto');

router.get('/login', function(req, res, next) {
    res.render('login');
});

router.validarSesion = function (req, res, next) {    
    try {
        if (!req.cookies || !req.cookies.session_itsc)
            throw new Error('No existe cookie de sesion');

        req.session_itsc = readToken(req.cookies.session_itsc)
        next()

    } catch (e) {
        if (req.url === '/')
            return res.redirect('/login/')
        
        res.status(401).send("unauth")
    }
}

router.get('/logout', function (req, res, next) {
    res.clearCookie('session_itsc');
    res.redirect('/login/')
})

router.post('/login', function (req, res, next) {    
    if (!req.body || !req.body.usuario || !req.body.clave)
        return res.status(400).redirect(`/login/?msg=${encodeURIComponent("Por favor, envie datos correctos")}`);

    try {
        if (checkUsuario(req.body.usuario, req.body.clave)) {
            var token = createToken({
                usr: req.body.usuario, 
                puesto: 'Tecnico',
                iat: new Date()
            })
            res.cookie('session_itsc', token,  { maxAge: 1000*60*60*12, httpOnly: true})
            res.redirect('/')  
        } else {
            res.redirect(`/login/?msg=${encodeURIComponent("Usuario/Clave Incorrectas")}`)
        }        
        
    } catch (e) {
        next(e)
        console.log("Error set cookie", e)
    }    
})



function checkUsuario (user, pass) {
    var user = users.find(u => u.user === user && u.pass === pass);
    
    if (user)
        return true;
    
    return false
}

//Crea token de sesion
function createToken (json) {
    var hmac = crypto.createHmac(sign_alg, secret);
    var payload = JSON.stringify(json)
    var payload_base64 = Buffer.from(payload, 'utf8').toString('base64')

    hmac.update(payload, 'utf8');
    var sign = hmac.digest('base64');

    return encodeURIComponent(`${payload_base64}.${sign}`);
}

//Lee token de sesion, verifica y retorna payload
function readToken (text) {
    var hmac = crypto.createHmac(sign_alg, secret);
    var cookie = decodeURIComponent(text).split('.')

    if (cookie.length !== 2)
        throw new Error('Cookie invalida, no cumple formato');
    
    var payload_base64 = cookie[0]
    var sign = cookie[1]

    var payload =  Buffer.from(payload_base64, 'base64').toString('utf8')
    hmac.update(payload);

    if (hmac.digest('base64') !== sign)
        throw new Error('Firma invalida');

    return JSON.parse(payload)
}

module.exports = router;  