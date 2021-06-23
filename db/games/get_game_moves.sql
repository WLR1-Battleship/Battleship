SELECT * FROM moves WHERE game_id = (SELECT 
game_id FROM games WHERE room_code = $1) ORDER BY move_id ASC;