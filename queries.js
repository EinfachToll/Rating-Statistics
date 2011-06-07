Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

/** @returns Ein SQL-String, der angibt, wonach sortiert wird */
function createOrderString(groupby, orderby)
{
	l = "";
	switch(orderby) {
		case 0:
			l = (groupby != 1 && groupby != 6 ? " HAVING anzbew >= " + config.minTracksPerAlbum : "" ) + (groupby != 6 ? " ORDER BY " : "") + "bewertung ";
			break;
		case 1:
			l = (groupby != 6 ? " ORDER BY " : "") + "wiedergabezaehler ";
			break;
		case 2:
			l = (groupby != 1 ? " HAVING anzlieder >= " + config.minTracksPerAlbum : "") + (groupby != 6 ? " ORDER BY " : "") + "punkte ";
			break;
		case 3:
			l = (config.weightRating > 0 && groupby != 1 && groupby != 6 ? " HAVING anzbew >= 1 " : "" ) + (groupby != 6 ? " ORDER BY " : "") + "wichtung ";
			break;
		case 4:
			l = (groupby != 6 ? " ORDER BY " : "") + "laenge ";
			break;
		case 5:
			l = (groupby != 6 ? " ORDER BY " : "") + "anzlieder ";
			break;
		case 6:
			l = (groupby != 6 ? " ORDER BY " : "") + "anzalben ";
			break;
		default:
			l = (groupby != 1 ? " HAVING anzlieder >= " + config.minTracksPerAlbum : "") + (groupby != 6 ? " ORDER BY " : "") + "jahr ";
			break;
	}
	if (config.reverseResults==Qt.Unchecked && groupby != 6) l += "DESC ";

    return l;
}

function createWeightString(groupby)
{
	if(groupby!=1)
	{
		l = "   (5.0 * " + config.weightRating    + " * avg(if(s.rating < 1,  null, s.rating)))"
		  + " + (0.6 * " + config.weightScore     + " * avg(s.score))"
		  + " + (0.5 * " + config.weightLength    + " * sqrt(sum(t.length)/1000))";
		if (groupby == 2 || groupby == 3) {
			l += " + (2.5 * " + config.weightPlaycount + " * sum(s.playcount))";
		} else {
			l += " + (2.5 * " + config.weightPlaycount + " * sqrt(sum(s.playcount)))";
		}
	} else
	{
		l = "   (5.0 * " + config.weightRating    + " * if(s.rating < 1,  null, s.rating))"
		  + " + (0.6 * " + config.weightScore     + " * s.score)"
		  + " + (0.5 * " + config.weightLength    + " * sqrt(t.length)/1000)";
		if (groupby == 2 || groupby == 3) {
			l += " + (2.5 * " + config.weightPlaycount + " * s.playcount)";
		} else {
			l += " + (2.5 * " + config.weightPlaycount + " * sqrt(s.playcount))";
		}
	}
    return l;
}

function createFilterString(filterText)
{
	if (filterText != "") 
	{
		var f = " WHERE true ";
		var filterTerms = filterText.split(" ");
		for(var i = 0; i < filterTerms.length; ++i)
		{
			f += " AND (upper(b.name) like upper('%" + filterTerms[i] + "%') OR upper(a.name) like upper('%" + filterTerms[i]  + "%') OR upper(b1.name) LIKE upper('%" + filterTerms[i] + "%') OR upper(g.name) like upper('%" + filterTerms[i]  + "%') OR y.name LIKE '%"+ filterTerms[i] +"%'";
			var regex = /^(\d+)-(\d+)/;
			if(filterTerms[i].match(regex))
			{
				var res = regex.exec(filterTerms[i]);
				var now = new Date();
				for(var r=1; r<=2; ++r)
				{
					if(parseInt(res[r]) <= now.getFullYear() - 2000) res[r] = String(parseInt(res[r]) + 2000);
					else
						if(parseInt(res[r]) <= 99) res[r] = String(parseInt(res[r]) + 1900);
				}
				f += " OR y.name BETWEEN " + res[1] + " AND " + res[2];
			}
			f += ")";
		}

		msg(f);
		return f;
	}
	else return "";
}

function fillTracksPage(filterText, orderby)
{
	var sql_query = "\
	SELECT  \
	t.id, \
	i.path as bild, \
	t.title  as liedname, \
	s.rating as bewertung, \
	s.playcount as wiedergabezaehler, \
	s.score as punkte, \
	" + createWeightString(1) + " AS wichtung, \
	t.length as laenge, \
	b.name, \
	a.name, \
	y.name as jahr \
	from tracks t left join statistics s on (s.url = t.url) left join years y on (t.year=y.id) left join albums a on (a.id = t.album) left join artists b on (b.id = t.artist) left join images i ON (i.id = a.image) left JOIN genres g ON (g.id = t.genre) LEFT JOIN artists b1 ON (a.artist = b1.id) \
	" + createFilterString(filterText) +
	createOrderString(1, orderby) + " limit " + config.resultsLimit;
    return sql_query;
}

