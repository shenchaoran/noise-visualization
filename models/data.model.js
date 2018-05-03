let Mongoose = require('./mongoose.base');
let mongoose = require('mongoose');

let schema = {
    fname: String,
    desc: String
};
let collectionName = 'Geo_Data';
let geoDataDB = new Mongoose(schema, collectionName);

module.exports = geoDataDB;