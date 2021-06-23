// import logo from './logo.svg';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io  from 'socket.io-client';
import './App.css';
import Dash from './components/Dash';
import Game from './components/Game'
import {setUser} from './redux/authReducer'
import axios from 'axios'
import Auth from './components/Auth'
import Replay from './components/Replay'

function App(props) {
  const [ socket,setSocket ] = useState(null)
  const [onGame, setOnGame] = useState(false);
  const [onDash, setOnDash] = useState(true);
  const {user} = useSelector((store) => store.authReducer)
  const [onReplay, setOnReplay] = useState(false)
  const dispatch = useDispatch();

  useEffect(()=>{
    if(!socket){
        setSocket(io.connect())
    } //<---- to check if socket is already connected
    return()=>{
        if(socket){
            socket.disconnect()
            setSocket(null)
        }
    }
},[socket])
  useEffect(()=> {
    axios.get('/api/auth/user')
    .then((res)=>{
      dispatch(setUser(res.data))
    })
    .catch((err)=>{
      console.log(err)
    })
  },[])
  return (
    <div className="App">
      {!user && <Auth/>}
      {user && onDash && <Dash socket={socket} setOnDash={setOnDash} setOnReplay={setOnReplay} setOnGame={setOnGame} />}
      {user && onGame && <Game socket={socket}/>}
      {user && onReplay && <Replay /> }
    </div>
  );
}

export default App;
