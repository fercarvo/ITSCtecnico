var express = require('express');
var router = express.Router();
var login = require('./login').router
var multer  = require('multer')
var upload = multer({ dest: 'uploads/zips/' })
var fs = require('fs')

var { getServerData, rename, callWebService } = require('./tecnico.js')

/**
 * Ruta que recibe un archizo ZIP y lo envia mediante un WebService a los servidores indicados
 */
router.post('/packin/', login.validarSesion, upload.single('file_zip_tecnico'), async function (req, res, next) {
    var newpath = undefined
    
    try {
        var servidores_id = req.query.servers.split(',').map(id => Number(id))

        var oldpath = `${__dirname}/../uploads/zips/${req.file.filename}`;
        newpath = `${__dirname}/../public/packin_files/${req.file.filename}.zip`;
        await rename(oldpath, newpath)

        var data_sv_arr = await getServerData(servidores_id);
        
        var promises = data_sv_arr.map(server => callWebService(
            `/packin_files/${req.file.filename}.zip`, 
            req.file.originalname,
            server
        ))

        var results = await Promise.all(promises)

        var subidos = results.filter(r => r.resolved).map(r => r.data)
        var errores = results.filter(r => !r.resolved).map(r => r.data)

        res.json({subidos, error: errores})
    } catch (e) {
        console.error(e);
        next(e)

    } finally {
        if (newpath)
            fs.unlink(newpath, err => err ? console.error("Err Eliminar", err) : console.log('eliminado', newpath))
    }
})

module.exports = router;