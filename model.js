var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/yoursocketdb');

function validator(v) {
      return v.length > 0;
}

var Post = new mongoose.Schema({
        comment: { type: String, validate: [validator, "Empty Error"] }
      , name   : { type: String, validate: [validator, "Empty Error"] }
      , date   : { type: Date, default: Date.now }
});

var PostObj = db.model('Post', Post);

var insertPost = function(data, callback) {
  var comment = data.comment
    , name    = data.name
    , newPost = new PostObj();

  if ( !comment || !name ) {
    callback("nothing comment or name");
    return;
  }

//  if ( req.session.token != req.body.token ) {
//    return;
//  }

  newPost.comment = comment;
  newPost.name    = name;
  newPost.save(function(err){
    if (err) {
      console.log( "err" + err );
      callback( err );
    } else {
      callback( null );
    }
  });
}

exports.Post = PostObj;
exports.insertPost = insertPost;
