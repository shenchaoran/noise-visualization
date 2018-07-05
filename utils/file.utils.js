let Promise = require('bluebird');
let fs = Promise.promisifyAll(require('fs'))
let path = require('path');

/**
 * get all files of the first floor, without recur for the folders
 * @param {directory path} dir 
 */
exports.getAllFiles = (dir) => {
    let rst = [];
    return fs.readdirAsync(dir)
        .then(files => {
            return Promise.map(files, file => {
                let fpath = path.join(dir, file);
                return fs.statAsync(fpath)
                    .then(stats => {
                        if(stats.isFile()) {
                            rst.push(file);
                        }
                    })
                    .catch(e => {
                        // unexist
                    });
            })
        })
        .then(() => {
            return Promise.resolve(rst);
        })
}

/**
 * 每个STEP时间扫描fpath，持续到TIMEOUT，如果存在返回true，否则超时返回false
 * @param {the path of file to scan} fpath 
 */
exports.scan = (fpath, STEP, TIMEOUT) => {
    scanOnce = (p) => {
        return new Promise((resolve, reject) => {
            fs.statAsync(p)
                .then(() => {
                    return resolve(true);
                })
                .catch(e => {
                    return resolve(false);
                });
        });
    }

    STEP = STEP? STEP: 1000;
    TIMEOUT = TIMEOUT? TIMEOUT: 10000;

    // TODO 文件扫描时，可能写了一半，所以读到的数据也是一半
    return new Promise((resolve, reject) => {
        var count = 0;
        polling = () => {
            scanOnce(fpath)
                .then(exist => {
                    count++;
                    if(exist) {
                        // TODO 这里暂时用延迟返回，保证文件操作完毕
                        // setTimeout(() => {
                            return resolve(true);
                        // }, 2000);
                    }
                    else {
                        if (TIMEOUT < count * STEP) {
                            return resolve(false);
                        }
                        else {
                            setTimeout(polling, STEP);
                        }
                    }
                })
                .catch(reject)
        };

        polling();
    });

}