insert into games (player_2)
VALUES ($1)
where room_code = $2
    and game_complete = false