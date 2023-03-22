import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv'

dotenv.config()
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ORIGIN_DOMAIN
  }
});

let activeUsers = []

io.on("connection", (socket) => {

  console.log(socket.id)
  io.emit(`get-socket-id`, socket.id)

  // Generate user Login!
  socket.on('user-login', (userLoginId) => {
    if (!activeUsers.some(activeUser => activeUser.userId == userLoginId)) {
      activeUsers.push({
        userId: userLoginId,
        socketId: socket.id
      })
    }else {
      const getUserLogin = activeUsers.find(user => user.userId == userLoginId)

      if(socket.id != getUserLogin.socketId){
        const filterActiveUser = activeUsers.filter(user => user.userId != userLoginId)
        filterActiveUser.push({
          userId: userLoginId,
          socketId: socket.id
        })
  
        activeUsers = filterActiveUser
      }
    }

    console.log(activeUsers)
    io.emit('get-users', activeUsers)
  })

  // Send Message
  socket.on('send-message', (data) => {
    const { receiverId, message, senderId } = data
    const user = activeUsers.find(user => user.userId == receiverId)

    console.log(user)

    if(user) {
      console.log('tes')
      io.to(user.socketId).emit(`receive-data`, {
          text: message,
          senderId
      })
    }
  })


  socket.on('disconnect', (userId) => {
    activeUsers = activeUsers.filter(activeUser => activeUser.id != userId)
  })
});


httpServer.listen(3000, () => {
  console.log(`server running on port 3000`)
});