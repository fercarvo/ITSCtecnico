var { spawn } = require('child_process')
var child = spawn('/usr/bin/env', ['login']);
child.stdin.setEncoding('utf-8');

child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
    //Here is where the output goes
});
child.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
    //Here is where the error output goes
});
child.on('close', function(code) {
    console.log('closing code: ' + code);
    //Here you can get the exit code of the script
});



child.stdin.write("idempiere\n");
child.stdin.end();

child.stdin.write("idempiere\n");
child.stdin.end();