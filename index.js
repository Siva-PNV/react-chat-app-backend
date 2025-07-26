

const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { mongoURI } = require("./config");
app.use(cors());

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const messageSchema = new mongoose.Schema({
  room: String,
  author: String,
  message: String,
  time: String,
  createdAt: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://personal-chat-appl.netlify.app",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);


  socket.on("join_room", async (room) => {
    socket.join(room);
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
    // Send previous messages for the room
    try {
      const messages = await Message.find({ room }).sort({ createdAt: 1 }).limit(50);
      socket.emit("previous_messages", messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  });

  socket.on("send_message", async (data) => {
    // Save message to DB
    try {
      const msg = new Message(data);
      await msg.save();
    } catch (err) {
      console.error("Error saving message:", err);
    }
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
