set @zei := 0;
set @derrang := (select ra from (select @zei:=@zei+1 as ra, title from tracks order by length) as kl where title = 'Ants')
set @zei := 0;
select * from
	(select @zei := @zei + 1 as rang, title, length from tracks order by length) as erg
where rang between
	@derrang -5 and @derrang + 5;




select concat(a.name, ' von ', a.artist),
    (SELECT path from images i LEFT JOIN albums b ON (i.id = b.image) WHERE b.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1) as bild,

images.path,
wiedergabezaehler,
anzlieder,
anzinterpreten,
round(c.bewertung,1),
round(c.punkte, 0),
laenge,
wichtung,
round(c.jahr,0)
FROM (
select 
t.album,
count(distinct t.artist) as anzinterpreten,
    avg(if(s.rating < 1,  null, s.rating)) as bewertung,
    avg(s.score) as punkte,
    sum(s.playcount) as wiedergabezaehler,
    sum(t.length)    as laenge,
    count(if(s.rating < 1, null, s.rating)) as anzbew,
    count(*) as anzlieder,
    (5.0 * 3 * avg(if(s.rating < 1,  null, s.rating)))
    + (0.6 * 0 * avg(s.score))
    + (0.5 * 0 * sqrt(sum(t.length)/1000))
    + (2.5 * 0 * sum(s.playcount))
    as wichtung,
    avg(if(y.name < 1, null, y.name)) as jahr
FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year=y.id)

	--	LEFT JOIN genres g ON (t.genre=g.id)
WHERE true
	 --   AND upper(g.name) like upper('%Rock%')
	--  AND t.year   = y.id AND y.name = '2010'

    GROUP BY t.album

	    HAVING anzbew >= 3 ORDER BY bewertung
	--  ORDER BY wiedergabezaehler
	--   ORDER BY anzlieder
	--   ORDER BY laenge
	--   HAVING count(if( s.score  is null, null, s.score)) >= 5 ORDER BY punkte
	--   HAVING anzbew >= 5 ORDER BY wichtung
	--   ORDER BY anzalben
	--   HAVING anzlieder >= ORDER BY jahr
DESC LIMIT 10
) c JOIN albums a on (c.album = a.id) JOIN images i on (a.image
