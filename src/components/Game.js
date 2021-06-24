import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import "./Game.css";
import "./Ships.scss"
import Chat from "./Chat";
import axios from "axios";

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
  const { socket, setOnDash, setOnGame } = props;
  const { roomCode } = useSelector((store) => store.gameReducer);
  const { user } = useSelector((store) => store.authReducer);
  const {opponentInfo} = useSelector((store)=>store.gameReducer);
  const shipGridRef = useRef(shipGrid);
  const radarGridRef = useRef(radarGrid);
  const shipsPositionsRef = useRef(shipsPositions);
  const [myTurn, setMyTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false); // {win: true||false}
  //get all previous game data on re-join
  useEffect(() => {
    axios
      .get(`/api/get/game/${roomCode}`)
      .then((res) => {
        console.log(res.data);
        updateGameRejoin(res.data)
      })
      .catch((err) => {
        console.log(err);
        
      });
  }, []);

  const updateGameRejoin = async (info) => {
      //determine if user is player1 or player2
      let opponent;
      let opponentShips;
      let thisPlayer;
      let thisPlayerShips;
      if (user.user_id === info.game.player_1){
        thisPlayer = info.game.player_1;
        thisPlayerShips = info.game.player_1_ships;
        opponent = info.game.player_2;
        opponentShips = info.game.player_2_ships;
      }
      else if (user.user_id === info.game.player_2){
        thisPlayer = info.game.player_2;
        thisPlayerShips = info.game.player_2_ships;
        opponent = info.game.player_1;
        opponentShips = info.game.player_1_ships;
      }
      console.log("thisplayer",thisPlayer, thisPlayerShips)
      console.log("opponent",opponent, opponentShips)
      if (thisPlayerShips !== null){
      setShipsPositions(thisPlayerShips)
      setImReady(true)
      }
      if (opponentShips !== null){
        setEveryoneReady(true)
      } 
      setGrids(opponentShips, thisPlayerShips, info.moves, opponent, thisPlayer) 
      if (info.moves.length > 0){
        console.log(shipsPositionsRef.current)
      let turn = info.moves.sort((a,b)=>{
        if (a.move_id > b.move_id){
          return -1
        }
        else{
          return 1
        }
      })[0];

      if (turn.user_id === user.user_id){
        setMyTurn(false)
      }
      else{
        //why isnt the shipGridRef current?
        console.log(shipGridRef.current)
        console.log(shipsPositionsRef.current)
        let hit = false
        for (let ship in shipsPositionsRef.current){
          for (let i = 0; i < shipsPositionsRef.current[ship].positions.length; i++){
            if (turn.move[0] === shipsPositionsRef.current[ship].positions[i][0] && turn.move[1] === shipsPositionsRef.current[ship].positions[i][1]){
              socket.emit('hit', {roomCode: roomCode, row: turn.move[0], column: turn.move[1], username2: user.username, username: opponentInfo.username})
              hit = true;
              if(shipsPositionsRef.current[ship].hits >= shipsPositionsRef.current[ship].positions.length){
                console.log(`${ship} SUNK!`)
                socket.emit('send-message', {username: user.username, roomCode: roomCode, message: `You sunk my ${ship}!`})
                let allSunk = 0
                for (const key in shipsPositionsRef.current) {
                  allSunk += shipsPositionsRef.current[key].hits
                }
                console.log(allSunk)
                if(allSunk === 17){
                  console.log('YOU LOSE')
                  setGameOver({win: false})
                  socket.emit('player-sunk', {user_id: user.user_id, roomCode: roomCode})
                }
              }
            }
          }
        }
        if (hit === false){
          socket.emit('miss', {roomCode: roomCode, row: turn.move[0], column: turn.move[1], username2: user.username, username: opponentInfo.username})

        }
        setMyTurn(true)
      }
    }
    else if (info.game.player_1 === user.user_id){
      setMyTurn(true)
    }
  }
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
        addShipToShipGrid[square.row][i].direction = `${shipsDirection}`;
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
        addShipToShipGrid[i][square.column].direction = `${shipsDirection}`;
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
  const setGrids = (opponentShips, playerShips, moves, opponent, thisPlayer) => {
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
    if (opponentShips){
      for (let i = 0; i < moves.length; i++){
        if (moves[i].user_id === user.user_id){
          let miss = true;
          for (let ship in opponentShips){
            for (let j = 0; j < opponentShips[ship].positions.length; j++){
              if (moves[i].move[0] === opponentShips[ship].positions[j][0] && moves[i].move[1] === opponentShips[ship].positions[j][1]){
                square[moves[i].move[0]][moves[i].move[1]].attacked = true;
                square[moves[i].move[0]][moves[i].move[1]].hit = true;
                miss = false;
              }
            }
          }
          if (miss === true){
            square[moves[i].move[0]][moves[i].move[1]].attacked = true;
            square[moves[i].move[0]][moves[i].move[1]].hit = false;
          }
        }
      }
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
    let updatedShipHits = {...shipsPositionsRef.current}
    if (playerShips){
      for (let ship in playerShips){
        let index = 0;
        for (let i = 0; i < playerShips[ship].positions.length; i++){
          //change to actual ship piece
          shipSquares[playerShips[ship].positions[i][0]][playerShips[ship].positions[i][1]].ship = `${ship}-${index}`
          index++
        }
    }
    for (let i = 0; i < moves.length; i++){
      if (moves[i].user_id !== user.user_id){
        let miss = true;
        
        for (let ship in playerShips){
          for (let j = 0; j < playerShips[ship].positions.length; j++){
            if (moves[i].move[0] === playerShips[ship].positions[j][0] && moves[i].move[1] === playerShips[ship].positions[j][1]){
              shipSquares[moves[i].move[0]][moves[i].move[1]].attacked = true;
              shipSquares[moves[i].move[0]][moves[i].move[1]].hit = true;
              updatedShipHits[ship].hits += 1;
              if (updatedShipHits[ship].hits === updatedShipHits[ship].positions.length){
                updatedShipHits[ship].sunk = true;
                for (let z = 0; z < updatedShipHits[ship].positions.length; z++){
                  shipSquares[updatedShipHits[ship].positions[z][0]][updatedShipHits[ship].positions[z][1]].sunk = true
                }
              }

              miss = false;
            }
          }
        }
        if (miss === true){
          shipSquares[moves[i].move[0]][moves[i].move[1]].attacked = true;
          shipSquares[moves[i].move[0]][moves[i].move[1]].hit = false;
        }
      }
    }

    }
    setShipsPositions(updatedShipHits)
    setShipGrid(shipSquares);
  }
  

  useEffect(() => {
    shipGridRef.current = shipGrid;
  }, [shipGrid]);

  useEffect(() => {
    radarGridRef.current = radarGrid;
  }, [radarGrid]);

  useEffect(() => {
    shipsPositionsRef.current = shipsPositions;
  }, [shipsPositions]);

  const attackRespond = (body) => {
    let updateShipGrid = [...shipGridRef.current]
    if (shipGridRef.current[body.row][body.column].ship !== null){
      let shipName = shipGridRef.current[body.row][body.column].ship.slice(0, shipGridRef.current[body.row][body.column].ship.indexOf("-"));
      // console.log('SHip Positions: ', shipsPositionsRef.current, 'shipPName: ', shipName)
        socket.emit('hit', {...body, username2: user.username})
        setShipsPositions({...shipsPositionsRef.current, [shipName]: {...shipsPositionsRef.current[shipName], hits: shipsPositionsRef.current[shipName].hits+1 }})
        // console.log('new positions: ', shipsPositionsRef.current)
        updateShipGrid[body.row][body.column].attacked = true;
        updateShipGrid[body.row][body.column].hit = true;
        if(shipsPositionsRef.current[shipName].hits + 1 >= shipsPositionsRef.current[shipName].positions.length){
          console.log(`${shipName} SUNK!`)
          socket.emit('send-message', {username: user.username, roomCode: body.roomCode, message: `You sunk my ${shipName}!`})
          for (let i = 0; i < shipsPositionsRef.current[shipName].positions.length; i++) {
            updateShipGrid[shipsPositionsRef.current[shipName].positions[i][0]][shipsPositionsRef.current[shipName].positions[i][1]].sunk = true;
          }
          // 17 hits means all ships are sunk, but because ShipPositionsRef.current is a render behind, we are checking for 16 hits.
          let allSunk = 0
          for (const key in shipsPositionsRef.current) {
            allSunk += shipsPositionsRef.current[key].hits
          }
          if(allSunk === 16){
            console.log('YOU LOSE')
            setGameOver({win: false})
            socket.emit('player-sunk', {user_id: user.user_id, roomCode: body.roomCode})
          }
        }
    }
    else{
        socket.emit('miss', {...body, username2: user.username})
        updateShipGrid[body.row][body.column].attacked = true;
        updateShipGrid[body.row][body.column].hit = false;
    }
  setMyTurn(true)
  setShipGrid(updateShipGrid)
  console.log(body);
};

  useEffect(() => {
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
console.log(shipGridRef.current)

  const handleBackButton = () => {
    setOnDash(true)
    setOnGame(false)
  }
  return (
    <div className="game-screen">
      <section className="yard-grid-wrapper">
        <button onClick={() => handleBackButton()}>Back</button>
      <section> 
      <h1 className='your-ships-title'>Your Ships:</h1>
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
                      className={`ship-grid-square ${cssClass} ${square.direction? square.direction: ''}`}
                      id={`${square.ship}`}
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
        <div className='code-container'>
          <h1 className='code-title'>CODE:</h1>
          <br />
          <h2> {roomCode} </h2>
        </div>
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
            <h1 className='your-turn'>
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
