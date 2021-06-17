// initial state
const initialState={
    roomCode: null
}

// ACTION BUILDERS
const SET_ROOM_CODE = 'SET_ROOM_CODE'

// ACTIONS
export const setRoomCode =(code)=>{
    return {
        type: SET_ROOM_CODE,
        payload: code
    }
}

// REDUCER
export default function gameReducer(state=initialState, action){
    switch(action.type){
        case SET_ROOM_CODE:
            return {...state, roomCode: action.payload}
        
        default:
            return {...state}
    }
}