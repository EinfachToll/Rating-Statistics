function PlaylistImporter(){}

PlaylistImporter.prototype.createFilterString = function(filterText)
{
	if (filterText != "") 
	{
		var f = "";
		var filterTerms = filterText.split(" ");
		for(var i = 0; i < filterTerms.length; ++i)
		{
			f += " AND (UPPER(b.name) LIKE UPPER('%" + filterTerms[i] + "%') OR UPPER(a.name) LIKE UPPER('%" + filterTerms[i]  + "%') OR UPPER(b1.name) LIKE UPPER('%" + filterTerms[i] + "%') OR UPPER(g.name) LIKE UPPER('%" + filterTerms[i]  + "%') OR t.url IN (SELECT url FROM urls_labels ul LEFT JOIN labels l ON l.id = ul.label where UPPER(l.label) LIKE UPPER('%" + filterTerms[i] + "%'))";
			var regexTwoY = /^(\d+)-(\d+)/;
			var regexToY = /^-(\d+)/;
			var regexFromY = /^(\d+)-/;
			var regexY = /^(\d+)/;
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
				f += " OR y.name <= " + res[1];
			} else
			if(filterTerms[i].match(regexFromY))
			{
				var res = regexFromY.exec(filterTerms[i]);
				var now = new Date();
				if(parseInt(res[1]) <= now.getFullYear() - 2000) res[1] = String(parseInt(res[1]) + 2000);
				else
					if(parseInt(res[1]) <= 99) res[1] = String(parseInt(res[1]) + 1900);
				f += " OR y.name >= " + res[1];
			} else
			if(filterTerms[i].match(regexY))
			{
				var res = regexY.exec(filterTerms[i]);
				var now = new Date();
				if(parseInt(res[1]) <= now.getFullYear() - 2000) res[1] = String(parseInt(res[1]) + 2000);
				else
					if(parseInt(res[1]) <= 99) res[1] = String(parseInt(res[1]) + 1900);
				f += " OR y.name = " + res[1];
			}
			f += ")";
		}

		return f;
	}
	else return "";
};

PlaylistImporter.prototype.filterText = "";

PlaylistImporter.prototype.addTrack = function(trackID)
{
    msg("Adding track with ID " + trackID + " to playlist...");

    var sql_query  = " SELECT CONCAT('file://', IF(d.lastmountpoint IS NULL, '', d.lastmountpoint), '/', u.rpath) FROM tracks t JOIN urls u ON t.url=u.id";
		sql_query += " LEFT JOIN albums a ON (a.id = t.album) LEFT JOIN artists b ON (b.id = t.artist) LEFT JOIN artists b1 ON (b1.id = a.artist) LEFT JOIN genres g ON (g.id = t.genre) LEFT JOIN years y ON (y.id = t.year)";
        sql_query += " LEFT JOIN devices d ON d.id=u.deviceid WHERE t.id=" + trackID + this.createFilterString(this.filterText);
    var result = sql_exec(sql_query);

    Amarok.Playlist.addMedia(new QUrl(result[0]));
};

PlaylistImporter.prototype.addAlbum = function(albumID)
{
    msg("Adding album with ID " + albumID + " to playlist...");

    var sql_query  = " SELECT CONCAT('file://', IF(d.lastmountpoint IS NULL, '', d.lastmountpoint), '/', u.rpath)";
        sql_query += " FROM tracks t";
        sql_query += " JOIN urls u ON t.url = u.id";
		sql_query += " LEFT JOIN albums a ON (a.id = t.album) LEFT JOIN artists b ON (b.id = t.artist) LEFT JOIN artists b1 ON (b1.id = a.artist) LEFT JOIN genres g ON (g.id = t.genre) LEFT JOIN years y ON (y.id = t.year)";
        sql_query += " LEFT JOIN devices d ON d.id = u.deviceid WHERE t.album=" + albumID + this.createFilterString(this.filterText);
        sql_query += " ORDER BY t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);

	Amarok.Playlist.addMediaList(result);
};

PlaylistImporter.prototype.addArtist = function(artistID)
{
    msg("Adding artist with ID " + artistID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) \
					  FROM tracks t LEFT JOIN urls u ON t.url=u.id LEFT JOIN (SELECT th.jahr, tr.id FROM tracks AS tr, (SELECT MAX(years.name) jahr, album FROM tracks, years WHERE tracks.year=years.id GROUP BY album) th WHERE th.album=tr.album) tnh ON tnh.id=t.id LEFT JOIN albums a ON (a.id = t.album) LEFT JOIN artists b ON (b.id = t.artist) LEFT JOIN artists b1 ON (b1.id = a.artist) LEFT JOIN genres g ON (g.id = t.genre) LEFT JOIN years y ON (y.id = t.year) LEFT JOIN devices ON devices.id=u.deviceid WHERE t.artist=" + artistID + this.createFilterString(this.filterText) + " ORDER BY tnh.jahr, t.album, t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);

	Amarok.Playlist.addMediaList(result);
};

