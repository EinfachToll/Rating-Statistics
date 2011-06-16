Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

function createOrderString(groupby, orderby)
{
	l = "";
	switch(orderby) {
		case 0:
			l = (groupby != 1 && groupby != 6 ? " HAVING numRatTr >= " + config.minTracksPerAlbum : "" ) + (groupby != 6 ? " ORDER BY " : "") + "rat ";
			break;
		case 1:
			l = (groupby != 6 ? " ORDER BY " : "") + "plcount ";
			break;
		case 2:
			l = (groupby != 1 && groupby != 6 ? " HAVING numTr >= " + config.minTracksPerAlbum : "") + (groupby != 6 ? " ORDER BY " : "") + "sco ";
			break;
		case 3:
			l = (config.weightRating > 0 && groupby != 1 && groupby != 6 ? " HAVING numRatTr >= 1 " : "" ) + (groupby != 6 ? " ORDER BY " : "") + "wei ";
			break;
		case 4:
			l = (groupby != 6 ? " ORDER BY " : "") + "leng ";
			break;
		case 5:
			l = (groupby != 6 ? " ORDER BY " : "") + "numTr ";
			break;
		case 6:
			l = (groupby != 6 ? " ORDER BY " : "") + "numAl ";
			break;
		default:
			l = (groupby != 1 ? " HAVING numTr >= " + config.minTracksPerAlbum : "") + (groupby != 6 ? " ORDER BY " : "") + "yea ";
			break;
	}
	if (config.reverseResults==Qt.Unchecked && groupby != 6) l += "DESC ";

    return l;
}

function createWeightString(groupby)
{
	if(groupby!=1)
	{
		l = "   (5.0 * " + config.weightRating    + " * AVG(if(s.rating < 1,  null, s.rating)))"
		  + " + (0.6 * " + config.weightScore     + " * AVG(s.score))"
		  + " + (0.5 * " + config.weightLength    + " * SQRT(SUM(t.length)/1000))";
		if (groupby == 2 || groupby == 3) {
			l += " + (2.5 * " + config.weightPlaycount + " * SUM(s.playcount))";
		} else {
			l += " + (2.5 * " + config.weightPlaycount + " * SQRT(SUM(s.playcount)))";
		}
	} else
	{
		l = "   (5.0 * " + config.weightRating    + " * IF(s.rating < 1,  null, s.rating))"
		  + " + (0.6 * " + config.weightScore     + " * s.score)"
		  + " + (0.5 * " + config.weightLength    + " * SQRT(t.length)/1000)";
		if (groupby == 2 || groupby == 3) {
			l += " + (2.5 * " + config.weightPlaycount + " * s.playcount)";
		} else {
			l += " + (2.5 * " + config.weightPlaycount + " * SQRT(s.playcount))";
		}
	}
    return l;
}

function fillTracksPage(filterText, orderby)
{
	var sql_query = "\
	SELECT \
	t.id, \
	i.path AS bild, \
	t.title  AS liedname, \
	s.rating AS rat, \
	s.playcount AS plcount, \
	s.score AS sco, \
	" + createWeightString(1) + " AS wei, \
	t.length AS leng, \
	b.name, \
	a.name, \
	y.name AS yea \
	FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year=y.id) LEFT JOIN albums a ON (a.id = t.album) LEFT JOIN artists b ON (b.id = t.artist) LEFT JOIN images i ON (i.id = a.image) LEFT JOIN genres g ON (g.id = t.genre) LEFT JOIN artists b1 ON (a.artist = b1.id) \
	WHERE true" + playlistImporter.createFilterString(filterText) +
	createOrderString(1, orderby) + " LIMIT " + config.resultsLimit;
    return sql_query;
}

