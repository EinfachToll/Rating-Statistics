Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );
Importer.include("query_result/album_query_result.js");
Importer.include("query_result/album_artist_query_result.js");

function findArtistAlbumCover(artist_id)
{
	return sql_exec([
		"select distinct",
	    "	a.id",
		"from",
		"    tracks t",
		"join",
		"    albums a on",
		"        t.album = a.id",
		"join",
		"    years y on",
		"        t.year = y.id",
		"join",
		"    images i on",
		"        a.image = i.id",
		"        and i.path != 'AMAROK_UNSET_MAGIC'",
		"where",
		"    t.artist = " + artist_id,
		"order by",
		"    y.name desc",
		"limit",
		"    5",
    ].join(' '));
}

function createOrderString(groupby, orderby)
{
	l = "";
	switch(orderby) {
		case 0:
			if(groupby ==1)
				; //l += " AND s.rating > 0 ";
			else if(groupby < 7)
				l += " HAVING numRatTr >= " + config.minTracksPerAlbum;
			if(groupby < 7)
				l += " ORDER BY ";
			l += "rating ";
			break;
		case 1:
			if(groupby < 7) l += " ORDER BY ";
			l += "plcount ";
			break;
		case 2:
			if(groupby != 1 && groupby < 7)
				l += " HAVING numTr >= " + config.minTracksPerAlbum;
			if(groupby < 7) l += " ORDER BY ";
			l += "sco ";
			break;
		case 3:
			if(config.weightRating > 0 && groupby != 1 && groupby < 7)
				l += " HAVING numRatTr >= 1 ";
			if(groupby < 7) l += " ORDER BY ";
			l += "wei ";
			break;
		case 4:
			if(groupby < 7) l += " ORDER BY ";
			l += "leng ";
			break;
		case 5:
			if(groupby < 7) l += " ORDER BY ";
			l += "numTr ";
			break;
		case 6:
			if(groupby < 7) l += " ORDER BY ";
			l += "numAl ";
			break;
		default:
			if(groupby < 7) {
				if(groupby != 1) {
					l += " HAVING numTr >= " + config.minTracksPerAlbum;
					if(config.reverseResults == Qt.Checked)
						l += " AND yea > 1";
				} else
					if(config.reverseResults == Qt.Checked)
						l += " AND y.name > 1";
				l += " ORDER BY ";
			}
			l += "yea ";
			break;
	}
	if (config.reverseResults==Qt.Unchecked && groupby < 7) l += "DESC ";
    return l;
}

function createWeightString(groupby)
{
	if(groupby!=1)
	{
		l = "   (5.0 * " + config.weightRating    + (groupby==9 ? " * s.rating)" : " * AVG(IF(s.rating < 1,  NULL, s.rating)))")
		  + " + (0.6 * " + config.weightScore     + " * AVG(IF(s.score IS NULL, 0, s.score)))"
		  + " + (0.5 * " + config.weightLength    + " * SQRT(SUM(t.length)/1000))"
		  + " + (2.5 * " + config.weightPlaycount + (groupby==2 || groupby==3 ? " * SUM(s.playcount))" : " * SQRT(SUM(s.playcount)))");
	} else
	{
		l = "   (5.0 * " + config.weightRating    + " * IF(s.rating < 1,  NULL, s.rating))"
		  + " + (0.6 * " + config.weightScore     + " * s.score)"
		  + " + (0.5 * " + config.weightLength    + " * SQRT(t.length)/1000)"
		  + " + (2.5 * " + config.weightPlaycount + " * SQRT(s.playcount))";
	}
    return l;
}

function fillTracksPage(filterText, orderby)
{
	var sql_query = "SELECT t.id, IF(i.path IS NOT NULL, i.path, CONCAT(IF(b1.name IS NOT NULL, LOWER(b1.name), ''), LOWER(a.name))), \
	t.title  AS liedname, s.rating AS rat, s.playcount AS plcount, s.score AS sco, " + createWeightString(1) + " AS wei, \
	t.length AS leng, a.name, b.name, y.name AS yea \
	FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year=y.id) LEFT JOIN albums a ON (a.id = t.album) \
	LEFT JOIN artists b ON (b.id = t.artist) LEFT JOIN images i ON (i.id = a.image) LEFT JOIN genres g ON (g.id = t.genre) \
	LEFT JOIN artists b1 ON (a.artist = b1.id) \
	WHERE true" + playlistImporter.createFilterString(filterText) + createOrderString(1, orderby) + " LIMIT " + config.resultsLimit;
    return sql_query;
}

