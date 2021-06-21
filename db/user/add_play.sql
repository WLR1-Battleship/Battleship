UPDATE users
SET games_played = games_played + 1,
    wins = wins + $1
WHERE user_id = $2;