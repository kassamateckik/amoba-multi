const socket = io();

let currentRoomName = "";
let playerID = "";
let currentRoom = {};
let role = "";
let canplace = true;

const table = document.querySelector("table");
const actPlayerSpan = document.querySelector("#actPlayer");

document.getElementById("createBtn").onclick = () => {
	const roomName = document.getElementById("newRoom").value;
	const password = document.getElementById("newPassword").value;
	socket.emit("createRoom", { roomName, password }, (res) => {
		if (res.success) joinRoom(roomName, password);
		else alert(res.message);
	});
};

document.getElementById("joinBtn").onclick = () => {
	const roomName = document.getElementById("joinRoom").value;
	const password = document.getElementById("joinPassword").value;
	joinRoom(roomName, password);
};

function joinRoom(roomName, password) {
	socket.emit("joinRoom", { roomName, password }, (res) => {
		if (res.success) {
			currentRoomName = roomName;
			document.getElementById("chatArea").style.display = "block";
			document.querySelector("main").style.display = "none"
			document.getElementById("roomTitle").innerText = roomName;
		} else {
			alert(res.message);
		}
	});
}

document.querySelectorAll("td").forEach(td => {
	td.addEventListener("click", place);
});

function place(e) {
	if (!canplace) return;
	const td = e.target;
	socket.emit("click", { roomName : currentRoomName, row : td.dataset.row, column : td.dataset.column, role });
}

socket.on("msg", ({ map, prevPlayer, winner = "none" }) => {
	if (winner != "none"){
		if (winner == role) alert("Nyertél!");
		else alert("Vesztettél!");
		return;
	}

	canplace = prevPlayer != role;
	if (prevPlayer != role) actPlayerSpan.innerText = "Te";
	else actPlayerSpan.innerText = "Ellenfél";
	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 3; col++) {
			table.rows[row].cells[col].innerText = map[row][col];
		}
	}
});

socket.on("start", ({ room }) => {
	currentRoom = room;
	role = currentRoom.users.filter((u) => u.id == playerID)[0].role;
})

socket.on("id", ({ id }) => {
	playerID = id;
})