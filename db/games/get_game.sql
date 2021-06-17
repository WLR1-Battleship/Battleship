SELECT * FROM games
WHERE room_code = $1 AND game_complete=false;