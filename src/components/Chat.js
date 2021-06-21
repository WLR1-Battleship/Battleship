import {useEffect, useState} from 'react'
import { useSelector } from 'react-redux'
import io, { Socket } from 'socket.io-client'
// import store from '../redux/authReducer'

const Chat = props => {
    const {user} = useSelector((store) => store.authReducer)
    const {roomCode} = useSelector((store) => store.gameReducer)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    // const [socket, setSocket] = useState(null)
    useEffect(() => {
        const emitMessage = (body) => {
            console.log(body)
            setMessages((currentMessages) => [...currentMessages, body ])
        }
        if(props.socket){
            props.socket.on('relay-message', emitMessage)
        }
        return () => {
            console.log('Elvis has left the building')
            if(props.socket){
                props.socket.off('relay-message', emitMessage)
            }
        }
        // setSocket(io.connect())
    }, [])

    const sendMessage = () => {
        props.socket.emit('send-message', {username: user.username, message, roomCode: roomCode})
        setMessage('')
    }

    return(
        <div>
            Bruh
            {messages.map((body) => (
                <div>
                    {body.username}: {body.message}
                </div>
            ))}
            <input value={message} onChange={(e) => setMessage(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
        </div>
    )
}


export default Chat