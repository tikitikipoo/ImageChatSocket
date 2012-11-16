(function( win, doc, $, undefined ) {

"use strict";

$(function() {

    //socket.ioのサーバにに接続
    var socket = io.connect('http://'+location.host+'/')
      , $textarea       = $("#comment")
      , $action_comment = $("#action")
      , $items          = $('#items');

    function renderItem(data) {

        var node = document.getElementById('item-tmpl').cloneNode(true),
            $item = $(node);

        $item.removeAttr("id");
        $item.attr("data-role-time", +new Date(data.date));
        $item.find(".date").text( dqx.misc.format_date(data.date));
        $item.find(".name").text( "投稿者：" + data.name );
        $item.find("pre").text( data.comment );

//        $items.prepend($('<div/>').text(data.text));
        $items.prepend( $item );
        $item.show( 'slow' );
    }

    //サーバからmessageイベントが送信された時
    socket.on('message',function(data){
        renderItem(data);
    });
    //sendボタンがクリックされた時
    $('#send').click(function(e){
        e.preventDefault();

        var comment = $('#comment').val(),
            name    = $('#name').val();

        if ( comment.length > 3000 ) {
            alert("コメントをもっと短くしてください＞＜")
            return false;
        }

        if ( !comment ) {
            alert("コメントを入力してください＞＜")
            return false;
        }

        if ( name.length > 20 ) {
            alert("名前をもっと短くしてください＞＜")
            return false;
        }

        if ( !name ) {
            alert("名前を入力してください＞＜")
            return false;
        }

        $textarea.height("20px")
        $textarea.val('');
        $action_comment.hide();

        $('#name').val('名無しさん');

        //サーバにテキストを送信
        socket.emit('message',{
            comment : comment,
            name    : name});

        var data = {};
        data.comment = comment;
        data.name    = name;
        data.date    = new Date;

        renderItem(data);
    });

});

})( window, document, jQuery );
