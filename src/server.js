import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import {instrument} from '@socket.io/admin-ui';

const app = express();

// set view engine
app.set("view engine", "pug");
// template이 어디 있는지 알려준다
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname+"/public"));

app.get("/", (req,res) => res.render("home"));
app.get("/*", (req,res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on ws://localhost:3000`);
// app.listen(3000, handleListen);
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  }
});

instrument(wsServer, {
  auth: false,
  mode: "development"
})

/**
 * public room은 sid에는 없다
 */
function publicRooms() {
  const {sockets: {adapter: {sids, rooms}}} = wsServer;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    };
  })

  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", socket => {
  socket['nickname'] = 'Anon';
  
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName)); // every socket in the room excluding the sender will get the event
    // 새로운 룸이 생겼다는 것을 알린다
    wsServer.sockets.emit("room_change", publicRooms());
  });
  
  socket.on("disconnecting", () => {
    socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
  });

  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  })

  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  })

  socket.on("nickname", nickname => {
    socket['nickname'] = nickname;
  })
})
// const sockets = [];

// {type: 'message', payload: 'hello'}
// {type: 'nickname', payload: 'ann'};
// wss.on("connection", (socket) => {
//   console.log(`Connected to Browser ✅`);

//   sockets.push(socket);
//   socket['nickname'] = 'Anon';

//   socket.on("close", () => console.log(`Disconnected from the Browser ❌`));
  
  // socket.on("message", message => {
  //   const msg = message.toString('utf8');
  //   const parsed = JSON.parse(msg);

  //   switch (parsed.type) {
  //     case 'new_message': {
  //       // broadcasting to sockets
  //       sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${parsed.payload}`));
  //       break;
  //     }
  //     case 'nickname': {
  //       socket['nickname'] = parsed.payload;
  //       break;
  //     }
  //   }
  // })
// });

httpServer.listen(3000, handleListen);