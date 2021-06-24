UPDATE games
SET player_1_ships = $1, player_2_ships = $2, player_2 = 17
WHERE room_code = $3;