Importer.include("utils.js");

function QueryManager() {

    this.last_filter = null;
    this.last_stats = null;

    this.weights_sql = read_local_file("/queries/_weights.sql");
    this.workspace_sql = read_local_file("/queries/_workspace.sql");
};

QueryManager.prototype.weight_attr = function() {

    return "rating";
    return "round(score / 10)";
    return "if(rating != 0, rating, round(score / 10))";
};

QueryManager.prototype.execute_query = function(query) {

    msg("[SQL] " + query);
    var res = Amarok.Collection.query(query);
    msg(res);
    return res;
};

QueryManager.prototype.create_workspace = function(filter_text) {

    var sql = this.workspace_sql.replace(
        /__FILTER__/g, playlistImporter.createFilterString(filter_text)).replace(
        /__WEIGHT_ATTR__/g, this.weight_attr());

    this.execute_query(sql);
};

QueryManager.prototype.create_weights = function() {

    this.execute_query(this.weights_sql.replace(
        /__WEIGHT_ATTR__/g, this.weight_attr()));

    this.execute_query("select * from RS_WEIGHTS");
};

QueryManager.prototype.create_tracks_table = function(filter_text) {
    Amarok.debug("Creating temporary tracks table");

    Amarok.debug("filter_text: " + filter_text);
    Amarok.debug("last_filter: " + this.last_filter);
    
    if (filter_text != this.last_filter) {
        this.execute_query('DROP TABLE RS_WORKSPACE');
        this.execute_query('DROP TABLE RS_WEIGHTS');
        this.create_workspace(filter_text);
        this.create_weights();
        this.last_filter = filter_text;
    }

    Amarok.debug("Finished creating temporary tracks table");
};
