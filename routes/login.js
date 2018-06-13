var express = require('express');
var router = express.Router();
var { pool, users } = require('../util/DB.js');
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
        
        res.redirect(401)
    }
}

router.get('/logout', function (req, res, next) {
    res.clearCookie('session_itsc');
    res.redirect('/login')
})

router.post('/login', function (req, res, next) {    
    if (!req.body || !req.body.usuario || !req.body.clave)
        return res.status(400).send('Por favor, envie datos correctos');

    try {
        if (checkUsuario(req.body.usuario, req.body.clave))
            return res.send(createToken({usr: req.body.usuario, puesto: 'Tecnico'}));
        
        res.status(400).send("Usuario/clave incorrectos");
        
    } catch (e) {
        next(e)
    }    
})

/*router.post('/login/datos', async function (req, res, next) {
    if (!req.body || !req.body.usuario || !req.body.clave || !req.body.ad_client_id || !req.body.ad_role_id || !req.body.ad_org_id)
        return res.status(400).send('Por favor, envie datos correctos');

    try {
        var data = await createPayload(req.body.usuario, req.body.clave, req.body.ad_client_id, req.body.ad_role_id, req.body.ad_org_id, req.body.m_warehouse_id)
        var token = createToken(data)

        //res.cookie('session_itsc', token,  { maxAge: 1000*60*60*12, httpOnly: true})
        res.send(token)
        
    } catch (e) {
        console.log(e)
        res.status(400).send('Error autenticacion ' + e.message);
    }    
})*/

router.get('/login/token/:data', function (req, res, next) {
    try {

        var token = decodeURIComponent(req.params.data)

        readToken(token)
        res.cookie('session_itsc', token,  { maxAge: 1000*60*60*12, httpOnly: true})
        res.redirect(301, '/')  
    } catch (e) {
        console.log("error token", e)
        res.redirect('/login')
    }
})



function checkUsuario (user, pass) {
    var user = users.find(u => u.user === user && u.pass === pass)
    
    if (user)
        return true
    
    return false
}

//Crea token de sesion
function createToken (json) {
    var hmac = crypto.createHmac('SHA256', 'ItSCS3cret0fLif3');
    var payload = JSON.stringify(json)
    var payload_base64 = Buffer.from(payload, 'utf8').toString('base64')

    hmac.update(payload, 'utf8');
    var sign = hmac.digest('base64');

    return `${payload_base64}.${sign}`;
}

//Lee token de sesion, verifica y retorna payload
function readToken (text) {
    var hmac = crypto.createHmac('SHA256', 'ItSCS3cret0fLif3');
    var cookie = text.split('.')

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