const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

let current_users = {};
let game_state = {};
let num_rooms = 0;
let random_games = [];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

function remove_username(usrname) {
    let clr = current_users[usrname];
    delete current_users[usrname];
    return clr;
}

io.on('connection', function(socket) {
    let username = uniqueNamesGenerator({ dictionaries: [adjectives, adjectives, animals] });
    console.log(username + ' connected...');
    current_users[username] = 1;
    socket.emit('your_username', username);

    socket.on('prior_username', function(usrname){
        console.log('  Prior user detected, changing to: ' + usrname);
        username = usrname;
        remove_username(username);
        current_users[usrname] = -1;
    });

    socket.on('new_game', function(){
        console.log('Creating new game and waiting for friend...');
        console.log('  ' + username + ' joining room ' + num_rooms);
        socket.join(num_rooms);
        socket.emit('connectToRoom', 'Send your username to a friend and tell them to enter it in the text box. The game will start after they enter your username. Please wait...');
        // Save what room the user is assigned to
        current_users[username] = num_rooms;
        // Initialize empty game board at same key as room id
        let matrix = new Array(7).fill(0).map(() => new Array(7).fill(0));
        game_state[num_rooms] = {'board': matrix, 'player1': username};
        num_rooms++;
    });

    socket.on('join_game', function(target_username){
        if (current_users.hasOwnProperty(target_username)) {
            // If room has 2 users, reject connection
            let room = current_users[target_username];
            if(io.sockets.adapter.rooms[room]
                && io.sockets.adapter.rooms[room].length > 1) {
                socket.emit('alert_mesg', 'User is already in a game, please enter another username.');
            } else {
                console.log('Connecting user from game code...');
                console.log('  ' + username + ' joining room ' + room);
                socket.join(room);
                current_users[username] = room;
                game_state[room]['player2'] = username;
                // Announce game start
                let firstTurn = [target_username, username][Math.floor(Math.random()*2)];
                game_state[room]['turn'] = firstTurn;
                io.sockets.in(room).emit('game_start', game_state[room]);
            }
        } else {
            // Tell user no such user exists
            socket.emit('alert_mesg', 'No such user exists, please enter a valid username to join game.');
        }
    });

    socket.on('join_random_game', function(){
        console.log('Attempting to join random game...');
        // Iterate through current_users to see if any single players waiting
        for (let i = 0; i < random_games.length; i++) {
            let room = random_games[i];
            // Check if room is valid and is waiting for another player
            if (io.sockets.adapter.rooms[room] && io.sockets.adapter.rooms[room].length === 1) {
                console.log('  ' + username + ' joining room ' + room);
                socket.join(room);
                current_users[username] = room;
                game_state[room]['player2'] = username;
                // Remove room from array of single players waiting to play
                random_games.splice(i, 1);
                // Announce game start
                let firstTurn = [game_state[room]['player1'], game_state[room]['player2']][Math.floor(Math.random()*2)];
                game_state[room]['turn'] = firstTurn;
                io.sockets.in(room).emit('game_start', game_state[room]);
                return;
            }
        }
        // If for loop completes, no available games found
        // Start new game and wait for another random join request
        console.log('  No game available, creating new game...');
        console.log('  ' + username + ' joining room ' + num_rooms);
        socket.join(num_rooms);
        socket.emit('connectToRoom', 'Game will start when another player joins a random game. Please wait for another player...');
        // Save what room the user is assigned to
        current_users[username] = num_rooms;
        // Add room to list of waiting random players
        random_games.push(num_rooms);
        // Initialize empty game board at same key as room id
        let matrix = new Array(7).fill(0).map(() => new Array(7).fill(0));
        game_state[num_rooms] = {'board': matrix, 'player1': username};
        num_rooms++;
    });

    socket.on('disconnect', function(){
        console.log(username + ' disconnected...');
        remove_username(username);
    });
});

http.listen(3000, function() {
    console.log('Listening on *:3000');
});