import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()
const app = express();
app.use(cors())
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ORIGIN_DOMAIN,
    methods: "GET, POST, PUT, DELETE"
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
    } else {
      const getUserLogin = activeUsers.find(user => user.userId == userLoginId)

      if (socket.id != getUserLogin.socketId) {
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
    console.log(data)
    const user = activeUsers.find(user => user.userId == receiverId)

    if (user) {
      console.log(user)
      io.to(user.socketId).emit(`receive-data`, {
        text: message,
        senderId
      })
    }
  })

  socket.on('disconnect', (userId) => {
    activeUsers = activeUsers.filter(activeUser => activeUser.userId != userId)
  })

  socket.on('logout', ({ userId }) => {
    activeUsers = activeUsers.filter(activeUser => activeUser.userId != userId)
    io.emit('get-users', activeUsers)
  })
});



httpServer.listen(3000, () => {
  console.log(`server running on port 3000`)
}); 