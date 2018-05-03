var child_process = require('child_process');
var Promise = require('bluebird');
var path = require('path');
var http = require('http');

var ChildProcess = {};
module.exports = ChildProcess;

ChildProcess.getPort = () => {
    return new Promise((resolve, reject) => {
        const server = http.createServer();
        server.listen(0);
        server.on('listening', () => {
            const port = server.address().port;
            server.close();
            resolve(port);
        });
    });
};

ChildProcess.newProcess = () => {
    ChildProcess.getPort()
        .then(port => {
            let cmdLine = `ogr2ogr -t_srs "EPSG:4326" ${dist} ${src}`
            child_process.exec(cmdLine, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                }
                if (stderr) {
                    console.log(stderr);
                }
                console.log(stdout);

            });

        })
        .catch(error => {
            console.log(error);
        })
}

ChildProcess.newScanProcess = () => {
    return new Promise((resolve, reject) => {
        ChildProcess.getPort()
            .then(port => {
                var cpPath = path.join(__dirname, 'scan.controller.js');
                var cp = child_process.fork(cpPath, [], {
                    execArgv: ['--inspect=' + port]
                });
                cp.send({
                    code: 'scan'
                });
                cp.on('message', m => {
                    if (m.code === 'state') {
                        cp.kill();
                        return resolve(m.hasFinished);
                    }
                });
            })
            .catch(err => {
                return reject(err);
            });
    })
}