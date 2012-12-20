Importer.include("utils.js");
Importer.include("query_result/abstract_query_result.js");

function Track(filter, order)
{   
	var self = this;
	
	var columns = [  
		"track_id",
		"album_id",
		"track_name",
		"rating",
		"playcount",
		"score",
		"weight",
		"length",
		"album_name",
		"artist_name",
		"year"
	];
	
	var sql_replace = {
	    __WEIGHT__ : createWeightString(1),
	    __FILTER__ : filter,
	    __ORDER__  : createOrderString(1, order),
	    __LIMIT__  : config.resultsLimit,
	};
	
	var html_replace = {
    	icon_score     : filesystem.icon_score,
    	icon_playcount : filesystem.icon_playcount,
    	icon_length    : filesystem.icon_length,
    	color_light    : qcolor_to_html(QApplication.palette().color(QPalette.Light)),
    	color_dark     : qcolor_to_html(QApplication.palette().color(QPalette.Dark)),
	};
		
	var column_process = {
		album_id : function(album_id){return cover_cache.get_album_pixmap(album_id);},
		length   : format_length,
		rating   : calc_rating,
		weight   : function(weight){return self.calc_weight(weight);}
	};
	
	Track.superclass.call(
		this, 
		"track", 
		columns,
		sql_replace,
		html_replace,
		column_process
	);
};

extend(Track, AbstractQueryResult);