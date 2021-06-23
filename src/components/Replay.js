import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import "./Game.css";
//need to clear interval on dismount
let moveId = 0;
let replayInterval;
const Replay = () => {
  const { roomCode } = useSelector((store) => store.gameReducer);
  const { opponentInfo } = useSelector((store) => store.gameReducer);
  const { user } = useSelector((store) => store.authReducer);
  const [player1Grid, setPlayer1Grid] = useState([]);
  const [player2Grid, setPlayer2Grid] = useState([]);
  const [player1Ships, setPlayer1Ships] = useState(null);
  const [player2Ships, setPlayer2Ships] = useState(null);
  const [moves, setMoves] = useState(null);
  const [game, setGame] = useState(null);
  const player2ShipsRef = useRef(player2Ships);
  const player1ShipsRef = useRef(player1Ships);

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
      } else {
        let shipName = player2GridNew[moves[i].move[0]][
          moves[i].move[1]
        ].ship.slice(
          0,
          player2GridNew[moves[i].move[0]][moves[i].move[1]].ship.indexOf("-")
        );
        player2GridNew[moves[i].move[0]][moves[i].move[1]].attacked = true;
        player2GridNew[moves[i].move[0]][moves[i].move[1]].hit = true;

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
      } else {
        let shipName = player1GridNew[moves[i].move[0]][
          moves[i].move[1]
        ].ship.slice(
          0,
          player1GridNew[moves[i].move[0]][moves[i].move[1]].ship.indexOf("-")
        );
        player1GridNew[moves[i].move[0]][moves[i].move[1]].attacked = true;
        player1GridNew[moves[i].move[0]][moves[i].move[1]].hit = true;
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

  return (
    <div>
      Replay
      <button
        onClick={() => {
          startReplayTimer(800);
        }}
      >
        Start Replay
      </button>
      <button
        onClick={() => {
          clearInterval(replayInterval);
          startReplayTimer(1350);
        }}
      >
        slow
      </button>
      <button
        onClick={() => {
          clearInterval(replayInterval);
          startReplayTimer(800);
        }}
      >
        medium
      </button>
      <button
        onClick={() => {
          clearInterval(replayInterval);
          startReplayTimer(250);
        }}
      >
        fast
      </button>
      <button
        onClick={() => {
          clearInterval(replayInterval);
        }}
      >
        pause
      </button>
      <button onClick={startReplay}>forward</button>
      <button
        onClick={() => {
          let info = { game: game, moves: moves };
          setGrid(info);
          moveId = 0;
        }}
      >
        reset
      </button>
      <div className="replay-grid-container">
        <div>
          {game && game.player_1 === user.user_id ? (
            <h1>{user.username}</h1>
          ) : (
            <h1>{opponentInfo.username}</h1>
          )}
          <section className="ship-grid">
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
                        className={`ship-grid-square ${cssClass}`}
                      >
                        {square.attacked === true ? (
                          <span className="missile-right-to-left"></span>
                        ) : null}
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
            <h1>{opponentInfo.username}</h1>
          )}

          <section className="ship-grid">
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
                        className={`ship-grid-square ${cssClass}`}
                      >
                        {square.attacked === true ? (
                          <span className="missile-left-to-right"></span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
};
export default Replay;
