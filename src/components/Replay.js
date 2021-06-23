import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

const Replay = () => {
  const { roomCode } = useSelector((store) => store.gameReducer);
  const { opponentInfo } = useSelector((store) => store.gameReducer);
  const { user } = useSelector((store) => store.authReducer);

  useEffect(() => {
    axios
      .get(`/api/get/completed/game/${roomCode}`)
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return <div>Replay</div>;
};
export default Replay;
