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
    getAllUsersGames: async (req, res) => {
        const db  = req.app.get('db')
        const {userId} = req.params;

        let games = db.games.get_users_games(userId)
        
        .then((data)=>{
            res.status(200).send(data)
        }).catch(err=>{
            console.log(err)
        })
    }
}