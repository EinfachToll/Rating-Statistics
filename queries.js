Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

/** @returns Ein SQL-String, der angibt, wonach sortiert wird */
function createOrderString(groupby, orderby)
{
	l = "";
	switch(orderby) {
		case 0:
			l = (groupby != 0 ? " HAVING anzbew >= " + config.minTracksPerAlbum : "" ) + " ORDER BY bewertung ";
			break;
		case 1:
			l = " ORDER BY wiedergabezaehler ";
			break;
		case 2:
			l = " ORDER BY punkte ";
			break;
		case 3:
			l = (config.weightRating > 0 && groupby != 0 ? " HAVING anzbew >= 1 " : "" ) + " ORDER BY wichtung ";
			break;
		case 4:
			l = " ORDER BY laenge ";
			break;
		case 5:
			l = " ORDER BY anzlieder ";
			break;
		case 6:
			l = " ORDER BY anzalben ";
			break;
		default:
			l = " ORDER BY jahr ";
			break;
	}

	if (config.reverseResults==Qt.Unchecked) l += "DESC ";

    return l;
}

function createWeightString(groupby)
{
	if(groupby!=0)
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

function createFilterString(album, artist, genre, year)
{
	f = "";
    if (artist != "") f += " AND upper(b.name) like upper('%" + artist + "%')";
    if (album  != "") f += " AND upper(a.name) like upper('%" + album  + "%')";
    if (genre  != "") f += " AND upper(g.name) like upper('%" + genre  + "%')";
    if (year   != "") f += " AND y.name = '"     + year   + "'";
	f = "";
    if (artist != "") f = " AND upper(b.name) like upper('%" + artist + "%') OR upper(a.name) like upper('%" + artist  + "%') OR upper(g.name) like upper('%" + artist  + "%') OR y.name = '"+ artist +"'";
	return f;
}


function fillTracksPage(album, artist, genre, year, orderby)
{
	var sql_query = "\
	SELECT  \
	t.id, \
	i.path as bild, \
	t.title  as liedname, \
	s.rating as bewertung, \
	s.playcount as wiedergabezaehler, \
	s.score as punkte, \
	" + createWeightString(0) + " AS wichtung, \
	t.length as laenge, \
	b.name, \
	a.name, \
	y.name as jahr \
	from tracks t join statistics s on (s.url = t.url) join years y on (t.year=y.id) join albums a on (a.id = t.album) join artists b on (b.id = t.artist) join images i ON (i.id = a.image) JOIN genres g ON (g.id = t.genre)\
	where true \
	" + createFilterString(album, artist, genre, year) +
	createOrderString(0, orderby) + " limit " + config.resultsLimit;

    return sql_query;
}

function fillAlbumsPage(album, artist, genre, year, orderby)
{
	var sql_query = "SELECT \
				 a.id, \
				 i.path as bild, \
				 a.name, \
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
		avg(if(s.rating <  1, null, s.rating)) as bewertung, \
		avg(s.score) as punkte, \
		sum(s.playcount) as wiedergabezaehler, \
		sum(t.length) as laenge, \
	   count(if(s.rating <  1, null, s.rating)) as anzbew, \
	   count(*) as anzlieder, "
	   + createWeightString(3) + " as wichtung, \
	   avg(if(y.name <  1, null, y.name)) as jahr, \
		b.name \
		  FROM tracks t LEFT JOIN statistics s ON (s.url =  t.url) LEFT JOIN years y on (t.year =  y.id) LEFT JOIN genres g ON (t.genre =  g.id) LEFT join artists b on (t.artist = b.id) \
		 WHERE true "
		+ createFilterString(album, artist, genre, year)
		 + " GROUP BY t.album "
		 + createOrderString(3, orderby)
		 + " LIMIT " + config.resultsLimit + "\
       ) c LEFT JOIN albums a on (c.album = a.id) LEFT join images i on (a.image = i.id)";

    return sql_query;
}

function fillAlbumArtistsPage(album, artist, genre, year, orderby)
{
	var sql_query = "SELECT \
		c.artist, (SELECT path from images i LEFT JOIN albums a ON (i.id = a.image) WHERE a.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1)  as bild, c.name, round(c.bewertung, 1), wiedergabezaehler, round(c.punkte, 0), wichtung, laenge, anzlieder, anzalben, round(jahr, 0) \
  FROM ( \
		SELECT a.artist, avg(if(s.rating <  1, null, s.rating)) as bewertung, avg(s.score) as punkte, sum(s.playcount) as wiedergabezaehler, sum(t.length) as laenge, \
		       count(if(s.rating < 1, null, s.rating)) as anzbew, count(distinct t.album) as anzalben, \
			   count(*) as anzlieder, "
				+ createWeightString(3) +
				" as wichtung, \
			   avg(if(y.name <  1, null, y.name)) as jahr, b.name \
		  FROM tracks t LEFT JOIN statistics s ON (s.url =  t.url) LEFT JOIN years y on (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) \
		  left join albums a on (t.album = a.id) LEFT join artists b on (a.artist = b.id) LEFT join images i on (a.image = i.id) \
		 WHERE true "
		 + createFilterString(album, artist, genre, year)
		 + " GROUP BY a.artist "
		 + createOrderString(3, orderby)
		 + " LIMIT " + config.resultsLimit + 
       " ) c";

	return sql_query;
}
function fillArtistsPage(album, artist, genre, year, orderby)
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
	+ createWeightString(1) 
		+ " \
		as wichtung, \
		avg(if(y.name < 1, null, y.name)) as jahr \
	FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year=y.id) \
	LEFT JOIN genres g ON (t.genre=g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) \
	WHERE true "
	+ createFilterString(album, artist, genre, year)
	+ " GROUP BY t.artist "
	+ createOrderString(1, orderby)
	+ " LIMIT " + config.resultsLimit + "\
	) c";

    return sql_query;
}


