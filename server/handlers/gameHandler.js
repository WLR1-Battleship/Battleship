module.exports = (io, socket, db, app) => {
  const serverSendAttack = async(body) => {
    //update db with move (add_move);
    const {row, column, roomCode, user_id} = body
    await db.moves.add_move([roomCode, user_id, row, column])
    socket.to(roomCode).emit("server-send-attack", { row, column, roomCode });
  };
  const shipsSet = async (body) => {
    const { user_id, ships, roomCode, username } = body;
    let shipsJson = JSON.stringify(ships);
    const [game] = await db.games.set_ships([shipsJson, user_id, roomCode]);
    io.in(roomCode).emit("player-ready", { username: username, gameReady: game.player_1_ships && game.player_2_ships? true : false , player_1: game.player_1});
  };
  const handleMiss = (body) => {
    const { row, column, roomCode } = body;

    socket.to(roomCode).emit("miss", body);
  };
  const handleHit = (body) => {
    const { row, column, roomCode } = body;
    socket.to(roomCode).emit("hit", body);
  };

  const serverSendSink=async (body)=>{
    const {roomCode, user_id} = body;
    // Message: 'user_id has lost all ships!'

    // IDEA: make call to database to update ships. Return Ships. If all ships are sunk, then emit you-win to the proper user_id
    const [game] = await db.games.game_complete(roomCode)
    console.log(game)
    for (let i = 1; i < 3; i++) {
      console.log(game[`player_${i}`])
      await db.user.add_play(user_id!== game[`player_${i}`]? 1:0, game[`player_${i}`])
    }
    socket.to(roomCode).emit('you-win')
  }

  socket.on("ships-set", shipsSet);
  socket.on("send-attack", serverSendAttack);
  socket.on("miss", handleMiss);
  socket.on("hit", handleHit);
  socket.on('player-sunk', serverSendSink)
};
