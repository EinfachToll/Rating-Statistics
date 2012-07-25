create temporary table RS_WORKSPACE
ENGINE=MEMORY
select
    t.id,
    t.title,
    t.length,
    a.id as album_id,
    a.name as album_name,
    b.id as artist_id,
    b.name as artist_name,
    y.name as year_name,
    case when s.rating != 0 then s.rating else null end as rating,
    s.playcount,
    case when s.score != 0 then s.score else null end as score,
    __WEIGHT_ATTR__ as weight_attr
from
    tracks t
join
    statistics s on
        s.url = t.url
join
    years y on
        t.year=y.id
join
    albums a on
        a.id = t.album
join
    artists b on
        b.id = t.artist
join
    genres g on
        g.id = t.genre
join
    artists b1 on
        a.artist = b1.id
where
    __WEIGHT_ATTR__ != 0
    __FILTER__