function fillArtistsPage(filterText, orderby)
{
var sql_query = "SELECT \
		c.artist, \
		(SELECT path from images i LEFT JOIN albums a ON (i.id = a.image) WHERE a.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1) as bild, \
		c.name, \
		round(c.bewertung,1), \
		wiedergabezaehler, \
		round(c.punkte, 0), \
		wichtung, \
		laenge, \
		anzlieder, \
		c.anzalben, \
		round(jahr, 0) \
	FROM ( \
	SELECT \
		t.artist, \
		b.name, \
		count(distinct t.album) as anzalben, \
		avg(if(s.rating < 1,  null, s.rating)) as bewertung, \
		avg(s.score) as punkte, \
		sum(s.playcount) as wiedergabezaehler, \
		sum(t.length)    as laenge, \
		count(if(s.rating < 1, null, s.rating)) as anzbew, \
		count(*) as anzlieder, " 
	+ createWeightString(2) 
		+ " \
		as wichtung, \
		avg(if(y.name < 1, null, y.name)) as jahr \
	FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year=y.id) \
	LEFT JOIN genres g ON (t.genre=g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) LEFT JOIN artists b1 ON (b1.id=a.artist) "
	+ createFilterString(filterText)
	+ " GROUP BY t.artist "
	+ createOrderString(2, orderby)
	+ " LIMIT " + config.resultsLimit + "\
	) c";

    return sql_query;
}

function fillAlbumArtistsPage(filterText, orderby)
{
	var sql_query = "SELECT \
		c.artist, (SELECT path from images i LEFT JOIN albums a ON (i.id = a.image) WHERE a.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1)  as bild, c.name, round(c.bewertung, 1), wiedergabezaehler, round(c.punkte, 0), wichtung, laenge, anzlieder, anzalben, round(jahr, 0) \
  FROM ( \
		SELECT a.artist, avg(if(s.rating <  1, null, s.rating)) as bewertung, avg(s.score) as punkte, sum(s.playcount) as wiedergabezaehler, sum(t.length) as laenge, \
		       count(if(s.rating < 1, null, s.rating)) as anzbew, count(distinct t.album) as anzalben, \
			   count(*) as anzlieder, "
				+ createWeightString(3) +
				" as wichtung, \
			   avg(if(y.name <  1, null, y.name)) as jahr, b1.name \
		  FROM tracks t LEFT JOIN statistics s ON (s.url =  t.url) LEFT JOIN years y on (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) \
		  left join albums a on (t.album = a.id) LEFT join artists b1 on (a.artist = b1.id) LEFT JOIN artists b ON (t.artist=b.id) LEFT join images i on (a.image = i.id) "
		 + createFilterString(filterText)
		 + " GROUP BY a.artist "
		 + createOrderString(3, orderby)
		 + " LIMIT " + config.resultsLimit + 
       " ) c";

	return sql_query;
}

function fillAlbumsPage(filterText, orderby)
{
	var sql_query = "SELECT \
				 c.album, \
				 c.bild, \
				 c.albumname, \
				 round(c.bewertung, 1), \
				 wiedergabezaehler, \
				 round(c.punkte, 0), \
				 wichtung, \
				 laenge, \
				 anzlieder, \
				 c.name, \
				 round(jahr, 0) \
  FROM ( \
		SELECT t.album, \
		a.name as albumname, \
		i.path AS bild, \
		avg(if(s.rating <  1, null, s.rating)) as bewertung, \
		avg(s.score) as punkte, \
		sum(s.playcount) as wiedergabezaehler, \
		sum(t.length) as laenge, \
	   count(if(s.rating <  1, null, s.rating)) as anzbew, \
	   count(*) as anzlieder, "
	   + createWeightString(4) + " as wichtung, \
	   avg(if(y.name <  1, null, y.name)) as jahr, \
		b1.name \
		  FROM tracks t LEFT JOIN statistics s ON (s.url =  t.url) LEFT JOIN years y on (t.year =  y.id) LEFT JOIN genres g ON (t.genre =  g.id) LEFT join artists b on (t.artist = b.id) left join albums a ON (t.album=a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) LEFT JOIN images i ON (a.image=i.id) "
		+ createFilterString(filterText)
		 + " GROUP BY t.album "
		 + createOrderString(4, orderby)
		 + " LIMIT " + config.resultsLimit + "\
       ) c";

    return sql_query;
}


