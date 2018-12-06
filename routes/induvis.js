var express = require('express');
var router = express.Router();

//var { getServerData, sendPackage } = require('./tecnico.js')

router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
})

/**
 * Ruta que recibe un archivo .jar, con una lista de servidores iDempiere, arma un paquete OSGI y lo envia
 */
router.post('/induvis/rest_test/', async function (req, res, next) {

    try { 
        var data = req.body
        
        if (typeof data === 'object') {
            console.log('es object', data)

        } else if (data === null && data === undefined) {
            console.log('Body no existe', data)
            data = {}

        } else {
            console.log('es string', data)
            data = JSON.parse(data)
        }

        console.log('info req.body', data)
        res.json({...data, mensaje: 'Test conector ITSC', foo: true})

    } catch (e) {
        console.log('error al leer info', e);
        res.json({mensaje: `error al leer la informacion en JSON -> ${e}`, foo: true, })
    }
})

module.exports = router;