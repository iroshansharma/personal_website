const express = require('express');
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();
    const httpServer = http.createServer(server);
    const io = new Server(httpServer);

    const db = require('./lib/db');

    // Auto-cleanup: Delete messages older than 2 hours
    const CLEANUP_INTERVAL = 10 * 60 * 1000; // Check every 10 minutes
    setInterval(() => {
        try {
            const stmt = db.prepare("DELETE FROM messages WHERE timestamp < datetime('now', '-2 hours')");
            const result = stmt.run();
            if (result.changes > 0) {
                console.log(`Cleaned up ${result.changes} old messages.`);
            }
        } catch (err) {
            console.error('Error cleaning up messages:', err);
        }
    }, CLEANUP_INTERVAL);

    // Socket.io connection handler
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Join a room based on user ID or just a global room for now since it's 2 users
        socket.join('couple-room');
        socket.to('couple-room').emit('user-connected', { userId: socket.id });

        socket.on('message', (data) => {
            // Save to DB
            try {
                const stmt = db.prepare('INSERT INTO messages (sender, content, type) VALUES (?, ?, ?)');
                stmt.run(data.sender, data.content, data.type || 'text');
            } catch (err) {
                console.error('Error saving message:', err);
            }

            // Broadcast to everyone else in the room
            socket.to('couple-room').emit('message', data);
        });

        socket.on('typing', (data) => {
            socket.to('couple-room').emit('typing', data);
        });

        socket.on('call-offer', (data) => {
            socket.to('couple-room').emit('call-offer', data);
        });

        socket.on('call-answer', (data) => {
            socket.to('couple-room').emit('call-answer', data);
        });

        socket.on('ice-candidate', (data) => {
            socket.to('couple-room').emit('ice-candidate', data);
        });

        socket.on('video-sync', (data) => {
            socket.to('couple-room').emit('video-sync', data);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    server.all(/.*/, (req, res) => {
        return handle(req, res);
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
