Importer.include("utils.js");

function AbstractQueryResult(name, columns, sql_replace, html_replace, column_process)
{

    msg("constructing abstract");
    this.name           = name;
    this.html           = read_local_file("/queries/" + name + ".html");
    this.sql            = read_local_file("/queries/" + name + ".sql");
    this.columns        = columns;
    this.html_replace   = html_replace;
    this.column_process = column_process;
    
	for (x in sql_replace){
		this.sql = this.sql.replace(new RegExp(x, "g"), sql_replace[x]);
	}
	   
    this.resultset = sql_exec(this.sql);
    
    this.row_count = this.resultset.length / this.columns.length;
    this.index     = 0;
    this.rows      = new Array();

    for (var i = 0; i < this.resultset.length; i += this.columns.length) {
        this.rows.push(this.resultset.slice(i, i + this.columns.length));
    }
    
    this.max_weight = config.reverseResults == Qt.Unchecked ? this.get_first("weight") : this.get_last("weight");
    
    msg("done");
};

AbstractQueryResult.prototype.read_next = function()
{

    if (this.index >= this.row_count) {
        return false;
    }
    
    this.index++;

    return true;
};

AbstractQueryResult.prototype.current_row_id = function()
{
    return this.index;
};

AbstractQueryResult.prototype.get_first = function(column_name)
{
    return this.rows[0][this.columns.indexOf(column_name)];
};

AbstractQueryResult.prototype.get_last = function(column_name)
{
    return this.rows[this.row_count - 1][this.columns.indexOf(column_name)];
};

AbstractQueryResult.prototype.get = function(column_name)
{
    return this.rows[this.index - 1][this.columns.indexOf(column_name)];
};

AbstractQueryResult.prototype.size = function(column_name)
{
    return this.row_count;
};

AbstractQueryResult.prototype.get_html = function()
{
	var html = this.html;
	html = html.replace("$rowid$", this.current_row_id());
	
	for (x in this.columns){
		var value = this.get(this.columns[x]);
		if (this.column_process[this.columns[x]] != undefined){
			Amarok.debug("Processing column: " + this.columns[x]);
			value = this.column_process[this.columns[x]](value);
		}
		
		html = html.replace("$" + this.columns[x] + "$", value);
	}
	
	for (x in this.html_replace){
		html = html.replace("$" + x + "$", this.html_replace[x]);
	}
	
	return html;
};

AbstractQueryResult.prototype.calc_weight = function(weight)
{
    return Math.round(weight / this.max_weight * 100);
};
