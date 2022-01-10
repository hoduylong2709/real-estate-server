const express = require('express');
const http = require('http');
require('./db/mongoose');
const userRouter = require('./routers/user');
const categoryRouter = require('./routers/category');
const listingRouter = require('./routers/listing');
const ratingRouter = require('./routers/rating');
const conversationRouter = require('./routers/conversation');
const messageRouter = require('./routers/message');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(categoryRouter);
app.use(listingRouter);
app.use(ratingRouter);
app.use(conversationRouter);
app.use(messageRouter);

const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some(user => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = socketId => {
  users = users.filter(user => user.socketId !== socketId);
};

const getUser = userId => {
  return users.find(user => user.userId === userId);
};

io.on('connection', socket => {
  console.log('A user connected.');

  // Take userId and socketId from user connected
  socket.on('addUser', userId => {
    addUser(userId, socket.id);
  });

  socket.on('getUsers', () => {
    io.emit('getUsers', users);
  });

  // Send and get message
  socket.on('sendMessage', message => {
    console.log(message);
    const user = getUser(message.receiverId);
    console.log(user);
    io.to(user.socketId).emit('getMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
    removeUser(socket.id);
    console.log('users', users);
    io.emit('getUsers', users);
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});