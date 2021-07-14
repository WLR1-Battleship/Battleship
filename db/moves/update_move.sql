UPDATE new_moves
SET move = $2, bot_tracker=$3
WHERE move_id = $1;