function fillArtistsPage(filterText, orderby)
{
var sql_query = "SELECT c.artist, \
		IF((SELECT auu.image FROM albums auu WHERE auu.id = c.anyalb) IS NOT NULL, \
				(SELECT iuu.path FROM albums auu JOIN images iuu ON auu.image=iuu.id WHERE auu.id = c.anyalb), \
				CONCAT(LOWER((SELECT buu.name FROM albums auu JOIN artists buu ON auu.artist=buu.id WHERE auu.id=c.anyalb)), \
				LOWER((SELECT auu.name FROM albums auu WHERE auu.id=c.anyalb)))), \
		c.name, ROUND(c.rat,1), plcount, ROUND(c.sco, 0), wei, leng, numTr, c.numAl, ROUND(yea, 0) \
	FROM (SELECT t.artist, \
		(SELECT au.id FROM albums au LEFT JOIN tracks tu ON (tu.album = au.id) WHERE tu.artist = t.artist ORDER BY RAND() LIMIT 1) AS anyalb, \
		b.name, COUNT(DISTINCT t.album) AS numAl, AVG(IF(s.rating < 1, NULL, s.rating)) AS rat, AVG(IF(s.score IS NULL, 0, s.score)) AS sco, \
		SUM(s.playcount) AS plcount, SUM(t.length) AS leng, COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, COUNT(*) AS numTr, \
		" + createWeightString(2) + " AS wei, AVG(IF(y.name < 1, NULL, y.name)) AS yea \
		FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year=y.id) LEFT JOIN genres g ON (t.genre=g.id) \
		LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) LEFT JOIN artists b1 ON (b1.id=a.artist) \
		WHERE true" + playlistImporter.createFilterString(filterText) + "\
		GROUP BY t.artist " + createOrderString(2, orderby) + " LIMIT " + config.resultsLimit + "\
	) c";
    return sql_query;
}

function fillAlbumArtistsPage(filterText, orderby)
{
	var sql_query = "SELECT c.artist, \
		c.name, ROUND(c.rat, 1), plcount, ROUND(c.sco, 0), wei, leng, numTr, numAl, ROUND(yea, 0) \
  FROM ( SELECT a.artist, \
		(SELECT au.id FROM albums au where au.artist = a.artist ORDER BY RAND() LIMIT 1) AS anyalb, \
		AVG(IF(s.rating <  1, NULL, s.rating)) AS rat, AVG(IF(s.score IS NULL, 0, s.score)) AS sco, SUM(s.playcount) AS plcount, \
		SUM(t.length) AS leng, COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, COUNT(DISTINCT t.album) AS numAl, \
		COUNT(*) AS numTr, " + createWeightString(3) + " AS wei, AVG(IF(y.name <  1, NULL, y.name)) AS yea, b1.name \
		FROM tracks t LEFT JOIN statistics s ON (s.url =  t.url) LEFT JOIN years y ON (t.year =  y.id) \
		LEFT JOIN genres g ON (t.genre = g.id) LEFT JOIN albums a ON (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) \
		LEFT JOIN artists b ON (t.artist=b.id) LEFT JOIN images i ON (a.image = i.id) \
		WHERE true" + playlistImporter.createFilterString(filterText) + "\
		GROUP BY a.artist " + createOrderString(3, orderby) + " LIMIT " + config.resultsLimit + "\
	) c";
	return new AlbumArtistQueryResult(sql_exec(sql_query));
}

function fillAlbumsPage(filterText, orderby)
{
	var sql_query = "SELECT c.album, c.img, c.albumname, ROUND(c.rat, 1), plcount, ROUND(c.sco, 0), wei, leng, numTr, c.name, ROUND(yea, 0) \
  FROM (SELECT t.album, a.name AS albumname, \
		  null as img, \
		AVG(IF(s.rating <  1, NULL, s.rating)) AS rat, AVG(IF(s.score IS NULL, 0, s.score)) AS sco, SUM(s.playcount) AS plcount, \
		SUM(t.length) AS leng, COUNT(IF(s.rating <  1, NULL, s.rating)) AS numRatTr, COUNT(*) AS numTr, " + createWeightString(4) + " AS wei, \
		AVG(IF(y.name <  1, NULL, y.name)) AS yea, b1.name \
	  FROM tracks t LEFT JOIN statistics s ON (s.url =  t.url) LEFT JOIN years y ON (t.year =  y.id) \
		LEFT JOIN genres g ON (t.genre =  g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album=a.id) \
		LEFT JOIN artists b1 ON (a.artist = b1.id) \
	  WHERE true" + playlistImporter.createFilterString(filterText) + " \
	  GROUP BY t.album " + createOrderString(4, orderby) + " LIMIT " + config.resultsLimit + "\
      ) c";
	msg("1");
	var a = sql_exec(sql_query);
	msg("2");
	msg(a);
	var b = new AlbumQueryResult(a);
	msg("3");
	msg(b);
    return new AlbumQueryResult(sql_exec(sql_query));
}


