/* need jquery.js */
var dqx = {};
dqx.misc = (function( win, doc, $, undefined ) {

"use strict";

function render_date (target_date) {
  return new Date(("" + target_date).replace("GMT+0000","GMT-0900"));
};

function format_date ( target_date ) {
  target_date = new Date(("" + target_date).replace("GMT+0000","GMT-0900"));
  return target_date.getFullYear() + "/"
      + (+target_date.getMonth() + 1) + "/"
      + target_date.getDate() + "("
      + (["日","月","火","水","木","金","土"])[target_date.getDay()] + ")"
      + target_date.getHours() + "時"
      + target_date.getMinutes() + "分"
      + target_date.getSeconds() + "秒";
}

function escapeHTML(str) {
    if (!str) return;
    return str.replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/**
 * @return {Object.<function>}
 */
function Deferred() {
    /*-------------------------------------------
        INIT
    -------------------------------------------*/
    var queue = [],
        data;

    /*-------------------------------------------
        PUBLIC
    -------------------------------------------*/
    /**
     *  @param {*}
     */
    function resolve(arg) {
        var arr = [].concat(queue),
            len = arr.length,
            i   = 0,
            fnc;

        queue = null;
        data  = arg;
        for (; i < len; ++i) {
            fnc = arr[i];

            if (typeof fnc === "function") {
                fnc(arg);
            }
        }
    }
    function done(fnc) {
        if (typeof fnc === "function") {
            queue ? queue.push(fnc) : fnc(data);
        }
    }
    /*-------------------------------------------
        EXPORT
    -------------------------------------------*/
    return {
        resolve : resolve,
        done    : done
    };
}

function DeferredQueue() {
    /*-------------------------------------------
        INIT
    -------------------------------------------*/
    var queue   = [],
        isReady = 1;

    /*-------------------------------------------
        PRIVATE
    -------------------------------------------*/
    function exec() {
        var len = queue.length,
            fnc, ret;

        isReady = !len;
        if (len) {
            fnc = queue.shift();
            ret = fnc();
            (ret && ret.done) ? ret.done(exec) : setTimeout(exec, 0);
        }
    }
    /*-------------------------------------------
        PUBLIC
    -------------------------------------------*/
    function push(fnc) {
        var arr = queue;

        arr.push(fnc);
        if (isReady) {
            exec();
        }
    }
    /*-------------------------------------------
        EXPORT
    -------------------------------------------*/
    return {
        push : push
    };
}

/**
 * 自動読み込み処理
 */
function Autoload(targetSelector, callback) {

    // 初期化
    var that = this,
        _window         = $(win),
        _target         = $(targetSelector),
        _threshold      = 30,
        _limitContent   = 20000,
        _loading        = false,
        _permitAutoload = true;

    var _check = function() {

        if (!_permitAutoload)
            return;

        var content = _target.offset().top + _target.height();
        var display = _window.scrollTop() + _window.height();
        if (content > _limitContent){
            _permitAutoload = false;
        }
        if (content - display < _threshold){
            return true;
        } else {
            return false;
        }
    };

    var _load = function () {
        callback(function() {
            _loading = false;
        });
    }

    // スクロールイベント発火設定
    _window.on("scroll", function() {

        if (_check()) {

            if (_loading) {
                return;
            }
            _loading = true;

            _load();
        }
    });

};

$(function() {

var $livecamera = $("#livecamera")
  , $action_comment = $("#action")
  , $textarea = $("#comment");

$textarea.focus(function() {
    $(this).height("60px");
    $action_comment.show();
});

$("#cancel").on('click', function() {
    $textarea.height("20px")
    $textarea.val('');
    $action_comment.hide();
});

$("form").on("submit", function() {

    var comment = $("#comment").val()
      , name = $("#name").val();

    if ( comment.length > 3000 ) {
        return false;
    }

    if ( !comment ) {
        return false;
    }

    if ( name.length > 20 ) {
        return false;
    }

    if ( !name ) {
        return false;
    }

    $('#comment').val('');
    $('#name').val('');
    return false;

});

new Autoload("#items", function(autoloadCallback) {

    var last_time = $(".item:last-child", "#items").attr("data-role-time"),
        token = $("#token", "#form").val();

    if ( last_time ) {
        $.ajax({
            type   : "GET",
            url    : "/past_timeline?time=" + last_time + "&token=" + token,
            success: function(data, dataType) {
                var _data = JSON.parse(data);
                if (_data.result === true) {
                    var $items = $("#items")
                      , fragment = document.createDocumentFragment();

                    if ( !_data.items.length ) {
                        return;
                    }

                    $.each( _data.items, function(i, item) {
                        var _item = document.getElementById('item-tmpl').cloneNode(true),
                            $item = $(_item);

                        $item.css("display", "block");
                        $item.attr("id", item._id);
                        $item.attr("data-role-time", +new Date(item.date));
                        $item.find(".date").text( format_date(item.date));
                        $item.find(".name").text( "投稿者：" + item.name );
                        $item.find("pre").text( item.comment );
                        fragment.appendChild( _item );
                    } );

                    $items.append( fragment );
                    fragment = null;
                    setTimeout(function() {
                        console.log("autoloadCallback");
                        autoloadCallback();
                    }, 1500);
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert('Error : ' + errorThrown);
                setTimeout(function() {
                    autoloadCallback();
                }, 1500);
            }
        });
    }

});


function getLiveCamera() {
    $.ajax({
        type   : "GET",
        url    : "/livecamera?time=" +(+new Date),
        success: function(data, dataType) {
            $livecamera.attr("src", data);
        }
    });
}

function getNewestTimeline() {
    var newest_time = $(".item:first-child", "#items").attr("data-role-time"),
        token = $("#token", "#form").val();

    if ( newest_time && token ) {
        $.ajax({
            type   : "GET",
            url    : "/new_timeline?time=" +(+newest_time) + "&token=" + token,
            success: function(data, dataType) {
                var _data = JSON.parse(data);
                if (_data.result === true) {
                    var $items = $("#items")
                      , fragment = document.createDocumentFragment()
                      , queue = []
                      , dfdQueue = new DeferredQueue;

                    $.each( _data.items, function(i, item) {

                        var _item = document.getElementById('item-tmpl').cloneNode(true),
                            $item = $(_item);


                        $item.attr("id", item._id);
                        $item.attr("data-role-time", +new Date(item.date));
                        $item.find(".date").text( format_date(item.date));
                        $item.find(".name").text( "投稿者：" + item.name);
                        $item.find("pre").text(item.comment);
                        fragment.appendChild( _item );
                        queue.push( $item );
                    } );

                    $items.prepend( fragment );
                    fragment = null;

                    $.each( queue.reverse(), function(i, $item) {
                        dfdQueue.push( function() {
                            var dfd = new Deferred;
                            $item.show(1000, function() {
                                dfd.resolve();
                            });
                            return dfd
                        });
                    });

//console.log( document.getElementById('item-tmpl').cloneNode(true));
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log('Error : ' + errorThrown);
            }
        });
    }
}

setInterval( getLiveCamera, 27000);
//setInterval( getNewestTimeline, 30000);

});

return {
    format_date : format_date
}

})( window, document, jQuery );
