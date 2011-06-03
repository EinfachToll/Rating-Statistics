set @zei := 0;
set @derrang := (select ra from (select @zei:=@zei+1 as ra, title from tracks order by length) as kl where title = 'Ants')
set @zei := 0;
select * from
	(select @zei := @zei + 1 as rang, title, length from tracks order by length) as erg
where rang between
	@derrang -5 and @derrang + 5;

select urls.rpath from tracks, albums , urls where tracks.album=albums.id and tracks.url = urls.id and albums.artist=198
select th.jahr, tr.id from tracks as tr, (select max(years.name) as jahr, album from tracks, years where tracks.year=years.id group by album) th where th.album=tr.album


SELECT c.artist, (
		SELECT path
		  from images i
		  LEFT JOIN albums a
			ON (i.id                                                          =  a.image)
		 WHERE a.artist                                                       =  c.artist
		   AND path NOT LIKE 'amarok-sqltrackuid://%'
		 ORDER BY RAND() LIMIT 1
       ) as bild, c.name, round(c.bewertung, 1), wiedergabezaehler, round(c.punkte, 0), wichtung, laenge, anzlieder, c.anzalben, round(jahr, 0)
  FROM (
		SELECT t.artist, b.name, count(distinct t.album) as anzalben, avg(if(s.rating <  1, null, s.rating)) as bewertung, avg(s.score) as punkte, sum(s.playcount) as wiedergabezaehler, sum(t.length) as laenge,
			   count(if(s.rating                                              <  1, null, s.rating)) as anzbew, count(*) as anzlieder, (5.0 * 3 * avg(if(s.rating                                          < 1,
			   null, s.rating))) + (0.6 * 0 * avg(s.score)) + (0.5 * 1 * sqrt(sum(t.length)/1000)) + (
				   2.5 * 0 *
				   sqrt(sum(s.playcount))
			   ) as wichtung, avg(if(y.name                                   <  1, null, y.name)) as jahr
		  FROM tracks t
		  LEFT JOIN statistics s
			ON (s.url                                                         =  t.url)
		  LEFT JOIN years y
			on (t.year                                                        =  y.id)
		  LEFT JOIN genres g
			ON (t.genre                                                       =  g.id)
		  LEFT JOIN artists b
			on (t.artist                                                      =  b.id)
		  LEFT JOIN albums a
		   on (a.id = t.album)
		 WHERE true
		 GROUP BY t.artist
		HAVING anzbew                                                         >= 3
		 ORDER BY bewertung DESC LIMIT 10
       ) c




