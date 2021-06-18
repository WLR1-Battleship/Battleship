import badwordsRegExp from 'badwords/regexp'
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { setRoomCode } from '../redux/gameReducer';


const Dash=(props)=>{
    const dispatch = useDispatch();
    const {setOnDash, setOnGame, socket} = props
    const[roomInput,setRoomInput] = useState('')
    const {user} = useSelector((store)=>store.authReducer)


    const generateCode=(_code, num)=>{
        if(num<=0){
            if(_code.match(badwordsRegExp)){
                return generateCode('', 6)
            }
            return _code;
        }
        const abc='qwertyuiopasdfghjklzxcvbnm'
        _code = _code +  abc[Math.floor(Math.random() * abc.length)].toUpperCase()
        return generateCode(_code, num-1);
    }

    const handleCreateGame=()=>{
        let code = generateCode('', 6)
        dispatch(setRoomCode(code))
        if(socket){
            socket.emit('client-start-game', {code, user_id: user.user_id}) // CHANGE THIS TO ACTUAL user id FROM REDUX
            setOnGame(true);
            setOnDash(false);
        }
        //Error check!
    }

    const handleJoinGame=()=>{
        socket && socket.emit('client-attempt-join', {code: roomInput, user_id: user.user_id})
    }
    
    useEffect(()=>{
        const joinRoom = (body) => {
            dispatch(setRoomCode(body.code))
            setOnGame(true)
            setOnDash(false)
        }
        if(socket){
            socket.on('server-confirm-join', joinRoom)
        }
        return ()=>{
            socket.off('server-confirm-join', joinRoom)
        } 
        
    },[socket])

    return(
        <div>
            Dash
            <button onClick={handleCreateGame}>Create Game</button>
            <input value={roomInput} onChange={(e)=>setRoomInput(e.target.value)} placeholder='room code' />
            <button onClick={handleJoinGame}>Join</button>
        </div>

    )
}
export default Dash