function fillGenresPage(filterText, orderby)
{
	var sql_query = "SELECT c.genre, 'genre' AS img, c.name,  ROUND(c.rat, 1), plcount, ROUND(c.sco, 0), wei, leng, numTr, \
		numAl, ROUND(yea, 0) \
	  FROM (SELECT t.genre, g.name, AVG(IF(s.rating <  1, NULL, s.rating)) AS rat, AVG(IF(s.score IS NULL, 0, s.score)) AS sco, \
		SUM(s.playcount) AS plcount, SUM(t.length) AS leng, COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, COUNT(*) AS numTr, \
		COUNT(DISTINCT t.album) AS numAl, " + createWeightString(5) + " AS wei, AVG(IF(y.name <  1, NULL, y.name)) AS yea \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year =  y.id) \
		  LEFT JOIN genres g ON (t.genre = g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) \
		  LEFT JOIN artists b1 ON (a.artist = b1.id) \
		  WHERE true" + playlistImporter.createFilterString(filterText) + " \
		  GROUP BY t.genre " + createOrderString(5, orderby) + " LIMIT " + config.resultsLimit + " \
       ) c";
    return sql_query;
}

function fillLabelsPage(filterText, orderby)
{
	var sql_query = "SELECT c.id, 'label' AS img, c.label, ROUND(c.rat, 1), plcount, ROUND(c.sco, 0), wei, leng, \
		numTr, numAl, ROUND(yea, 0) \
  FROM (SELECT ul.label AS id, l.label, AVG(IF(s.rating <  1, NULL, s.rating)) AS rat, AVG(IF(s.score IS NULL, 0, s.score)) AS sco, \
		SUM(s.playcount) AS plcount, SUM(t.length) AS leng, COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, COUNT(*) AS numTr, \
		COUNT(DISTINCT t.album) AS numAl, " + createWeightString(6) + " AS wei, AVG(IF(y.name <  1, NULL, y.name)) AS yea \
	  FROM urls_labels ul LEFT JOIN labels l ON (l.id = ul.label) JOIN tracks t ON (t.url = ul.url) \
	    LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) \
		LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) \
		WHERE true" + playlistImporter.createFilterString(filterText) + " \
		GROUP BY ul.label " + createOrderString(6, orderby) + " LIMIT " + config.resultsLimit + " \
       ) c";
    return sql_query;
}

function fillYearGraph(filterText, indexOrd)
{
	var sql_query = "SELECT c.yid, c.name, c." + createOrderString(7, indexOrd) + "\
		FROM (SELECT t.year AS yid, y.name, AVG(IF(s.rating < 1, NULL, s.rating)) AS rat, AVG(IF(s.score IS NULL, 0, s.score)) AS sco, \
			SUM(s.playcount) AS plcount, SUM(t.length) AS leng, COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, \
		    COUNT(*) AS numTr, COUNT(DISTINCT t.album) AS numAl, " + createWeightString(7) + " AS wei \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year = y.id) \
		  LEFT JOIN genres g ON (t.genre = g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) \
		  LEFT JOIN artists b1 ON (a.artist = b1.id) \
		  WHERE true" + playlistImporter.createFilterString(filterText) + " GROUP BY t.year \
		  HAVING name != 0 " + (indexOrd == 0 ? (" AND numRatTr >= " + config.minTracksPerAlbum) : "") + " ORDER BY 2 \
       ) c";
    return sql_query;
}

