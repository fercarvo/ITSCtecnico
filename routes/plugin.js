var express = require('express');
var router = express.Router();
var login = require('./login').router
var multer  = require('multer')
var upload = multer({ dest: 'uploads/jars/' })
var fs = require('fs')

var { getServerData, sendPackage, rename } = require('./tecnico.js')

/**
 * Ruta que recibe un archivo .jar, con una lista de servidores iDempiere, arma un paquete OSGI y lo envia
 */
router.post('/servidor/paquete', login.validarSesion, upload.single('file_jar_tecnico'), async function (req, res, next) {
    var file_path = undefined

    try {        
        var file_path = req.file.path
        var servidores_id = req.query.servers.split(',').map(id => Number(id))
        var file = fs.createReadStream(file_path); //Se lee el archivo a ser enviado

        var data_sv_arr = await getServerData(servidores_id);

        var promises = data_sv_arr.map(sv => sendPackage(file, req.file.originalname, sv)) //Se envia en pararelo
        var resultados = await Promise.all(promises) //resultados
        
        var subidos = resultados.filter(r => r.resolved) //Servidores de exito
        var error = resultados.filter(r => !r.resolved) //Servidores fallidos
    
        res.json({ subidos, error })

    } catch (e) {
        console.error(e);
        next(e)
    } finally {
        if (file_path)
            fs.unlink(file_path, err => err ? console.error("Err Eliminar", err) : console.log('eliminado', file_path))
    }
})

module.exports = router;