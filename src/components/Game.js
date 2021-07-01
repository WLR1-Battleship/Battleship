import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Game.css";
import "./Game.scss";
import "./Ships.scss";
import "./GameMissile.css";
import './gamefire.css';
import Chat from "./Chat";
import axios from "axios";
import { setOpponent } from "../redux/gameReducer";

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
  const dispatch = useDispatch();
  const [imReady, setImReady] = useState(false);
  const [everyoneReady, setEveryoneReady] = useState(false);
  const [radarGrid, setRadarGrid] = useState([]);
  const [shipGrid, setShipGrid] = useState([]);
  const { socket, setOnDash, setOnGame } = props;
  const { roomCode, opponentInfo } = useSelector((store) => store.gameReducer);
  const { user } = useSelector((store) => store.authReducer);
  const shipGridRef = useRef(shipGrid);
  const radarGridRef = useRef(radarGrid);
  const shipsPositionsRef = useRef(shipsPositions);
  const [myTurn, setMyTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false); // {win: true||false}
  const [botShipGrid, setBotShipGrid] = useState([]);
  const [botShipPosition, setBotShipPosition] = useState({
    battleship: { positions: [[], [], [], []], hits: 0, sunk: false },
    carrier: { positions: [[], [], [], [], []], hits: 0, sunk: false },
    sub: { positions: [[], [], []], hits: 0, sunk: false },
    cruiser: { positions: [[], [], []], hits: 0, sunk: false },
    destroyer: { positions: [[], []], hits: 0, sunk: false },
  });
  const [opponentOnline, setOpponentOnline] = useState(false)
  const [botDiff, setBotDiff] = useState('easy')
  const [botHitTracker, setBotHitTracker] = useState({currentHits: [], shipsSunk: [], dir: null, bot_diff: 'easy'})
 
  //get all previous game data on re-join
  useEffect(() => {
    axios
      .get(`/api/get/game/${roomCode}`)
      .then((res) => {
        updateGameRejoin(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
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
    setBotShipGrid(shipSquares);
  }, []);

  const updateGameRejoin = async (info) => {
    //determine if user is player1 or player2
    let opponent;
    let opponentShips;
    let thisPlayer;
    let thisPlayerShips;
    if(info.moves.length > 0 && info.moves[info.moves.length-1].bot_tracker!== null){
      setBotHitTracker(info.moves[info.moves.length-1].bot_tracker)
      setBotDiff(info.moves[info.moves.length-1].bot_tracker.bot_diff)
    }
    if (user.user_id === info.game.player_1) {
      thisPlayer = info.game.player_1;
      thisPlayerShips = info.game.player_1_ships;
      opponent = info.game.player_2;
      opponentShips = info.game.player_2_ships;
    } else if (user.user_id === info.game.player_2) {
      thisPlayer = info.game.player_2;
      thisPlayerShips = info.game.player_2_ships;
      opponent = info.game.player_1;
      opponentShips = info.game.player_1_ships;
    }
    if (thisPlayerShips !== null) {
      setShipsPositions(thisPlayerShips);
      setImReady(true);
    }
    if (opponentShips !== null) {
      setEveryoneReady(true);
    }

    setGrids(opponentShips, thisPlayerShips, info.moves, opponent, thisPlayer);
    //HARD CODED to check for bot (bot user_id = 1);
    if (opponent === 1) {
      setMyTurn(true);
      //set botships
      let updatedBotShips = opponentShips;
      for (let i = 0; i < info.moves.length; i++) {
        if (info.moves[i].user_id !== 1) {
          for (let ship in updatedBotShips) {
            for (let j = 0; j < updatedBotShips[ship].positions.length; j++) {
              if (
                info.moves[i].move[0] ===
                  updatedBotShips[ship].positions[j][0] &&
                info.moves[i].move[1] === updatedBotShips[ship].positions[j][1]
              ) {
                updatedBotShips[ship].hits++;
              }
            }
          }
        }
      }
      setBotShipPosition(updatedBotShips);
      return;
    }
    if (info.moves.length > 0) {
      let turn = info.moves.sort((a, b) => {
        if (a.move_id > b.move_id) {
          return -1;
        } else {
          return 1;
        }
      })[0];

      if (turn.user_id === user.user_id) {
        setMyTurn(false);
      } else {
        let hit = false;
        for (let ship in shipsPositionsRef.current) {
          for (
            let i = 0;
            i < shipsPositionsRef.current[ship].positions.length;
            i++
          ) {
            if (
              turn.move[0] ===
                shipsPositionsRef.current[ship].positions[i][0] &&
              turn.move[1] === shipsPositionsRef.current[ship].positions[i][1]
            ) {
              socket.emit("hit", {
                roomCode: roomCode,
                row: turn.move[0],
                column: turn.move[1],
                username2: user.username,
                username: opponentInfo.username,
              });
              hit = true;
              if (
                shipsPositionsRef.current[ship].hits >=
                shipsPositionsRef.current[ship].positions.length
              ) {
                console.log(`${ship} SUNK!`);
                socket.emit("send-message", {
                  username: user.username,
                  roomCode: roomCode,
                  message: `You sunk my ${ship}!`,
                });
                let allSunk = 0;
                for (const key in shipsPositionsRef.current) {
                  allSunk += shipsPositionsRef.current[key].hits;
                }
                if (allSunk === 17) {
                  setGameOver({ win: false });
                  alert('GAME OVER: YOU LOSE')
                  socket.emit("player-sunk", {
                    user_id: user.user_id,
                    roomCode: roomCode,
                  });
                }
              }
            }
          }
        }
        if (hit === false) {
          socket.emit("miss", {
            roomCode: roomCode,
            row: turn.move[0],
            column: turn.move[1],
            username2: user.username,
            username: opponentInfo.username,
          });
        }
        setMyTurn(true);
      }
    } else if (info.game.player_1 === user.user_id) {
      setMyTurn(true);
    }
  };
  //Start Game
  const startGame = () => {
    setBotHitTracker(prev => {
      return {...prev, bot_diff: botDiff} 
    })
    setImReady(true);
    if (opponentInfo) {
      if (opponentInfo.username === "BOT") {
        handleRandomShips("bot", botShipGrid, botShipPosition);
        setMyTurn(true);
        setEveryoneReady(true);
        return;
      }
    }

    socket.emit("ships-set", {
      user_id: user.user_id,
      ships: shipsPositions,
      roomCode: roomCode,
      username: user.username,
    });
  };
  //Placing ships onto grid
  const handleRandomShips = (bot, shipGrid, shipsPositions) => {
    if(bot !=='bot'){
      let resetShipGrid = [...shipGrid];
      for (let i = 0; i < resetShipGrid.length; i++) {
        for (let j = 0; j < resetShipGrid[i].length; j++) {
          resetShipGrid[i][j].ship = null;
          resetShipGrid[i][j].direction = null
        }
      }
      setShipGrid(resetShipGrid);
    }
        
    let shipPieces = [
      "battleship-0",
      "sub-0",
      "carrier-0",
      "cruiser-0",
      "destroyer-0",
    ];
    let orientation;
    while (shipPieces.length != 0) {
      let row = Math.floor(Math.random() * 10);
      let column = Math.floor(Math.random() * 10);
      let shipPiece = shipPieces[0];
      Math.random() > 0.5
        ? (orientation = "vertical")
        : (orientation = "horizontal");
      let shipDrop = randomShipDrop(
        shipGrid[row][column],
        orientation,
        shipPiece,
        bot,
        shipGrid,
        shipsPositions
      );
      if (shipDrop === true) {
        shipPieces.splice(0, 1);

      }
    }
    setShipsSet(5);
  };
  const randomShipDrop = (
    square,
    orientation,
    shipPiece,
    bot,
    shipGrid,
    shipsPositions
  ) => {
    let shipName = shipPiece.slice(0, shipPiece.indexOf("-"));
    let shipIndex = shipPiece.slice(shipPiece.indexOf(shipPiece.length - 2));
    let shipLength =
      shipsPositions[shipPiece.slice(0, shipPiece.indexOf("-"))].positions
        .length;
    //check if squares are available with direction HORIZONTAL
    let addShipToShipGrid = [...shipGrid];
    let shipPosition = { ...shipsPositions };
    if (orientation === "horizontal") {
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
        addShipToShipGrid[square.row][i].direction = `${orientation}`;
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
        addShipToShipGrid[i][square.column].direction = `${orientation}`;

        nameIndex++;
      }
    }
    if (bot === "bot") {
      setBotShipGrid(addShipToShipGrid);
      setBotShipPosition(shipPosition);
      let shipFull = true;
      for (let ship in shipPosition) {
        for (let i = 0; i < shipPosition[ship].positions.length; i++) {
          if (shipPosition[ship].positions[i].length === 0) {
            shipFull = false;
            break;
          }
        }
      }
      if (shipFull === true) {
        axios.put("/api/bot/setgame", {
          bot: shipPosition,
          player: shipsPositionsRef.current,
          roomCode: roomCode,
        });
      }
    } else {
      setShipsPositions(shipPosition);
      setShipGrid(addShipToShipGrid);
      document.getElementById(shipName).style.display = "none";
      setShipsSet(shipsSet + 1);
    }
    //check if ships are all set
    //update the ship position locally and in the db
    return true;
  };

  const onDragStart = () => {};
  const onShipDrop = (square) => {
    if (!draggedShipPiece){
      return
    }
    let shipName = draggedShipPiece.slice(0, draggedShipPiece.indexOf("-"));
    if (shipsPositions[shipName].positions[0].length > 0){
      return
    }
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
  const setGrids = (
    opponentShips,
    playerShips,
    moves,
    opponent,
    thisPlayer
  ) => {
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
    if (opponentShips) {
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].user_id === user.user_id) {
          let miss = true;
          for (let ship in opponentShips) {
            for (let j = 0; j < opponentShips[ship].positions.length; j++) {
              if (
                moves[i].move[0] === opponentShips[ship].positions[j][0] &&
                moves[i].move[1] === opponentShips[ship].positions[j][1]
              ) {
                square[moves[i].move[0]][moves[i].move[1]].attacked = true;
                square[moves[i].move[0]][moves[i].move[1]].hit = true;
                miss = false;
              }
            }
          }
          if (miss === true) {
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
    let updatedShipHits = { ...shipsPositionsRef.current };
    if (playerShips) {
      for (let ship in playerShips) {
        let index = 0;
        for (let i = 0; i < playerShips[ship].positions.length; i++) {
          //change to actual ship piece
          shipSquares[playerShips[ship].positions[i][0]][
            playerShips[ship].positions[i][1]
          ].ship = `${ship}-${index}`;
          let direction = ''
          console.log(shipSquares[playerShips[ship].positions[0][0]])
          if(shipSquares[playerShips[ship].positions[0][0]][playerShips[ship].positions[0][1]].row === shipSquares[playerShips[ship].positions[1][0]][playerShips[ship].positions[1][1]].row){
            direction = 'horizontal'
          }
          else{
            direction = 'vertical'
          }
          shipSquares[playerShips[ship].positions[i][0]][
            playerShips[ship].positions[i][1]
          ].direction = direction;
          index++;
        }
      }
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].user_id !== user.user_id) {
          let miss = true;

          for (let ship in playerShips) {
            for (let j = 0; j < playerShips[ship].positions.length; j++) {
              if (
                moves[i].move[0] === playerShips[ship].positions[j][0] &&
                moves[i].move[1] === playerShips[ship].positions[j][1]
              ) {
                shipSquares[moves[i].move[0]][moves[i].move[1]].attacked = true;
                shipSquares[moves[i].move[0]][moves[i].move[1]].hit = true;
                updatedShipHits[ship].hits += 1;
                if (
                  updatedShipHits[ship].hits ===
                  updatedShipHits[ship].positions.length
                ) {
                  updatedShipHits[ship].sunk = true;
                  for (
                    let z = 0;
                    z < updatedShipHits[ship].positions.length;
                    z++
                  ) {
                    shipSquares[updatedShipHits[ship].positions[z][0]][
                      updatedShipHits[ship].positions[z][1]
                    ].sunk = true;
                  }
                }

                miss = false;
              }
            }
          }
          if (miss === true) {
            shipSquares[moves[i].move[0]][moves[i].move[1]].attacked = true;
            shipSquares[moves[i].move[0]][moves[i].move[1]].hit = false;
          }
        }
      }
    }
    setShipsPositions(updatedShipHits);
    setShipGrid(shipSquares);
  };

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
    let updateShipGrid = [...shipGridRef.current];
    if (shipGridRef.current[body.row][body.column].ship !== null) {
      let shipName = shipGridRef.current[body.row][body.column].ship.slice(
        0,
        shipGridRef.current[body.row][body.column].ship.indexOf("-")
      );
      socket.emit("hit", { ...body, username2: user.username });
      setShipsPositions({
        ...shipsPositionsRef.current,
        [shipName]: {
          ...shipsPositionsRef.current[shipName],
          hits: shipsPositionsRef.current[shipName].hits + 1,
        },
      });
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
          alert('GAME OVER: YOU LOSE')
          socket.emit("player-sunk", {
            user_id: user.user_id,
            roomCode: body.roomCode,
          });
        }
      }
    } else {
      socket.emit("miss", { ...body, username2: user.username });
      updateShipGrid[body.row][body.column].attacked = true;
      updateShipGrid[body.row][body.column].hit = false;
    }
    setMyTurn(true);
    setShipGrid(updateShipGrid);
  };

  useEffect(() => {
    const playerReady = (body) => {
      const { username, gameReady, player_1, user_id } = body;
      if (gameReady) {
        if (user_id !== user.user_id){
        dispatch(setOpponent({ username: username, user_id: user_id }));
        socket.emit('im-your-opponent', {username: user.username, user_id: user.user_id, roomCode})
        }
        setEveryoneReady(true);
        setOpponentOnline(true);
        player_1 === user.user_id && setMyTurn(true);
      }
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
      alert('VICTORY')
    };

    const handlePlayerOffline = (body) => {
      console.log('offline')
      setOpponentOnline(false)
    }
    const handlePlayerOnline = (body) => {
      console.log('online')
      setOpponentOnline(true)
    }
    if (socket){
      socket.emit('online', {roomCode: roomCode})
      socket.emit('are-you-online', {roomCode})
    }
    if (socket) {
      socket.on('are-you-online', ()=>{
        socket.emit('online', {roomCode})
      })

      socket.on('im-your-opponent', (body) => {
        dispatch(setOpponent({username: body.username, user_id: body.user_id}))
      })

      socket.on('player-online', handlePlayerOnline);

      socket.on('player-offline', handlePlayerOffline);

      socket.on("server-send-attack", attackRespond);

      socket.on("player-ready", playerReady);

      socket.on("miss", handleMiss);

      socket.on("hit", handleHit);

      socket.on("you-win", handleWin);
    }

    return () => {
      if (socket) {

        socket.off("server-send-attack", attackRespond);
        socket.off("player-ready", playerReady);
        socket.off("miss", handleMiss);
        socket.off("hit", handleHit);
        socket.off("you-win", handleWin);
        socket.off("are-you-online");
        socket.off("im-your-opponent");
        socket.off("player-online", handlePlayerOnline);
        socket.off("player-offline", handlePlayerOffline)
      }
    };
  }, [socket]);
 
  const attackBot = (row, column) => {
    //need to update bots ship hits
    let updateBotShips = { ...botShipPosition };
    let hit = false;
    let sunk = false;
    let allSunk = 0;
    for (let ship in updateBotShips) {
      for (let i = 0; i < updateBotShips[ship].positions.length; i++) {
        if (
          updateBotShips[ship].positions[i][0] === row &&
          updateBotShips[ship].positions[i][1] === column
        ) {
          updateBotShips[ship].hits += 1;
          hit = true;
          if (
            updateBotShips[ship].positions.length === updateBotShips[ship].hits
          ) {
            sunk=true;
            socket.emit("send-message", {
              username: "BOT",
              roomCode: roomCode,
              message: `You sunk my ${ship}!`,
            });
          }
        }
      }
    }

    setBotShipPosition(updateBotShips);
    //need to update players radar
    let updatePlayerRadar = [...radarGrid];
    updatePlayerRadar[row][column].attacked = true;

    if (hit === true) {
      updatePlayerRadar[row][column].hit = true;
    }
    if (sunk === true) {
      updatePlayerRadar[row][column].sunk = true;
      
      for (let hitCount in updateBotShips) {
        allSunk += updateBotShips[hitCount].hits;
      }
      if (allSunk === 17) {
        alert("You Win!");
        setGameOver({win: true});
        socket.emit("player-sunk", {
          user_id: opponentInfo.user_id,
          roomCode: roomCode,
        });
      }
    }

    //need to send move to db
    axios.post("/api/game/add/move", {
      row,
      column,
      user_id: user.user_id,
      roomCode,
      botHitTracker
    }).then(()=>{
      if (allSunk !== 17){
        botAttackPlayer();
        }
    }).catch(err=>{
      console.log(err)
    });
    //need to call a function for bot to move
    
  };
  const botAttackPlayer = () => {
    let successfulAttack = false;
    let playerShipGrid = [...shipGrid];
    let playersShips = { ...shipsPositions };
    let row;
    let column;
    console.log(botHitTracker)
    let updateBotHitTracker = {...botHitTracker}
    let dir;

    //easybot
    if(botDiff==='easy'){
      while (!successfulAttack){
        let tryRow = Math.floor(Math.random() * 10)
        let tryColumn = Math.floor(Math.random() * 10)
        if(!playerShipGrid[tryRow][tryColumn].attacked){
          successfulAttack = true;
          row = tryRow;
          column = tryColumn
        }
      }
    }
    
    else if(botDiff==='hard'){
      console.log(botHitTracker)
        if (botHitTracker.currentHits.length === 0){
          while (!successfulAttack){
            let tryRow = Math.floor(Math.random() * 10)
            let tryColumn = Math.floor(Math.random() * 10)
            if(!playerShipGrid[tryRow][tryColumn].attacked){
              successfulAttack = true;
              row = tryRow;
              column = tryColumn
            }
          }
        }
      else if (botHitTracker.currentHits.length > 0 && !botHitTracker.dir){

         
          //check 1 sqaure below, above, left, right
          if ((botHitTracker.currentHits[0][0] + 1 <= 9) && (!playerShipGrid[botHitTracker.currentHits[0][0] + 1][botHitTracker.currentHits[0][1]].attacked)){
                row = botHitTracker.currentHits[0][0] + 1;
                column = botHitTracker.currentHits[0][1];
                dir = 'down'
            
          }
          else if ((botHitTracker.currentHits[0][0] - 1 >= 0) &&(!playerShipGrid[botHitTracker.currentHits[0][0] - 1][botHitTracker.currentHits[0][1]].attacked)){
                row = botHitTracker.currentHits[0][0] - 1;
                column = botHitTracker.currentHits[0][1];
                dir = 'up'

            }
          
          else if ((botHitTracker.currentHits[0][1] - 1 >= 0) && (!playerShipGrid[botHitTracker.currentHits[0][0]][botHitTracker.currentHits[0][1] - 1].attacked)){
                row = botHitTracker.currentHits[0][0];
                column = botHitTracker.currentHits[0][1] - 1;
                dir = 'left'

            }
          
          else if ((botHitTracker.currentHits[0][1] + 1 <= 9) && (!playerShipGrid[botHitTracker.currentHits[0][0]][botHitTracker.currentHits[0][1] + 1].attacked)){
                row = botHitTracker.currentHits[0][0];
                column = botHitTracker.currentHits[0][1] + 1;
                dir = 'right'

            }
          }

          
          
      else if (botHitTracker.currentHits.length > 0 && botHitTracker.dir){
            
            if (botHitTracker.dir === 'down'){
              if ((botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0] + 1 <= 9) && (!playerShipGrid[botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0] + 1][botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1]].attacked)){
                row = botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0] + 1;
                column = botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1];
                dir = 'down'
                
            
              }
              else{
                 if ((botHitTracker.currentHits[0][0] - 1 >= 0) &&(!playerShipGrid[botHitTracker.currentHits[0][0] - 1][botHitTracker.currentHits[0][1]].attacked)){
                  row = botHitTracker.currentHits[0][0] - 1;
                  column = botHitTracker.currentHits[0][1];
                  dir = 'up'
  
                }
            
              else if ((botHitTracker.currentHits[0][1] - 1 >= 0) && (!playerShipGrid[botHitTracker.currentHits[0][0]][botHitTracker.currentHits[0][1] - 1].attacked)){
                  row = botHitTracker.currentHits[0][0];
                  column = botHitTracker.currentHits[0][1] - 1;
                  dir = 'left'
  
                }
            
              else if ((botHitTracker.currentHits[0][1] + 1 <= 9) && (!playerShipGrid[botHitTracker.currentHits[0][0]][botHitTracker.currentHits[0][1] + 1].attacked)){
                  row = botHitTracker.currentHits[0][0];
                  column = botHitTracker.currentHits[0][1] + 1;
                  dir = 'right'
  
                }
              }

            }
            else if (botHitTracker.dir === 'up'){
              if ((botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0] - 1 >= 0) && (!playerShipGrid[botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0] - 1][botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1]].attacked)){
                row = botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0] - 1;
                column = botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1];
                dir = 'up'
            
              }
              else {
              
           
                if ((botHitTracker.currentHits[0][1] - 1 >= 0) && (!playerShipGrid[botHitTracker.currentHits[0][0]][botHitTracker.currentHits[0][1] - 1].attacked)){
                  row = botHitTracker.currentHits[0][0];
                  column = botHitTracker.currentHits[0][1] - 1;
                  dir = 'left'
  
                }
            
                else if ((botHitTracker.currentHits[0][1] + 1 <= 9) && (!playerShipGrid[botHitTracker.currentHits[0][0]][botHitTracker.currentHits[0][1] + 1].attacked)){
                  row = botHitTracker.currentHits[0][0];
                  column = botHitTracker.currentHits[0][1] + 1;
                  dir = 'right'
  
                }
              }
            }
            else if (botHitTracker.dir === 'left'){
              if ((botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1] - 1 >= 0) && (!playerShipGrid[botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0]][botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1] - 1].attacked)){
                row = botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0];
                column = botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1] - 1;
                dir='left'
            
              }
              else{
                if ((botHitTracker.currentHits[0][1] + 1 <= 9) && (!playerShipGrid[botHitTracker.currentHits[0][0]][botHitTracker.currentHits[0][1] + 1].attacked)){
                  row = botHitTracker.currentHits[0][0];
                  column = botHitTracker.currentHits[0][1] + 1;
                  dir = 'right'
  
              }

              }


          }
          else if (botHitTracker.dir === 'right'){
            if ((botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1] + 1 <= 9) && (!playerShipGrid[botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0]][botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1] + 1].attacked)){
              row = botHitTracker.currentHits[botHitTracker.currentHits.length - 1][0];
              column = botHitTracker.currentHits[botHitTracker.currentHits.length - 1][1] + 1;
              dir = 'right'
          
            }
            else{
              console.log('error')
            }
          }

        
        
       
      }
  }
    else{
      //impossible bot
      for (let i = 0; i < playerShipGrid.length; i++) {
        for (let j = 0; j < playerShipGrid[i].length; j++) {
          if (
            playerShipGrid[i][j].attacked === false &&
            playerShipGrid[i][j].ship !== null
          ) {
            row = i;
            column = j;
          }
        }
      }
    }

    
    
