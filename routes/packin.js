var express = require('express');
var router = express.Router();
var login = require('./login').router
var { pool } = require('../util/DB.js');
var multer  = require('multer')
var upload = multer({ dest: 'packin/' })
var request = require('request')
var fs = require('fs')
var host = "https://tecnico.itsc.ec"
//var host_ip = "http://149.56.109.174:3000";

router.post('/packin', login.validarSesion, upload.single('file_zip_tecnico'), async function (req, res, next) {
    var newpath = ""
    var subidos = []
    var errores = []
    var promises = []
    try {
        var oldpath = `${__dirname}/../packin/${req.file.filename}`;
        var newpath = `${__dirname}/../public/packin_files/${req.file.filename}.zip`;
        await rename(oldpath, newpath)

        var data_sv_arr = await getServerData([...req.query.servers.split(',')]);

        for (var server of data_sv_arr) {
            promises.push( callWebService(
                `/packin_files/${req.file.filename}.zip`,
                req.file.originalname,
                'Y',
                server 
            ))
        }

        var results = await Promise.all(promises)

        subidos = results.filter(r => r.resolved).map(r => r.data)
        errores = results.filter(r => !r.resolved).map(r => r.data)

        res.json({subidos, error: errores})
    } catch (e) {
        console.log(e);
        res.status(500).json({
            subidos, 
            error: errores.push(e.message)
        })

    } finally {
        fs.unlink(newpath, err => err ? console.log("Err Eliminar archivo: ", err) : console.log('finalizado Pack-in'))
    }
})

async function getServerData (servers_arr) { 
    var query = `
        select
            TB_ServidoresIdempiere_ID as id,
            username, 
            password,
            name, 
            url 
        from tb_servidoresidempiere
        where 
            isactive = 'Y'
            and tb_servidoresidempiere_id in (${servers_arr.join(',')})`;

    var { rows } = await pool.query(query);    
    return rows
}

function callWebService(url_file, file_name, esSistema, server) {
    var soap = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:_0="http://idempiere.org/ADInterface/1_0">
   <soapenv:Header/>
   <soapenv:Body>
      <_0:runProcess>
         <_0:ModelRunProcessRequest>
            <_0:ModelRunProcess>
               <_0:serviceType>CrearPackInWeb</_0:serviceType>
               <_0:ParamValues>
                  <!--Zero or more repetitions:-->
                  <_0:field column="esSistema">
                     <_0:val>${esSistema}</_0:val>
                  </_0:field>

                  <_0:field column="name">
                     <_0:val>${file_name}</_0:val>
                  </_0:field>

                  <_0:field column="url">
                     <_0:val>${host + url_file}</_0:val>
                  </_0:field>

               </_0:ParamValues>
            </_0:ModelRunProcess>
            <_0:ADLoginRequest>
               <_0:user>${server.username}</_0:user>
               <_0:pass>${server.password}</_0:pass>
               <_0:lang>es_EC</_0:lang>
               <_0:ClientID>0</_0:ClientID>
               <_0:RoleID>0</_0:RoleID>
               <_0:OrgID>0</_0:OrgID>
               <_0:WarehouseID>0</_0:WarehouseID>
               <_0:stage>0</_0:stage>
            </_0:ADLoginRequest>
         </_0:ModelRunProcessRequest>
      </_0:runProcess>
   </soapenv:Body>
</soapenv:Envelope>`

    return new Promise(resolve => {
        var options = { 
            method: 'POST',
            url: `${server.url}/ADInterface/services/ModelADService`,
            headers: { 
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/xml; charset=utf-8' 
            },
            body: soap 
        }
    
        request(options, function (error, response, body) {
            if (error) {
                return resolve({
                    data: error.message + ' servidor: ' + server.name, 
                    resolved: false
                })
            } else if (response && (response.statusCode === 200 || response.statusCode === 302) ) {
                return resolve({
                    data: {server: server.name, body},
                    resolved: true
                })
            } else {
                resolve({
                    data:  response.statusCode + ' ' + response.statusMessage + ' ' + server.name, 
                    resolved: false
                })                   
            }                
        })    
    })    
}

async function rename (oldpath, newpath) {
    return new Promise((resolve, reject) => {
        fs.rename(oldpath, newpath, err => err ? reject(err) : resolve())
    })
}



module.exports = router;