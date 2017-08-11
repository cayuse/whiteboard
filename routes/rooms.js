var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:roomId', function(req, res, next) {
    res.render('rooms', {roomId: req.params.roomId, realtime: false} );
});

module.exports = router;
