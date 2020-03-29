$(function () {
    let socket = io();
    let onlineusers = {};
    let username = '';
    let cookiename = 'game-username'

    socket.on('connect', function () {
      // Check if username cookie exists on connect
      if (document.cookie.split(';').filter((item) => item.trim().startsWith(cookiename + '=')).length) {
        // If username exists, use that username
        let usrname = document.cookie.replace(/(?:(?:^|.*;\s*)socketio-chat-username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        socket.emit('prior username', usrname);
      }
    });

    socket.on('your_username', function(usrname){
      username = usrname;
      document.cookie = cookiename + '=' + usrname;
      $('#username').text(username);
    });

    socket.on('current_users', function(users){
        console.log(users);
    //   $('#onlineusers').empty();
    //   onlineusers = users;
    //   for (const user of Object.keys(users)) {
    //     let listitem = $('<li>');
    //     listitem.text(user)
    //     listitem.css('color', onlineusers[user]);
    //     $('#onlineusers').append(listitem);
    //   }
    });
});