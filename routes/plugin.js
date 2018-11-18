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
    var newpath = ''

    try {
        var servidores_id = req.query.servers.split(',').map(id => Number(id))

        var oldpath = `${__dirname}/../uploads/jars/${req.file.filename}`;
        newpath = `${__dirname}/../uploads/jars/${req.file.filename}.jar`; //Path Archivo a ser enviado
        await rename(oldpath, newpath);

        var file = fs.createReadStream(newpath); //Se lee el archivo a ser enviado
        var data_sv_arr = await getServerData(servidores_id);

        var promises = data_sv_arr.map(server => sendPackage(file, newpath, server)) //Se envia en pararelo
        var resultados = await Promise.all(promises) //resultados
        
        var exito = resultados.filter(r => r.resolved) //Servidores de exito
        var fallidos = resultados.filter(r => !r.resolved) //Servidores fallidos         

        res.json({ exito, fallidos })

    } catch (e) {
        console.log(e);
        next(e)
    } finally {
        fs.unlink(newpath, err => err ? console.error("Err Eliminar", err) : '')
    }
})

module.exports = router;