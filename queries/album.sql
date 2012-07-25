select
  album_id,
  s.album_name,
  round(avg(s.rating), 0),
  sum(playcount),
  round(avg(score), 0),
  sum(weight),
  sum(length),
  count(*),
  case when count(*) = album_count.total then null else album_count.total end,
  s.artist_name
from
  RS_WORKSPACE s
join
  RS_WEIGHTS w on s.weight_attr = w.weight_attr
join
  (select album, artist, count(*) as total from tracks group by album, artist) album_count on s.album_id = album_count.album and s.artist_id = album_count.artist
group by
  s.album_id,
  s.album_name,
  s.artist_name
order by
  6 desc
limit
  __LIMIT__