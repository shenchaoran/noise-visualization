let os = require('os');
let fs = require('fs');
let path = require('path');

module.exports = {
    port: 7777,
    mongodb: {
        name: 'N',
        host: '127.0.0.1',
        port: '27017'
    },
    geo_data: {
        path: path.join(__dirname, '../geo_data'),
        max_size: 500 * 1024 * 1024
    }
};