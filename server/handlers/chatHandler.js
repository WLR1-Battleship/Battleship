module.exports = (io, socket, db, app) => {
    const emitMessage = (body) => {
        console.log(body)
        io.to(body.roomCode).emit('relay-message', body)
    }

    socket.on('send-message', emitMessage)
}