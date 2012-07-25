Importer.include("query_result/abstract_query_result.js");

function CoverQueryResult(name, columns, sql_replace, html_replace, cover_column, cover_func)
{
	CoverQueryResult.superclass.call(this, name, columns, sql_replace, html_replace);
	this.cover_column = cover_column;
	this.cover_func   = cover_func;
};

extend(CoverQueryResult, AbstractQueryResult);

CoverQueryResult.prototype.get_html = function()
{
	var html = CoverQueryResult.superclass.prototype.get_html.call(this);
	var cover = this.cover_func.call(cover_cache, this.get(this.cover_column));
	
	return html.replace("$cover$", cover);
};