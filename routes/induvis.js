var express = require('express');
var router = express.Router();

var { requestWS } = require('nodejs_idempierewebservice')
var { induvis } = require('../util/DB.js');

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

router.post('/induvis/confirmacion/crear/', async function (req, res, next) {

    try {
        var payload = req.body

        if (typeof payload === 'string' || payload instanceof String) {
            payload = JSON.parse(payload)
        }

        console.log('payload', payload)
    
        var params = [
            {
                column: 'M_InOut_ID', 
                val: payload.m_inout_id
            },{
                column: 'Description', 
                val: payload.descripcion
            }
        ]
    
        requestWS( induvis.host, 'crear_confirmacion_ws', payload.ctx, params)
            .then(res => {
                console.log('respuesta WS', res)
                res.json({ exito: true, msg: res })
    
            }).catch(err => {
                console.log('Error ws', err)
                res.json({exito: false, msg: `${err}`})
            })
    } catch (e) {
        console.log('err', e)
        res.json({exito: false, msg: `${e}`})
    }
})

module.exports = router;