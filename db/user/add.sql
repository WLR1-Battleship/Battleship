insert into users (username, games_played, wins)
VALUES ($1, 0, 0);
select *
from users
where username = $1