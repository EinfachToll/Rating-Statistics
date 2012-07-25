select
    count(*) as total_tracks,
    count(distinct t.album) as total_albums,
    count(distinct t.artist) as total_artists,
    sum(t.length) as sum_length,
    count(distinct s.id) as rated_tracks,
    round(100 * (count(distinct s.id)) / count(*), 2) as perc_rated_tracks,
    count(distinct amb.album) as rated_albums,
    round(100 * (count(distinct amb.album)) / count(distinct t.album), 2) as perc_rated_albums,
    count(distinct bmb.artist) as rated_artists,
    round(100 * (count(distinct bmb.artist)) / count(distinct t.artist), 2) as perc_rated_artists,
    round(avg(s.rating) / 2, 1) as avg_rating,
    round(avg(if(s.score is null, 0, s.score)), 0) as avg_score,
    round(avg(t.length), 0) as avg_length
from
    tracks t
left join
    artists b on
        t.artist = b.id
left join
    albums a on
        t.album = a.id
left join
    statistics s on
        s.url = t.url
        and s.rating > 0
left join
    years y on
        t.year = y.id
left join
    genres g on
        t.genre = g.id
left join
    artists b1 on
        b1.id = a.artist
left join (
    select distinct
        t.album
    from
        tracks t
    join
        statistics s on
            s.url = t.url
    where
        rating > 0
    group by
        t.album
    having
        count(*) >= MIN_TRACKS_PER_ALBUM
    union
    select distinct
        t.album
    from
        tracks t
    join
        statistics s on
            s.url = t.url
    group by
        t.album
    having
        min(rating) > 0
    ) amb on
        t.album = amb.album
left join (
    select distinct
        t.artist
    from
        tracks t
    join
        statistics s on
            s.url = t.url
    where
        rating > 0
    group by
        t.artist
    having
        count(*) >= MIN_TRACKS_PER_ALBUM
    union
    select distinct
        t.artist
    from
        tracks t
    join
        statistics s on
            s.url = t.url
    group by
        t.artist
    having
        min(rating) > 0
    ) bmb on
        t.artist = bmb.artist
where
    true
    FILTER
