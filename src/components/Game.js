import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import "./Game.css";
import Chat from "./Chat";

const Game = (props) => {
  //Placing ships onto grid
  const [shipsPositions, setShipsPositions] = useState({
    battleship: { positions: [[], [], [], []], hits: 0, sunk: false },
    carrier: { positions: [[], [], [], [], []], hits: 0, sunk: false },
    sub: { positions: [[], [], []], hits: 0, sunk: false },
    cruiser: { positions: [[], [], []], hits: 0, sunk: false },
    destroyer: { positions: [[], []], hits: 0, sunk: false },
  });
  const [shipsSet, setShipsSet] = useState(0);
  const [shipsDirection, setShipsDirection] = useState("horizontal");
  const [draggedShipPiece, setDraggedShipPiece] = useState(null);
  ////////////////////////////////////////////////////////////////
  const [imReady, setImReady] = useState(false);
  const [everyoneReady, setEveryoneReady] = useState(false);
  const [radarGrid, setRadarGrid] = useState([]);
  const [shipGrid, setShipGrid] = useState([]);
  const { socket } = props;
  const { roomCode } = useSelector((store) => store.gameReducer);
  const { user } = useSelector((store) => store.authReducer);
  const shipGridRef = useRef(shipGrid);
  const radarGridRef = useRef(radarGrid);
  const shipsPositionsRef = useRef(shipsPositions);
  const [myTurn, setMyTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false); // {win: true||false}

  //Start Game
  const startGame = () => {
    setImReady(true);
    socket.emit("ships-set", {
      user_id: user.user_id,
      ships: shipsPositions,
      roomCode: roomCode,
      username: user.username,
    });
  };
  //Placing ships onto grid
  const onDragStart = () => {};
  const onShipDrop = (square) => {
    let shipName = draggedShipPiece.slice(0, draggedShipPiece.indexOf("-"));
    let shipIndex = draggedShipPiece.slice(
      draggedShipPiece.indexOf(draggedShipPiece.length - 2)
    );
    let shipLength =
      shipsPositions[draggedShipPiece.slice(0, draggedShipPiece.indexOf("-"))]
        .positions.length;
    //check if squares are available with direction HORIZONTAL
    let addShipToShipGrid = [...shipGrid];
    let shipPosition = { ...shipsPositions };
    if (shipsDirection === "horizontal") {
      for (let i = 0; i < shipLength - shipIndex; i++) {
        //9 === grid width
        if (square.column + i > 9) {
          return;
        }
        if (shipGrid[square.row][square.column + i].ship !== null) {
          return;
        }
      }
      for (let i = shipIndex; i > 0; i--) {
        if (square.column - i < 0) {
          return;
        }
        if (shipGrid[square.row][square.column - i].ship !== null) {
          return;
        }
      }
      let nameIndex = 0;
      for (
        let i = square.column - shipIndex;
        i < square.column + shipLength - shipIndex;
        i++
      ) {
        shipPosition[shipName].positions[nameIndex] = [square.row, i];
        addShipToShipGrid[square.row][i].ship = `${shipName}-${nameIndex}`;
        nameIndex++;
      }
    } else {
      for (let i = 0; i < shipLength - shipIndex; i++) {
        //9 === grid width
        if (square.row + i > 9) {
          return;
        }
        if (shipGrid[square.row + i][square.column].ship !== null) {
          return;
        }
      }
      for (let i = shipIndex; i > 0; i--) {
        if (square.row - i < 0) {
          return;
        }
        if (shipGrid[square.row - 1][square.column].ship !== null) {
          return;
        }
      }
      let nameIndex = 0;
      for (
        let i = square.row - shipIndex;
        i < square.row + shipLength - shipIndex;
        i++
      ) {
        shipPosition[shipName].positions[nameIndex] = [i, square.column];
        addShipToShipGrid[i][square.column].ship = `${shipName}-${nameIndex}`;
        nameIndex++;
      }
    }
    setShipsPositions(shipPosition);
    setShipGrid(addShipToShipGrid);
    document.getElementById(shipName).style.display = "none";
    setShipsSet(shipsSet + 1);
    //check if ships are all set
    //update the ship position locally and in the db
  };
  //////////////////////////////////////////////////////////////////
  useEffect(() => {
    let square = [];
    for (let i = 0; i < 10; i++) {
      let row = [];
      for (let j = 0; j < 10; j++) {
        row.push({
          row: i,
          column: j,
          attacked: false,
          sunk: false,
          hit: false,
        });
      }
      square.push(row);
    }
    setRadarGrid(square);

    let shipSquares = [];

    for (let i = 0; i < 10; i++) {
      let row = [];
      for (let j = 0; j < 10; j++) {
        row.push({
          row: i,
          column: j,
          attacked: false,
          sunk: false,
          hit: false,
          ship: null,
        });
      }
      shipSquares.push(row);
    }
    setShipGrid(shipSquares);
  }, []);

  useEffect(() => {
    shipGridRef.current = shipGrid;
  }, [shipGrid]);

  useEffect(() => {
    radarGridRef.current = radarGrid;
  }, [radarGrid]);

  useEffect(() => {
    shipsPositionsRef.current = shipsPositions;
  }, [shipsPositions]);

  useEffect(() => {
    const attackRespond = (body) => {
      let updateShipGrid = [...shipGridRef.current];

      if (shipGridRef.current[body.row][body.column].ship !== null) {
        let shipName = shipGridRef.current[body.row][body.column].ship.slice(
          0,
          shipGridRef.current[body.row][body.column].ship.indexOf("-")
        );
        // console.log('SHip Positions: ', shipsPositionsRef.current, 'shipPName: ', shipName)
        socket.emit("hit", { ...body, username2: user.username });
        setShipsPositions({
          ...shipsPositionsRef.current,
          [shipName]: {
            ...shipsPositionsRef.current[shipName],
            hits: shipsPositionsRef.current[shipName].hits + 1,
          },
        });
        // console.log('new positions: ', shipsPositionsRef.current)
        updateShipGrid[body.row][body.column].attacked = true;
        updateShipGrid[body.row][body.column].hit = true;
        if (
          shipsPositionsRef.current[shipName].hits + 1 >=
          shipsPositionsRef.current[shipName].positions.length
        ) {
          console.log(`${shipName} SUNK!`);
          socket.emit("send-message", {
            username: user.username,
            roomCode: body.roomCode,
            message: `You sunk my ${shipName}!`,
          });
          for (
            let i = 0;
            i < shipsPositionsRef.current[shipName].positions.length;
            i++
          ) {
            updateShipGrid[shipsPositionsRef.current[shipName].positions[i][0]][
              shipsPositionsRef.current[shipName].positions[i][1]
            ].sunk = true;
          }
          // 17 hits means all ships are sunk, but because ShipPositionsRef.current is a render behind, we are checking for 16 hits.
          let allSunk = 0;
          for (const key in shipsPositionsRef.current) {
            allSunk += shipsPositionsRef.current[key].hits;
          }
          if (allSunk === 16) {
            console.log("YOU LOSE");
            setGameOver({ win: false });
            socket.emit("player-sunk", {
              user_id: user.user_id,
              roomCode: body.roomCode,
            });
          }
          // POTENTIALLY EMIT TO OTHER PLAYERS THAT A SHIP WAS SUNK ????????
        }
      } else {
        socket.emit("miss", { ...body, username2: user.username });
        updateShipGrid[body.row][body.column].attacked = true;
        updateShipGrid[body.row][body.column].hit = false;
      }
      setMyTurn(true);
      setShipGrid(updateShipGrid);
      console.log(body);
    };
    const playerReady = (body) => {
      const { username, gameReady, player_1 } = body;
      if (gameReady) {
        console.log("EVERYONE READY");
        setEveryoneReady(true);
        player_1 === user.user_id && setMyTurn(true);
      }
      console.log(username);
    };

    const handleMiss = (body) => {
      let updateRadarGrid = [...radarGridRef.current];
      updateRadarGrid[body.row][body.column].attacked = true;
      updateRadarGrid[body.row][body.column].hit = false;
      setRadarGrid(updateRadarGrid);
    };
    const handleHit = (body) => {
      let updateRadarGrid = [...radarGridRef.current];
      updateRadarGrid[body.row][body.column].attacked = true;
      updateRadarGrid[body.row][body.column].hit = true;
      setRadarGrid(updateRadarGrid);
    };

    const handleWin = (body) => {
      const { roomCode } = body;
      socket.emit("send-message", {
        username: "GAME",
        roomCode,
        message: `${user.username} WINS!!!!`,
      });
      setGameOver({ win: true });
    };

    if (socket) {
      socket.on("server-send-attack", attackRespond);

      socket.on("player-ready", playerReady);

      socket.on("miss", handleMiss);

      socket.on("hit", handleHit);

      socket.on("you-win", handleWin);
    }

    return () => {
      console.log("off");
      if (socket) {
        socket.off("server-send-attack", attackRespond);
        socket.off("player-ready", playerReady);
        socket.off("miss", handleMiss);
        socket.off("hit", handleHit);
        socket.off("you-win", handleWin);
      }
    };
  }, [socket]);

  const handleAttack = (row, column) => {
    console.log(radarGrid[row][column]);
    if (
      !gameOver &&
      everyoneReady &&
      myTurn &&
      !radarGrid[row][column].attacked
    ) {
      socket.emit("send-attack", { row, column, roomCode, user });
      setMyTurn(false);
    }
  };
  // console.log(shipsPositionsRef.current)
  // MAYBE WE SHOULD
  return (
    <div className="game-screen">
      <section className="yard-grid-wrapper">
        <section>
          <h1>Your Ships:</h1>
          <section className="ship-grid">
            {shipGrid.map((row) => {
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
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={() => {
                          onShipDrop(square);
                        }}
                      ></div>
                    );
                  })}
                </div>
              );
            })}
          </section>
        </section>
        {imReady ? (
          <div>
            {" "}
            <Chat socket={props.socket} />{" "}
          </div>
        ) : (
          <section className="ship-yard">
            <div className="ship-yard-button-container">
              <button
                onClick={() => {
                  let ships = Array.from(
                    document.querySelectorAll("#ship-yard-ship-container > div")
                  );
                  for (let i = 0; i < ships.length; i++) {
                    ships[i].style.display = "flex";
                    setShipsDirection("horizontal");
                  }
                  let resetShipGrid = [...shipGrid];
                  for (let i = 0; i < resetShipGrid.length; i++) {
                    for (let j = 0; j < resetShipGrid[i].length; j++) {
                      resetShipGrid[i][j].ship = null;
                    }
                  }
                  setShipGrid(resetShipGrid);
                  setShipsSet(0);
                  setShipsPositions({
                    battleship: {
                      positions: [[], [], [], []],
                      hits: 0,
                      sunk: false,
                    },
                    carrier: {
                      positions: [[], [], [], [], []],
                      hits: 0,
                      sunk: false,
                    },
                    sub: { positions: [[], [], []], hits: 0, sunk: false },
                    cruiser: { positions: [[], [], []], hits: 0, sunk: false },
                    destroyer: { positions: [[], []], hits: 0, sunk: false },
                  });
                }}
              >
                reset
              </button>
              <button
                onClick={() => {
                  if (shipsDirection === "horizontal") {
                    setShipsDirection("vertical");
                  } else {
                    setShipsDirection("horizontal");
                  }
                }}
              >
                flip
              </button>
            </div>
            <div id="ship-yard-ship-container" className={shipsDirection}>
              <div
                id="battleship"
                draggable={true}
                onDragStart={onDragStart}
                className={shipsDirection}
              >
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="battleship-0"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="battleship-1"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="battleship-2"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="battleship-3"
                ></div>
              </div>
              <div
                id="carrier"
                draggable={true}
                onDragStart={onDragStart}
                className={shipsDirection}
              >
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="carrier-0"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="carrier-1"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="carrier-2"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="carrier-3"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="carrier-4"
                ></div>
              </div>
              <div
                id="sub"
                draggable={true}
                onDragStart={onDragStart}
                className={shipsDirection}
              >
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="sub-0"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="sub-1"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="sub-2"
                ></div>
              </div>
              <div
                id="cruiser"
                draggable={true}
                onDragStart={onDragStart}
                className={shipsDirection}
              >
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="cruiser-0"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="cruiser-1"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="cruiser-2"
                ></div>
              </div>
              <div
                id="destroyer"
                draggable={true}
                onDragStart={onDragStart}
                className={shipsDirection}
              >
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="destroyer-0"
                ></div>
                <div
                  onMouseDown={(e) => setDraggedShipPiece(e.target.id)}
                  className="ship-yard-ship-piece"
                  id="destroyer-1"
                ></div>
              </div>
            </div>
          </section>
        )}
        <h2>CODE: {roomCode}</h2>
      </section>
      {imReady ? null : (
        <div>
          {shipsSet === 5 ? (
            <button onClick={startGame}>Start Game</button>
          ) : (
            <div>Place Ships to start </div>
          )}
        </div>
      )}

      {imReady && (
        <section>
          <h1 id="radar-header">Radar:</h1>
          <section className="radar-grid">
            {radarGrid.map((row) => {
              return (
                <div className="radar-grid-row">
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
                    return (
                      <div
                        onClick={() => handleAttack(square.row, square.column)}
                        className={`radar-grid-square ${cssClass}`}
                      ></div>
                    );
                  })}
                </div>
              );
            })}
            <div className="scan"></div>
          </section>
          {everyoneReady && (
            <h1 className="turn">
              {!gameOver
                ? myTurn
                  ? "Your Turn!"
                  : "Opponent's turn!"
                : gameOver.win
                ? "You Win!"
                : "You Lose!"}
            </h1>
          )}
        </section>
      )}
    </div>
  );
};
export default Game;
