const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessages = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUser } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Bot

const botName = 'fellow Bot';

// Run when client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessages(botName, 'Welcome to fellowSpace!'));

    // Broadcast when a user connect
    socket.broadcast.to(user.room).emit('message', formatMessages(botName, `Another user has joined the chat`));

    // Send user and room info
    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUser(user.room)
    });

    });

    // Listen for chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        
        io.to(user.room).emit('message', formatMessages('Anonymous User', msg));
    });

     // When disconnected
     socket.on('disconnect', () => {
         const user = userLeave(socket.id);

         if (user) {
            io.to(user.room).emit('message', formatMessages(botName, `A user has left the chat`));
             // Send user and room info
             io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUser(user.room)
             });      
         }
        
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));