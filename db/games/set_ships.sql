UPDATE games SET player_1_ships = $1 WHERE player_1 = $2 AND room_code = $3;
UPDATE games SET player_2_Ships = $1 WHERE player_2 = $2 AND room_code = $3;