import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import "./Game.css";
import './Ships.scss';
import "./Replay.css";
import {FaPlay} from 'react-icons/fa'
import {GiPauseButton} from 'react-icons/gi'
import {RiSpeedFill} from 'react-icons/ri'
import {FaStepForward} from 'react-icons/fa'
import {AiOutlineReload} from 'react-icons/ai'
import {BsBackspaceFill} from 'react-icons/bs'
import explosionSound from '../assets/images/sounds/explosion.mp3'
import splashSound from '../assets/images/sounds/splash.mp3'

//need to clear interval on dismount
let moveId = 0;
let replayInterval;
const Replay = (props) => {
  const { roomCode } = useSelector((store) => store.gameReducer);
  const { opponentInfo } = useSelector((store) => store.gameReducer);
  const { user } = useSelector((store) => store.authReducer);
  const [player1Grid, setPlayer1Grid] = useState([]);
  const [player2Grid, setPlayer2Grid] = useState([]);
  const [player1Ships, setPlayer1Ships] = useState(null);
  const [player2Ships, setPlayer2Ships] = useState(null);
  const [moves, setMoves] = useState(null);
  const [game, setGame] = useState(null);
  const {setOnDash, setOnReplay} = props
  const player2ShipsRef = useRef(player2Ships);
  const player1ShipsRef = useRef(player1Ships);
  const [speed, setSpeed] = useState('slow');
  const [buttonHighlight, setButtonHighlight] = useState({play: 1, pause: 1, speed: 1, reset: 1, next: 1})

  useEffect(() => {
    player2ShipsRef.current = player2Ships;
  }, [player2Ships]);

  useEffect(() => {
    player1ShipsRef.current = player1Ships;
  }, [player1Ships]);

  useEffect(() => {
    axios
      .get(`/api/get/completed/game/${roomCode}`)
      .then((res) => {
        setMoves(res.data.moves);
        setGame(res.data.game);
        setGrid(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const setGrid = (info) => {
    let makePlayer1Grid = [];
    let makePlayer2Grid = [];

    for (let i = 0; i < 10; i++) {
      let row = [];
      let row2 = [];
      for (let j = 0; j < 10; j++) {
        row.push({
          row: i,
          column: j,
          attacked: false,
          sunk: false,
          hit: false,
          ship: null,
        });
        row2.push({
          row: i,
          column: j,
          attacked: false,
          sunk: false,
          hit: false,
          ship: null,
        });
      }
      makePlayer1Grid.push(row);
      makePlayer2Grid.push(row2);
    }

    for (let ship in info.game.player_1_ships) {
      let index = 0;
      for (
        let i = 0;
        i < info.game.player_1_ships[ship].positions.length;
        i++
      ) {
        makePlayer1Grid[info.game.player_1_ships[ship].positions[i][0]][
          info.game.player_1_ships[ship].positions[i][1]
        ].ship = `${ship}-${index}`;
        
        let direction = ''
          console.log(makePlayer1Grid[info.game.player_1_ships[ship].positions[i][0]][
            info.game.player_1_ships[ship].positions[i][1]
          ].ship)
          if(makePlayer1Grid[info.game.player_1_ships[ship].positions[0][0]][info.game.player_1_ships[ship].positions[0][1]].row === makePlayer1Grid[info.game.player_1_ships[ship].positions[1][0]][info.game.player_1_ships[ship].positions[1][1]].row){
            direction = 'horizontal'
          }
          else{
            direction = 'vertical'
          }
          makePlayer1Grid[info.game.player_1_ships[ship].positions[i][0]][
            info.game.player_1_ships[ship].positions[i][1]
          ].direction = direction;
        index++;
      }
    }
    for (let ship2 in info.game.player_2_ships) {
      let index = 0;
      for (
        let j = 0;
        j < info.game.player_2_ships[ship2].positions.length;
        j++
      ) {
        makePlayer2Grid[info.game.player_2_ships[ship2].positions[j][0]][
          info.game.player_2_ships[ship2].positions[j][1]
        ].ship = `${ship2}-${index}`;
        let direction = ''
          // console.log(shipSquares[playerShips[ship].positions[0][0]])
          if(makePlayer2Grid[info.game.player_2_ships[ship2].positions[0][0]][info.game.player_2_ships[ship2].positions[0][1]].row === makePlayer2Grid[info.game.player_2_ships[ship2].positions[1][0]][info.game.player_2_ships[ship2].positions[1][1]].row){
            direction = 'horizontal'
          }
          else{
            direction = 'vertical'
          }
          makePlayer2Grid[info.game.player_2_ships[ship2].positions[j][0]][
            info.game.player_2_ships[ship2].positions[j][1]
          ].direction = direction;
        index++;
      }
    }
    setPlayer1Grid(makePlayer1Grid);
    setPlayer2Grid(makePlayer2Grid);
    setPlayer2Ships(info.game.player_2_ships);
    setPlayer1Ships(info.game.player_1_ships);
  };
  const startReplayTimer = (speed) => {
    // for (let i = 0; i < moves.length; i++){
    //   setTimeout(startReplay, i * 500);
    // }
    console.log(speed);
    replayInterval = setInterval(startReplay, speed);
  };

  const startReplay = () => {
    //change on interval

    let i = moveId;
    if (i >= moves.length) {
      clearInterval(replayInterval);
      setTimeout(()=>{
        if (moves[moves.length - 1].user_id === user.user_id){
          alert(`${user.username} wins`)
        }
        else{
          alert(`${opponentInfo.username} wins`)
        }
      }, 2000)
      return;
    }

    let player2GridNew = [...player2Grid];
    let player1GridNew = [...player1Grid];
    // for (let i = 0; i < moves.length; i++){
    if (moves[i].user_id === game.player_1) {
      //change player2grid
      if (player2GridNew[moves[i].move[0]][moves[i].move[1]].ship === null) {
        player2GridNew[moves[i].move[0]][moves[i].move[1]].attacked = true;
        player2GridNew[moves[i].move[0]][moves[i].move[1]].hit = false;
        setTimeout(function(){
          let splash = document.getElementById("splash-sound")
          if(splash){
          splash.currentTime = 0;
          splash.volume = 0.5;
          splash.play();
          }

          
        },1150)
      } else {
        let shipName = player2GridNew[moves[i].move[0]][
          moves[i].move[1]
        ].ship.slice(
          0,
          player2GridNew[moves[i].move[0]][moves[i].move[1]].ship.indexOf("-")
        );
        player2GridNew[moves[i].move[0]][moves[i].move[1]].attacked = true;
        player2GridNew[moves[i].move[0]][moves[i].move[1]].hit = true;
        setTimeout(function(){
          let explosion = document.getElementById("explosion-sound")
          if (explosion){
          explosion.currentTime = 0;
          explosion.volume = 0.5;
          explosion.play();
          }
        },1150)
       

        setPlayer2Ships({
          ...player2ShipsRef.current,
          [shipName]: {
            ...player2ShipsRef.current[shipName],
            hits: player2ShipsRef.current[shipName].hits + 1,
          },
        });
        console.log(
          "hits",
          player2ShipsRef.current[shipName].hits,
          "shipLength",
          player2Ships[shipName].positions.length
        );
        if (
          player2ShipsRef.current[shipName].hits + 1 >=
          player2Ships[shipName].positions.length
        ) {
          //sunk
          for (let j = 0; j < player2Ships[shipName].positions.length; j++) {
            player2GridNew[player2Ships[shipName].positions[j][0]][
              player2Ships[shipName].positions[j][1]
            ].sunk = true;
          }
        }
      }
    } else {
      //change player2grid
      if (player1GridNew[moves[i].move[0]][moves[i].move[1]].ship === null) {
        player1GridNew[moves[i].move[0]][moves[i].move[1]].attacked = true;
        player1GridNew[moves[i].move[0]][moves[i].move[1]].hit = false;
        setTimeout(function(){
          let splash = document.getElementById("splash-sound")
          if (splash){
          splash.currentTime = 0;
          splash.volume = 0.5;
          splash.play();
          }
        },1150)
      } else {
        let shipName = player1GridNew[moves[i].move[0]][
          moves[i].move[1]
        ].ship.slice(
          0,
          player1GridNew[moves[i].move[0]][moves[i].move[1]].ship.indexOf("-")
        );
        player1GridNew[moves[i].move[0]][moves[i].move[1]].attacked = true;
        player1GridNew[moves[i].move[0]][moves[i].move[1]].hit = true;
        setTimeout(function(){
          let explosion = document.getElementById("explosion-sound")
          if (explosion){
          explosion.currentTime = 0;
          explosion.volume = 0.5;

          explosion.play();
          }
        },1150)
        player1GridNew[moves[i].move[0]][moves[i].move[1]].zIndex = moveId;
        setPlayer1Ships({
          ...player1ShipsRef.current,
          [shipName]: {
            ...player1ShipsRef.current[shipName],
            hits: player1ShipsRef.current[shipName].hits + 1,
          },
        });

        if (
          player1ShipsRef.current[shipName].hits + 1 >=
          player2Ships[shipName].positions.length
        ) {
          //sunk
          for (let j = 0; j < player1Ships[shipName].positions.length; j++) {
            player1GridNew[player1Ships[shipName].positions[j][0]][
              player1Ships[shipName].positions[j][1]
            ].sunk = true;
          }
          
        }
      }
    }

    // }
    setPlayer2Grid(player2GridNew);
    setPlayer1Grid(player1GridNew);
    moveId++;
  };

  const handleBackButtonReplay = () => {
    moveId = 0;
    clearInterval(replayInterval);
    setOnDash(true)
    setOnReplay(false)
  }
 

  return (
    <div id='replay-page-container'>
      <div className='replay-header'>

      <h2 className='replay-replay-title' color={'yellowgreen'}>Replay</h2>
      <div id='replay-page-buttons'>
      <div id='replay-back-button'><BsBackspaceFill size={40} color={'red'} cursor={'pointer'} onClick={handleBackButtonReplay}/></div>
      <FaPlay className='fa-play-button' opacity={buttonHighlight.play} onClick={() => {
        setSpeed('slow')
        startReplayTimer(1350);
        setButtonHighlight({play: .3, pause: 1, speed: 1, reset: 1, next: 1})
        
      }}/>
      <RiSpeedFill className='ri-speed-fill-buttons' opacity={buttonHighlight.speed} onClick={()=>{
        if (speed === 'slow'){
          clearInterval(replayInterval);
          startReplayTimer(800);
          setSpeed('medium')
        }
        if (speed === 'medium'){
          clearInterval(replayInterval);
          startReplayTimer(250);
          setSpeed('fast')
        }
        if (speed === 'fast'){
          clearInterval(replayInterval);
          startReplayTimer(1350);
          setSpeed('slow')
        }
      }}/>

      <GiPauseButton className='gi-pause-button' opacity={buttonHighlight.pause} onClick={() => {
        clearInterval(replayInterval);
        setButtonHighlight({play: 1, pause: .3, speed: 1, reset: 1, next: 1})
        
      }}/>
      <FaStepForward className='fa-step-forword-button' opacity={buttonHighlight.next} onClick={()=>{startReplay();

                setButtonHighlight({play: 1, pause: 1, speed: 1, reset: 1, next: .3})
                
              }}/>
      <AiOutlineReload className='ai-outline-reload' opacity={buttonHighlight.reset} onClick={() => {
        let info = { game: game, moves: moves };
        clearInterval(replayInterval);
        setGrid(info);
        moveId = 0;
        setButtonHighlight({play: 1, pause: 1, speed: 1, reset: .3, next: 1})
        
      }}/>
      </div>
      <div className='replay-speed-title'>speed: {speed}</div>
      <br />
      {moves !== null? 
      <div id="replay-status-bar" style={{width: '100vw', height: '20px', display:'flex', justifyContent:'center', alignItems:'center'}}> 
        <div style={{width: '66%', border: '1px solid black', height: '100%'}}>
          <div style={{height: '100%', backgroundColor:'rgb(216, 130, 0)', width: `${(moveId / (moves.length - 1)) * 100}%`, transition: '1.5s'}}></div>

        </div> 
      </div> : null}
      <br />
          </div>
      <div className="replay-grid-container">
        <div>
          {game && game.player_1 === user.user_id ? (
            <h1 className='replay-username-title'>{user.username}</h1>
            ) : (
              <h1>{opponentInfo.username}</h1>
              )}
          <section className="ship-grid">
          <div className='ocean'></div>
            <div className='waves'></div>
            <div className='waves w2'></div>
            {player1Grid.map((row) => {
              return (
                <div className="ship-grid-row">
                  {row.map((square) => {
                    /*
                    CHANGE CSS to match square.ship
                    */
                    let cssClass = "none";
                    if (square.ship !== null) {
                      cssClass = "ship";
                    }
                    if (square.attacked === true && square.hit === true) {
                      cssClass = "hit";
                    }
                    if (square.attacked === true && square.hit === false) {
                      cssClass = "miss";
                    }
                    if (square.sunk === true) {
                      cssClass = "sunk";
                    }

                    return (
                      <div
                        onClick={() => console.log(square)}
                        className={`ship-grid-square ${cssClass} ${
                          square.direction ? square.direction : ""
                        } `}
                        style={{zIndex:`${square.attacked? `${50 + square.zIndex}`: '1'}`}}
                        id={`${square.ship}`}
                        
                      >
                           {square.attacked ?<div className="replay-missile-right-to-left"> <div ></div><span id="replay-smoke-right">
  <span className="s0"></span>
  <span className="s1"></span>
  <span className="s2"></span>
  <span className="s3"></span>
  <span className="s4"></span>
  <span className="s5"></span>
  <span className="s6"></span>
  <span className="s7"></span>
  <span className="s8"></span>
  <span className="s9"></span>
</span></div> : null}

{square.hit ? 

<div class="fire">
  <div class="fire-left">
    <div class="main-fire"></div>
    <div class="particle-fire"></div>
  </div>
  <div class="fire-main">
    <div class="main-fire"></div>
    <div class="particle-fire"></div>
  </div>
  <div class="fire-right">
    <div class="main-fire"></div>
    <div class="particle-fire"></div>
  </div>
  <div class="fire-bottom">
    <div class="main-fire"></div>
  </div>
</div>: null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </section>
        </div>
        <div>
          {game && game.player_2 === user.user_id ? (
            <h1>{user.username}</h1>
          ) : (
            <h1 className='replay-opponent-title'>{opponentInfo.username}</h1>
          )}

          <section className="ship-grid">
          <div className='ocean'></div>
            <div className='waves'></div>
            <div className='waves w2'></div>
            {player2Grid.map((row) => {
              return (
                <div className="ship-grid-row">
                  {row.map((square) => {
                    /*
                    CHANGE CSS to match square.ship
                    */
                    let cssClass = "none";
                    if (square.ship !== null) {
                      cssClass = "ship";
                    }
                    if (square.attacked === true && square.hit === true) {
                      cssClass = "hit";
                    }
                    if (square.attacked === true && square.hit === false) {
                      cssClass = "miss";
                    }
                    if (square.sunk === true) {
                      cssClass = "sunk";
                    }

                    return (
                      <div
                        onClick={() => console.log(square)}
                        className={`ship-grid-square ${cssClass} ${
                          square.direction ? square.direction : ""
                        } `}
                        id={`${square.ship}`}
                      >
                            {square.attacked ?<div className="replay-missile-left-to-right"> <div ></div><span id="replay-smoke">
  <span className="s0"></span>
  <span className="s1"></span>
  <span className="s2"></span>
  <span className="s3"></span>
  <span className="s4"></span>
  <span className="s5"></span>
  <span className="s6"></span>
  <span className="s7"></span>
  <span className="s8"></span>
  <span className="s9"></span>
</span></div> : null}
{square.hit ? 
<div class='explode'>
<div class="fire">
  <div class="fire-left">
    <div class="main-fire"></div>
    <div class="particle-fire"></div>
  </div>
  <div class="fire-main">
    <div class="main-fire"></div>
    <div class="particle-fire"></div>
  </div>
  <div class="fire-right">
    <div class="main-fire"></div>
    <div class="particle-fire"></div>
  </div>
  <div class="fire-bottom">
    <div class="main-fire"></div>
  </div>
</div>
</div> : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </section>
        </div>
      </div>
      <audio id='explosion-sound'>
        <source src={explosionSound}></source>
      </audio>
      <audio id='splash-sound'>
        <source src={splashSound}></source>
      </audio>
    </div>
  );
};
export default Replay;