function fillGenresPage(album, artist, genre, year, orderby)
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
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) LEFT join artists b on (t.artist = b.id) LEFT JOIN albums a on (t.album = a.id) \
		 WHERE true "
		 + createFilterString(album, artist, genre, year)
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


function fillRatingOverTimePage(artist, genre)
{
    var                                     sql_query  = " SELECT";
                                            sql_query += "     y.name";
                                            sql_query += " ,   avg(s.rating)";
                                            sql_query += " FROM";
                                            sql_query += "     tracks t";
                                            sql_query += "     JOIN (select id, name from years where name != '0') y ON (t.year = y.id)";
    if (config.skipUnrated==Qt.Checked)     sql_query += "     JOIN (select url, rating from statistics where rating > 0) s ON (t.url = s.url)";
    if (config.skipUnrated!=Qt.Checked)     sql_query += "     JOIN (select url, if(rating is null or rating < 1,  5, rating) as rating  from statistics) s ON (t.url = s.url)";
    if (artist != "")                       sql_query += "     JOIN (select id from artists where upper(name) like upper('%" + artist + "%')) a on (t.artist = a.id)";
    if (genre  != "")                       sql_query += "     JOIN (select id from genres where upper(name) like upper('%" + genre + "%')) g on (t.genre = g.id)";
                                            sql_query += " GROUP BY";
                                            sql_query += "     t.year";
                                            sql_query += " HAVING count(*) >= " + config.minTracksPerAlbum;
                                            sql_query += " ORDER BY";
                                            sql_query += "     y.name";
                                            sql_query += " ;";
    return sql_query;
}

function fillScoreOverTimePage(artist, genre)
{
    var                                     sql_query  = " SELECT";
                                            sql_query += "     y.name";
                                            sql_query += " ,   avg(s.score)";
                                            sql_query += " FROM";
                                            sql_query += "     tracks t";
                                            sql_query += "     JOIN (select id, name from years where name != '0') y ON (t.year = y.id)";
    if (config.skipUnrated==Qt.Checked)     sql_query += "     JOIN (select url, score from statistics where score > 0) s ON (t.url = s.url)";
    if (config.skipUnrated!=Qt.Checked)     sql_query += "     JOIN (select url, if(score is null or score < 1,  50, score) as score  from statistics) s ON (t.url = s.url)";
    if (artist != "")                       sql_query += "     JOIN (select id from artists where upper(name) like upper('%" + artist + "%')) a on (t.artist = a.id)";
    if (genre  != "")                       sql_query += "     JOIN (select id from genres where upper(name) like upper('%" + genre + "%)') g on (t.genre = g.id)";
                                            sql_query += " GROUP BY";
                                            sql_query += "     t.year";
                                            sql_query += " HAVING count(*) >= " + config.minTracksPerAlbum;
                                            sql_query += " ORDER BY";
                                            sql_query += "     y.name";
                                            sql_query += " ;";
    return sql_query;
}

