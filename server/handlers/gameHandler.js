module.exports = (io,socket)=>{
    const serverSendAttack=(body)=>{
        const {row, column, roomCode} = body
        socket.to(roomCode).emit('server-send-attack' , {row,column})
    }

    socket.on('send-attack', serverSendAttack)
}