var express = require('express');
var router = express.Router();
var login = require('./login').router
var { getAllServers, getAllServersSSH } = require('./tecnico.js')

router.get('/servidor', login.validarSesion, async function (req, res, next) {
    try {
        if (req.query.tipo == 'SSH') {
            var data  = await getAllServersSSH();
            res.json(data);
        } else {
            var data  = await getAllServers();
            res.json(data);
        }
    } catch (e) {
        next(e)
    }
})

/* GET home page. */
router.get('/', login.validarSesion, function(req, res, next) {
    res.setHeader("Content-Security-Policy", "connect-src 'self'");
    res.render('index');
})

module.exports = router;
