var express = require('express');
var request = require('request');
var router = express.Router();
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })
var fs = require('fs')


router.post('/savefile', upload.single('file_jar_tecnico'), async function (req, res, next) {
    console.log(req.query)
    var newpath = ""
    try {
        var oldpath = `${__dirname}/../uploads/${req.file.filename}`;
        var newpath = `${__dirname}/../uploads/${req.file.filename}.jar`;
        await rename(oldpath, newpath)

        var data = await sendPackage(newpath, 'localhost:8088', 'SuperUser', 'System')
        console.log(data)
        
        res.send(data)
    } catch (e) {
        next(e);
    } finally {
        fs.unlink(newpath, err => err ? console.log(err) : console.log('finalizado'))
    }
})

async function rename (oldpath, newpath) {
    return new Promise((resolve, reject) => {
        fs.rename(oldpath, newpath, err => err ? reject(err) : resolve())
    })
}


//var auth = `Basic ${Buffer.from('SuperUser', 'ASCII').toString('base64')}:${Buffer.from('System', 'ASCII').toString('base64')}`
//var auth2 = "Basic U3VwZXJVc2VyOlN5c3RlbQ=="

//router.post('/update', bodyParser.text({type: '*/*'}), function (req, res, next) {
/*
    var options = { 
    method: 'POST',
    url: 'http://localhost:8088/osgi/system/console/bundles',
    headers: 
    { 'Postman-Token': '6fd9e0f2-f3ac-44f6-acd3-54c7744c5917',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
        'Cache-Control': 'no-cache',
        'Authorization': 'Basic U3VwZXJVc2VyOlN5c3RlbQ==',
        //'Content-Type': 'application/x-www-form-urlencoded',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
    formData: 
    { action: 'install',
        bundlestart: 'start',
        refreshPackages: 'refresh',
        bundlestartlevel: '1',
        bundlefile: 
        { value: fs.createReadStream("C:\\Users\\ITSC04\\Documents\\plugins\\plugins\\ec.itsc.crm_1.0.0.201806111750.jar"),
            options: 
            { filename: 'C:\\Users\\ITSC04\\Documents\\plugins\\plugins\\ec.itsc.crm_1.0.0.201806111750.jar',
            contentType: null } } } };


    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        //console.log(response)
        console.log("bien")
      
        console.log(" " + response.statusCode + response.statusMessage);
        res.send(" " + response.statusCode + response.statusMessage)

      });
})*/

router.get('/update', function (req, res, next){
    res.render('update')
})




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

        console.log(options)
        
        request(options, function (error, response) {
            if (error) 
                return reject(new Error(error))
            
            if (response && response.statusCode !== '200')
                return reject(new Error({code: response.statusCode, message: response.statusMessage}))

            resolve({code: response.statusCode, message: response.statusMessage})      
        })    
    })    
} 






































module.exports = router;