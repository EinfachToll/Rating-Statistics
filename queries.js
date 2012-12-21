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
