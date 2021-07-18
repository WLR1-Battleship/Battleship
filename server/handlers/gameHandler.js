module.exports = (io, socket, db, app) => {
  const serverSendAttack = async(body) => {
    //update db with move (add_move);
    const {row, column, roomCode} = body
    const {user_id, username} = body.user
    io.to(roomCode).emit('relay-message', {username: 'GAME', message:`${username} attacks row: ${row}, column: ${column}.`})
    const [myMoves] = await db.moves.get_my_moves(roomCode, user_id)
    const dummyData = JSON.stringify({bot_diff: 'player'})
    if(myMoves){
      // console.log('TRUE')
      const moves = JSON.stringify({moves: [...myMoves.move.moves, [row,column]]})
      await db.moves.update_move(myMoves.move_id, moves, dummyData)
    }
    else{
      // console.log('FALSE')
      const move = JSON.stringify({moves: [[row,column]]})
      await db.moves.add_move([roomCode, user_id, move, dummyData])
    }
    socket.to(roomCode).emit("server-send-attack", { row, column, roomCode, username });
  };
  const shipsSet = async (body) => {
    const { user_id, ships, roomCode, username } = body;
    let shipsJson = JSON.stringify(ships);
    const [game] = await db.games.set_ships([shipsJson, user_id, roomCode]);
    io.in(roomCode).emit("player-ready", { username: username, gameReady: game.player_1_ships && game.player_2_ships? true : false , player_1: game.player_1, user_id: user_id});
  };
  const handleMiss = (body) => {
    const { row, column, roomCode, username, username2 } = body;
    io.to(roomCode).emit('relay-message', {username: 'GAME', message:`${username} misses ${username2}!`})
    socket.to(roomCode).emit("miss", body);
  };
  const handleHit = (body) => {
    const { row, column, roomCode, username, username2 } = body;
    io.to(roomCode).emit('relay-message', {username: 'GAME', message:`${username} hits ${username2}!`})
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
    socket.to(roomCode).emit('you-win', {roomCode})
  }

  socket.on("ships-set", shipsSet);
  socket.on("send-attack", serverSendAttack);
  socket.on("miss", handleMiss);
  socket.on("hit", handleHit);
  socket.on('player-sunk', serverSendSink)
};
