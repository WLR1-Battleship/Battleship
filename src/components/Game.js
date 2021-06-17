import { useEffect, useState } from "react"
import io, { Socket } from "socket.io-client";
import './Game.css'

const Game =(props)=>{
    const[shipYard,setShipYard] = useState(true);
    const[msgBoard, setMsgBoard] = useState(false);
    const [radarGrid, setRadarGrid] = useState([])
    const [shipGrid,setShipGrid] = useState([])
    const {socket} = props
    
    useEffect(()=>{
        let square = [];
        for (let i = 0; i < 10; i++) {
            let row = [];
            for (let j = 0; j < 10; j++) {
                row.push({row:i, column: j, attacked: false, sunk: false, hit: false})
            }
            square.push(row)
        }
        setRadarGrid(square)

        let shipSquares = [];

        for (let i = 0; i < 10; i++) {
            let row = [];
            for (let j = 0; j < 10; j++) {
                row.push({row:i, column: j, attacked: false, sunk: false, hit: false, ship: null})
            }
            shipSquares.push(row)
        }
        setShipGrid(shipSquares);
    },[])

    useEffect(()=>{
        const attackRespond=(body)=>{
            console.log(body)

        }

        if(socket){

            socket.on('server-send-attack',attackRespond)
        }

        return ()=>{
            if(socket){
                socket.off('server-send-attack', attackRespond)

            }
        }
    },[socket])

   const handleAttack=(row, column)=>{
        socket.emit('send-attack', {row, column})
   }

    console.log(radarGrid)
    return(
        <div className='game-screen'>
            <section className='yard-grid-wrapper'>
                <section className='ship-yard'>
                    
                </section>

                <section className='ship-grid'>
                    {shipGrid.map(row=>{
                        return <div className='ship-grid-row'>
                            {row.map(square=>{
                                return<div onClick={()=>console.log(square)} className='ship-grid-square'>

                                </div>
                            })}
                        </div>
                    })}
                </section>

                <h2>CODE: ASDFFF</h2>
            </section>

            <section className='radar-grid'>
                {radarGrid.map(row=>{
                    return <div className='radar-grid-row'>
                        {row.map(square=>{
                            return<div onClick={()=>handleAttack(square.row, square.column)} className='radar-grid-square'>

                            </div>
                        })}
                    </div>
                })}
            </section>

        </div>
    )
}
export default Game;