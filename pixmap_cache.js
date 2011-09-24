function PixmapCache(display_common) {

    msg("Pixmap cache initializing...");

    this.icon_x = display_common.albumCover_x;
    this.icon_y = display_common.albumCover_y;
    this.album_cache = {};
    this.artist_cache = {};

    this.default_album = new QPixmap(Amarok.Info.iconPath(
        "filename-album-amarok", 96)).scaled(
        display_common.albumCover_x, display_common.albumCover_y, Qt.IgnoreAspectRatio, Qt.SmoothTransformation);

    msg("Pixmap cache done");
}

PixmapCache.prototype._fetch_pixmap = function(album_id) {
    msg("_fetch_pixmap");

    var path = sql_exec("select path from albums b join images i on b.image = i.id where b.id = " + album_id);
    var pixmap;

    if (path == null || path == "") {
        Amarok.debug("using default album pixmap for album_id " + album_id);
        pixmap = this.default_album;

    } else {
        pixmap = new QPixmap(path, 0, 0).scaled(
            this.icon_x, this.icon_y, Qt.KeepAspectRatio, Qt.SmoothTransformation);
    }

    this.album_cache[album_id] = pixmap;

    msg("_fetch_pixmap done");
    return pixmap;
};

PixmapCache.prototype.get_album_pixmap = function(album_id) {

    if (this.album_cache[album_id] != undefined) {
        Amarok.debug("key " + album_id + " found in cache");
        return this.album_cache[album_id];
    }

    Amarok.debug("key " + album_id + " NOT found in cache");
    return this._fetch_pixmap(album_id);
};
