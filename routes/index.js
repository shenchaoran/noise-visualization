var express = require('express');
var router = express.Router();
let DataRouter = require('./data.route')
module.exports = router;

router.route('/')
    .get((req, res, next) => {
        res.render('index');
    });

router.use('/data', DataRouter);