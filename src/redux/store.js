import { createStore, combineReducers  } from "redux";
import gameReducer from "./gameReducer";

const rootReducer = combineReducers({
    gameReducer
})

export default createStore(rootReducer);