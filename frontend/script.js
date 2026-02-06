    const socket = io();

    let currentRoom = "";

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
          currentRoom = roomName;
          document.getElementById("chatArea").style.display = "block";
          document.getElementById("roomTitle").innerText = roomName;
        } else {
          alert(res.message);
        }
      });
    }

    // ["ta1","ta2","ta3","ta4"].forEach(id => {
    //   const ta = document.getElementById(id);
    //   ta.addEventListener("keypress", (e) => {
    //     if (e.key === "Enter") {
    //       e.preventDefault();
    //       const msg = ta.value;
    //       socket.emit("chatMessage", { roomName: currentRoom, textarea: id, message: msg });
    //       ta.value = "";
    //     }
    //   });
    // });

    socket.on("chatMessage", ({ textarea, message }) => {
      const ta = document.getElementById(textarea);
      ta.value += message + "\n";
    });