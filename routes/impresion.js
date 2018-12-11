var express = require('express');
var router = express.Router();
var login = require('./login').router
var multer  = require('multer')
var upload = multer({ dest: 'uploads/print/' })
var fs = require('fs')
var nodemailer = require('nodemailer')
var { impresion } = require('../util/DB.js');


/**
 * Ruta que recibe un archizo ZIP y lo envia mediante un WebService a los servidores indicados
 */
router.post('/print_itsc/', login.validarSesion, upload.single('file_pdf_tecnico'), async function (req, res, next) {
    var file_path = undefined
    
    try {
        if (!impresion)
            throw new Error('Impresion ITSC no configurada');

        file_path = req.file.path
        let transporter = nodemailer.createTransport({
            host: impresion.smtp_host,
            port: impresion.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: impresion.smtp_user, // generated ethereal user
                pass: impresion.smtp_pass // generated ethereal password
            }
        });
    
        // setup email data with unicode symbols
        let mailOptions = {
            from: impresion.from, // sender address
            to: impresion.to, // list of receivers
            subject: 'Print this', // Subject line
            attachments: [{
                filename: req.file.originalname,
                content: fs.createReadStream(file_path)
            }]
        };
    
        // send mail with defined transport object
        await new Promise((resolve, reject) => { 
            transporter.sendMail(mailOptions, (err, info) => {
                if (err)
                    return reject(new Error(err));

                res.send('Archivo enviado a HP con exito, verifique la impresora!')
                resolve()
            })
        })

        console.log(`${req.session_itsc.usr} ${new Date()} imprimió [${req.file.originalname}]`)

    } catch (e) {
        console.log(e);
        next(e)

    } finally {
        if (file_path)
            fs.unlink(file_path, err => err ? console.error("Err Eliminar", err) : '')
    }
})

module.exports = router;