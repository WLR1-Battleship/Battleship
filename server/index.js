require("dotenv").config();
const express = require("express");
const massive = require("massive");
const session = require("express-session");
const authController = require("./controllers/authController");
const gameController = require('./controllers/gameController');
const path = require("path");

const { CONNECTION_STRING, SESSION_SECRET, SERVER_PORT } = process.env;

const app = express();

//Include this with your other top-level middleware
app.use(express.json());


app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 365 * 10 },
  })
);

massive({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
})
  .then((db) => {
    app.set("db", db);
    console.log("DB connected");
    const io = require("socket.io")(
      app.listen(SERVER_PORT, () => console.log(`Server: ${SERVER_PORT}`)),
      { cors: { origin: true } }
    );
    // ----------- SOCKET HANDLERS -----------
    const registerGameHandlers = require("./handlers/gameHandler");
    const registerRoomHandlers = require("./handlers/roomHandler");
    const registerChatHandlers = require('./handlers/chatHandler')

    const onConnection = (socket) => {
      console.log(`Socket: ${socket.id} connected`);
      registerGameHandlers(io, socket, db);
      registerRoomHandlers(io, socket, db, app);
      registerChatHandlers(io, socket, db, app)
      socket.on('disconnecting', () => {
        console.log(socket.rooms)
        let roomsArray  = Array.from(socket.rooms);
        for (let i = 1; i < roomsArray.length; i++){
          socket.to(roomsArray[i]).emit("player-offline");

        }

      })
      socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected`);
      });
    };

    io.on("connection", onConnection);
  })
  .catch((err) => console.log(err));

//AUth Endpoint
app.post("/api/auth/login", authController.login);
app.get("/api/auth/user", authController.getUser);
app.get("/api/get/game/:roomCode", gameController.getGameData)
app.get("/api/get/completed/game/:roomCode", gameController.getCompletedGameData)
app.get("/api/user/games/:userId", gameController.getAllUsersGames);
app.put('/api/bot/setgame', gameController.setBotGame)
app.post('/api/game/add/move', gameController.addMove)

app.use(express.static(`${__dirname}/../build`))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'))
})