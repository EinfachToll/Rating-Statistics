set @zei := 0;
set @derrang := (select ra from (select @zei:=@zei+1 as ra, title from tracks order by length) as kl where title = 'Ants')
set @zei := 0;
select * from
	(select @zei := @zei + 1 as rang, title, length from tracks order by length) as erg
where rang between
	@derrang -5 and @derrang + 5;


Se
