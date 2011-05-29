set @zei := 0;
set @derrang := (select ra from (select @zei:=@zei+1 as ra, title from tracks order by length) as kl where title = 'Ants')
set @zei := 0;
select * from
	(select @zei := @zei + 1 as rang, title, length from tracks order by length) as erg
where rang between
	@derrang -5 and @derrang + 5;


SELECT 
		a.id, 
		(SELECT path from images i LEFT JOIN albums b ON (i.id = b.image) WHERE b.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1) as bild, 
		a.name, 
		c.anzalben, 
		anzlieder, 
		round(c.bewertung,1), 
		round(c.punkte, 0), 
		wiedergabezaehler, 
		laenge, 
		round(jahr, 0),
		wichtung 
	FROM ( 
	SELECT 
		t.artist, 
		count(distinct t.album) as anzalben, 
		avg(if(s.rating < 1,  null, s.rating)) as bewertung, 
		avg(s.score) as punkte, 
		sum(s.playcount) as wiedergabezaehler, 
		sum(t.length)    as laenge, 
		count(if(s.rating < 1, null, s.rating)) as anzbew, 
		count(*) as anzlieder, 
		2 as wichtung, 
		avg(if(y.name < 1, null, y.name)) as jahr 
	FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year=y.id) 
	GROUP BY t.artist order by punkte asc LIMIT 10

	) c JOIN artists a on (c.artist = a.id)




	select t.id, bild, liedname, anzalben, anzlieder, bewertung, punkte, wiedergabezaehler, laenge, jahr, wichtung

	from
(
	select  
	t.id,
	i.path as bild, 
	concat(t.title, " von ", b.name, " auf ", a.name) as liedname,
	1 as anzalben,
	1 as anzlieder,
	s.rating as bewertung,
	s.score as punkte,
	s.playcount as wiedergabezaehler,
	t.length as laenge,
	y.name as jahr,
	s.score as wichtung

from tracks t join statistics s on (s.url = t.url) join years y on (t.year=y.id) join albums a on (a.id = t.album) join artists b on (b.id = t.artist) join images i ON (i.id = a.image) JOIN genres g ON (g.id = t.genre)
where g.name like '%Rock%'
order by wichtung desc limit 10
)

SELECT t.id, i.path as bild, concat(t.title, ' by ', b.name, ' am ', a.name) as liedname, 1 as anzalben, 1 as anzlieder, s.rating as bewertung, s.score as punkte, s.playcount as wiedergabezaehler,
       t.length as laenge, y.name as jahr, (
		   5.0 * 3 *
		   if(s.rating < 1, null, s.rating)
       ) + (0.6 * 0 * s.score) + (0.5 * 0 * sqrt(t.length)/1000) + (2.5 * 0 * sqrt(s.playcount)) AS wichtung
  from tracks t
  join statistics s
    on (s.url          = t.url)
  join years y
    on (t.year         = y.id)
  join albums a
    on (a.id           = t.album)
  join artists b
    on (b.id           = t.artist)
  join images i
    ON (i.id           = a.image)
  JOIN genres g
    ON (g.id           = t.genre)
 where true
 order by wichtung desc limit 10


SELECT 
		t.id, 
		(SELECT path from images i LEFT JOIN albums b ON (i.id = b.image) WHERE b.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1) as bild, 
		a.name, 
		c.anzalben, 
		anzlieder, 
		round(c.bewertung,1), 
		round(c.punkte, 0), 
		wiedergabezaehler, 
		laenge, 
		round(jahr, 0),
		wichtung 
	FROM ( 
	SELECT 
		t.artist, 
		count(distinct t.album) as anzalben, 
		avg(if(s.rating < 1,  null, s.rating)) as bewertung, 
		avg(s.score) as punkte, 
		sum(s.playcount) as wiedergabezaehler, 
		sum(t.length)    as laenge, 
		count(if(s.rating < 1, null, s.rating)) as anzbew, 
		count(*) as anzlieder, 
		2 as wichtung, 
		avg(if(y.name < 1, null, y.name)) as jahr 
	FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year=y.id) 
	GROUP BY t.artist order by punkte asc LIMIT 10

	) c JOIN artists a on (c.artist = a.id)

