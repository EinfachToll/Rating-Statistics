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
			l = (groupby != 1 && groupby != 6 ? " HAVING anzlieder >= " + config.minTracksPerAlbum : "") + (groupby != 6 ? " ORDER BY " : "") + "punkte ";
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

function createFilterString(filterText)
{
	msg(filterText);
	if (filterText != "") 
	{
		var f = " WHERE true ";
		var filterTerms = filterText.split(" ");
		for(var i = 0; i < filterTerms.length; ++i)
		{
			f += " AND (UPPER(b.name) LIKE UPPER('%" + filterTerms[i] + "%') OR UPPER(a.name) LIKE UPPER('%" + filterTerms[i]  + "%') OR UPPER(b1.name) LIKE UPPER('%" + filterTerms[i] + "%') OR UPPER(g.name) LIKE UPPER('%" + filterTerms[i]  + "%') OR t.url IN (SELECT url FROM urls_labels ul LEFT JOIN labels l ON l.id = ul.label where UPPER(l.label) LIKE UPPER('%" + filterTerms[i] + "%')) OR y.name LIKE '%"+ filterTerms[i] +"%'";
			var regexTwoY = /^(\d+)-(\d+)/;
			var regexToY = /^-(\d+)/;
			var regexFromY = /^(\d+)-/;
			if(filterTerms[i].match(regexTwoY))
			{
				var res = regexTwoY.exec(filterTerms[i]);
				var now = new Date();
				for(var r=1; r<=2; ++r)
				{
					if(parseInt(res[r]) <= now.getFullYear() - 2000) res[r] = String(parseInt(res[r]) + 2000);
					else
						if(parseInt(res[r]) <= 99) res[r] = String(parseInt(res[r]) + 1900);
				}
				f += " OR y.name BETWEEN " + res[1] + " AND " + res[2];
			} else
			if(filterTerms[i].match(regexToY))
			{
				var res = regexToY.exec(filterTerms[i]);
				var now = new Date();
				if(parseInt(res[1]) <= now.getFullYear() - 2000) res[1] = String(parseInt(res[1]) + 2000);
				else
					if(parseInt(res[1]) <= 99) res[1] = String(parseInt(res[1]) + 1900);
				f += " OR y.name < " + res[1];
			} else
			if(filterTerms[i].match(regexFromY))
			{
				var res = regexFromY.exec(filterTerms[i]);
				var now = new Date();
				if(parseInt(res[1]) <= now.getFullYear() - 2000) res[1] = String(parseInt(res[1]) + 2000);
				else
					if(parseInt(res[1]) <= 99) res[1] = String(parseInt(res[1]) + 1900);
				f += " OR y.name > " + res[1];
			}
			f += ")";
		}

		return f;
	}
	else return "";
}

function fillTracksPage(filterText, orderby)
{
	var sql_query = "\
	SELECT \
	t.id, \
	i.path AS bild, \
	t.title  AS liedname, \
	s.rating AS bewertung, \
	s.playcount AS wiedergabezaehler, \
	s.score AS punkte, \
	" + createWeightString(1) + " AS wichtung, \
	t.length AS laenge, \
	b.name, \
	a.name, \
	y.name AS jahr \
	from tracks t left join statistics s on (s.url = t.url) left join years y on (t.year=y.id) left join albums a on (a.id = t.album) left join artists b on (b.id = t.artist) left join images i ON (i.id = a.image) left JOIN genres g ON (g.id = t.genre) LEFT JOIN artists b1 ON (a.artist = b1.id) \
	" + createFilterString(filterText) +
	createOrderString(1, orderby) + " LIMIT " + config.resultsLimit;
    return sql_query;
}