function fillArtistsPage(filterText, orderby)
{
var sql_query = "SELECT \
		c.artist, \
		(SELECT path FROM images i LEFT JOIN albums a ON (i.id = a.image) WHERE a.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1) AS bild, \
		c.name, \
		ROUND(c.rat,1), \
		plcount, \
		ROUND(c.sco, 0), \
		wei, \
		leng, \
		numTr, \
		c.numAl, \
		ROUND(yea, 0) \
	FROM ( \
	SELECT \
		t.artist, \
		b.name, \
		COUNT(DISTINCT t.album) AS numAl, \
		AVG(IF(s.rating < 1,  NULL, s.rating)) AS rat, \
		AVG(s.score) AS sco, \
		SUM(s.playcount) AS plcount, \
		SUM(t.length)    AS leng, \
		COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, \
		COUNT(*) AS numTr, " 
	+ createWeightString(2) 
		+ " \
		AS wei, \
		AVG(IF(y.name < 1, NULL, y.name)) AS yea \
	FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year=y.id) \
	LEFT JOIN genres g ON (t.genre=g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) LEFT JOIN artists b1 ON (b1.id=a.artist) WHERE true"
	+ playlistImporter.createFilterString(filterText)
	+ " GROUP BY t.artist "
	+ createOrderString(2, orderby)
	+ " LIMIT " + config.resultsLimit + "\
	) c";

    return sql_query;
}

