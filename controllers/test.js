var Promise = require('bluebird');
var path = require('path');
var _ = require('lodash');
var fs = Promise.promisifyAll(require('fs'));
var ChildProcess = require('./child-process.controller');
let FileUtil = require('../utils/file.utils');

fs.readFileAsync('F:/Cesium/n-visualization/geo_data/5ae6c17b3fae6e4860da75a4/Test_Point.json', {
    encoding: 'utf8'
})
    .then(data => {
        data;
    })
    .catch(e => {
        console.log(e);
    })

// FileUtil.getAllFiles(path.join(__dirname, '..'))
//     .then(files => {
//         console.log(files);
//     });

// fs.writeFileAsync(path.join(__dirname, '../matlab/mx.dat'), 'asdfasdfasdf')
//     .then(() => {;
//     })
//     .catch(console.log);


// var fPath1 = path.join(__dirname, '../matlab/mx_result.csv');
// fs.stat(fPath1, (err, stats) => {
//         if (err) {
//             console.log(err);
//         }
//         console.log(stats);
//     })
    // .then(stats => {
    //     console.log(stats);
    // })