
String.prototype.lpad = function(padString, length)
{
	var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
};

String.prototype.rpad = function(padString, length)
{
	var str = this;
    while (str.length < length)
        str = str + padString;
    return str;
};

function qcolor_to_html(qcolor)
{
	return '#' + qcolor.red().toString(16).lpad('0', 2)
	           + qcolor.green().toString(16).lpad('0', 2)
			   + qcolor.blue().toString(16).lpad('0', 2);    
}

function read_local_file(filename)
{
	Amarok.debug("Loading local file: " + Amarok.Info.scriptPath() + filename);
	
    var file = new QFile(Amarok.Info.scriptPath() + "/" + filename);
    file.open(QIODevice.ReadOnly);
    var ts = new QTextStream(file);
    return ts.readAll();
}

function format_length(length)
{
	var len_day  = Math.floor(length/86400000);
	length = length % 86400000;

	var len_hour = Math.floor(length/3600000);
    var len_min  = Math.floor((length/1000 - len_hour*3600)/60);
    var len_sec  = Math.floor((length/1000)%60);
    var len_txt  = (len_day > 0 ? len_day + "d " : "") +
    			  ((len_hour > 0)
                  ? (len_hour<10 && len_day > 0 ? "0" + len_hour : len_hour) + ":" + (len_min<10?"0"+len_min:len_min) + ":" + (len_sec<10?"0"+len_sec:len_sec) //lame, but i'm in a hurry, cba to look it up
                  : len_min + ":" + (len_sec<10?"0"+len_sec:len_sec));
    return len_txt;
}

function calc_rating(rating)
{
	var num_full_star = Math.floor(rating / 2);
	var html = [];

	for (var i = 0; i < num_full_star; i++) {
		html.push(filesystem.url_star_full);
    }
	
    var mid = Math.floor((rating - num_full_star * 2) * 4 / 2);
    if (mid != 0){
    	if (mid == 1){
    		html.push(filesystem.url_star_1);
    	} else if (mid == 2){
    		html.push(filesystem.url_star_2);
    	} else if (mid == 3){
    		html.push(filesystem.url_star_3);
    	}
    }
    
    for (var i = 0; i < 5 - num_full_star - (mid == 0 ? 0 : 1); i++){
    	html.push(filesystem.url_star_0);
    }

    return html.join('');
};

function calc_weight(query_result, weight)
{
	msg(query_result.name);
	var max_weight = config.reverseResults == Qt.Unchecked ? query_result.get_first("weight") : query_result.get_last("weight");
	return Math.round(weight / max_weight * 100);
};


