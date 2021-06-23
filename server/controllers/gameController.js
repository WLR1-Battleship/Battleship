module.exports = {
    getGameData: async (req, res) => {
        let {roomCode} = req.params;
        const db = req.app.get('db');
        let gameInfo;
        const moves = await db.games.get_game_moves(roomCode);
        const [game] = await db.games.get_game(roomCode);
        gameInfo = {moves: moves, game: game};

        res.status(200).send(gameInfo)

    },
    getCompletedGameData: async (req, res) => {
        let {roomCode} = req.params;
        const db = req.app.get('db');
        let gameInfo;
        const moves = await db.games.get_game_moves(roomCode);
        const [game] = await db.games.get_completed_game(roomCode);
        gameInfo = {moves: moves, game: game};

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
    }
}