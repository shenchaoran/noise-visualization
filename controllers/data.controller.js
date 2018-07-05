let Promise = require('bluebird');
let path = require('path');
let ObjectID = require('mongodb').ObjectID;
let fs = Promise.promisifyAll(require('fs'));
let unzip = require('unzip');
let setting = require('../config/setting');
let geoDataDB = require('../models/data.model');
let _ = require('lodash');
let FileUtil = require('../utils/file.utils');
let CPUtil = require('../utils/child_process.utils');
let cp = Promise.promisifyAll(require('child_process'));

module.exports = {
    /**
     * 条目保存到数据库，文件移动到geo_data中
     * 如果数据为zip则解压
     */
    insert: (fields, files) => {
        if (!files['myfile']) {
            return Promise.reject('invalid request body!');
        }
        let file = files['myfile'];
        let filename = file.name;
        let ext = filename.substr(filename.lastIndexOf('.'));
        let oid = new ObjectID();
        let newName = oid + ext;

        let newPath = path.join(
            setting.geo_data.path,
            newName
        );
        let unzipPath;
        return fs.renameAsync(file.path, newPath)
            .then(() => {
                return new Promise((resolve, reject) => {
                    if (ext !== '.zip') {
                        return resolve();
                    }
                    unzipPath = path.join(
                        setting.geo_data.path,
                        oid.toHexString()
                    );
                    fs
                        .createReadStream(newPath)
                        .pipe(unzip.Extract({
                            path: unzipPath
                        }))
                        .on('error', reject)
                        .on('close', () => {
                            return resolve();
                        });
                });
            })
            .then(() => geoDataDB.insert({
                _id: oid,
                fname: filename,
                desc: fields.desc
            }))
            .then(doc => Promise.resolve({
                _id: doc._id
            }))
            .catch(Promise.reject);
    },

    convert: (fields, files) => {
        if (!fields.from || !fields.to || !files['myfile']) {
            return Promise.reject('invalid request body!');
        }
        let file = files['myfile'];
        let filename = file.name;
        let ext = filename.substr(filename.lastIndexOf('.'));
        if (ext !== '.zip') {
            return Promise.reject('invalid file format!');
        }
        let oid = new ObjectID();
        let newName = oid + ext;

        let newPath = path.join(
            setting.geo_data.path,
            newName
        );

        let src;
        let dst;
        let unzipPath;
        return fs.renameAsync(file.path, newPath)
            .then(() => {
                unzipPath = path.join(
                    setting.geo_data.path,
                    oid.toHexString()
                );
                return new Promise((resolve, reject) => {
                    fs
                        .createReadStream(newPath)
                        .pipe(unzip.Extract({
                            path: unzipPath
                        }))
                        .on('error', reject)
                        .on('close', () => {
                            return resolve();
                        });
                });
            })
            .then(() => FileUtil.getAllFiles(unzipPath))
            .then(files => {
                if (fields.from === 'shp' && fields.to === 'geojson') {
                    let shp = _.filter(files, file => {
                        return /\.shp$/.test(file);
                    });
                    if (shp.length) {
                        shp = shp[0];
                        src = path.join(unzipPath, shp);
                        dst = path.join(unzipPath, shp.replace(/\.shp$/, '.json'));
                        let cmdLine = `ogr2ogr -f "GeoJSON" -t_srs "EPSG:4326" "${dst}" "${src}"`;
                        return new Promise((resolve, reject) => {
                            cp.exec(cmdLine, {
                                encoding: 'utf8'
                            }, (err, stdout, stderr) => {
                                if (err) {
                                    return Promise.reject(err);
                                } else {
                                    console.info(stdout);
                                    console.error(stderr);
                                    return resolve();
                                }
                            });
                        })
                            .then(() => FileUtil.scan(dst));
                    } else {
                        return Promise.reject('zip中不包括shapefile！');
                    }
                } else {
                    return Promise.reject('暂不支持其他格式的转换！');
                }
            })
            .then(exist => exist ? fs.readFileAsync(dst, {
                encoding: 'utf8'
            }) : Promise.reject('转换失败！'))
            .then(Promise.resolve)
            .catch(e => {
                console.log(e);
                return Promise.reject(e);
            })
    },

    download: (id) => {
        let fname;
        let fpath;
        let doc;
        return new Promise((resolve, reject) => {
            geoDataDB
                .findOne({
                    _id: id
                })
                .then(v => {
                    doc = v;
                    fname = doc.fname;
                    let ext = fname.substr(fname.lastIndexOf('.'));
                    fpath = path.join(
                        setting.geo_data.path,
                        doc._id.toHexString() + ext,
                    );
                    return fs.statAsync(fpath);
                })
                .then(stats => fs.readFileAsync(fpath))
                .then(data => resolve({
                    length: data.length,
                    filename: doc.fname,
                    data: data
                }))
                .catch(reject);
        });
    }
}