set @zei := 0;
set @derrang := (select ra from (select @zei:=@zei+1 as ra, title from tracks order by length) as kl where title = 'Ants')
set @zei := 0;
select * from
	(select @zei := @zei + 1 as rang, title, length from tracks order by length) as erg
where rang between
	@derrang -5 and @derrang + 5;




    SELECT y.name, avg(s.rating)
      FROM tracks t
      JOIN (
			select id, name
			  from years
			 where name     != '0'
           ) y
        ON (t.year  =  y.id)
      JOIN (
			select url, rating
			  from statistics
			 where rating   >  0
           ) s
        ON (t.url   =  s.url)
     GROUP BY t.year
    HAVING count(*) >= 3
     ORDER BY y.name ;

	select -
