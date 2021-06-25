let rooms = {}

module.exports = (io, socket, db, app) => {
  const startRoom = async (body) => {
    const { code, user_id } = body;
    await db.games.create_game(user_id, code);
    socket.join(code);
    rooms[code] = {connections: [user_id]}
    console.log(rooms)
    console.log(`room ${code} started`);
  };

  const serverAttemptJoin = async (body) => {
    const { code, user_id } = body;
    const [game] = await db.games.get_game(code);
    // POTENTIALLY NEED TO INCLUDE A CHECK FOR IF PLAYERS ALREADY EXIST

    if (game) {
      if (game.player_2 === null) {
        await db.games.addplayer2(user_id, code);
      }
      socket.join(code);
      rooms[code].connections.push(user_id)
      console.log(rooms)
      return socket.emit("server-confirm-join", { code });
    }
    socket.emit("join-failed");
  };

  socket.on("client-start-game", startRoom);
  socket.on("client-attempt-join", serverAttemptJoin);
};
