import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Game.css";
import "./Ships.scss";
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
  const { roomCode } = useSelector((store) => store.gameReducer);
  const { user } = useSelector((store) => store.authReducer);
  const { opponentInfo } = useSelector((store) => store.gameReducer);
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
    //HARD CODED to check for bot (bot user_id = 17);
    if (opponent === 17) {
      setMyTurn(true);
      //set botships
      let updatedBotShips = opponentShips;
      for (let i = 0; i < info.moves.length; i++) {
        if (info.moves[i].user_id !== 17) {
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
    setImReady(true);
    if (opponentInfo !== null) {
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
      const { username, gameReady, player_1 } = body;
      if (gameReady) {
        dispatch(setOpponent({ username: username }));
        setEveryoneReady(true);
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
    };

    if (socket) {
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
        setGameOver(true);
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
    //easybot

    //   while (!successfulAttack){
    //   let tryRow = Math.floor(Math.random() * 10)
    //   let tryColumn = Math.floor(Math.random() * 10)
    //   if(!playerShipGrid[tryRow][tryColumn].attacked){
    //     successfulAttack = true;
    //     row = tryRow;
    //     column = tryColumn
    //   }
    // }
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
/////////////
    playerShipGrid[row][column].attacked = true;
    if (playerShipGrid[row][column].ship !== null) {
      playerShipGrid[row][column].hit = true;
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
          setGameOver(true);
          socket.emit("player-sunk", {
            user_id: user.user_id,
            roomCode: roomCode,
          });
        }
        //check for win
      }
    } else {
      playerShipGrid[row][column].hit = false;
    }
    setShipGrid(playerShipGrid);
    setShipsPositions(playersShips);
    setTimeout(function () {
      setMyTurn(true);
    }, 3000);
    axios.post("/api/game/add/move", {
      row,
      column,
      user_id: opponentInfo.user_id,
      roomCode,
    });
  };

  const handleAttack = (row, column) => {
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
      socket.emit("send-attack", { row, column, roomCode, user });
      setMyTurn(false);
    }
  };

  const handleBackButton = () => {
    setOnDash(true);
    setOnGame(false);
  };

  return (
    <div className="game-screen">
      <section className="yard-grid-wrapper">
        <button onClick={() => handleBackButton()}>Back</button>
        <section>
          <h1 className="your-ships-title">Your Ships:</h1>
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
                onClick={() => handleRandomShips("", shipGrid, shipsPositions)}
              >
                Random
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
        <div className="code-container">
          <h1 className="code-title">CODE:</h1>
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
