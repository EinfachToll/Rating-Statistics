function StatisticsPainter(displayCommon)
{
    this.common = displayCommon;

    this.icon_collection = Amarok.Info.scriptPath() + "/collectiongreen.png";
    this.icon_averages = Amarok.Info.scriptPath() + "/notegreen.png";
    this.icon_tracks = Amarok.Info.scriptPath() + "/halfstargreen.png";
}

StatisticsPainter.prototype.drawStatistics = function(scrollArea, query)
{
    msg("painting...");

    var frame_counts = this.common.drawFrame(scrollArea, 0);
    this.common.addAlbumCover(frame_counts, this.icon_collection);
    this.common.addSimpleText(frame_counts, qsTr("Collection Statistics"), 0, true);
    this.common.addSimpleText(frame_counts, qsTr("tracks: ") + query[0], this.common.font_bold_height, false);
    this.common.addSimpleText(frame_counts, qsTr("albums: ") + query[1], this.common.font_bold_height + this.common.font_height, false);
    this.common.addSimpleText(frame_counts, qsTr("artists: ") + query[2], this.common.font_bold_height + 2 * this.common.font_height, false);
	var len_day  = Math.floor(query[3]/86400000);
	query[3] = query[3] % 86400000;
    var len_hour = Math.floor(query[3]/3600000);
    var len_min  = Math.floor((query[3]/1000 - len_hour*3600)/60);
    var len_sec  = Math.floor((query[3]/1000)%60);
    var len_txt  = (len_day > 0 ? len_day + "d " : "") + (len_hour > 0 ? len_hour + "h " : "") + len_min + "m " + len_sec + "s";
	this.common.addSimpleText(frame_counts, qsTr("Total length: ") + len_txt, this.common.font_bold_height + 3 * this.common.font_height, false);

    var frame_rating = this.common.drawFrame(scrollArea, 1);
    this.common.addAlbumCover(frame_rating, this.icon_tracks);
    this.common.addSimpleText(frame_rating, qsTr("Rating Statistics"), 0, true);
    this.common.addSimpleText(frame_rating, query[4] + qsTr(" rated tracks (") + query[5] + "%)", this.common.font_bold_height, false);
    this.common.addSimpleText(frame_rating, query[6] + qsTr(" rated albums (") + query[7] + "%)", this.common.font_bold_height + this.common.font_height, false);
    this.common.addSimpleText(frame_rating, query[8] + qsTr(" rated artists (") + query[9] + "%)", this.common.font_bold_height + 2 * this.common.font_height, false);

    var frame_average = this.common.drawFrame(scrollArea, 2);
    this.common.addAlbumCover(frame_average, this.icon_averages);
    this.common.addSimpleText(frame_average, qsTr("Track Averages"), 0, true);
    this.common.addSimpleText(frame_average, qsTr("average rating: ") + query[10], this.common.font_bold_height, false);
    this.common.addSimpleText(frame_average, qsTr("average score: ") + query[11], this.common.font_bold_height + this.common.font_height, false);
    var len_hour = Math.floor(query[12]/3600000);
    var len_min  = Math.floor((query[12]/1000 - len_hour*3600)/60);
    var len_sec  = Math.floor((query[12]/1000)%60);
    var len_txt  = (len_hour > 0)
                    ? len_hour + "h " + len_min + "m " + len_sec + "s"
                    : len_min + "m " + len_sec + "s";
    this.common.addSimpleText(frame_average, qsTr("average length: ") + len_txt, this.common.font_bold_height + 2 * this.common.font_height, false);
};

StatisticsPainter.prototype.drawStatistics2 = function(scrollArea, query)
{
	Amarok.debug("Paintings statistics...");
	
	var len_day  = Math.floor(query[3]/86400000);
	query[3] = query[3] % 86400000;
    var len_hour = Math.floor(query[3]/3600000);
    var len_min  = Math.floor((query[3]/1000 - len_hour*3600)/60);
    var len_sec  = Math.floor((query[3]/1000)%60);
    var len_txt  = (len_day > 0 ? len_day + "d " : "") + (len_hour > 0 ? len_hour + "h " : "") + len_min + "m " + len_sec + "s";
    
    var len_hour = Math.floor(query[12]/3600000);
    var len_min  = Math.floor((query[12]/1000 - len_hour*3600)/60);
    var len_sec  = Math.floor((query[12]/1000)%60);
    var len_txt2  = (len_hour > 0)
                    ? len_hour + "h " + len_min + "m " + len_sec + "s"
                    : len_min + "m " + len_sec + "s";
	
    var file = new QFile(Amarok.Info.scriptPath() + "/html/result_stats.html");
    file.open(QIODevice.ReadOnly);
    var ts = new QTextStream(file);
    var html = ts.readAll();
    
    html = html.replace('$icon-collection$', this.icon_collection)
    		   .replace('$icon-rate$', this.icon_averages)
			   .replace('$icon-track$', this.icon_tracks)
     		   .replace('$tracks$', query[0])
     		   .replace('$albums$', query[1])
     		   .replace('$artists$', query[2])
     		   .replace('$length$', len_txt)
     		   .replace('$rate-tracks$', query[4])
     		   .replace('$rate-tracks-per$', query[5])
     		   .replace('$rate-albums$', query[6])
     		   .replace('$rate-albums-per$', query[7])
     		   .replace('$rate-artists$', query[8])
     		   .replace('$rate-artists-per$', query[9])
     		   .replace('$avg-rating$', query[10])
     		   .replace('$avg-score$', query[11])
     		   .replace('$avg-length$', len_txt2)
			   ;
	
    scrollArea.html = html;
    scrollArea.show();
	
	Amarok.debug("Paintings statistics done");
};
