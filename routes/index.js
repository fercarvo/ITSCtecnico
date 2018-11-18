var express = require('express');
var router = express.Router();
var login = require('./login').router
var { getAllServers } = require('./tecnico.js')

router.get('/servidor', login.validarSesion, async function (req, res, next) {
    try {
        var data  = await getAllServers();
        res.json(data);
    } catch (e) {
        next(e)
    }
})

/* GET home page. */
router.get('/', login.validarSesion, function(req, res, next) {
    res.render('index');
})

module.exports = router;
