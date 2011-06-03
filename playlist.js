Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

function PlaylistImporter(){}

PlaylistImporter.prototype.addTrack = function(trackID)
{
    msg("Adding track with ID " + trackID + " to playlist...");

    var sql_query  = " SELECT concat('file://', if(d.lastmountpoint is NULL, '', d.lastmountpoint), '/', u.rpath)";
        sql_query += " FROM tracks t";
        sql_query += " JOIN urls u on t.url=u.id";
        sql_query += " LEFT JOIN devices d on d.id=u.deviceid";
        sql_query += " where t.id=" + trackID;
    var result = sql_exec(sql_query);

    Amarok.Playlist.addMedia(new QUrl(result[0]));
}

PlaylistImporter.prototype.addAlbum = function(albumID)
{
    msg("Adding album with ID " + albumID + " to playlist...");

    var sql_query  = " SELECT concat('file://', if(d.lastmountpoint is NULL, '', d.lastmountpoint), '/', u.rpath)";
        sql_query += " FROM tracks t";
        sql_query += " JOIN urls u on t.url = u.id"
        sql_query += " LEFT JOIN devices d on d.id = u.deviceid";
        sql_query += " where t.album=" + albumID;
        sql_query += " order by t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);

	Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addArtist = function(artistID)
{
    msg("Adding artist with ID " + artistID + " to playlist...");

    var sql_query  = "SELECT concat('file://', if(devices.lastmountpoint is NULL, '', devices.lastmountpoint), '/', urls.rpath) FROM tracks AS ts, (select th.jahr, tr.id from tracks as tr, (select max(years.name) as jahr, album from tracks, years where tracks.year=years.id group by album) th where th.album=tr.album) tnh, (urls  LEFT JOIN devices ON devices.id=urls.deviceid) WHERE tnh.id=ts.id AND urls.id=ts.url AND ts.artist=" + artistID + " order by tnh.jahr, ts.album, ts.discnumber, ts.tracknumber";
    var result = sql_exec(sql_query);

	Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addAlbumArtist = function(artistID)
{
	msg("Adding artist with ID " + artistID + " to playlist...");

	var sql_query = "SELECT concat('file://', if(devices.lastmountpoint is NULL, '', devices.lastmountpoint), '/', urls.rpath) FROM tracks, albums, (urls LEFT JOIN devices ON devices.id=urls.deviceid), (select max(years.name) as jahr, album from tracks, years where tracks.year=years.id group by album) as jahr WHERE tracks.album = albums.id and tracks.url = urls.id AND jahr.album = albums.id AND albums.artist = " + artistID + " ORDER BY jahr.jahr, tracks.album, tracks.discnumber, tracks.tracknumber";
	var result = sql_exec(sql_query);
	Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addGenre = function(genreID)
{
    msg("Adding genre with ID " + genreID + " to playlist...");

    var sql_query  = "SELECT concat('file://', if(devices.lastmountpoint is NULL, '', devices.lastmountpoint), '/', urls.rpath) FROM tracks JOIN urls ON tracks.url = urls.id JOIN albums ON albums.id=tracks.album LEFT JOIN devices ON devices.id = urls.deviceid WHERE tracks.genre=" + genreID + " AND albums.artist IS NULL ORDER BY tracks.album, tracks.discnumber, tracks.tracknumber";
	var result = sql_exec(sql_query);
	Amarok.Playlist.addMediaList(result);


	sql_query = "SELECT concat('file://', if(devices.lastmountpoint is NULL, '', devices.lastmountpoint), '/', urls.rpath) FROM tracks JOIN urls ON tracks.url = urls.id JOIN albums ON albums.id=tracks.album LEFT JOIN devices ON devices.id = urls.deviceid WHERE tracks.genre=" + genreID + " AND albums.artist IS NOT NULL ORDER BY tracks.artist, tracks.album, tracks.discnumber, tracks.tracknumber";
	result = sql_exec(sql_query);

	Amarok.Playlist.addMediaList(result);
}
