function Filesystem(displayCommon)
{
    this.url_star_full       = '<img src="file://' + Amarok.Info.scriptPath() + '/smallerstar.png" width="16"/>';
    this.url_star_0          = '<img src="file://' + Amarok.Info.scriptPath() + '/star_0.png" width="16"/>';
    this.url_star_1          = '<img src="file://' + Amarok.Info.scriptPath() + '/star_1.png" width="16"/>';
    this.url_star_2          = '<img src="file://' + Amarok.Info.scriptPath() + '/star_2.png" width="16"/>';
    this.url_star_3          = '<img src="file://' + Amarok.Info.scriptPath() + '/star_3.png" width="16"/>';
    
    this.path_root           = Amarok.Info.scriptPath().replace(/scripts\/rating_statistics/g, "");
    this.path_cover_cache    = this.path_root + "/albumcovers/cache/";
    this.path_cover_large    = this.path_root + "/albumcovers/large/";
      
    this.icon_default_album  = "file://" + Amarok.Info.iconPath("filename-album-amarok", 96);
    
    this.icon_score          = "file://" + Amarok.Info.iconPath("love-amarok", 16);
    this.icon_playcount      = "file://" + Amarok.Info.iconPath("amarok_playcount", 16);
    this.icon_length         = "file://" + Amarok.Info.iconPath("amarok_clock", 16);
    this.icon_collection     = "file://" + Amarok.Info.scriptPath() + "/collectiongreen.png";
    this.icon_rate           = "file://" + Amarok.Info.scriptPath() + "/notegreen.png";
    this.icon_track          = "file://" + Amarok.Info.scriptPath() + "/halfstargreen.png";
    
    this.dir_cover_cache     = new QDir(this.path_cover_cache);   
    this.dir_cover_large     = new QDir(this.path_cover_large);
};