$(function () {
    let socket = io();
    let username = '';
    let opponent = '';
    let cookie_username = 'game-username'
    let last_game_state = new Array(7).fill(0).map(() => new Array(7).fill(0));
    let selected_theme = 0;
    let color_themes = [
      // board color, empty, your piece, opponent piece
      ['#D4B483', '#E4DFDA', '#C1666B', '#4281A4'], // Classic
      ['#A37B73', '#DBBEA1', '#DB7F67', '#3F292B'], // Autumn
      ['#545E75', '#82A0BC', '#63ADF2', '#304D6D'], // Ocean
    ]

    socket.on('connect', function () {

    });

    let getCookie = function(name) {
      var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
      return v ? v[2] : null;
    }

    let initializeGameBoardHTML = function(){
      let cols = $(".col");
      for (let x = 0; x < cols.length; x++) {
        for (let y = 0; y < 7; y++) {
          let square = document.createElement('div');
          let circle = document.createElement('div');
          circle.id = '' + x + '-' + y;
          circle.className = 'circle';
          square.id = 'square' + x + '-' + y;
          square.className = 'square';
          // Set css
          circle.setAttribute('style', 'background:' + color_themes[selected_theme][1]);
          square.setAttribute('style', 'background:' + color_themes[selected_theme][0]);
          // Append to DOM
          square.appendChild(circle);
          cols[x].appendChild(square) ;
        }
      }

      // Register click handler for squares after creation
      $('.square').click(function() {
        let user_turn = $('#turn').text().replace('Turn: ', '');
        if (user_turn !== username) return; // Do not send moves when it is not your turn
        let grid_position = $(this).attr('id').replace('square', '').split('-');
        let x = grid_position[0];
        let y = grid_position[1];
        let moveObject = {'player': username, 'move': [x,y]};
        console.log(moveObject);
        socket.emit('player_move', moveObject);
      });
    }

    let updateGameBoard = function(gameData) {
      let col_divs = $(".col");
      for (let x = 0; x < gameData['board'].length; x++) {
        let col = gameData['board'][x];
        for (let y = 0; y < col.length; y++) {
          let grid_val = 1; // Default empty color
          if (col[y] === username) grid_val = 2; // Your color
          else if (col[y] === opponent) grid_val = 3; // Opponent color
          let circle_color = color_themes[selected_theme][grid_val]; // Get color from theme palette
          // Update css
          let circle_id = '' + x + '-' + y;
          let square_id = 'square' + x + '-' + y;
          $('#' + circle_id).css('background', circle_color);
          $('#' + square_id).css('background', color_themes[selected_theme][0]);
        }
      }
      last_game_state = gameData['board'];
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
      $('#username').text('Username: ' + username);
    });

    socket.on('alert_mesg', function(mesg) {
      alert(mesg);
    });

    socket.on('connectToRoom', function(mesg) {
      $('#banner_message').text(mesg);
    });

    socket.on('game_start', function(gameData) {
      $('.matchmaking').remove();
      $('#banner_message').remove();
      opponent = gameData['player1'];
      if (opponent === username) opponent = gameData['player2'];
      $('#players').text(username + ', you are playing ' + opponent);
      $('#turn').text('Turn: ' + gameData['turn']);
      initializeGameBoardHTML();
    });

    socket.on('game_update', function(gameData) {
      $('#turn').text('Turn: ' + gameData['turn']);
      // Redraw the game board
      updateGameBoard(gameData);
    });

    $('#newgame_button').click(function() {
      socket.emit('new_game');
      $('.matchmaking').remove();
    });

    $('#joinrandomgame_button').click(function() {
      socket.emit('join_random_game');
      $('.matchmaking').remove();
    });

    $('#joingame_form').submit(function(e){
      e.preventDefault(); // prevents page reloading
      let game_code = $('#m').val();
      if (game_code === '') return false;
      socket.emit('join_game', game_code);
      return false;
    });
});