const socket = io();

let currentRoomName = "";
let playerID = "";
let currentRoom = {};
let role = "";
let canplace = true;
let isStarter = false;

const table = document.querySelector("table");
const actPlayerSpan = document.querySelector("#actPlayer");
const winnerH1 = document.querySelector("#winner");
const out = document.querySelector("#out")

setInterval(() => {
	getRooms();
}, 1000);

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
	socket.emit("joinRoom", { roomName, password, isStarter }, (res) => {
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

function gameEnd() {
	window.location.reload();
}

socket.on("msg", ({ map, prevPlayer, winner = "none" }) => {
	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 3; col++) {
			table.rows[row].cells[col].innerText = map[row][col];
		}
	}

	if (winner != "none"){
		if (winner == "draw"){
			winnerH1.innerText = "Döntetlen!";
			winnerH1.style.color = "gray";
		} 
		else if (winner == role) {
			winnerH1.innerText = "Nyertél!";
			winnerH1.style.color = "green";
		}
		else {
			winnerH1.innerText = "Vesztettél!";
			winnerH1.style.color = "red";
		}

		setTimeout(() => {
			gameEnd();
		}, 3000);
		return;
	}

	canplace = prevPlayer != role;
	if (prevPlayer != role) actPlayerSpan.innerText = "Te";
	else actPlayerSpan.innerText = "Ellenfél";
});

async function getRooms() {
	const rooms = await fetch("/rooms");
	const data = await rooms.json();
	document.querySelector("#rooms").innerText = "";
	for (const room of data.rooms) {
		document.querySelector("#rooms").innerText += room + "\n";
	}
}

socket.on("start", ({ room }) => {
	currentRoom = room;
	role = currentRoom.users.filter((u) => u.id == playerID)[0].role;
})

socket.on("id", ({ id }) => {
	playerID = id;
})

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

function makePizza() {
	document.querySelector("#pizzaBtn").style.display = "none";
	out.innerText = "Pizza készítése";
	sleep(3000).then(() => {
		out.innerText = "Tészta elkészült";
		return sleep(1000);
	}).then(() => {
		out.innerText = "Kelesztés kész";
		return sleep(1000);
	}).then(() => {
		out.innerText = "Nyújtás kész";
		return sleep(1000);
	}).then(() => {
		out.innerText = "Feltét kész";
		return sleep(5000);
	}).then(() => {
		out.innerHTML = `
			<img src="/pizza.jpg" alt="pizza">
			<p>Te kezded a játékot!</p>
		`;
		isStarter = true;
		document.querySelector("#pizzaBtn").style.display = "block";
	}).catch(() => {
		out.innerText = "Hiba";
	})
}