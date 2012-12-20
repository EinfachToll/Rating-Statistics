Importer.include("utils.js");
Importer.include("query_result/abstract_query_result.js");

function Album(filter, order) {
    var self = this;

    var columns = [
        "album_id",
        "album_name", 
        "rating", 
        "playcount", 
        "score", 
        "weight", 
        "length", 
        "rated_track_count", 
        "total_track_count", 
        "artist_name",
    ];

    var sql_replace = {
        __WEIGHT__ : createWeightString(4),
        __FILTER__ : filter,
        __ORDER__  : createOrderString(4, order),
        __LIMIT__  : config.resultsLimit,
    };

    var html_replace = {
        icon_score     : filesystem.icon_score,
        icon_playcount : filesystem.icon_playcount,
        icon_length    : filesystem.icon_length,
        color_dark     : qcolor_to_html(QApplication.palette().color(QPalette.Dark)),
    };

    var column_process = {
        album_id          : function(album_id) {return cover_cache.get_album_pixmap(album_id);},
        length            : format_length,
        rating            : calc_rating,
        weight            : function(weight) {return self.calc_weight(weight);},
        total_track_count : function(total_count) {
            if (total_count == null || total_count == "")
                return "";
            return "(out of " + total_count + ")";
        },
    };

    Album.superclass.call(
        this, 
        "album", 
        columns, 
        sql_replace, 
        html_replace, 
        column_process
    );
};

extend(Album, AbstractQueryResult);
