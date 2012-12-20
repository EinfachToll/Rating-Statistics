Importer.include("queries.js");
Importer.include("CoverCacheEntry.js");

function PixmapCache() {

    this.album_cache   = {};
    this.artist_cache  = {};
    this.default_cover   = new CoverCacheEntry(filesystem.icon_default_album, false, 96);
}

PixmapCache.prototype._fetch_cover = function(album_id) {

    var path = sql_exec("select path, md5(path) from albums b join images i on b.image = i.id where b.id = " + album_id);

    if (path == "") {
    	return this.default_cover; 								// cover not set
    } else if (path[0] == "AMAROK_UNSET_MAGIC") {
    	return this.default_cover; 								// manually unset cover
    } else if (path[0].substr(0, 18) == "amarok-sqltrackuid"){
        
        var covers = filesystem.dir_cover_large.entryList(new Array("*" + path[1] + "*"), QDir.Files, QDir.Size);
        if (covers.length == 0){
            // not found in albumcovers large folder, continue to cache
        } else {
            return new CoverCacheEntry("file://" + filesystem.path_cover_large + covers[0], true, CoverCacheEntry.extract_size(covers[0]));
        }
        
        // check in cache folder
    	var covers = filesystem.dir_cover_cache.entryList(new Array("*" + path[1] + "*"), QDir.Files, QDir.Size);
        if (covers.length == 0){
        	return this.default_cover; 							// not found in albumcovers cache folder!
        } else {
        	return new CoverCacheEntry("file://" + filesystem.path_cover_cache + covers[0], true, CoverCacheEntry.extract_size(covers[0]));
        }
    } else {
    	return new CoverCacheEntry("file://" + path[0], false, 0);
    }
};

PixmapCache.prototype.get_album_pixmap = function(album_id) {

	var cover = this.album_cache[album_id]; 
    if (cover != undefined) {
        Amarok.debug("album " + album_id + " found in cache");
    } else {
        Amarok.debug("key " + album_id + " NOT found in cache");
        cover = this._fetch_cover(album_id).path;
        if (cover != filesystem.icon_default_album){
            this.album_cache[album_id] = cover;
        }
    }
    return cover;
};

PixmapCache.prototype.get_artist_pixmap = function(artist_id)
{	
	var cover = this.artist_cache[artist_id]; 
    if (cover != undefined) {
        Amarok.debug("artist " + artist_id + " found in cache");
        return cover;
    }
    
    Amarok.debug("artist " + artist_id + " NOT found in cache");
    
    var album_ids = findArtistAlbumCover(artist_id);
    
    for(var i in album_ids){
    	var c = this._fetch_cover(album_ids[i]);
    	if (c.is_small() == false){
    		this.artist_cache[artist_id] = c.path;
    		return c.path;
    	} else {
    		Amarok.debug("Cover [" + c.path + "] is too small to use (" + c.size + "), trying a different one.");
    	}
    }
    
    if (album_ids.length > 0){
    	cover = this._fetch_cover(album_ids[0]).path;
    	Amarok.debug("I couldn't get a larger match; using: " + cover);
    } else {
    	cover = filesystem.icon_default_album;
    	Amarok.debug("I couldn't get any match; using default");
    }
    
	this.artist_cache[artist_id] = cover;
	return cover;
};
