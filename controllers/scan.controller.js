var Promise = require('bluebird');
var path = require('path');
var _ = require('lodash');
var fs = Promise.promisifyAll(require('fs'));

var ScanCtrl = {};
module.exports = ScanCtrl;

ScanCtrl.scan = () => {
    // TODO 文件扫描时，可能写了一半，所以读到的数据也是一半
	var STEP = 2000;
	var TIMEOUT = 10000;
    return new Promise((resolve, reject) => {
        var count = 0;
        var interval = setInterval(() => {
            ScanCtrl.scanOnce()
                .then(hasFinished => {
                    console.log('scan: ' + hasFinished);
                    interval++;
                    if (hasFinished) {
                        clearInterval(interval);
                        // TODO 这里暂时用延迟返回，保证文件操作完毕
                        setTimeout(() => {
                            return resolve(true);
                        }, 5000);
                    } else {
                        if (TIMEOUT < count * STEP) {
                            return reject(false);
                        }
                    }
                });
        }, STEP);
    });
}

ScanCtrl.scanOnce = () => {
    var fPath1 = path.join(__dirname, '../matlab/mx_result.csv');
    var fPath2 = path.join(__dirname, '../matlab/my_result.csv');
    statFile = (fpath) => {
        return new Promise((resolve, reject) => {
            fs.stat(fpath, (err, stat) => {
                if (err) {
                    return resolve(false);
                } else {
                    return resolve(true);
                }
            });
        });
    }
    return Promise.all([
            statFile(fPath1),
            statFile(fPath2)
        ])
        .then(rsts => {
            if (rsts[0] && rsts[1]) {
                return Promise.resolve(true);
            } else {
                return Promise.resolve(false);
            }
        })
        .catch(err => {
            console.log(err);
            return Promise.reject(err);
        });
}

process.on('message', m => {
    if (m.code === 'scan') {
        return new Promise((resolve, reject) => {
            ScanCtrl.scan()
                .then((hasFinished) => {
                    process.send({
                        code: 'state',
                        hasFinished: hasFinished
                    });
                });
        });
    }
});