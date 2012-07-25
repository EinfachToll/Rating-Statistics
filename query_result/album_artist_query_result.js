Importer.include("query_result/abstract_query_result.js");

function AlbumArtistQueryResult(resultset) {
    
    var columns_dict = new Array();
    columns_dict.push("id");
    columns_dict.push("name");
    columns_dict.push("rating");
    columns_dict.push("playcount");
    columns_dict.push("score");
    columns_dict.push("weight");
    columns_dict.push("length");
    columns_dict.push("track_count");
    columns_dict.push("info"); // album count
    columns_dict.push("year");
    
    AlbumArtistQueryResult.superclass.call(this, columns_dict, resultset);
    Amarok.debug("done");
}

extend(AlbumArtistQueryResult, AbstractQueryResult);
