var express = require('express');
var router = express.Router();
var login = require('./login').router
var { exec } = require('child_process');
var { getServerData } = require('./tecnico.js')


/**
 * @param cliente id del servidor
 */
router.post('/server_admin/:cliente', login.validarSesion, async function(req, res, next) {
    try {
        var tipo = req.body.tipo

        if (isNaN(req.params.cliente)) {
            throw new Error('ID del servidor no es numerico');
        }

        var data = await getServerData([Number(req.params.cliente)])
        const {name, port, dir_ssh, pwd_ssh} = data[0];
        var comando = undefined;

        console.log(name, tipo)

        if (tipo === "restart_idempiere") {
            comando = `sshpass -p "${pwd_ssh}" ssh -o "StrictHostKeyChecking no" -o ConnectTimeout=60 -p ${Number(port)} ${dir_ssh} "service idempiere restart"` 
        } else if (tipo === "restart_postgresql") {
            comando = `sshpass -p "${pwd_ssh}" ssh -o "StrictHostKeyChecking no" -o ConnectTimeout=60 -p ${Number(port)} ${dir_ssh} "service postgresql restart"`
        } else if (tipo === "espacio_disco") {
            comando = `sshpass -p "${pwd_ssh}" ssh -o "StrictHostKeyChecking no" -o ConnectTimeout=60 -p ${Number(port)} ${dir_ssh} "df -h -x tmpfs"`
        } else {
            throw new Error(`${tipo} << comando no soportado`)
        }

        var resultado = await new Promise(resolve => {
            exec(comando, function (err, stdout, stderr) {
                if (err) {
                    console.log('Error ejecucion', err);
                    return resolve('Error ejecución: '+ err);
                }

                console.log(`${name} stdout: ${stdout}`);
                console.log(`${name} stderr: ${stderr}`);

                return resolve(`Ejecucion finalizada, stdout: [${stdout}] stderr: [${stderr}]`)    
            })
        })        
        
        return res.send(resultado)

    } catch (e) {
        console.error(e)
        res.send(`${e}`)
    }   
})


module.exports = router;
    