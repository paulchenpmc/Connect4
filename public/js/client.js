$(function () {
    let socket = io();
    let username = '';
    let cosmetic_username = null;
    let opponent = '';
    let cookie_username = 'game-username';
    let cookie_theme = 'game-theme';
    let last_game_state = {'board': new Array(7).fill(0).map(() => new Array(7).fill(0))};
    let selected_theme = 0;
    let color_themes = [
      // board, empty space, your piece, opponent piece
      ['#D4B483', '#E4DFDA', '#C1666B', '#4281A4'], // Classic
      ['#A37B73', '#DBBEA1', '#DB7F67', '#3F292B'], // Autumn
      ['#545E75', '#82A0BC', '#63ADF2', '#304D6D'], // Ocean
    ];

    socket.on('connect', function () {

    });

    let getCookie = function(name) {
      var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
      return v ? v[2] : null;
    }

    let initializeGameHTML = function(){
      // Create game board html
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
      // Show theme switching html
      $('#theme_form').css('display', 'flex')
      // Register click handlers after creation
      $('.square').click(function() {
        let user_turn = $('#turn').text().replace('Turn: ', '');
        if (user_turn !== username && user_turn !== cosmetic_username) return; // Do not send moves when it is not your turn
        let grid_position = $(this).attr('id').replace('square', '').split('-');
        let x = grid_position[0];
        let y = grid_position[1];
        let moveObject = {'player': username, 'move': [x,y]};
        socket.emit('player_move', moveObject);
      });

      $('.square').mouseleave(function () {
        $(this).css('background', color_themes[selected_theme][0]);
      });

      $('.square').mouseenter(function() {
        let user_turn = $('#turn').text().replace('Turn: ', '');
        if (user_turn !== username && user_turn !== cosmetic_username) return; // Do not send moves when it is not your turn
        let grid_position = $(this).attr('id').replace('square', '').split('-');
        let x = parseInt(grid_position[0]);
        let y = parseInt(grid_position[1]);
        let y_lowest_empty_space = last_game_state['board'][x].lastIndexOf(0);
        let highlight_color = 'red';
        if (last_game_state['board'][x][y] === 0 && y === y_lowest_empty_space) highlight_color = 'green';
        $(this).css('background', highlight_color);
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
      last_game_state = gameData;
    }

    let applyCosmeticUsername = function() {
      if (cosmetic_username === null) return;

      $(".contains_username").each(function() {
        let text = $(this).text();
        text = text.replace(username, cosmetic_username);
        $(this).text(text);
      });
    }

    socket.on('your_username', function(usrname){
      // Check if username cookie exists on connect
      let cookie1 = getCookie(cookie_username);
      let cookie2 = getCookie(cookie_theme);
      if (cookie1 !== null && cookie2 !== null) {
        // If username exists, use that username
        let usrname = cookie1;
        selected_theme = cookie2;
        socket.emit('prior_username', usrname);
        username = usrname;
      } else {
        username = usrname;
        document.cookie = cookie_username + '=' + usrname;
        document.cookie = cookie_theme + '=' + selected_theme;
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
      initializeGameHTML();
      applyCosmeticUsername();
    });

    socket.on('game_update', function(gameData) {
      $('#turn').text('Turn: ' + gameData['turn']);
      // Redraw the game board
      updateGameBoard(gameData);
      applyCosmeticUsername();
    });

    $('#change_username_button').click(function() {
      let new_username = prompt('Enter new username:');
      if (!new_username.match(/^[0-9a-zA-Z]+$/)) {
        alert('Invalid username, please use alphanumeric characters.');
        return;
      }
      cosmetic_username = new_username;
      applyCosmeticUsername();
      socket.emit('username_change', cosmetic_username);
      document.cookie = cookie_username + '=' + cosmetic_username;
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

    $('input[type=radio]').on('change', function(){
      selected_theme = $(this).attr('value');
      document.cookie = cookie_theme + '=' + selected_theme;
      updateGameBoard(last_game_state);
    });
});