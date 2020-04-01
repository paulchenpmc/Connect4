const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

let current_users = {};
let game_state = {};
let num_rooms = 0;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/game', function(req, res) {
    res.sendFile(__dirname + '/public/game.html');
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
        console.log('Creating new game...');
        console.log('  ' + username + ' joining room ' + num_rooms);
        socket.join(num_rooms)
        // Save what room the user is assigned to
        current_users[username] = num_rooms;
        // Initialize empty game board at same key as room id
        let matrix = new Array(7).fill(0).map(() => new Array(7).fill(0));
        game_state[num_rooms] = matrix;
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
                // Announce game start
                io.sockets.in(room).emit('game_start', '');
            }
        } else {
            // Tell user no such user exists
            socket.emit('alert_mesg', 'No such user exists, please enter a valid username to join game.');
        }
    });

    socket.on('join_random_game', function(){
        console.log('Attempting to join random game...');
        // Iterate through current_users to see if any single players waiting
        for (const room of Object.keys(io.sockets.adapter.rooms)) {
            // Check if room is a number (aka a game room, and not a socket.io default room) and is waiting
            if (!isNaN(room) && io.sockets.adapter.rooms[room].length === 1) {
                console.log('  ' + username + ' joining room ' + room);
                socket.join(room);
                current_users[username] = room;
                // Announce game start
                io.sockets.in(room).emit('game_start', '');
                return;
            }
        }
        // If for loop completes, no available games found
        socket.emit('alert_mesg', 'No available games found.');
    });

    socket.on('disconnect', function(){
        console.log(username + ' disconnected...');
        remove_username(username);
    });
});

http.listen(3000, function() {
    console.log('Listening on *:3000');
});