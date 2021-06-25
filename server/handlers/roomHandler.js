

module.exports = (io, socket, db, app) => {
  const startRoom = async (body) => {
    const { code, user_id } = body;
    await db.games.create_game(user_id, code);
    socket.join(code);
    console.log(`room ${code} started`);
  };

  const serverAttemptJoin = async (body) => {
    const { code, user_id } = body;
    const [game] = await db.games.get_game(code);
    // POTENTIALLY NEED TO INCLUDE A CHECK FOR IF PLAYERS ALREADY EXIST

    if (game) {
      if (game.player_2 === null && game.player_1 !== user_id) {
        await db.games.addplayer2(user_id, code);
      }
      socket.join(code);

     return socket.emit("server-confirm-join", { code });
    };
    socket.emit("join-failed");
  };

  socket.on('im-your-opponent', (body)=>{
    socket.to(body.roomCode).emit('im-your-opponent', {username: body.username, user_id: body.user_id});

  })

  socket.on('are-you-online', (body) =>{
    socket.to(body.roomCode).emit("are-you-online");

  })
  socket.on('online', (body) => {
    socket.to(body.roomCode).emit("player-online");

  })
  socket.on("client-start-game", startRoom);
  socket.on("client-attempt-join", serverAttemptJoin);
};
