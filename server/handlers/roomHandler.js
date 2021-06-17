module.exports = (io,socket)=>{
    const startRoom=async(body)=>{
        const {code, user_id} = body;
        const db = app.get('db')
        await db.games.create_game(user_id, code)
        socket.join(code);
        console.log(`room ${code} started`)
    }

    const serverAttemptJoin=async (body)=>{
        const {code} = body;
        const db = app.get('db')
        const [game] = await db.games.get_game(code);
        // POTENTIALLY NEED TO INCLUDE A CHECK FOR IF PLAYERS ALREADY EXIST
        if(game){
            return socket.to(code).emit('server-attempt-join')
        }
        socket.emit('join-failed')
    }

    socket.on('client-start-game', startRoom)
    socket.on('client-attempt-join', serverAttemptJoin)
}