import { Server } from 'socket.io'
import db from "../../lib/database"

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    // console.log('Socket is already running')
  } else {
    // console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io;
    io.on("connection", async (socket) => {
      console.log("connected", socket.id)
      socket.on("joinRoom", async (roomId, callback) => {
        socket.join(roomId);
        const room = await db.get(roomId);
        console.log(socket.id, roomId)
        callback(room);
      })
      socket.on("pause", async (roomId, time) => {
        const room = await db.get(roomId);
        if (room.is_playing) {
          room.is_playing = false;
          room.last_track_time = time
          await db.set(roomId, room);
          io.to(roomId).emit("pause", time)
        }
      })
      socket.on("play", async (roomId, time) => {
        const room = await db.get(roomId);
        if (!room.is_playing) {
          room.is_playing = true;
          room.last_played = Date.now();
          room.last_track_time = time;
          await db.set(roomId, room);
          io.to(roomId).emit("play", time)
        }
      })
      socket.on("setVideo", async (roomId, videoId) => {
        const room = await db.get(roomId)
        if (room.current !== videoId) {
          room.current = videoId;
          room.last_track_time = 0;
          room.is_playing = false;
          await db.set(roomId, room);
          io.to(roomId).emit("setVideo", videoId)
        }
      })
    });
  }
  res.end()
}

export default SocketHandler