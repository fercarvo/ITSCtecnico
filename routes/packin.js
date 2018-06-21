var express = require('express');
var router = express.Router();
var login = require('./login').router
var { pool } = require('../util/DB.js');
var multer  = require('multer')
var upload = multer({ dest: 'packin/' })
var request = require('request')
var fs = require('fs')

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
            var promise = callWebService(
                `https://tecnico.itsc.ec/packin_files/${req.file.filename}.zip`,
                req.file.originalname,
                'Y',
                server 
            )

            promise.then(data => {
                return {data, status: "resolved"}
            }).catch(data => {
                return {data, status: "rejected"}
            })

            promises.push(promise)
        }

        var results = await Promise.all(promises)
        console.log(results)
        subidos = results.filter(r => r.status === "resolved").map(r => r.data)
        errores = results.filter(r => r.status === "rejected").map(r => r.data)

        console.log("subidos", subidos)
        console.log("errores", errores)

        res.json({subidos, error: errores})
    } catch (e) {
        console.log(e);
        res.status(500).json({subidos, error: [e.message]})

    } finally {
        fs.unlink(newpath, err => err ? console.log("Err Eliminar archivo: ", err) : console.log('finalizado'))
    }
})

async function getServerData (servers_arr) { 
    var query = `
        select
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
                     <_0:val>${url_file}</_0:val>
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

    return new Promise((resolve, reject) => {
        var options = { 
            method: 'POST',
            url: `http://${server.url}/ADInterface/services/ModelADService`,
            headers: { 
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/xml; charset=utf-8' 
            },
            body: soap 
        }
    
        request(options, function (error, response, body) {
            if (error) 
                return reject(error.message + ' servidor: ' + server.name)

            if (response && (response.statusCode === 200 || response.statusCode === 302) )
                return resolve({server: server.name, body});
            
            reject(response.statusCode + ' ' + response.statusMessage + ' ' + server.name)    
        })    
    })    
}

async function rename (oldpath, newpath) {
    return new Promise((resolve, reject) => {
        fs.rename(oldpath, newpath, err => err ? reject(err) : resolve())
    })
}



module.exports = router;