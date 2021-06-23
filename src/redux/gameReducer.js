// initial state
const initialState={
    roomCode: null,
    opponentInfo: null
}

// ACTION BUILDERS
const SET_ROOM_CODE = 'SET_ROOM_CODE'
const SET_OPPONENT = `SET_OPPONENT`
// ACTIONS
export const setRoomCode =(code)=>{
    return {
        type: SET_ROOM_CODE,
        payload: code
    }
}
export const setOpponent =(opp)=>{
    return {
        type: SET_OPPONENT,
        payload: opp
    }
}

// REDUCER
export default function gameReducer(state=initialState, action){
    switch(action.type){
        case SET_ROOM_CODE:
            return {...state, roomCode: action.payload}
        case SET_OPPONENT: 
            return {...state, opponentInfo: action.payload}
        default:
            return {...state}
    }
}