/////////////
    playerShipGrid[row][column].attacked = true;
    if (playerShipGrid[row][column].ship !== null) {
      playerShipGrid[row][column].hit = true;
      updateBotHitTracker.dir = dir
      updateBotHitTracker.currentHits.push([row, column]);
      let shipName = playerShipGrid[row][column].ship.slice(
        0,
        playerShipGrid[row][column].ship.indexOf("-")
      );
      console.log(shipName);
      playersShips[shipName].hits += 1;
      console.log(playersShips[shipName]);
      if (
        playersShips[shipName].hits === playersShips[shipName].positions.length
      ) {
         let updateCurrentHits = []
       
          for (let i = 0; i < updateBotHitTracker.currentHits.length; i++){
            let flag = false;
            for (let j = 0; j < playersShips[shipName].positions.length; j++){
                if (updateBotHitTracker.currentHits[i][0] === playersShips[shipName].positions[j][0] && updateBotHitTracker.currentHits[i][1] === playersShips[shipName].positions[j][1]){
                    flag = true;
                }
            }
            if (flag === false){
              updateCurrentHits.push(updateBotHitTracker.currentHits[i]);
            }
          }
        updateBotHitTracker.currentHits = updateCurrentHits;
        updateBotHitTracker.dir = null;

        console.log(playersShips[shipName], "sunk");
        socket.emit("send-message", {
          username: user.username,
          roomCode: roomCode,
          message: `You sunk my ${shipName}!`,
        });
        for (let i = 0; i < playersShips[shipName].positions.length; i++) {
          playerShipGrid[playersShips[shipName].positions[i][0]][
            playersShips[shipName].positions[i][1]
          ].sunk = true;
        }
        let hits = 0;
        for (let ship in playersShips) {
          hits += playersShips[ship].hits;
        }
        if (hits === 17) {
          alert("You Lose");
          setGameOver({win: false});
          socket.emit("player-sunk", {
            user_id: user.user_id,
            roomCode: roomCode,
          });
        }
        //check for win
      }
    } else {
      playerShipGrid[row][column].hit = false;
      botDiff==='hard' && (updateBotHitTracker.dir = null)

    }
    console.log(updateBotHitTracker)
    setBotHitTracker(updateBotHitTracker)
    setShipGrid(playerShipGrid);
    setShipsPositions(playersShips);
    setTimeout(function () {
      setMyTurn(true);
    }, 500);
    axios.post("/api/game/add/move", {
      row,
      column,
      user_id: opponentInfo.user_id,
      roomCode,
      botHitTracker: updateBotHitTracker
    });
  };

  const handleAttack = (row, column) => {
    if(!everyoneReady || !opponentInfo){
      return
    }
    if (
      opponentInfo.username === "BOT" &&
      !gameOver &&
      everyoneReady &&
      myTurn &&
      !radarGrid[row][column].attacked
    ) {
      attackBot(row, column);
      setMyTurn(false);
    }
    if (
      opponentInfo.username !== "BOT" &&
      !gameOver &&
      everyoneReady &&
      myTurn &&
      !radarGrid[row][column].attacked
    ) {
      socket.emit("send-attack", { row, column, roomCode, user});
      setMyTurn(false);
    }
  };

  const handleBackButton = () => {
    dispatch(setOpponent(null))
    setOnDash(true);
    setOnGame(false);
  };
