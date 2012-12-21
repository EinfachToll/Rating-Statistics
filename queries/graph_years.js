Importer.include("utils.js");
Importer.include("query_result/abstract_query_result.js");

function GraphYears(filter, order)
{   
	var columns = [
		"year",
		"rating",
		"playcount",
		"score",
		"weight",
		"length",
	];
	
	var sql_replace = {
    	__FILTER__ : filter,
    	__ORDER__  : createOrderString(2, order),
	};
	
	var html_replace = {
	};
		
	var column_process = {
	};
	
	GraphYears.superclass.call(
		this, 
		"graph_years", 
		columns,
		sql_replace,
		html_replace,
		column_process
	);
};

extend(GraphYears, AbstractQueryResult);