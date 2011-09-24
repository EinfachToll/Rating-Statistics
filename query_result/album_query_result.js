Importer.include("query_result/abstract_query_result.js");

function AlbumQueryResult(resultset) {
    msg("initializing albumqueryresult");
    var columns_dict = new Array();
    columns_dict.push("album_id");
    columns_dict.push("image");
    columns_dict.push("album_name");
    columns_dict.push("rating");
    columns_dict.push("playcount");
    columns_dict.push("score");
    columns_dict.push("weight");
    columns_dict.push("length");
    columns_dict.push("track_count");
    columns_dict.push("artist");
    columns_dict.push("year");
    
    AlbumQueryResult.superclass.call(this, columns_dict, resultset);
}

extend(AlbumQueryResult, AbstractQueryResult);
