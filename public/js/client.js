$(function () {
    let socket = io();
    let username = '';
    let cookie_username = 'game-username'

    socket.on('connect', function () {

    });

    let getCookie = function(name) {
      var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
      return v ? v[2] : null;
    }

    socket.on('your_username', function(usrname){
      // Check if username cookie exists on connect
      let cookie = getCookie(cookie_username);
      if (cookie !== null) {
        // If username exists, use that username
        let usrname = cookie;
        socket.emit('prior_username', usrname);
        username = usrname;
      } else {
        username = usrname;
        document.cookie = cookie_username + '=' + usrname;
      }
      $('#username').text(username);
    });

    socket.on('alert_mesg', function(mesg) {
      alert(mesg);
    });

    socket.on('connectToRoom', function(data) {

    });

    $('#newgame_button').click(function() {
      socket.emit('new_game');
    });

    $('#joinrandomgame_button').click(function() {
      socket.emit('join_random_game');
    });

    $('#joingame_form').submit(function(e){
      e.preventDefault(); // prevents page reloading
      let game_code = $('#m').val();
      if (game_code === '') return false;
      socket.emit('join_game', game_code);
      return false;
    });
});