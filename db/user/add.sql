insert into users (username, games_played, wins)
VALUES ($1, null, null);
select *
from users
where username = $1