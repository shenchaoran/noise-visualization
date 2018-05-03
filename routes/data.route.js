let DataCtrl = require('../controllers/data.controller');
let express = require('express');
let formidable = require('formidable');
let setting = require('../config/setting');
let router = express.Router();
module.exports = router;

router.route('/')
    .post((req, res, next) => {
        let form = new formidable.IncomingForm();
		form.encoding = 'utf-8';
		form.uploadDir = setting.geo_data.path;
		form.keepExtensions = true;
		form.maxFieldsSize = setting.geo_data.max_size;
		form.parse(req, (err, fields, files) => {
			if (err) {
				return next(err);
            }
            else {
                DataCtrl.insert(fields, files)
                    .then(rst => {
                        return res.json(rst);
                    })
                    .catch(next);
            }
        });
    });

router.route('/convert')
    .post((req, res, next) => {
        let form = new formidable.IncomingForm();
		form.encoding = 'utf-8';
		form.uploadDir = setting.geo_data.path;
		form.keepExtensions = true;
		form.maxFieldsSize = setting.geo_data.max_size;
		form.parse(req, (err, fields, files) => {
			if (err) {
				return res.json({
                    err: err
                });
            }
            else {
                DataCtrl.convert(fields, files)
                    .then(rst => {
                        return res.json({
                            err: null,
                            data: rst
                        });
                    })
                    .catch(e => {
                        return res.json({
                            err: e
                        })
                    });
            }
        });
    });

router.route('/:id')
    .get((req, res, next) => {
        DataCtrl.download(req.params.id)
            .then(rst => {
                res.set({
                    'Content-Type': 'file/*',
                    'Content-Length': rst.length,
                    'Content-Disposition': 'attachment;filename=' +
                        encodeURIComponent(rst.filename)
                });
                return res.end(rst.data);
            });
    });