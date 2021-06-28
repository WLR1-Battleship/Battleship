import axios from "axios";
import badwordsRegExp from "badwords/regexp";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setRoomCode } from "../redux/gameReducer";
import {setOpponent} from '../redux/gameReducer';
import './Dash.css'

const Dash = (props) => {
  const dispatch = useDispatch();
  const { setOnDash, setOnGame, socket, setOnReplay } = props;
  const [roomInput, setRoomInput] = useState("");
  const { user } = useSelector((store) => store.authReducer);
  const [currentGames, setCurrentGames] = useState([]);
  const [pastGames, setPastGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get(`/api/user/games/${user.user_id}`)
      .then((res) => {
        console.log(res);
        let currentGames = [];
        let pastGamesData = [];
        for (let i = 0; i < res.data.length; i++) {
          if (res.data[i].game_complete !== true) {
            currentGames.push(res.data[i]);
          }
          else{
            pastGamesData.push(res.data[i])
          }
        }
        setPastGames(pastGamesData)
        setCurrentGames(currentGames);
        setLoading(false)
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const generateCode = (_code, num) => {
    if (num <= 0) {
      if (_code.match(badwordsRegExp)) {
        return generateCode("", 6);
      }
      return _code;
    }
    const abc = "qwertyuiopasdfghjklzxcvbnm";
    _code = _code + abc[Math.floor(Math.random() * abc.length)].toUpperCase();
    return generateCode(_code, num - 1);
  };

  const handleCreateGame = () => {
    let code = generateCode("", 6);
    dispatch(setRoomCode(code));
    if (socket) {
      socket.emit("client-start-game", { code, user_id: user.user_id }); // CHANGE THIS TO ACTUAL user id FROM REDUX
      setOnGame(true);
      setOnDash(false);
    }
    //Error check!
  };
  const handleReplay = (game) => {
    dispatch(setOpponent(game.opponent))
    dispatch(setRoomCode(game.room_code))
    setOnDash(false)
    setOnReplay(true)
  }

  const handleJoinGame = (game) => {
    if (game.room_code) {
      socket &&
        socket.emit("client-attempt-join", {
          code: game.room_code,
          user_id: user.user_id,
        });
        dispatch(setOpponent(game.opponent))
    }
    else {
    socket &&
      socket.emit("client-attempt-join", {
        code: roomInput,
        user_id: user.user_id,
      });
    }
  };

  useEffect(() => {
    const joinRoom = (body) => {
      dispatch(setRoomCode(body.code));
      setOnGame(true);
      setOnDash(false);
    };
    if (socket) {
      socket.on("server-confirm-join", joinRoom);
    }
    return () => {
      socket.off("server-confirm-join", joinRoom);
    };
  }, [socket]);

  const handleVsBot = () => {
    let code = generateCode("", 6);
    dispatch(setRoomCode(code));
    //maybe change set opponent based on real bot in database
    dispatch(setOpponent({username: 'BOT', user_id: 17}))
    if (socket) {
      socket.emit("client-start-game", { code, user_id: user.user_id }); // CHANGE THIS TO ACTUAL user id FROM REDUX
    }
    setOnGame(true);
    setOnDash(false);
  }

  const move = () => {
    var elem = document.getElementById("myBar");
    var width = 1;
    var id = setInterval(frame, 10);
    function frame() {
      if (width >= 100) {
        clearInterval(id);
      } else {
        width++;
        elem.style.width = width + '%';
      }
    }
  }

  return (
    <div className='dash'>
      {/* Dash */}
      <br />
      <div>
        <input
          className='dash-input'
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="Enter Room Code"
          />
        <button className='dash-join-game-button' onClick={handleJoinGame}>Join</button>
      </div>
      <br />
      <button className='dash-create-game-button' onClick={handleCreateGame}>Create Game</button>
      <button className='dash-vs-bot-button' onClick={handleVsBot}>VS. Bot</button>
      <br />
      {loading ? 
        <span className='dash-loading-bar'>Loading</span> 
        : null}
      <div className="replay-current-games-container">

      
      <div className='replay-games-container'>
        <h1 className='dash-replay-games-title'>REPLAY GAMES:</h1>
        <br />
        {pastGames.map((game) => {

                return <div className='replay-games-button'  onClick={()=>{handleReplay(game)}}>
                <h3> {`vs. ${game.opponent? game.opponent.username:'Nobody'}`}</h3>

                  <h3>{game.room_code}</h3>
                </div>;
              })}
      </div>
      <div className='current-games-container'>
        <h1 className='dash-current-games-title'>CURRENT GAMES:</h1>
        <br />
              {currentGames.filter((game)=> game.opponent?.user_id !== user.user_id).map((game) => {

                return <div className='current-games-button'  onClick={()=>{handleJoinGame(game)}}>
                    <h3> {`vs. ${game.opponent? game.opponent.username:'Nobody'}`}</h3>

                  <h3>{game.room_code}</h3>
                </div>;
              })}
      </div>
    </div>
    </div>
  );
};
export default Dash;