function fillGenresPage(filterText, orderby)
{
	var sql_query = "SELECT \
		c.genre, \
		NULL as bild, \
		c.name,  \
		round(c.bewertung, 1), \
		wiedergabezaehler, \
		round(c.punkte, 0), \
		wichtung, \
		laenge, \
		anzlieder, \
		anzalben, \
		round(jahr, 0) \
  FROM ( \
		SELECT t.genre, g.name, avg(if(s.rating <  1, null, s.rating)) as bewertung, avg(s.score) as punkte, sum(s.playcount) as wiedergabezaehler, sum(t.length) as laenge, \
		       count(if(s.rating < 1, null, s.rating)) as anzbew, \
			   count(*) as anzlieder, count(distinct t.album) as anzalben, "
			   + createWeightString(5)
			   + " as wichtung, \
			   avg(if(y.name <  1, null, y.name)) as jahr \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) LEFT join artists b on (t.artist = b.id) LEFT JOIN albums a on (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) "
		 + createFilterString(filterText)
		 + " GROUP BY t.genre "
		 + createOrderString(5, orderby)
		 + " LIMIT " + config.resultsLimit + " \
       ) c";
    return sql_query;
}


function fillGlobalStatisticsPage()
{
    var sql_query  = " SELECT";
	sql_query += "     a.total_tracks";
	sql_query += " ,   a.total_albums";
	sql_query += " ,   a.total_artists";
	sql_query += " ,   a.rated_tracks";
	sql_query += " ,   round(100 * a.rated_tracks / a.total_tracks, 2)";
	sql_query += " ,   a.rated_albums";
	sql_query += " ,   round(100 * a.rated_albums  / a.total_albums, 2)";
	sql_query += " ,   a.rated_artists";
	sql_query += " ,   round(100 * a.rated_artists / a.total_artists, 2)";
	sql_query += " ,   round(a.avg_rating / 2, 1)";
	sql_query += " ,   round(a.avg_score, 0)";
	sql_query += " ,   round(a.avg_length, 0)";
	sql_query += " FROM (";
	sql_query += "     SELECT";
	sql_query += "         (select count(*) from tracks) as total_tracks";
	sql_query += "     ,   (select count(*) from albums) as total_albums";
	sql_query += "     ,   (select count(*) from artists) as total_artists";
	sql_query += "     ,   (select count(*) from tracks t JOIN statistics s ON (s.url = t.url and s.rating > 0)) as rated_tracks";
	sql_query += "     ,   (select count(*) from (select distinct t.album from tracks t JOIN (select * from statistics where rating > 0) s ON (s.url = t.url) group by t.album having count(*) >= " + config.minTracksPerAlbum + ") x ) as rated_albums";
	sql_query += "     ,   (select count(*) from (select distinct t.artist from tracks t JOIN (select * from statistics where rating > 0) s ON (s.url = t.url) group by t.album having count(*) >= " + config.minTracksPerAlbum + ") x ) as rated_artists";
	sql_query += "     ,   (select avg(rating) from statistics where rating > 0) as avg_rating";
	sql_query += "     ,   (select avg(if(score is NULL, 0, score)) from statistics) as avg_score";
	sql_query += "     ,   (select avg(length) from tracks) as avg_length";
	sql_query += "     FROM";
	sql_query += "         dual";
	sql_query += " ) a ;";
    return sql_query;
}


function fillRatingOverTimePage(filterText, indexOrd)
{
	var sql_query = "SELECT c.name, c." + createOrderString(6, indexOrd) +
		  "FROM ( \
		SELECT t.year, y.name, avg(if(s.rating < 1, null, s.rating)) as bewertung, avg(s.score) as punkte, sum(s.playcount) as wiedergabezaehler, \
		       sum(t.length) as laenge, count(if(s.rating < 1, null, s.rating)) as anzbew, \
			   count(*) as anzlieder, count(distinct t.album) as anzalben, " + createWeightString(6) + " as wichtung \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year = y.id) LEFT JOIN genres g ON (t.genre = g.id) LEFT join artists b on (t.artist = b.id) LEFT JOIN albums a on (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) "
		 + createFilterString(filterText)
		 + " GROUP BY t.year \
		HAVING name != 0 " + (indexOrd == 0 ? (" AND anzbew >= " + config.minTracksPerAlbum) : "")
		 + " ORDER BY 2 \
       ) c";
    return sql_query;
}
