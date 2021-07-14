SELECT * FROM new_moves WHERE game_id = (SELECT 
game_id FROM games WHERE room_code = $1) AND user_id = $2;