console.log(botHitTracker)
  return (
    <div className="game-screen">
      <section className="yard-grid-wrapper">
      <button className='game-back-button' onClick={() => handleBackButton()}>Back</button>
        <section>
          <h1 className="your-ships-title">Your Ships:</h1>
          <section className="ship-grid">
          <div className='ocean'></div>
            <div className='waves'></div>
            <div className='waves w2'></div>
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
                        className={`ship-grid-square ${cssClass} ${
                          square.direction ? square.direction : ""
                        }`}
                        id={`${square.ship}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={() => {
                          onShipDrop(square);
                        }}
                      >
                        {square.attacked ?<div className="game-missile"> <div ></div><span id="smoke">
  <span class="s0"></span>
  <span class="s1"></span>
  <span class="s2"></span>
  <span class="s3"></span>
  <span class="s4"></span>
  <span class="s5"></span>
  <span class="s6"></span>
  <span class="s7"></span>
  <span class="s8"></span>
  <span class="s9"></span>
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
        </section>
        {imReady ? (
          <div>
          {opponentInfo && opponentOnline ? <h1 className='game-online-title'>{opponentInfo.username} <span>online</span></h1> : null}
            {opponentInfo && !opponentOnline && opponentInfo.username !== 'BOT' ? <h1 className='game-offline-title' style={{color: 'red'}}>{opponentInfo.username} <span style={{color: 'red'}}>offline</span></h1> : null}
            {" "}
            <Chat socket={props.socket} />{" "}
          </div>
        ) : (
          <section className="ship-yard">
            <div className="ship-yard-button-container">
              <button className='game-reset-button'
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
                      resetShipGrid[i][j].direction = null
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
              <button className='game-random-button'
                onClick={() => handleRandomShips("", shipGrid, shipsPositions)}
              >
                Random
              </button>
              <button className='game-flip-button'
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
        {opponentInfo?.username !== 'BOT' ? <div className="code-container">
          <h1 className="code-title">CODE:</h1>
          <br />
          <h2> {roomCode} </h2>
        </div> : 
        everyoneReady && <h2 >BOT DIFFICULTY: {<span className={`diff-${botDiff}`}>{`${botDiff.toUpperCase()}`}</span>}</h2>}
      </section>
      {imReady ? null : (
        <div className='start-panel'>
          {shipsSet === 5 ? (
            <button className='game-start-game-button' onClick={startGame}>Start Game</button>
          ) : (
            <div className='game-ships-to-start-title'>Place Ships To Start </div>
          )}
          {opponentInfo?.username==='BOT' && <div className='bot-difficulty'>
          <h2>BOT DIFFICULTY</h2>
          <label  ><input onChange={(e)=>setBotDiff(e.target.value)} defaultChecked={true} type='radio' name='diff' value='easy' />Easy</label>
          <label  ><input onChange={(e)=>setBotDiff(e.target.value)} type='radio' name='diff' value='hard' />Hard</label>
          <label  ><input onChange={(e)=>setBotDiff(e.target.value)}  type='radio' name='diff' value='impossible' />Impossible</label>
        </div>}
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
            <h1 className="your-turn">
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
