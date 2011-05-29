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
	return f;
}


function fillTracksPage(album, artist, genre, year, orderby)
{
	var sql_query = "\
	SELECT  \
	t.id, \
	i.path as bild, \
	concat(t.title, ' " + qsTr("by") + " ' , b.name, ' " + qsTr("on") + " ' , a.name) as liedname, \
	1 as anzalben, \
	1 as anzlieder, \
	s.rating as bewertung, \
	s.score as punkte, \
	s.playcount as wiedergabezaehler, \
	t.length as laenge, \
	y.name as jahr, \
	" + createWeightString(0) + " AS wichtung \
	from tracks t join statistics s on (s.url = t.url) join years y on (t.year=y.id) join albums a on (a.id = t.album) join artists b on (b.id = t.artist) join images i ON (i.id = a.image) JOIN genres g ON (g.id = t.genre)\
	where true \
	" + createFilterString(album, artist, genre, year) +
	createOrderString(0, orderby) + " limit " + config.resultsLimit;

    return sql_query;
}

function fillAlbumsPage(album, artist, genre, year, orderby)
{
    var                                     sql_query  = " SELECT";
                                            sql_query += "     b.id,";
                                            sql_query += "     i.path,";
                                            sql_query += "     b.name,";
                                            sql_query += "     concat('by ', if (b.artist is not null,";
                                            sql_query += "         (SELECT a.name FROM artists a WHERE a.id = b.artist),";
                                            sql_query += "         concat((SELECT count(distinct t.artist) from tracks t where t.album = c.id), ' artists') )),";
                                            sql_query += "     null,";
                                            sql_query += "     round(c.rating,1),";
                                            sql_query += "     round(c.score, 0),";
                                            sql_query += "     round(c.playcount, 0),";
                                            sql_query += "     c.length,";
                                            sql_query +=       createWeightString(3) + " as weight";
                                            sql_query += "     FROM (";
                                            sql_query += "         SELECT";
                                            sql_query += "             b.id,";
                                            sql_query += "             sum(t.length) as length,";
                                            sql_query += "             avg(if( s.rating is null or s.rating < 1,  5, s.rating)) as rating,";
                                            sql_query += "             avg(if( s.score  is null or s.score  < 1, 50, s.score)) as score,";
                                            sql_query += "             avg(if( s.playcount is null,               0, s.playcount)) as playcount";
                                            sql_query += "         FROM tracks t LEFT JOIN statistics s ON (s.url = t.url), albums b";
    if (artist != "")                       sql_query += "                                                                          , amarok.artists a";
    if (genre  != "")                       sql_query += "                                                                          , amarok.genres  g";
    if (year   != "")                       sql_query += "                                                                          , amarok.years   y";
                                            sql_query += "             WHERE t.album = b.id";
    if (config.skipUnrated==Qt.Checked)     sql_query += "             AND s.id is not null AND s.rating > 0";
    if (artist != "")                       sql_query += "             AND t.artist = a.id AND upper(a.name) like upper('%" + artist + "%')";
    if (genre  != "")                       sql_query += "             AND t.genre  = g.id AND upper(g.name) like upper('%" + genre  + "%')";
    if (year   != "")                       sql_query += "             AND t.year   = y.id AND y.name = '"     + year   + "'";
                                            sql_query += "             GROUP BY b.id";
                                            sql_query += "             HAVING count(*) >= " + config.minTracksPerAlbum;
                                            sql_query += "         ) c JOIN albums b ON (c.id=b.id) LEFT JOIN images i ON (b.image = i.id) ";
                                            sql_query +=       createOrderString(3, orderby);
                                            sql_query += "     LIMIT " + config.resultsLimit;

    return sql_query;
}

//soweit fertig
function fillArtistsPage(album, artist, genre, year, orderby)
{
sql_query = "SELECT \
		a.id, \
		(SELECT path from images i LEFT JOIN albums b ON (i.id = b.image) WHERE b.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1) as bild, \
		a.name, \
		c.anzalben, \
		anzlieder, \
		round(c.bewertung,1), \
		round(c.punkte, 0), \
		wiedergabezaehler, \
		laenge, \
		round(jahr, 0), \
		wichtung \
	FROM ( \
	SELECT \
		t.artist, \
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
	FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year=y.id) ";

/*if(genre!="") sql_query += " LEFT JOIN genres g ON (t.genre=g.id) ";

sql_query += " WHERE true ";
if(genre!="") sql_query += " AND upper(g.name) like upper('%" + genre + "%') ";
if(year!="") sql_query += " AND t.year   = y.id AND y.name = '" + year + "' ";*/

	sql_query += " GROUP BY t.artist "
				+ createOrderString(1, orderby)
				+ " LIMIT " + config.resultsLimit + "\
	) c JOIN artists a on (c.artist = a.id)";

    return sql_query;
}


function fillGenresPage(album, artist, genre, year, orderby)
{
    var                                     sql_query  = " SELECT";
                                            sql_query += "     c.id,";
                                            sql_query += "     null,";
                                            sql_query += "     c.name, concat('(',artistcount,' artists)'), null,";
                                            sql_query += "     round(c.rating,1),";
                                            sql_query += "     round(c.score, 0),";
                                            sql_query += "     playcount,";
                                            sql_query += "     length,";
                                            sql_query +=       createWeightString(4) + " as weight";
                                            sql_query += " FROM (";
                                            sql_query += "     SELECT";
                                            sql_query += "         g.id,";
                                            sql_query += "         g.name,";
                                            sql_query += "         count(distinct t.artist) as artistcount,";
                                            sql_query += "         avg(if( s.rating is null or s.rating < 1,  5, s.rating)) as rating,";
                                            sql_query += "         avg(if( s.score  is null or s.score  < 1, 50, s.score)) as score,";
                                            sql_query += "         if(sum(s.playcount) is null, 0, sum(s.playcount)) as playcount,";
                                            sql_query += "         sum(t.length) as length";
                                            sql_query += "     FROM genres g STRAIGHT_JOIN tracks t on (g.id = t.genre)";
                                            sql_query += "                   LEFT JOIN statistics s ON (s.url = t.url)";
    if (year   != "")                       sql_query += "                                                             , amarok.years   y";
                                            sql_query += "         WHERE 1=1";
    if (config.skipUnrated==Qt.Checked)     sql_query += "         AND s.id is not null AND s.rating > 0";
    if (year   != "")                       sql_query += "         AND t.year = y.id AND y.name = '" + year + "'";
                                            sql_query += "         GROUP BY g.id";
                                            sql_query += "         HAVING count(*) >= " + config.minTracksPerAlbum;
                                            sql_query += "     ) c ";
                                            sql_query +=   createOrderString(4, orderby);
                                            sql_query += " LIMIT " + config.resultsLimit;
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
	sql_query += "     ,   (select avg(score) from statistics where score > 0) as avg_score";
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

