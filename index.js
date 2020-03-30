const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

let current_users = {};

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
    io.emit('current_users', current_users);

    socket.on('prior_username', function(usrname){
        console.log('  Prior user detected, changing to: ' + usrname);
        username = usrname;
        remove_username(username);
        current_users[usrname] = 1;
    });

    socket.on('disconnect', function(){
        console.log(username + ' disconnected...');
        remove_username(username);
        io.emit('current_users', current_users);
    });
});

http.listen(3000, function() {
    console.log('Listening on *:3000');
});