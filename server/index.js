require('dotenv').config()
const express = require('express')
const massive = require('massive')
const session = require('express-session')

const path = require('path')

const {CONNECTION_STRING, SESSION_SECRET, SERVER_PORT} = process.env;

const app = express()

app.use(express.json())

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 1000*60*60*24*365*10}
}))

massive({
    connectionString: CONNECTION_STRING,
    ssl: {rejectUnauthorized: false} 
})
.then(db =>{
    app.set('db', db)
    console.log('DB connected')
    const io = require('socket.io')(app.listen(SERVER_PORT, ()=> console.log(`Server: ${SERVER_PORT}`)),{cors: {origin: true}})
    // ----------- SOCKET HANDLERS -----------
    const registerGameHandlers = require("./handlers/gameHandler");
    const registerRoomHandlers = require("./handlers/roomHandler")
    
    const onConnection = (socket) => {
        console.log(`Socket: ${socket.id} connected`)
        registerGameHandlers(io, socket);
        registerRoomHandlers(io,socket);
        

        socket.on('disconnect', ()=>{
            console.log(`Socket ${socket.id} disconnected` )
            
        })
    }
    
    io.on("connection", onConnection);
})
.catch(err => console.log(err))