function fillDecadeGraph(filterText, indexOrd)
{
	var sql_query = "SELECT c.deca, c.deca, c." + createOrderString(8, indexOrd) + "\
		 FROM (SELECT FLOOR(y.name/10)*10 AS deca, AVG(IF(s.rating < 1, NULL, s.rating)) AS rat, \
			AVG(IF(s.score IS NULL, 0, s.score)) AS sco, SUM(s.playcount) AS plcount, SUM(t.length) AS leng, \
			COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr, COUNT(*) AS numTr, \
			COUNT(DISTINCT t.album) AS numAl, " + createWeightString(8) + " AS wei \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year = y.id) \
		  LEFT JOIN genres g ON (t.genre = g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album = a.id) \
		  LEFT JOIN artists b1 ON (a.artist = b1.id) \
		  WHERE true" + playlistImporter.createFilterString(filterText) + " \
		  GROUP BY deca HAVING deca != 0 " + (indexOrd == 0 ? (" AND numRatTr >= " + config.minTracksPerAlbum) : "") + " ORDER BY 1 \
       ) c";
    return sql_query;
}

function fillRatingGraph(filterText, indexOrd)
{
    var sql_query = "SELECT c.rating, c.rating, c." + createOrderString(9, indexOrd) + "\
      FROM (SELECT s.rating, AVG(IF(y.name < 1, NULL, y.name)) AS yea, AVG(IF(s.score IS NULL, 0, s.score)) AS sco, \
		SUM(s.playcount) AS plcount, SUM(t.length) AS leng, COUNT(*) AS numTr, \
		COUNT(DISTINCT t.album) AS numAl, " + createWeightString(9) + " AS wei \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y ON (t.year = y.id) \
		  LEFT JOIN genres g ON (t.genre = g.id) LEFT JOIN artists b ON (t.artist = b.id) LEFT JOIN albums a ON (t.album  = a.id) \
		  LEFT JOIN artists b1 ON (a.artist = b1.id) \
		  WHERE true" + playlistImporter.createFilterString(filterText) + "\
		  GROUP BY s.rating ORDER BY 1 \
	   ) c";
	return sql_query;
}

function fillGlobalStatisticsPage(filterText)
{
	var sql_query = "SELECT COUNT(*) AS total_tracks, \
	COUNT(DISTINCT t.album) AS total_albums, \
	COUNT(DISTINCT t.artist) AS total_artists, \
	SUM(t.length) AS sum_length, \
	COUNT(DISTINCT s.id) AS rated_tracks, \
	ROUND(100*(COUNT(DISTINCT s.id)) / COUNT(*), 2) AS perc_rated_tracks, \
	COUNT(DISTINCT amb.album) AS rated_albums, \
	ROUND(100*(COUNT(DISTINCT amb.album)) / COUNT(DISTINCT t.album), 2) AS perc_rated_albums, \
	COUNT(DISTINCT bmb.artist) AS rated_artists, \
	ROUND(100*(COUNT(DISTINCT bmb.artist)) / COUNT(DISTINCT t.artist), 2) AS perc_rated_artists, \
	ROUND(AVG(s.rating) / 2, 1) AS avg_rating, \
	ROUND(AVG(IF(s.score IS NULL, 0, s.score)), 0) AS avg_score, \
	ROUND(AVG(t.length),0) AS avg_length \
FROM tracks t \
	LEFT JOIN artists b ON (t.artist=b.id) \
	LEFT JOIN albums a ON (t.album=a.id) \
	LEFT JOIN statistics s ON (s.url=t.url AND s.rating>0) \
	LEFT JOIN years y ON (t.year=y.id) \
	LEFT JOIN genres g ON (t.genre=g.id) \
	LEFT JOIN artists b1 ON (b1.id=a.artist) \
	LEFT JOIN (SELECT DISTINCT t.album FROM tracks t JOIN statistics s ON (s.url=t.url) \
				WHERE rating>0 GROUP BY t.album HAVING COUNT(*)>=" +config.minTracksPerAlbum + "  \
			   UNION SELECT DISTINCT t.album FROM tracks t JOIN statistics s ON (s.url=t.url) GROUP BY t.album HAVING MIN(rating)>0) amb \
		ON (t.album=amb.album) \
	LEFT JOIN (SELECT DISTINCT t.artist FROM tracks t JOIN statistics s ON (s.url = t.url)  \
		WHERE rating > 0 GROUP BY t.artist HAVING COUNT(*) >= " + config.minTracksPerAlbum + "  \
		UNION SELECT DISTINCT t.artist FROM tracks t JOIN statistics s ON (s.url = t.url)  \
		GROUP BY t.artist HAVING MIN(rating) > 0) bmb ON (t.artist=bmb.artist) \
	WHERE TRUE" + playlistImporter.createFilterString(filterText);
    return sql_query;
}

