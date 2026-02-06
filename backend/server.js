import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors : {
    origin : "*"
  }
});

app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

// Szobák: { roomName: { password, users: [] } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("Új felhasználó csatlakozott:", socket.id);

  socket.on("createRoom", ({ roomName, password }, callback) => {
    if (rooms[roomName]) {
      return callback({ success: false, message: "A szoba már létezik" });
    }
    rooms[roomName] = { password, users: [] };
    callback({ success: true });
  });

  socket.on("joinRoom", ({ roomName, password }, callback) => {
    const room = rooms[roomName];
    if (!room) return callback({ success: false, message: "A szoba nem létezik" });
    if (room.password !== password) return callback({ success: false, message: "Hibás jelszó" });
    if (room.users.length >= 2) return callback({ success: false, message: "A szoba megtelt" });

    socket.join(roomName);
    room.users.push(socket.id);
    callback({ success: true });
  });

  socket.on("chatMessage", ({ roomName, textarea, message }) => {
    // Mindenki kapja a szobán belül
    io.to(roomName).emit("chatMessage", { textarea, message });
  });

  socket.on("disconnecting", () => {
    for (const roomName of socket.rooms) {
      if (rooms[roomName]) {
        rooms[roomName].users = rooms[roomName].users.filter(id => id !== socket.id);
        // Ha üres a szoba, töröljük
        if (rooms[roomName].users.length === 0) delete rooms[roomName];
      }
    }
  });
});

server.listen(3000, () => console.log("Server fut a 3000-es porton"));
