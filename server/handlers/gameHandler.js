module.exports = (io, socket, db, app) => {
  const serverSendAttack = (body) => {
    //update db with move (add_move);
    const { row, column, roomCode } = body;
    socket.to(roomCode).emit("server-send-attack", { row, column, roomCode });
  };
  const shipsSet = async (body) => {
    const { user_id, ships, roomCode, username } = body;
    let shipsJson = JSON.stringify(ships);
    await db.games.set_ships([shipsJson, user_id, roomCode]);
    socket.to(roomCode).emit("player-ready", { username: username });
  };
  const handleMiss = (body) => {
    const { row, column, roomCode } = body;

    socket.to(roomCode).emit("miss", body);
  };
  const handleHit = (body) => {
    const { row, column, roomCode } = body;
    socket.to(roomCode).emit("hit", body);
  };

  socket.on("ships-set", shipsSet);
  socket.on("send-attack", serverSendAttack);
  socket.on("miss", handleMiss);
  socket.on("hit", handleHit);
};
