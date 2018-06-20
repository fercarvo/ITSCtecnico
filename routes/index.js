var express = require('express');
var router = express.Router();
var login = require('./login').router
var { pool } = require('../util/DB.js');
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })
var request = require('request')
var fs = require('fs')

router.use(login.validarSesion, (req, res, next) => next());

router.post('/packin', upload.single('file_jar_tecnico'), async function (req, res, next) {
    var newpath = ""
    var subidos = []
    try {
        var oldpath = `${__dirname}/../uploads/${req.file.filename}`;
        var newpath = `${__dirname}/../uploads/${req.file.filename}.jar`;
        await rename(oldpath, newpath)

        var data_sv_arr = await getServerData([...req.query.servers.split(',')]);

        for (var sv of data_sv_arr) {
            await sendPackage(newpath, sv.url, sv.username, sv.password)
            subidos.push(sv.url)
        }

        res.json({subidos})
    } catch (e) {
        console.log(e);
        res.status(500).json({subidos: subidos, error: e.message})

    } finally {
        fs.unlink(newpath, err => err ? console.log("Err Eliminar archivo: ", err) : console.log('finalizado'))
    }
})

router.get('/servidor', async function (req, res, next) {
    try {
        var query = `
            select
                tb_servidoresidempiere_id as id,
                name as name
            from tb_servidoresidempiere
            where isactive = 'Y'`;

        var { rows } = await pool.query(query);
        
        res.set('Cache-Control', 'private, max-age=30');
        res.json(rows);
    } catch (e) {
        next((e))
    }
})

async function getServerData (servers_arr) { 
    var query = `
        select
            username, 
            password, 
            url 
        from tb_servidoresidempiere
        where 
            isactive = 'Y'
            and tb_servidoresidempiere_id in (${servers_arr.join(',')})`;

    var { rows } = await pool.query(query);    
    return rows
}


function sendPackage(file, server, user, password) {
    var btoa = txt => Buffer.from(txt, 'binary').toString('base64');

    return new Promise((resolve, reject) => {
        var options = { 
            method: 'POST',
            url: `http://${server}/osgi/system/console/bundles`,
            headers: { 
                'Postman-Token': '6fd9e0f2-f3ac-44f6-acd3-54c7744c5917',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
                'Cache-Control': 'no-cache',
                'Authorization': `Basic ${btoa(user + ":" + password)}`,
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' 
            },
            formData: { 
                action: 'install',
                bundlestart: 'start',
                refreshPackages: 'refresh',
                bundlestartlevel: '1',
                bundlefile: { 
                    value: fs.createReadStream(file),
                    options: { 
                        filename: file,
                        contentType: null 
                    } 
                } 
            } 
        }
    
        request(options, function (error, response) {
            if (error) 
                return reject(new Error(error.message + ' servidor: ' + server))

            if (response && (response.statusCode === 200 || response.statusCode === 302) )
                return resolve({code: response.statusCode, message: response.statusMessage})    
            
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