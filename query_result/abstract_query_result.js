function AbstractQueryResult(column_dict, resultset) {

    msg("constructing abstract");
    this.column_dict = column_dict;
    this.row_count = resultset.length / column_dict.length;
    this.index = 0;
    this.rows = new Array();

    for ( var i = 0; i < resultset.length; i += column_dict.length) {
        this.rows.push(resultset.slice(i, i + column_dict.length));
    }
    msg("done");

}

AbstractQueryResult.prototype.read_next = function() {

    this.index++;

    if (this.index > this.row_count) {
        return false;
    }

    return true;
};

AbstractQueryResult.prototype.current_row_id = function() {
    return this.index;
};

AbstractQueryResult.prototype.get_first = function(column_name) {
    return this.rows[0][this.column_dict.indexOf(column_name)];
};

AbstractQueryResult.prototype.get_last = function(column_name) {
    return this.rows[this.row_count][this.column_dict.indexOf(column_name)];
};

AbstractQueryResult.prototype.get = function(column_name) {

    return this.rows[this.index - 1][this.column_dict.indexOf(column_name)];
};

AbstractQueryResult.prototype.size = function(column_name) {

    return this.row_count;
};
