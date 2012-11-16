var request  = require("request")
  , model    = require("../model")
  , async    = require("async")
  , Post     = model.Post
  , Utils    = require("../utils")
  , Helpers  = require("../helpers").helpers
  , PER_PAGE = 20;

/*
 * GET home page.
 */

exports.index = function(req, res){

  req.session.token = +new Date;

  async.parallel({
    getItems: function(callback){
      Post.find().limit(PER_PAGE).sort({date:-1}).exec(function(err, items){
        callback( err, items );
      });
    },
    getImage: function(callback) {
      getLiveCameraImage( req, res, function(err, image) {
        callback( err, image );
      });
    },
    getItemCount: function(callback) {
      Post.count().exec(function(err, result){
        callback( err, result);
      });
    }
  }, function(err, result) {
    res.render('index', {
        title  : 'ライブカメラ',
        items  : result.getItems,
        image  : result.getImage,
        count  : result.getItemCount,
        isNext : ((result.getItemCount || 0 ) > PER_PAGE),
        helper : Helpers,
        token  : req.session.token })
  });
};

exports.create = function(req, res){
//  var comment = Utils.escapeHTML( req.body.comment )
//    , name    = Utils.escapeHTML( req.body.name )
  var comment = req.body.comment
    , name    = req.body.name
    , newPost = new Post();

  if ( !comment || !name ) {
    res.redirect('back');
    return;
  }

  if ( req.session.token != req.body.token ) {
    res.redirect('back');
    return;
  }

  newPost.comment = comment;
  newPost.name    = name;
  newPost.save(function(err){
    if (err) {
      console.log( "err" + err );
      res.redirect('back');
    } else {
      res.redirect('/');
    }
  });
};

exports.livecamera = function(req, res){
  getLiveCameraImage(req, res, function(err, image, content_type) {
    var header  = {'Content-Type': content_type};
    return res.send( image, header, 200);
  });
};

function getLiveCameraImage(req, res, callback) {
  var url, date;
  date = +new Date;
  // your live image
  url = unescape("something live image url" + date);
  return request({
    uri: url,
    encoding: 'binary'
  }, function(error, response, body) {
    var data_uri_prefix, image;
    if (!error && response.statusCode === 200) {
      data_uri_prefix = "data:" + response.headers["content-type"] + ";base64,";
      image = new Buffer(body.toString(), "binary").toString("base64");
      image = data_uri_prefix + image;
      callback( null, image, response.headers["content-type"] );
//       return res.send("<img src=\"" + image + "\"/>");
    } else {
      callback( error, null );
    }
  });
}

exports.new_timeline = function( req, res ) {
  var header  = {'Content-Type': 'application/json'}
    , info  = {}
    , time  = req.query.time
    , token = req.query.token;

  if ( !/[0-9]{13}/.test(time) ||
    req.session.token != token ) {
    info.result = false;
    info.message = '不正なアクセスです';
    res.send(JSON.stringify(info), header, 200);
    return;
  }

  //
  Post.where('date').gt(new Date(+time)).select().limit(PER_PAGE).sort({date:-1}).exec(
    function(err, items){

    if (err) {
      console.log( "err" + err );
      info.result = false;
    } else {
      info.result = true;
    }

    info.items = items || [];
    res.send(JSON.stringify(info), header, 200);
  });
};

exports.past_timeline = function(req, res) {
  var header  = {'Content-Type': 'application/json'}
    , info  = {}
    , time  = req.query.time
    , token = req.query.token;

  if ( !/[0-9]{13}/.test(time) ||
    req.session.token != token ) {
    info.result = false;
    info.message = '不正なアクセスです';
    res.send(JSON.stringify(info), header, 200);
    return;
  }

  Post.where('date').lt(new Date(+time)).select().limit(PER_PAGE).sort({date:-1}).exec(
    function(err, items){

    if (err) {
      console.log( "err" + err );
      info.result = false;
    } else {
      info.result = true;
    }

    info.items = items || [];
    res.send(JSON.stringify(info), header, 200);
  });
};
