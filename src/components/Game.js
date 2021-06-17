import { useEffect, useState } from "react"

const Game =()=>{
    const[shipYard,setShipYard] = useState(true);
    const[msgBoard, setMsgBoard] = useState(false);
    
    return(
        <div className='game-screen'>
            <section className='ship-yard'>

            </section>

            <section className='ship-grid'>

            </section>

            <section className='radar-grid'>

            </section>

        </div>
    )
}
export default Game;