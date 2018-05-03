let Promise = require('bluebird');
let mongoose = require('mongoose');
let _ = require('lodash');
let ObjectID = require('mongodb').ObjectID;
let setting = require('../config/setting');
let debug = require('debug');
let mongooseDebug = debug('WebNJGIS: Mongoose');
mongoose.Promise = require('bluebird');

let url ='mongodb://'+setting.mongodb.host +':' +setting.mongodb.port +'/' +setting.mongodb.name;
    
mongoose.connect(url);

mongoose.connection.on('connected', () => {
    mongooseDebug('Mongoose connected');
});

mongoose.connection.on('error', (err) => {
    mongooseDebug('Mongoose err\n' + err);
});

mongoose.connection.on('disconnected', () => {
    mongooseDebug('Mongoose disconnected');
});

module.exports = function Mongoose(schema, collectionName) {
    this.schema = new mongoose.Schema(schema, {
        collection: collectionName
    });
    this.model = mongoose.model(collectionName, this.schema);

    this.findOne = (where) => {
        return new Promise((resolve, reject) => {
            this.model.find(where, (err, docs) => {
                if (err) {
                    return reject(err);
                } else {
                    if(docs.length) {
                        return resolve(docs[0]._doc);
                    }
                    else {
                        return reject(new Error('Can\'t find data by ' + JSON.stringify(where)));
                    }
                }
            });
        });
    }

    this.find = (where) => {
        return new Promise((resolve, reject) => {
            this.model.find(where, (err, docs) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(_.map(docs, doc => {
                        return doc.toJSON();
                    }));
                }
            });
        });
    }

    /**
     * 分页查询
     * return 
     *      {
     *          count: number,
     *          docs: any[]
     *      }
     */
    this.findByPage = (where, pageOpt) => {
        return Promise.all([
            new Promise((resolve, reject) => {
                this.model
                    .find()
                    .count((err, count) => {
                        if (err) {
                            return reject(err)
                        } else {
                            return resolve(count);
                        }
                    });
            }),
            new Promise((resolve, reject) => {
                this.model
                    .find(where, (err, docs) => {
                        if (err) {
                            return reject(err);
                        } else {
                            return resolve(_.map(docs, doc => {
                                return doc.toJSON();
                            }));
                        }
                    })
                    .limit(pageOpt.pageSize)
                    .skip(pageOpt.pageSize* (pageOpt.pageNum- 1));
            })
        ])
            .then(rsts => {
                return Promise.resolve({
                    count: rsts[0],
                    docs: rsts[1]
                });
            })
            .catch(Promise.reject);
    }

    this.remove = (where) => {
        return new Promise((resolve, reject) => {
            this.model.remove(where, (err, doc) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(doc);
                }
            });
        });
    }

    this.insert = (item) => {
        let model = new this.model(item);
        return new Promise((resolve, reject) => {
            model.save((err, rst) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rst._doc);
                }
            });
        });
    }

    this.insertBatch = (docs, options) => {
        return new Promise((resolve, reject) => {
            this.model.collection.insert(docs, options, (err, rst) => {
                if(err) {
                    return reject(err);
                }
                else {
                    return resolve(rst);
                }
            });
        });
    }

    this.update = (where, update, options) => {
        return new Promise((resolve, reject) => {
            this.model.update(where, update, options, (err, rst) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rst);
                }
            });
        });
    }

    this.updateDoc = (doc) => {
        if(doc._id) {
            return new Promise((resolve, reject) => {
                this.model.update({_id: doc._id}, doc, undefined, (err, rst) => {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve(rst);
                    }
                });
            });
        }
        else {
            return Promise.reject();
        }
    }
}