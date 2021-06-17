const initialState = {
  user: null,
};

const SET_USER = "SET_USER";
const LOGOUT = "LOGOUT";

//action builders
export function setUser(user) {
  return {
    type: SET_USER,
    payload: user,
  };
}

export function logout() {
  return {
    type: LOGOUT,
    payload: null,
  };
}

//the actual reducer
export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };
    case LOGOUT:
      return { ...state, user: action.payload };
    default:
      return { ...state };
  }
}
