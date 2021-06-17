update games
set player_2 = $1
where room_code = $2
    and game_complete = false;