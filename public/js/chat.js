$(function () {
    var username =  prompt('请输入昵称');
    $('.name').html(username)
    var input = $('.inputMessage');
    // 默认链接到渲染页面的服务器
    var socket = io();
    function scrollToBottom () {
        $('#chat-area').scrollTop($('#chat-area')[0].scrollHeight);
    };

    socket.on('connect', function () {
        var name = $('.name').text() ||'匿名';
        socket.emit('join',name);
    })
    socket.on('sys', function (msg) {
        $('.messages').append('<p>'+msg+'</p>');
        // 滚动条滚动到底部
        scrollToBottom();
    });
    socket.on('listchange', function (msg) {
        $('.messages').append('<p>'+msg+'</p>');
        // 滚动条滚动到底部
        scrollToBottom();
    });
    socket.on('new message', function (msg,user) {
        $('.messages').append('<font color="green">' + '<p>'+user+'说：'+msg+'</p>' +'</font>');
        // 滚动条滚动到底部
        scrollToBottom();
    });
    socket.on('sys message', function (msg,user) {
        $('.messages').append('<font color="red">' + '<p>'+msg+'</p>' +'</font>');
        // 滚动条滚动到底部
        scrollToBottom();
    });
    socket.on('private message', function (msg,user,toUser) {
        $('.messages').append('<font color="blue">' +'<p>'+ user+'悄悄对'+toUser+'说：'+msg+'</p>' +'</font>');
        // 滚动条滚动到底部
        scrollToBottom();
    });
    input.on('keydown',function (e) {
        if (e.which === 13) {
            var message = $(this).val();
            if (!message) {
                return ;
            }
            socket.send(message);
            $(this).val('');
        }else if( e.which ===192 )
        {
            socket.emit('list','');
        }
    });
});