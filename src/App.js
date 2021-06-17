// import logo from './logo.svg';
import { useEffect, useState } from 'react';
import io  from 'socket.io-client';
import './App.css';
import Dash from './components/Dash';
import Game from './components/Game'

function App(props) {
  const [ socket,setSocket ] = useState(null)
  const [onGame, setOnGame] = useState(false);
  const [onDash, setOnDash] = useState(true);

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
  return (
    <div className="App">
      {onDash && <Dash socket={socket} setOnDash={setOnDash} setOnGame={setOnGame} />}
      {onGame && <Game socket={socket}/>}
    </div>
  );
}

export default App;
