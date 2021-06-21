UPDATE games
SET game_complete = true
WHERE room_code = $1
RETURNING *;