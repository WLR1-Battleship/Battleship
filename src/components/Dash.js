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

  useEffect(() => {
    axios
      .get(`/api/user/games/${user.user_id}`)
      .then((res) => {
        console.log(res);
        let currentGames = [];
        for (let i = 0; i < res.data.length; i++) {
          if (res.data[i].game_complete !== true) {
            currentGames.push(res.data[i]);
          }
          else{
            pastGames.push(res.data[i])
          }
        }
        setCurrentGames(currentGames);
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
      <br />
      <div className="replay-current-games-container">

      
      <div>
        <h1 className='dash-replay-games-title'>REPLAY GAMES:</h1>
        <br />
        {pastGames.map((game) => {

                return <div className='replay-games-button'  onClick={()=>{handleReplay(game)}}>
                <h3> {`vs. ${game.opponent? game.opponent.username:'Nobody'}`}</h3>

                  <h3>{game.room_code}</h3>
                </div>;
              })}
      </div>
      <div>
        <h1 className='dash-current-games-title'>CURRENT GAMES:</h1>
        <br />
              {currentGames.map((game) => {

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
