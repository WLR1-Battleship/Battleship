require('dotenv').config()
const express = require('express')
const massive = require('massive')
const session = require('express-session')

const path = require('path')

const {CONNECTION_STRING, SESSION_SECRET, SERVER_PORT}

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
    app.listen(SERVER_PORT, ()=> console.log(`Server: ${SERVER_PORT}`))
})
.catch(err => console.log(err))