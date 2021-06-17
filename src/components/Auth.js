import React from "react";
import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import {setUser} from '../redux/authReducer'

const Auth = (props) =>{
    const [username, setUsername] = useState("");
    const dispatch = useDispatch();

    const handleLogin = (e) => {
        e.preventDefault()
        if (username === "") {
          alert("Please enter a Username");
        } else {
          axios
            .post("/api/auth/login", { username })
            .then((res) => {
              dispatch(setUser(res.data));
            })
            .catch((err) => {
              alert(`${err}: Seems like you entered something incorrectly`);
              setUsername("");
            });
        }
      };

    return (
        <div>
            <h1>AUTH</h1>
            <input value={username} onChange={(e) =>{ setUsername(e.target.value)}}/>
            <button onClick={handleLogin}>Enter</button>
        </div>
    )
}

export default Auth