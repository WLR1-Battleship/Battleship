module.exports = {
    getGameData: async (req, res) => {
        let {roomCode} = req.params;
        const db = req.app.get('db');
        let gameInfo;
        const moves = await db.games.get_game_moves(roomCode);
        const [game] = await db.games.get_game(roomCode);
        let _moves = [];
        for (let j = 0; j < moves[0]?.move.moves.length; j++) {
            _moves.push({move_id: j*2, game_id: game.game_id, user_id: moves[0].user_id, move: moves[0].move.moves[j], bot_tracker: moves[0].bot_tracker  })
            if(j < moves[1]?.move.moves.length) _moves.push({move_id: j*2+1, game_id: game.game_id, user_id: moves[1].user_id, move: moves[1].move.moves[j], bot_tracker: moves[1].bot_tracker  })
        }
        gameInfo = {moves: _moves, game: game};

        res.status(200).send(gameInfo)

    },
    getCompletedGameData: async (req, res) => {
        let {roomCode} = req.params;
        const db = req.app.get('db');
        let gameInfo;
        const moves = await db.games.get_game_moves(roomCode);
        const [game] = await db.games.get_completed_game(roomCode);
        let _moves = [];
        for (let j = 0; j < moves[0].move.moves.length; j++) {
            _moves.push({move_id: j*2, game_id: game.game_id, user_id: moves[0].user_id, move: moves[0].move.moves[j], bot_tracker: moves[0].bot_tracker  })
            if(j < moves[1].move.moves.length) _moves.push({move_id: j*2+1, game_id: game.game_id, user_id: moves[1].user_id, move: moves[1].move.moves[j], bot_tracker: moves[1].bot_tracker  })
        }
        gameInfo = {moves: _moves, game: game};

        res.status(200).send(gameInfo)
    },
    
    getAllUsersGames: async (req, res) => {
        const db  = req.app.get('db')
        const {userId} = req.params;

        let games = await db.games.get_users_games(userId)
        for (let i = 0; i < games.length; i++){
            let opponent;
            games[i].player_1 === parseInt(userId) ? opponent = games[i].player_2 : opponent = games[i].player_1;
            let [opponentInfo] = await db.user.get_by_id(opponent);
            games[i].opponent = opponentInfo
        }
        res.status(200).send(games)
    },

    setBotGame: (req, res) => {
        const db = req.app.get('db')
        let player = JSON.stringify(req.body.player)
        let bot = JSON.stringify(req.body.bot)
        db.games.set_bot_game(player, bot, req.body.roomCode)
        res.sendStatus(200)
    },

    addMove: async (req, res) => {
        const db = req.app.get('db')
        const {row, column, roomCode, user_id, botHitTracker} = req.body
        const [myMoves] = await db.moves.get_my_moves(roomCode, user_id)
        const bot_tracker = JSON.stringify(botHitTracker)
        if(myMoves){
          const moves = JSON.stringify({moves: [...myMoves.move.moves, [row,column]]})
          await db.moves.update_move(myMoves.move_id, moves)
          res.sendStatus(200)
        }
        else{
          const move = JSON.stringify({moves: [[row,column]]})
          await db.moves.add_move([roomCode, user_id, move, bot_tracker])
          res.sendStatus(200)
        }
    },
}