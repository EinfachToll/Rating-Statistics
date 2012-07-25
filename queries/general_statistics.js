Importer.include("query_result/abstract_query_result.js");

function GeneralStatistics(filter)
{   
	var columns = [  
		"total_tracks",
		"total_albums",
		"total_artists",
		"sum_length",
		"rated_tracks",
		"perc_rated_tracks",
		"rated_albums",
		"perc_rated_albums",
		"rated_artists",
		"perc_rated_artists",
		"avg_rating",
		"avg_score",
		"avg_length"
	];
	
	var sql_replace = new Object;
	sql_replace.FILTER = filter;
	sql_replace.MIN_TRACKS_PER_ALBUM = config.minTracksPerAlbum;
	
	var html_replace = new Object;
	html_replace.icon_collection = Amarok.Info.scriptPath() + "/collectiongreen.png";
	html_replace.icon_rate       = Amarok.Info.scriptPath() + "/notegreen.png";
	html_replace.icon_track      = Amarok.Info.scriptPath() + "/halfstargreen.png";
	
	var column_process = {
		sum_length : format_length,
		avg_length : format_length
	};
	
	GeneralStatistics.superclass.call(
		this, 
		"general_statistics", 
		columns,
		sql_replace,
		html_replace,
		column_process
	);
};

extend(GeneralStatistics, AbstractQueryResult);