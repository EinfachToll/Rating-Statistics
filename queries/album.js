Importer.include("utils.js");
Importer.include("query_result/abstract_query_result.js");

function Album(filter, order) {
    var self = this;

    var columns = [
        "album_id", "album_name", "rating", "playcount", "score", "weight", "length", "rated_track_count", "total_track_count", "artist_name",
    ];

    var sql_replace = new Object;
    sql_replace.__WEIGHT__ = createWeightString(4);
    sql_replace.__FILTER__ = filter;
    sql_replace.__ORDER__ = createOrderString(
        4, order);
    sql_replace.__LIMIT__ = config.resultsLimit;

    var html_replace = new Object;
    html_replace.icon_score = Amarok.Info.iconPath(
        "love-amarok", 16);
    html_replace.icon_playcount = Amarok.Info.iconPath(
        "amarok_playcount", 16);
    html_replace.icon_length = Amarok.Info.iconPath(
        "amarok_clock", 16);
    html_replace.color_dark = qcolor_to_html(QApplication.palette().color(
        QPalette.Dark));

    var column_process = {
        album_id : function(album_id) {
            return cover_cache.get_album_pixmap(album_id);
        },
        length : format_length,
        rating : calc_rating,
        weight : function(weight) {
            return self.calc_weight(weight);
        },
        total_track_count : function(total_count) {
            if (total_count == null || total_count == "")
                return "";
            return "(out of " + total_count + ")";
        },
    };

    Album.superclass.call(
        this, "album", columns, sql_replace, html_replace, column_process);
};

extend(
    Album, AbstractQueryResult);
