const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
  
    socket.on("join-room", (roomID) => {
      socket.join(roomID);
      const clients = [...io.sockets.adapter.rooms.get(roomID)];
      const otherClients = clients.filter(id => id !== socket.id);
  
      if (otherClients.length > 0) {
        socket.emit("other-user", otherClients[0]);
        io.to(otherClients[0]).emit("user-joined", socket.id);
      }
    });
  
    socket.on("send-signal", ({ targetID, signal }) => {
      io.to(targetID).emit("receive-signal", {
        signal,
        senderID: socket.id,
      });
    });
  
    socket.on("peer-connected", ({ targetID }) => {
      io.to(targetID).emit("peer-connected");
    });
  
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
  

server.listen(5000, () => {
  console.log("Signaling server running on http://localhost:5000");
});
