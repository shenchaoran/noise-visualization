var express = require('express');
var router = express.Router();
module.exports = router;

router.route('/')
    .get((req, res, next) => {
        res.render('index');
    });