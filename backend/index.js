import axios from 'axios';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] // Replace with your frontend domain in production
    : ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite's default dev server ports
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));

const server = http.createServer(app);

// === Add a basic route to prevent 404 during health check ===
app.get('/', (req, res) => {
  res.send('Server is up and running.');
});

// === Socket.IO Setup ===
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('🔌 New user connected:', socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on('join', ({ roomId, userName }) => {
    console.log(`${userName} (${socket.id}) joining room ${roomId}`);

    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).users.delete(currentUser);
      socket.leave(currentRoom);
      const usersList = Array.from(rooms.get(currentRoom).users);
      console.log(`Users in previous room ${currentRoom}:`, usersList);
      io.to(currentRoom).emit('userJoined', usersList);
    }

    currentRoom = roomId;
    currentUser = userName;
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Set(),
        code: "",
        language: "javascript"
      });
    }

    const room = rooms.get(roomId);
    room.users.add(userName);

    socket.emit("codeUpdate", room.code);
    socket.emit("languageUpdate", room.language);

    const usersList = Array.from(room.users);
    console.log(`Users in room ${roomId}:`, usersList);
    console.log(`Number of users in room ${roomId}:`, usersList.length);
    io.to(roomId).emit('userJoined', usersList);
  });

  socket.on('codeChange', ({ roomId, code }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
      io.to(roomId).emit('codeUpdate', code);
    }
  });

  socket.on('languageChange', ({ roomId, language }) => {
    console.log(`Language in room ${roomId} changed to ${language}`);
    if (rooms.has(roomId)) {
      rooms.get(roomId).language = language;
      io.to(roomId).emit('languageUpdate', language);
    }
  });

  socket.on('typing', ({ roomId, userName }) => {
    io.to(roomId).emit('userTyping', { userName });
  });

  socket.on("compileCode", async ({ code, roomId, language, input }) => {
    try {
      if (rooms.has(roomId)) {
        console.log(`Executing code for ${roomId} in ${language}`);

        const languageMap = {
          javascript: { language: 'javascript', version: '18.15.0' },
          python: { language: 'python', version: '3.10.0' },
          java: { language: 'java', version: '15.0.2' },
          cpp: { language: 'cpp', version: '10.2.0' }
        };

        const langConfig = languageMap[language];
        if (!langConfig) throw new Error(`Unsupported language: ${language}`);

        const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
          language: langConfig.language,
          version: langConfig.version,
          files: [{ content: code }],
          stdin: input
        });

        if (response.data?.run) {
          io.to(roomId).emit("codeResponse", response.data);
        } else {
          throw new Error('Invalid response from Piston API');
        }
      }
    } catch (error) {
      console.error("Compile error:", error.response?.data || error.message);
      io.to(roomId).emit("codeResponse", {
        run: {
          error: error.response?.data?.message || "Execution failed.",
          stderr: error.response?.data?.stderr || error.message
        }
      });
    }
  });

  socket.on('leaveRoom', ({ roomId, userName }) => {
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.users.delete(userName);

      if (room.users.size === 0) {
        rooms.delete(roomId);
      } else {
        const usersList = Array.from(room.users);
        io.to(roomId).emit('userJoined', usersList);
      }

      socket.leave(roomId);
      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.users.delete(currentUser);

      if (room.users.size === 0) {
        rooms.delete(currentRoom);
      } else {
        const usersList = Array.from(room.users);
        io.to(currentRoom).emit('userJoined', usersList);
      }
    }
  });
});

// === Start Server ===
const PORT = 1111;
app.get('/', (req, res) => {
  res.send('Server is up and running.');
});
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
