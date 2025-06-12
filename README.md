# 🚀 CodeCollab – Real-Time Collaborative Code Editor

A powerful, web-based code editor enabling **real-time collaboration**, **multi-language code execution**, and **live output**, all within a sleek and responsive interface. Perfect for pair programming, interviews, live coding sessions, and remote team collaboration.

🌐 **Live Demo**: [CodeCollab on Render](https://collab-and-code-conquer-01.onrender.com/)

---

## ✨ Key Features

### 👨‍💻 Real-Time Collaboration
- Simultaneous code editing by multiple users in the same room
- Real-time code synchronization with live updates
- Typing indicators showing active users
- Presence detection for connected collaborators
- Unique room IDs for private sessions

### ⚙️ Code Execution
- Supports multiple popular programming languages
- Displays real-time output and error logs
- Handles standard input during execution
- **Supported Languages**:
  - JavaScript (Node.js 18.15.0)
  - Python (3.10.0)
  - Java (15.0.2)
  - C++ (10.2.0)

### 🎨 Modern UI/UX
- Integrated **Monaco Editor** (used in VS Code)
- Dark mode with syntax highlighting
- Responsive and minimal layout
- Toast notifications for real-time events
- Smooth animations for typing and presence indicators

---

## 🛠️ Tech Stack

### 🔹 Frontend
- **React.js** – Component-driven UI
- **Monaco Editor** – Code editing engine
- **Socket.IO (Client)** – Real-time event handling
- **React Toastify** – Notifications
- **CSS3** – Responsive styling & animations

### 🔸 Backend
- **Node.js + Express.js** – Server-side logic & APIs
- **Socket.IO (Server)** – WebSocket-based communication
- **Axios** – REST API interaction
- **Piston API** – Secure, sandboxed code execution

---

## 🔧 Core Implementation

### 📡 Real-Time Communication

```js
// Server-side code synchronization using Socket.IO
socket.on('codeChange', ({ roomId, code }) => {
  if (rooms.has(roomId)) {
    rooms.get(roomId).code = code;
    io.to(roomId).emit('codeUpdate', code);
  }
});
