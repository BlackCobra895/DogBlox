const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, '../public')));

const players = {};
const blockChanges = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  players[socket.id] = {
    id: socket.id,
    username: 'Player_' + socket.id.substring(0, 4),
    x: 8,
    y: 5,
    z: 8,
    yaw: 0,
    rank: 'Pup'
  };

  console.log('Sending init to', socket.id);
  socket.emit('init', {
    id: socket.id,
    players: players,
    blockChanges: blockChanges
  });

  socket.broadcast.emit('playerJoined', players[socket.id]);

  socket.on('setProfile', (data) => {
    if (players[socket.id]) {
      players[socket.id].username = data.username || players[socket.id].username;
      players[socket.id].rank = data.rank || 'Pup';
      io.emit('playerUpdated', players[socket.id]);
    }
  });

  socket.on('playerMove', (data) => {
    if (players[socket.id]) {
      players[socket.id].x   = data.x;
      players[socket.id].y   = data.y;
      players[socket.id].z   = data.z;
      players[socket.id].yaw = data.yaw;
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  socket.on('blockChange', (data) => {
    const key = `${data.x},${data.y},${data.z}`;
    if (data.type === null) {
      delete blockChanges[key];
    } else {
      blockChanges[key] = data.type;
    }
    socket.broadcast.emit('blockChanged', data);
  });

  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', data);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`DogBlox server running on port ${PORT}`);
});