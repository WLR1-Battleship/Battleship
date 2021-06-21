import {useEffect, useState} from 'react'
import { useSelector } from 'react-redux'
import io, { Socket } from 'socket.io-client'
// import store from '../redux/authReducer'
import './Chat.css'

const Chat = props => {
    const {user} = useSelector((store) => store.authReducer)
    const {roomCode} = useSelector((store) => store.gameReducer)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    // const [socket, setSocket] = useState(null)
    useEffect(() => {
        const emitMessage = (body) => {
            console.log(body)
            setMessages((currentMessages) => [body, ...currentMessages])
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
        <section>
            <div className='chat-board'>
                {messages.map((body) => (
                    <div>
                        {body.username}: {body.message}
                    </div>
                ))}
            </div>
            <input value={message} onChange={(e) => setMessage(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
        </section>
    )
}


export default Chat