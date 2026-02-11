const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

// React dev server runs on 5173
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    // CREATE ROOM (creator also joins)
    socket.on("create_room", ({ name, room }) => {
        if (!name || !room) return;

        socket.data.name = name;
        socket.data.room = room;

        socket.join(room);

        socket.emit("system_message", { text: `Room "${room}" created ✅` });
        socket.to(room).emit("system_message", { text: `${name} created the room` });
    });

    // JOIN ROOM
    socket.on("join_room", ({ name, room }) => {
        if (!name || !room) return;

        socket.data.name = name;
        socket.data.room = room;

        socket.join(room);

        socket.emit("system_message", { text: `Welcome ${name}!` });
        socket.to(room).emit("system_message", { text: `${name} joined the room` });
    });

    // SEND MESSAGE
    socket.on("send_message", ({ room, name, message }) => {
        if (!room || !name || !message) return;

        io.to(room).emit("receive_message", {
            name,
            message,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
    });

    // TYPING INDICATOR
    socket.on("typing", ({ room, name, isTyping }) => {
        if (!room || !name) return;

        socket.to(room).emit("typing", {
            name,
            isTyping: !!isTyping,
        });
    });

    // DISCONNECT (LEAVE ROOM)
    socket.on("disconnect", () => {
        const { name, room } = socket.data || {};
        if (!name || !room) return;

        socket.to(room).emit("system_message", { text: `${name} left the room` });
        socket.to(room).emit("typing", { name, isTyping: false }); // clear typing state
    });
});

app.get("/", (req, res) => {
    res.send("Chatter server running ✅");
});

server.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});