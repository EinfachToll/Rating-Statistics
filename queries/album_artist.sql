select
    c.artist,
    c.name,
    round(c.rat, 1),
    plcount,
    round(c.sco, 0),
    wei,
    leng,
    numtr,
    numal
from (
    select
        a.artist,
        avg(if(s.rating <  1, null, s.rating)) as rat,
        avg(if(s.score is null, 0, s.score)) as sco,
        sum(s.playcount) as plcount,
        sum(t.length) as leng,
        count(if(s.rating < 1, null, s.rating)) as numrattr,
        count(distinct t.album) as numal,
        count(*) as numtr,
        __WEIGHT__ as wei,
        b1.name
    from
        tracks t
    left join
        statistics s on
            s.url =  t.url
    left join
        genres g on
            t.genre = g.id
    left join
        albums a on
            t.album = a.id
    left join
        artists b1 on
            a.artist = b1.id
    left join
        artists b on
            t.artist=b.id
    left join
        images i on
            a.image = i.id
    where
        true
        __FILTER__
    group by
        a.artist
    __ORDER__
    limit
        __LIMIT__
) c