select
  artist_id,
  s.artist_name,
  count(distinct s.album_id),
  case when count(distinct s.album_id) = artist_count.albums then null else artist_count.albums end,
  round(avg(s.rating), 0),
  round(avg(score), 0),
  sum(playcount),
  sum(length),
  sum(case when weight > 0 then weight else null end),
  count(*),
  case when count(*) = artist_count.total then null else artist_count.total end
from
  RS_WORKSPACE s
join
  RS_WEIGHTS w on s.weight_attr = w.weight_attr
join
  (select artist, count(distinct album) as albums, count(*) as total from tracks group by artist) artist_count on s.artist_id = artist_count.artist
group by
  s.artist_id,
  s.artist_name
order by
  9 desc
limit
  __LIMIT__