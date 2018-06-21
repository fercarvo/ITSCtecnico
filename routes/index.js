var express = require('express');
var router = express.Router();
var login = require('./login').router
var { pool } = require('../util/DB.js');

router.use(function (req, res, next) {
    res.set('Cache-Control', 'private, max-age=600') //60*10
    next();
})

/* GET home page. */
router.get('/', login.validarSesion, function(req, res, next) {
    res.render('index');
})

module.exports = router;
