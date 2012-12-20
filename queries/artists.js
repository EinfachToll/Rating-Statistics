Importer.include("utils.js");
Importer.include("query_result/abstract_query_result.js");

function Artists(filter, order)
{   
	var self = this;
	
	var columns = [  
		"artist_id",
		"artist_name",
		"rated_album_count",
		"total_album_count",
		"rating",
		"score",
		"playcount",
		"length",
		"weight",
		"rated_track_count",
		"total_track_count",
	];
	
	var sql_replace = {
    	__WEIGHT__ : createWeightString(2),
    	__FILTER__ : filter,
    	__ORDER__  : createOrderString(2, order),
    	__LIMIT__  : config.resultsLimit,
	};
	
	var html_replace = {
    	icon_score     : filesystem.icon_score,
    	icon_playcount : filesystem.icon_playcount,
    	icon_length    : filesystem.icon_length,
    	color_dark     : qcolor_to_html(QApplication.palette().color(QPalette.Dark)),
	};
		
	var column_process = {
		artist_id : function(artist_id){return cover_cache.get_artist_pixmap(artist_id);},
		length    : format_length,
		rating    : calc_rating,
		weight    : function(weight){return self.calc_weight(weight);},
		total_album_count : function(total_count) {
            if (total_count == null || total_count == "")
                return "";
            return "(out of " + total_count + ")";
        },
        total_track_count : function(total_count) {
            if (total_count == null || total_count == "")
                return "";
            return "(out of " + total_count + ")";
        },
	};
	
	Artists.superclass.call(
		this, 
		"artists", 
		columns,
		sql_replace,
		html_replace,
		column_process
	);
};

extend(Artists, AbstractQueryResult);