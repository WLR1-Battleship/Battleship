module.exports = (io,socket)=>{
    const serverSendAttack=(body)=>{
        io.emit('server-send-attack', body)
    }

    socket.on('send-attack', serverSendAttack)
}