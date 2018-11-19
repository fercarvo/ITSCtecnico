var { pool } = require('../util/DB.js');
var request = require('request')
var fs = require('fs')
const host = 'https://tecnico.itsc.ec'

/**
 * Funcion que retorna el nombre, id y url de todos los servidores disponibles
 * 
 * @returns {Promise<Array<{id:number, name:string, url:string}>>} Info basica de los servidores
 */
async function getAllServers () {
    var query = `
        select
            tb_servidoresidempiere_id as id,
            name as name,
            url
        from tb_servidoresidempiere
        where isactive = 'Y'`;

    var { rows } = await pool.query(query);
    return rows;
}

/**
 * Funcion que recibe una lista de IDs de servidores y retorna una lista con su data
 * 
 * @param {Array<number>} servers_arr id de los servidores
 * @returns {Promise<Array<{id:number, username:string, password:string, name:string, url:string}>>} Arreglo de info de servidores
 */
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
            isactive = 'Y' and
            tb_servidoresidempiere_id in (${servers_arr.join(',')})`;

    var { rows } = await pool.query(query);    
    return rows
}

/**
 * Funcion que envia un requerimiento POST multipart/form-data con un paquete .jar a un servidor iDempiere
 * Similar al de la interfaz OSGI
 * 
 * @author Edgar Carvajal <https://fercarvo.github.io>
 * 
 * @param {ReadableStream} file Archivo que sera enviado
 * @param {string} filename nombre del archivo a ser enviado
 * @param {Object} server servidor que recibira el request
 * @param {string} server.url url del servidor
 * @param {string} server.username usuario de iDempiere
 * @param {string} server.password clave del usuario de iDempiere
 * @returns {Promise<{servidor:string, data:string, resolved:boolean}>} Si resolved es true, se subio con exito
 */
function sendPackage(file, filename, server) {
    var btoa = txt => Buffer.from(txt, 'binary').toString('base64');

    return new Promise(resolve => {
        var options = { 
            method: 'POST',
            url: `${server.url}/osgi/system/console/bundles`,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
                'Cache-Control': 'no-cache',
                'Authorization': `Basic ${btoa(server.username + ":" + server.password)}`,
                'content-type': 'multipart/form-data;' 
            },
            formData: { 
                action: 'install',
                bundlestart: 'start',
                refreshPackages: 'refresh',
                bundlestartlevel: '1',
                bundlefile: { 
                    value: file,
                    options: { 
                        filename: filename,
                        contentType: null 
                    } 
                } 
            },
            timeout: 1000*90  //Si se demora mas de 1 minuto y medio se cancela la conexion  
        }
    
        request(options, function (error, response) {
            if (error) {
                resolve({
                    servidor: server.url,
                    data: error.message,
                    resolved: false
                })
            } else if (response && (response.statusCode === 200 || response.statusCode === 302) ) {
                resolve({
                    servidor: server.url,
                    data: response.statusMessage,
                    resolved: true
                })
            } else {
                resolve({
                    servidor: server.url,
                    data: `HTTP code: ${response.statusCode}, message: ${response.statusMessage}`,
                    resolved: false
                })
            }   
        })    
    })    
}

/**
 * 
 * Funcion que llama al web service CrearPackInWeb que debera estar instalado y funcionando en dicho
 * servidor iDempiere, esta funcion es un fork de nodejs_idempierewebservice
 * 
 * @link nodejs_idempierewebservice https://github.com/fercarvo/nodejs_idempierewebservice
 * 
 * @author Edgar Carvajal <https://fercarvo.github.io>
 * 
 * @param {string} url_file path del archivo donde podra descargarse la data
 * @param {string} file_name nombre del archivo .zip
 * @param {Object} server servidor a recibir el web service
 * @param {string} server.name nombre del servidor
 * @param {string} server.url url del servidor
 * @param {string} server.username usuario de iDempiere
 * @param {string} server.password clave del usuario de iDempiere
 * @returns {Promise<{data:string | {server:string,body:string}, resolved:boolean}>} Si resolved true, exito
 */
function callWebService(url_file, file_name, server) {
    var soap = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:_0="http://idempiere.org/ADInterface/1_0">
   <soapenv:Header/>
   <soapenv:Body>
      <_0:runProcess>
         <_0:ModelRunProcessRequest>
            <_0:ModelRunProcess>
               <_0:serviceType>CrearPackInWeb</_0:serviceType>
               <_0:ParamValues>

                  <_0:field column="esSistema">
                     <_0:val>Y</_0:val>
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
            body: soap, 
            timeout: 60*1000 //Si se demora mas de 1 minuto se cancela la conexion 
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

/**
 * Funcion que renombra un archivo, cortar y pegar
 * 
 * @param {string} oldpath viejo nombre (path)
 * @param {string} newpath nuevo nombre (path)
 */
async function rename (oldpath, newpath) {
    return new Promise((resolve, reject) => {
        fs.rename(oldpath, newpath, err => err ? reject(err) : resolve())
    })
}


module.exports = {
    getAllServers,
    getServerData,
    sendPackage,
    rename,
    callWebService
}