function fillArtistsPage(filterText, orderby)
{
var sql_query = "SELECT \
		c.artist, \
		(SELECT path from images i LEFT JOIN albums a ON (i.id = a.image) WHERE a.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1) AS bild, \
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
		count(distinct t.album) AS anzalben, \
		AVG(if(s.rating < 1,  null, s.rating)) AS bewertung, \
		AVG(s.score) AS punkte, \
		sum(s.playcount) AS wiedergabezaehler, \
		sum(t.length)    AS laenge, \
		count(if(s.rating < 1, null, s.rating)) AS anzbew, \
		count(*) AS anzlieder, " 
	+ createWeightString(2) 
		+ " \
		as wichtung, \
		AVG(if(y.name < 1, null, y.name)) AS jahr \
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
		c.artist, (SELECT path from images i LEFT JOIN albums a ON (i.id = a.image) WHERE a.artist = c.artist AND path NOT LIKE 'amarok-sqltrackuid://%' ORDER BY RAND() LIMIT 1)  AS bild, c.name, round(c.bewertung, 1), wiedergabezaehler, round(c.punkte, 0), wichtung, laenge, anzlieder, anzalben, round(jahr, 0) \
  FROM ( \
		SELECT a.artist, AVG(if(s.rating <  1, null, s.rating)) AS bewertung, AVG(s.score) AS punkte, sum(s.playcount) AS wiedergabezaehler, sum(t.length) AS laenge, \
		       count(if(s.rating < 1, null, s.rating)) AS anzbew, count(distinct t.album) AS anzalben, \
			   count(*) AS anzlieder, "
				+ createWeightString(3) +
				" AS wichtung, \
			   AVG(if(y.name <  1, null, y.name)) AS jahr, b1.name \
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
		a.name AS albumname, \
		i.path AS bild, \
		AVG(if(s.rating <  1, null, s.rating)) AS bewertung, \
		AVG(s.score) AS punkte, \
		sum(s.playcount) AS wiedergabezaehler, \
		sum(t.length) AS laenge, \
	   count(if(s.rating <  1, null, s.rating)) AS anzbew, \
	   count(*) AS anzlieder, "
	   + createWeightString(4) + " AS wichtung, \
	   AVG(if(y.name <  1, null, y.name)) AS jahr, \
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
		NULL AS bild, \
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
		SELECT t.genre, g.name, AVG(if(s.rating <  1, null, s.rating)) AS bewertung, AVG(s.score) AS punkte, sum(s.playcount) AS wiedergabezaehler, sum(t.length) AS laenge, \
		       count(if(s.rating < 1, null, s.rating)) AS anzbew, \
			   count(*) AS anzlieder, count(distinct t.album) AS anzalben, "
			   + createWeightString(5)
			   + " AS wichtung, \
			   AVG(if(y.name <  1, null, y.name)) AS jahr \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) LEFT join artists b on (t.artist = b.id) LEFT JOIN albums a on (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) "
		 + createFilterString(filterText)
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
		round(c.bewertung, 1), \
		wiedergabezaehler, \
		round(c.punkte, 0), \
		wichtung, \
		laenge, \
		anzlieder, \
		anzalben, \
		round(jahr, 0) \
  FROM ( \
		SELECT ul.label AS id, l.label, AVG(if(s.rating <  1, null, s.rating)) AS bewertung, AVG(s.score) AS punkte, sum(s.playcount) AS wiedergabezaehler, sum(t.length) AS laenge, \
		       count(if(s.rating < 1, null, s.rating)) AS anzbew, \
			   count(*) AS anzlieder, count(distinct t.album) AS anzalben, "
			   + createWeightString(5)
			   + " AS wichtung, \
			   AVG(if(y.name <  1, null, y.name)) AS jahr \
		  FROM urls_labels ul LEFT JOIN labels l ON (l.id = ul.label) JOIN tracks t ON (t.url = ul.url) LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year =  y.id) LEFT JOIN genres g ON (t.genre = g.id) LEFT join artists b on (t.artist = b.id) LEFT JOIN albums a on (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) "
		 + createFilterString(filterText)
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
	sql_query += "         (select count(*) from tracks) AS total_tracks";
	sql_query += "     ,   (select count(*) from albums) AS total_albums";
	sql_query += "     ,   (select count(*) from artists) AS total_artists";
	sql_query += "     ,   (select count(*) from tracks t JOIN statistics s ON (s.url = t.url and s.rating > 0)) AS rated_tracks";
	sql_query += "     ,   (select count(*) from (SELECT DISTINCT t.album from tracks t JOIN statistics s ON (s.url = t.url) WHERE rating > 0 GROUP BY t.album HAVING count(*) >= " + config.minTracksPerAlbum + ") x ) AS rated_albums";
	sql_query += "     ,   (select count(*) from (SELECT DISTINCT t.artist from tracks t JOIN statistics s ON (s.url = t.url) WHERE rating > 0 GROUP BY t.artist HAVING count(*) >= " + config.minTracksPerAlbum + ") x ) AS rated_artists";
	sql_query += "     ,   (select AVG(rating) from statistics where rating > 0) AS avg_rating";
	sql_query += "     ,   (select AVG(if(score is NULL, 0, score)) from statistics) AS avg_score";
	sql_query += "     ,   (select AVG(length) from tracks) AS avg_length";
	sql_query += "     FROM";
	sql_query += "         dual";
	sql_query += " ) a ;";
    return sql_query;
}


function fillRatingOverTimePage(filterText, indexOrd)
{
	var sql_query = "SELECT c.name, c." + createOrderString(6, indexOrd) +
		  "FROM ( \
		SELECT t.year, y.name, AVG(if(s.rating < 1, null, s.rating)) AS bewertung, AVG(s.score) AS punkte, sum(s.playcount) AS wiedergabezaehler, \
		       sum(t.length) AS laenge, count(if(s.rating < 1, null, s.rating)) AS anzbew, \
			   count(*) AS anzlieder, count(distinct t.album) AS anzalben, " + createWeightString(6) + " AS wichtung \
		  FROM tracks t LEFT JOIN statistics s ON (s.url = t.url) LEFT JOIN years y on (t.year = y.id) LEFT JOIN genres g ON (t.genre = g.id) LEFT join artists b on (t.artist = b.id) LEFT JOIN albums a on (t.album = a.id) LEFT JOIN artists b1 ON (a.artist = b1.id) "
		 + createFilterString(filterText)
		 + " GROUP BY t.year \
		HAVING name != 0 " + (indexOrd == 0 ? (" AND anzbew >= " + config.minTracksPerAlbum) : "")
		 + " ORDER BY 2 \
       ) c";
    return sql_query;
}