function fillAlbumArtistsPage(filterText, orderby)
{
	var sql_query = "SELECT \
		c.artist, (SELECT path FROM images i LEFT JOIN albums a ON (i.id = a.image) WHERE a.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1)  AS bild, c.name, ROUND(c.rat, 1), plcount, ROUND(c.sco, 0), wei, leng, numTr, numAl, ROUND(yea, 0) \
  FROM ( \
		SELECT a.artist, AVG(IF(s.rating <  1, NULL, s.rating)) AS rat, AVG(s.score) AS sco, SUM(s.playcount) AS plcount, SUM(t.length) AS leng, \
		       COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, COUNT(DISTINCT t.album) AS numAl, \
			   count(*) AS numTr, "
				+ createWeightString(3) +
				" AS wei, \
			   AVG(IF(y.name <  1, NULL, y.name)) AS yea, b1.name \
		  FROM tracks t LEFT JOIN statistics s ON (s.url =  t.url) LEFT JOIN years y ON (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) \
		  LEFT JOIN albums a ON (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) LEFT JOIN artists b ON (t.artist=b.id) LEFT JOIN images i ON (a.image = i.id) WHERE true"
		 + playlistImporter.createFilterString(filterText)
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
				 ROUND(c.rat, 1), \
				 plcount, \
				 ROUND(c.sco, 0), \
				 wei, \
				 leng, \
				 numTr, \
				 c.name, \
				 ROUND(yea, 0) \
  FROM ( \
		SELECT t.album, \
		a.name AS albumname, \
		i.path AS bild, \
		AVG(IF(s.rating <  1, NULL, s.rating)) AS rat, \
		AVG(s.score) AS sco, \
		SUM(s.playcount) AS plcount, \
		SUM(t.length) AS leng, \
	   COUNT(IF(s.rating <  1, NULL, s.rating)) AS numRatTr, \
	   COUNT(*) AS numTr, "
	   + createWeightString(4) + " AS wei, \
	   AVG(IF(y.name <  1, NULL, y.name)) AS yea, \
		b1.name \
		  FROM tracks t LEFT JOIN statistics s ON (s.url =  t.url) LEFT JOIN years y ON (t.year =  y.id) LEFT JOIN genres g ON (t.genre =  g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album=a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) LEFT JOIN images i ON (a.image=i.id) WHERE true"
		+ playlistImporter.createFilterString(filterText)
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
		NULL AS bild, \
		c.name,  \
		ROUND(c.rat, 1), \
		plcount, \
		ROUND(c.sco, 0), \
		wei, \
		leng, \
		numTr, \
		numAl, \
		ROUND(yea, 0) \
  FROM ( \
		SELECT t.genre, g.name, AVG(IF(s.rating <  1, NULL, s.rating)) AS rat, AVG(s.score) AS sco, SUM(s.playcount) AS plcount, SUM(t.length) AS leng, \
		       COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, \
			   COUNT(*) AS numTr, COUNT(DISTINCT t.album) AS numAl, "
			   + createWeightString(5)
			   + " AS wei, \
			   AVG(IF(y.name <  1, NULL, y.name)) AS yea \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) WHERE true"
		 + playlistImporter.createFilterString(filterText)
		 + " GROUP BY t.genre "
		 + createOrderString(5, orderby)
		 + " LIMIT " + config.resultsLimit + " \
       ) c";
    return sql_query;
}

function fillLabelsPage(filterText, orderby)
{
	var sql_query = "SELECT \
		c.id, \
		NULL AS bild, \
		c.label,  \
		ROUND(c.rat, 1), \
		plcount, \
		ROUND(c.sco, 0), \
		wei, \
		leng, \
		numTr, \
		numAl, \
		ROUND(yea, 0) \
  FROM ( \
		SELECT ul.label AS id, l.label, AVG(IF(s.rating <  1, NULL, s.rating)) AS rat, AVG(s.score) AS sco, SUM(s.playcount) AS plcount, SUM(t.length) AS leng, \
		       COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, \
			   COUNT(*) AS numTr, COUNT(DISTINCT t.album) AS numAl, "
			   + createWeightString(5)
			   + " AS wei, \
			   AVG(IF(y.name <  1, NULL, y.name)) AS yea \
		  FROM urls_labels ul LEFT JOIN labels l ON (l.id = ul.label) JOIN tracks t ON (t.url = ul.url) LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) WHERE true"
		 + playlistImporter.createFilterString(filterText)
		 + " GROUP BY ul.label "
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
	sql_query += " ,   ROUND(100 * a.rated_tracks / a.total_tracks, 2)";
	sql_query += " ,   a.rated_albums";
	sql_query += " ,   ROUND(100 * a.rated_albums  / a.total_albums, 2)";
	sql_query += " ,   a.rated_artists";
	sql_query += " ,   ROUND(100 * a.rated_artists / a.total_artists, 2)";
	sql_query += " ,   ROUND(a.avg_rating / 2, 1)";
	sql_query += " ,   ROUND(a.avg_score, 0)";
	sql_query += " ,   ROUND(a.avg_length, 0)";
	sql_query += " FROM (";
	sql_query += "     SELECT";
	sql_query += "         (SELECT COUNT(*) FROM tracks) AS total_tracks";
	sql_query += "     ,   (SELECT COUNT(*) FROM albums) AS total_albums";
	sql_query += "     ,   (SELECT COUNT(*) FROM artists) AS total_artists";
	sql_query += "     ,   (SELECT COUNT(*) FROM tracks t JOIN statistics s ON (s.url = t.url AND s.rating > 0)) AS rated_tracks";
	sql_query += "     ,   (SELECT COUNT(*) FROM (SELECT DISTINCT t.album FROM tracks t JOIN statistics s ON (s.url = t.url) WHERE rating > 0 GROUP BY t.album HAVING COUNT(*) >= " + config.minTracksPerAlbum + ") x ) AS rated_albums";
	sql_query += "     ,   (SELECT COUNT(*) FROM (SELECT DISTINCT t.artist FROM tracks t JOIN statistics s ON (s.url = t.url) WHERE rating > 0 GROUP BY t.artist HAVING COUNT(*) >= " + config.minTracksPerAlbum + ") x ) AS rated_artists";
	sql_query += "     ,   (SELECT AVG(rating) FROM statistics WHERE rating > 0) AS avg_rating";
	sql_query += "     ,   (SELECT AVG(if(score IS NULL, 0, score)) FROM statistics) AS avg_score";
	sql_query += "     ,   (SELECT AVG(length) FROM tracks) AS avg_length";
	sql_query += "     FROM";
	sql_query += "         dual";
	sql_query += " ) a ;";
    return sql_query;
}


function fillRatingOverTimePage(filterText, indexOrd)
{
	var sql_query = "SELECT c.yid, c.name, c." + createOrderString(6, indexOrd) +
		  "FROM ( \
		SELECT t.year AS yid, y.name, AVG(IF(s.rating < 1, NULL, s.rating)) AS rat, AVG(s.score) AS sco, SUM(s.playcount) AS plcount, \
		       SUM(t.length) AS leng, COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, \
			   COUNT(*) AS numTr, COUNT(DISTINCT t.album) AS numAl, " + createWeightString(6) + " AS wei \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year = y.id) LEFT JOIN genres g ON (t.genre = g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) WHERE true"
		 + playlistImporter.createFilterString(filterText)
		 + " GROUP BY t.year \
		HAVING name != 0 " + (indexOrd == 0 ? (" AND numRatTr >= " + config.minTracksPerAlbum) : "")
		 + " ORDER BY 2 \
       ) c";
    return sql_query;
}
