import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import io, { Socket } from "socket.io-client";
import "./Game.css";

const Game = (props) => {
  //Placing ships onto grid
  const [shipYard, setShipYard] = useState(true);
  const [shipsPositions, setShipsPositions] = useState({
    battleship: { positions: [[], [], [], []], hits: 0, sunk: false },
    carrier: { positions: [[], [], [], [], []], hits: 0, sunk: false },
    sub: { positions: [[], [], []], hits: 0, sunk: false },
    cruiser: { positions: [[], [], []], hits: 0, sunk: false },
    destroyer: { positions: [[], []], hits: 0, sunk: false },
  });
  const [shipsDirection, setShipsDirection] = useState("horizontal");
  const [draggedShipPiece, setDraggedShipPiece] = useState(null);
  ////////////////////////////////////////////////////////////////
  const [msgBoard, setMsgBoard] = useState(false);
  const [radarGrid, setRadarGrid] = useState([]);
  const [shipGrid, setShipGrid] = useState([]);
  const { socket } = props;
  const { roomCode } = useSelector((store) => store.gameReducer);

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
    const attackRespond = (body) => {
      console.log(body);
    };

    if (socket) {
      socket.on("server-send-attack", attackRespond);
    }

    return () => {
      if (socket) {
        socket.off("server-send-attack", attackRespond);
      }
    };
  }, [socket]);

  const handleAttack = (row, column) => {
    socket.emit("send-attack", { row, column, roomCode });
    
  };
  return (
    <div className="game-screen">
      <section className="yard-grid-wrapper">
        <section className="ship-grid">
          {shipGrid.map((row) => {
            return (
              <div className="ship-grid-row">
                {row.map((square) => {
                  let cssClass = "none";
                  if (square.ship !== null) {
                    cssClass = "ship";
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

        <section className="ship-yard">
          <div className="ship-yard-button-container">
            <button
              onClick={() => {
                let ships = Array.from(
                  document.querySelectorAll("#ship-yard-ship-container > div")
                );
                console.log(ships);
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
                setShipsPositions({
                    battleship: { positions: [[], [], [], []], hits: 0, sunk: false },
                    carrier: { positions: [[], [], [], [], []], hits: 0, sunk: false },
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

        <h2>CODE: {roomCode}</h2>
      </section>

      <section className="radar-grid">
        {radarGrid.map((row) => {
          return (
            <div className="radar-grid-row">
              {row.map((square) => {
                return (
                  <div
                    onClick={() => handleAttack(square.row, square.column)}
                    className="radar-grid-square"
                  ></div>
                );
              })}
            </div>
          );
        })}
      </section>
    </div>
  );
};
export default Game;
