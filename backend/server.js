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

const rooms = {};

app.get("/rooms", (_, res) => {
	res.status(200).json({ rooms : Object.keys(rooms)});
})

io.on("connection", (socket) => {
	console.log("Új felhasználó csatlakozott:", socket.id);

	socket.emit("id", { id : socket.id });

	socket.on("createRoom", ({ roomName, password }, callback) => {
		if (rooms[roomName]) {
			return callback({ success: false, message: "A szoba már létezik" });
		}
		rooms[roomName] = { password, users : [], map : [
															["", "", ""],
															["", "", ""],
															["", "", ""]
														] };
		socket.emit("newRoom");
		callback({ success: true });
	});

	socket.on("joinRoom", ({ roomName, password, isStarter }, callback) => {
			const room = rooms[roomName];
			if (!room) return callback({ success: false, message: "A szoba nem létezik" });
			if (room.password !== password) return callback({ success: false, message: "Hibás jelszó" });
			if (room.users.length >= 2) return callback({ success: false, message: "A szoba megtelt" });

			socket.join(roomName);
			if (room.users.length == 0) {
				room.users.push({ id : socket.id, role : "circle", isStarter });
			} else {
				room.users.push({ id : socket.id, role : "cross", isStarter });
			}

			if (room.users.length == 2) {
				const startingPlayerIndex = rng(0, 1);
				if (room.users[0].isStarter && !room.users[1].isStarter) startingPlayerIndex = 0;
				if (room.users[1].isStarter && !room.users[0].isStarter) startingPlayerIndex = 1;
				
				io.to(roomName).emit("start", { room });
				io.to(roomName).emit("msg", { map : rooms[roomName].map, prevPlayer : room.users[startingPlayerIndex == 1 ? 0 : 1].role });
			}

			callback({ success: true });
	});

	socket.on("click", ({ roomName, row, column, role }) => {
		if (rooms[roomName].map[row][column] != "") return;
		rooms[roomName].map[row][column] = role == "cross" ? "X" : "O";
		
		const winner = checkIfWinner(rooms[roomName].map);
		io.to(roomName).emit("msg", { map : rooms[roomName].map, prevPlayer : role, winner });
	});

	socket.on("disconnecting", () => {
			for (const roomName of socket.rooms) {
				if (rooms[roomName]) {
					rooms[roomName].users = rooms[roomName].users.filter(u => u.id !== socket.id);
					if (rooms[roomName].users.length === 0) delete rooms[roomName];
				}
			}
	});
});

function checkIfWinner(map) {
	if (map[0][0] == "O" && map[0][1] == "O" && map[0][2] == "O") return "circle";
	if (map[1][0] == "O" && map[1][1] == "O" && map[1][2] == "O") return "circle";
	if (map[2][0] == "O" && map[2][1] == "O" && map[2][2] == "O") return "circle";

	if (map[0][0] == "O" && map[1][0] == "O" && map[2][0] == "O") return "circle";
	if (map[0][1] == "O" && map[1][1] == "O" && map[2][1] == "O") return "circle";
	if (map[0][2] == "O" && map[1][2] == "O" && map[2][2] == "O") return "circle";

	if (map[0][0] == "O" && map[1][1] == "O" && map[2][2] == "O") return "circle";
	if (map[0][2] == "O" && map[1][1] == "O" && map[2][0] == "O") return "circle";

	
	if (map[0][0] == "X" && map[0][1] == "X" && map[0][2] == "X") return "cross";
	if (map[1][0] == "X" && map[1][1] == "X" && map[1][2] == "X") return "cross";
	if (map[2][0] == "X" && map[2][1] == "X" && map[2][2] == "X") return "cross";

	if (map[0][0] == "X" && map[1][0] == "X" && map[2][0] == "X") return "cross";
	if (map[0][1] == "X" && map[1][1] == "X" && map[2][1] == "X") return "cross";
	if (map[0][2] == "X" && map[1][2] == "X" && map[2][2] == "X") return "cross";

	if (map[0][0] == "X" && map[1][1] == "X" && map[2][2] == "X") return "cross";
	if (map[0][2] == "X" && map[1][1] == "X" && map[2][0] == "X") return "cross";

	if (map[0][0] != "" && map[0][1] != "" && map[0][2] != "" &&
		map[1][0] != "" && map[1][1] != "" && map[1][2] != "" &&
		map[2][0] != "" && map[2][1] != "" && map[2][2] != "")
	{
		return "draw";
	}

	return "none";
}

function rng(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

server.listen(3210, () => console.log("Server fut a 3210-es porton"));