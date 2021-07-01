import React from "react";
import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import {setUser} from '../redux/authReducer'
import './Auth.css'

const Auth = (props) =>{
    const [username, setUsername] = useState("");
    const dispatch = useDispatch();

    const handleLogin = (e) => {
        e.preventDefault()
        if (username === "") {
          alert("Please enter a Username");
        } 
        else if(username.toUpperCase()==='BOT'){
          alert(`Cannot login as BOT!!`)
        }
        else {
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
        <div className='auth'>
          <div className='auth-container'>
            <h1 className='auth-title'>WARFARE BOAT</h1>
            <input className='auth-input' placeholder='Enter a username' value={username} onChange={(e) =>{ setUsername(e.target.value)}}/>
            <button className='auth-button' onClick={handleLogin}>Enter</button>
          </div>
        </div>
    )
}

export default Auth