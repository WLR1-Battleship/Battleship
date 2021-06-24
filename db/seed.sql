DROP TABLE moves;
DROP TABLE games;
DROP TABLE users;




CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    games_played INT,
    wins INT
);
CREATE TABLE games (
    game_id SERIAL PRIMARY KEY,
    game_complete BOOLEAN,
    player_1 INT REFERENCES users(user_id),
    player_2 INT REFERENCES users(user_id),
    player_1_ships json,
    player_2_ships json,
    room_code VARCHAR(6)
);
CREATE TABLE moves (
    move_id SERIAL PRIMARY KEY,
    game_id INT REFERENCES games(game_id),
    user_id INT REFERENCES users(user_id),
    move INT []
);

-- bot into database

-- INSERT INTO users
-- (username, games_played, wins)
-- VALUES
-- ('BOT', 0, 0);