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
    try {
        var oldpath = `${__dirname}/../packin/${req.file.filename}`;
        var newpath = `${__dirname}/../public/packin_files/${req.file.filename}.jar`;
        await rename(oldpath, newpath)

        var data_sv_arr = await getServerData([...req.query.servers.split(',')]);

        for (var sv of data_sv_arr) {
            var body = await callWebService(
                `https://tecnico.itsc.ec/packin_files/${req.file.filename}.jar`,
                req.file.originalname,
                'Y',
                sv.url,
                sv.username,
                sv.password 
            )
            console.log(body)
            subidos.push({server: sv.name, body})
        }

        res.json({subidos})
    } catch (e) {
        console.log(e);
        res.status(500).json({subidos: subidos, error: e.message})

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

function callWebService(url_file, file_name, esSistema, server, user, password) {
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
               <_0:user>${user}</_0:user>
               <_0:pass>${password}</_0:pass>
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
            url: `http://${server}/ADInterface/services/ModelADService`,
            headers: { 
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/xml; charset=utf-8' 
            },
            body: soap 
        }
    
        request(options, function (error, response, body) {
            if (error) 
                return reject(new Error(error.message + ' servidor: ' + server))

            if (response && (response.statusCode === 200 || response.statusCode === 302) )
                return resolve(body);
            
            reject(new Error(response.statusCode + ' ' + response.statusMessage + ' ' + server))    
        })    
    })    
}

async function rename (oldpath, newpath) {
    return new Promise((resolve, reject) => {
        fs.rename(oldpath, newpath, err => err ? reject(err) : resolve())
    })
}



module.exports = router;








var a = `
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body><ns1:runProcessResponse xmlns:ns1="http://idempiereorg/ADInterface/1_0">
        <RunProcessResponse xmlns="http://idempiere.org/ADInterface/1_0" IsError="false">
            <Error>Processed=22 Un-Resolved=0</Error>
            <Summary>Processed=22 Un-Resolved=0</Summary>
            <LogInfo></LogInfo>
        </RunProcessResponse>
    </ns1:runProcessResponse></soap:Body>
</soap:Envelope>
`
var b = `
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body><ns1:runProcessResponse xmlns:ns1="http://idempiere.org/ADInterface/1_0">
        <RunProcessResponse xmlns="http://idempiere.org/ADInterface/1_0" IsError="true">
            <Error>Service type CrearPackInWeb not configured</Error>
        </RunProcessResponse>
    </ns1:runProcessResponse></soap:Body>
</soap:Envelope>
`