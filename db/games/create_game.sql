INSERT INTO games
(game_complete, player_1, player_2, player_1_ships, player_2_ships, room_code)
VALUES
(false, $1, null,null,null,$2 );