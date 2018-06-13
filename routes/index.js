var express = require('express');
var router = express.Router();
var login = require('./login')
var { pool } = require('../util/DB.js');

/* GET home page. */
router.get('/', login.validarSesion, function(req, res, next) {
    res.render('index');
})

module.exports = router;