PlaylistImporter.prototype.addAlbumArtist = function(artistID)
{
	msg("Adding artist with ID " + artistID + " to playlist...");

	var sql_query = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) FROM tracks t LEFT JOIN urls u ON t.url=u.id LEFT JOIN albums a ON a.id=t.album LEFT JOIN (SELECT MAX(years.name) AS yu, album FROM tracks, years WHERE tracks.year=years.id GROUP BY album) alb_maxy ON alb_maxy.album=a.id LEFT JOIN artists b ON (b.id=t.artist) LEFT JOIN artists b1 ON (b1.id=a.artist) LEFT JOIN genres g ON (g.id=t.genre) LEFT JOIN years y ON (y.id=t.year) LEFT JOIN devices ON devices.id=u.deviceid WHERE a.artist = " + artistID + this.createFilterString(this.filterText) + " ORDER BY alb_maxy.yu, t.album, t.discnumber, t.tracknumber";
	var result = sql_exec(sql_query);
	Amarok.Playlist.addMediaList(result);
};

PlaylistImporter.prototype.addGenre = function(genreID)
{
    msg("Adding genre with ID " + genreID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) FROM tracks t LEFT JOIN urls u ON t.url = u.id LEFT JOIN albums a ON a.id=t.album LEFT JOIN artists b ON (b.id=t.artist) LEFT JOIN artists b1 ON (b1.id=a.artist) LEFT JOIN genres g ON (g.id=t.genre) LEFT JOIN years y ON (y.id=t.year) LEFT JOIN devices ON devices.id = u.deviceid WHERE t.genre=" + genreID + this.createFilterString(this.filterText) + " ORDER BY IF(a.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
	var result = sql_exec(sql_query);
	Amarok.Playlist.addMediaList(result);
};

PlaylistImporter.prototype.addLabel = function(labelID)
{
    msg("Adding label with ID " + labelID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) FROM urls_labels ul LEFT JOIN urls u ON ul.url = u.id LEFT JOIN tracks t ON t.url = u.id LEFT JOIN albums a ON a.id=t.album LEFT JOIN artists b ON (b.id=t.artist) LEFT JOIN artists b1 ON (b1.id=a.artist) LEFT JOIN genres g ON (g.id=t.genre) LEFT JOIN years y ON (y.id=t.year) LEFT JOIN devices ON devices.id = u.deviceid WHERE ul.label =" + labelID + this.createFilterString(this.filterText) + " ORDER BY IF(a.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
	var result = sql_exec(sql_query);
	Amarok.Playlist.addMediaList(result);
};

PlaylistImporter.prototype.addYear = function(yearID)
{
    msg("Adding year with ID " + yearID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) FROM tracks t LEFT JOIN urls u ON t.url = u.id LEFT JOIN albums a ON a.id=t.album LEFT JOIN artists b ON (b.id=t.artist) LEFT JOIN artists b1 ON (b1.id=a.artist) LEFT JOIN genres g ON (g.id=t.genre) LEFT JOIN years y ON (y.id=t.year) LEFT JOIN devices ON devices.id = u.deviceid WHERE t.year=" + yearID + this.createFilterString(this.filterText) + " ORDER BY IF(a.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
	var result = sql_exec(sql_query);
	Amarok.Playlist.addMediaList(result);
};

PlaylistImporter.prototype.addDecade = function(dec)
{
    msg("Adding Decade " + dec + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) FROM tracks t LEFT JOIN urls u ON t.url = u.id LEFT JOIN albums a ON a.id=t.album LEFT JOIN artists b ON (b.id=t.artist) LEFT JOIN artists b1 ON (b1.id=a.artist) LEFT JOIN genres g ON (g.id=t.genre) LEFT JOIN years y ON (y.id=t.year) LEFT JOIN devices ON devices.id = u.deviceid WHERE (y.name BETWEEN " + dec + " AND " + dec + "+9) " + this.createFilterString(this.filterText) + " ORDER BY IF(a.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
	var result = sql_exec(sql_query);
	Amarok.Playlist.addMediaList(result);
};

PlaylistImporter.prototype.addRating = function(rating)
{
    msg("Adding Rating " + rating + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) FROM tracks t LEFT JOIN statistics s ON t.url=s.url LEFT JOIN urls u ON t.url = u.id LEFT JOIN albums a ON a.id=t.album LEFT JOIN artists b ON (b.id=t.artist) LEFT JOIN artists b1 ON (b1.id=a.artist) LEFT JOIN genres g ON (g.id=t.genre) LEFT JOIN years y ON (y.id=t.year) LEFT JOIN devices ON devices.id = u.deviceid WHERE s.rating=" + rating + this.createFilterString(this.filterText) + " ORDER BY IF(a.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
	var result = sql_exec(sql_query);
	Amarok.Playlist.addMediaList(result);
};

