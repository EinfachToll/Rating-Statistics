function PlaylistImporter(){}

PlaylistImporter.prototype.createFilterString = function(filterText)
{
    if (filterText != "")
    {
        var f = "";
        var filterTerms = filterText.split(" ");
        for(var i = 0; i < filterTerms.length; ++i)
        {
            f += " AND (";
            f += "UPPER(ar.name) LIKE UPPER('%" + filterTerms[i] + "%') OR ";
            f += "UPPER(al.name) LIKE UPPER('%" + filterTerms[i] + "%') OR ";
            f += "UPPER(ar1.name) LIKE UPPER('%" + filterTerms[i] + "%') OR ";
            f += "UPPER(g.name) LIKE UPPER('%" + filterTerms[i]  + "%') OR ";
            f += "t.url IN (SELECT url FROM urls_labels ul LEFT JOIN labels l ON (l.id = ul.label) ";
            f += "WHERE UPPER(l.label) LIKE UPPER('%" + filterTerms[i] + "%'))";
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
}

PlaylistImporter.prototype.filterText = "";

PlaylistImporter.prototype.addTrack = function(trackID)
{
    msg("Adding track with ID " + trackID + " to playlist...");

    var sql_query  = " SELECT CONCAT('file://', IF(d.lastmountpoint IS NULL, '', d.lastmountpoint), '/', u.rpath) ";
        sql_query += "FROM tracks t JOIN urls u ON (t.url = u.id) ";
        sql_query += "LEFT JOIN albums al ON (al.id = t.album) LEFT JOIN artists ar ON (ar.id = t.artist) ";
        sql_query += "LEFT JOIN artists ar1 ON (ar1.id = al.artist) LEFT JOIN genres g ON (g.id = t.genre) ";
        sql_query += "LEFT JOIN years y ON (y.id = t.year) ";
        sql_query += "LEFT JOIN devices d ON (d.id = u.deviceid) WHERE t.id = " + trackID + this.createFilterString(this.filterText);
    var result = sql_exec(sql_query);

    Amarok.Playlist.addMedia(new QUrl(result[0]));
}

PlaylistImporter.prototype.addAlbum = function(albumID)
{
    msg("Adding album with ID " + albumID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(d.lastmountpoint IS NULL, '', d.lastmountpoint), '/', u.rpath) ";
        sql_query += "FROM tracks t JOIN urls u ON (t.url = u.id) LEFT JOIN albums al ON (al.id = t.album) ";
        sql_query += "LEFT JOIN artists ar ON (ar.id = t.artist) LEFT JOIN artists ar1 ON (ar1.id = al.artist) ";
        sql_query += "LEFT JOIN genres g ON (g.id = t.genre) LEFT JOIN years y ON (y.id = t.year) ";
        sql_query += "LEFT JOIN devices d ON (d.id = u.deviceid) WHERE t.album=" + albumID + this.createFilterString(this.filterText);
        sql_query += " ORDER BY t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);

    Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addArtist = function(artistID)
{
    msg("Adding artist with ID " + artistID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) ";
        sql_query += "FROM tracks t LEFT JOIN urls u ON (t.url = u.id) ";
        sql_query += "LEFT JOIN (SELECT year_per_album.ym, t1.id FROM tracks AS t1, ";
        sql_query += "(SELECT MAX(years.name) ym, album FROM tracks, years WHERE (tracks.year = years.id) GROUP BY album) year_per_album ";
        sql_query += "WHERE year_per_album.album = t1.album) year_per_track ON (year_per_track.id = t.id) LEFT JOIN albums al ON (al.id = t.album) ";
        sql_query += "LEFT JOIN artists ar ON (ar.id = t.artist) LEFT JOIN artists ar1 ON (ar1.id = al.artist) ";
        sql_query += "LEFT JOIN genres g ON (g.id = t.genre) LEFT JOIN years y ON (y.id = t.year) ";
        sql_query += "LEFT JOIN devices ON (devices.id = u.deviceid) ";
        sql_query += "WHERE t.artist=" + artistID + this.createFilterString(this.filterText);
        sql_query += " ORDER BY year_per_track.ym, t.album, t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);

    Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addAlbumArtist = function(artistID)
{
    msg("Adding artist with ID " + artistID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) ";
        sql_query += "FROM tracks t LEFT JOIN urls u ON (t.url = u.id) LEFT JOIN albums al ON (al.id = t.album) ";
        sql_query += "LEFT JOIN (SELECT MAX(years.name) AS ym, album FROM tracks, years WHERE (tracks.year = years.id) GROUP BY album) alb_maxy ";
        sql_query += "ON (alb_maxy.album = al.id) LEFT JOIN artists ar ON (ar.id = t.artist) ";
        sql_query += "LEFT JOIN artists ar1 ON (ar1.id = al.artist) LEFT JOIN genres g ON (g.id = t.genre) ";
        sql_query += "LEFT JOIN years y ON (y.id = t.year) LEFT JOIN devices ON (devices.id = u.deviceid) ";
        sql_query += "WHERE al.artist = " + artistID + this.createFilterString(this.filterText);
        sql_query += " ORDER BY alb_maxy.ym, t.album, t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);
    Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addGenre = function(genreID)
{
    msg("Adding genre with ID " + genreID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) ";
        sql_query += "FROM tracks t LEFT JOIN urls u ON (t.url = u.id) LEFT JOIN albums al ON (al.id = t.album) ";
        sql_query += "LEFT JOIN artists ar ON (ar.id = t.artist) LEFT JOIN artists ar1 ON (ar1.id = al.artist) ";
        sql_query += "LEFT JOIN genres g ON (g.id = t.genre) LEFT JOIN years y ON (y.id = t.year) ";
        sql_query += "LEFT JOIN devices ON (devices.id = u.deviceid) ";
        sql_query += "WHERE t.genre=" + genreID + this.createFilterString(this.filterText);
        sql_query += " ORDER BY IF(al.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);
    Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addLabel = function(labelID)
{
    msg("Adding label with ID " + labelID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) ";
        sql_query += "FROM urls_labels ul LEFT JOIN urls u ON (ul.url = u.id) LEFT JOIN tracks t ON (t.url = u.id) ";
        sql_query += "LEFT JOIN albums al ON (al.id = t.album) LEFT JOIN artists ar ON (ar.id = t.artist) ";
        sql_query += "LEFT JOIN artists ar1 ON (ar1.id = al.artist) LEFT JOIN genres g ON (g.id = t.genre) ";
        sql_query += "LEFT JOIN years y ON (y.id = t.year) LEFT JOIN devices ON (devices.id = u.deviceid) ";
        sql_query += "WHERE ul.label =" + labelID + this.createFilterString(this.filterText);
        sql_query += " ORDER BY IF(al.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);
    Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addYear = function(yearID)
{
    msg("Adding year with ID " + yearID + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) ";
        sql_query += "FROM tracks t LEFT JOIN urls u ON (t.url = u.id) LEFT JOIN albums al ON (al.id = t.album) ";
        sql_query += "LEFT JOIN artists ar ON (ar.id = t.artist) LEFT JOIN artists ar1 ON (ar1.id = al.artist) ";
        sql_query += "LEFT JOIN genres g ON (g.id = t.genre) LEFT JOIN years y ON (y.id = t.year) ";
        sql_query += "LEFT JOIN devices ON (devices.id = u.deviceid) ";
        sql_query += "WHERE t.year=" + yearID + this.createFilterString(this.filterText);
        sql_query += " ORDER BY IF(al.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);
    Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addDecade = function(dec)
{
    msg("Adding Decade " + dec + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) ";
        sql_query += "FROM tracks t LEFT JOIN urls u ON (t.url = u.id) LEFT JOIN albums al ON (al.id = t.album) ";
        sql_query += "LEFT JOIN artists ar ON (ar.id = t.artist) LEFT JOIN artists ar1 ON (ar1.id = al.artist) ";
        sql_query += "LEFT JOIN genres g ON (g.id = t.genre) LEFT JOIN years y ON (y.id = t.year) ";
        sql_query += "LEFT JOIN devices ON (devices.id = u.deviceid) ";
        sql_query += "WHERE (y.name BETWEEN " + dec + " AND " + dec + "+9) " + this.createFilterString(this.filterText);
        sql_query += " ORDER BY IF(al.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);
    Amarok.Playlist.addMediaList(result);
}

PlaylistImporter.prototype.addRating = function(rating)
{
    msg("Adding Rating " + rating + " to playlist...");

    var sql_query  = "SELECT CONCAT('file://', IF(devices.lastmountpoint IS NULL, '', devices.lastmountpoint), '/', u.rpath) ";
        sql_query += "FROM tracks t LEFT JOIN statistics s ON (t.url = s.url) LEFT JOIN urls u ON (t.url = u.id) ";
        sql_query += "LEFT JOIN albums al ON (al.id = t.album) LEFT JOIN artists ar ON (ar.id = t.artist) ";
        sql_query += "LEFT JOIN artists ar1 ON (ar1.id = al.artist) LEFT JOIN genres g ON (g.id = t.genre) ";
        sql_query += "LEFT JOIN years y ON (y.id = t.year) LEFT JOIN devices ON (devices.id = u.deviceid) ";
        sql_query += "WHERE s.rating=" + rating + this.createFilterString(this.filterText);
        sql_query += " ORDER BY IF(al.artist IS NULL, 1, 2), t.album, t.discnumber, t.tracknumber";
    var result = sql_exec(sql_query);
    Amarok.Playlist.addMediaList(result);
}

