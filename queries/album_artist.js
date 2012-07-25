Importer.include("utils.js");
Importer.include("query_result/abstract_query_result.js");

function AlbumArtist(filter, order)
{   
	var self = this;
	
	var columns = [  
		"artist_id",
		"artist_name",
		"rating",
		"playcount",
		"score",
		"weight",
		"length",
		"track_count",
		"album_count",
	];
	
	var sql_replace = new Object;
	sql_replace.__WEIGHT__ = createWeightString(3);
	sql_replace.__FILTER__ = filter;
	sql_replace.__ORDER__  = createOrderString(3, order);
	sql_replace.__LIMIT__  = config.resultsLimit;
	
	var html_replace = new Object;
	html_replace.icon_score     = Amarok.Info.iconPath("love-amarok", 16);
	html_replace.icon_playcount = Amarok.Info.iconPath("amarok_playcount", 16);
	html_replace.icon_length    = Amarok.Info.iconPath("amarok_clock", 16);
	html_replace.color_dark     = qcolor_to_html(QApplication.palette().color(QPalette.Dark));
		
	var column_process = {
		artist_id : function(artist_id){return cover_cache.get_artist_pixmap(artist_id);},
		length    : format_length,
		rating    : calc_rating,
		weight    : function(weight){return self.calc_weight(weight);}
	};
	
	AlbumArtist.superclass.call(
		this, 
		"album_artist", 
		columns,
		sql_replace,
		html_replace,
		column_process
	);
};

extend(AlbumArtist, AbstractQueryResult);