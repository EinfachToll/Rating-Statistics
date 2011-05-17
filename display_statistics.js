Importer.include("display_common.js");
Importer.include("display_frame.js");

function StatisticsPainter(displayCommon)
{
    this.common = displayCommon;

    this.icon_collection = Amarok.Info.scriptPath() + "/book_cdgr.png"; //statistics_collection.png";
    this.icon_averages = Amarok.Info.scriptPath() + "/kbemusedsrv.png"; //statistics_average.png";
    this.icon_tracks = Amarok.Info.scriptPath() + "/star_halfgr.png"; //statistics_tracks.png";
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

    var frame_rating = this.common.drawFrame(scrollArea, 1);
    this.common.addAlbumCover(frame_rating, this.icon_tracks);
    this.common.addSimpleText(frame_rating, qsTr("Rating Statistics"), 0, true);
    this.common.addSimpleText(frame_rating, query[3] + qsTr(" rated tracks (") + query[4] + "%)", this.common.font_bold_height, false);
    this.common.addSimpleText(frame_rating, query[5] + qsTr(" rated albums (") + query[6] + "%)", this.common.font_bold_height + this.common.font_height, false);
    this.common.addSimpleText(frame_rating, query[7] + qsTr(" rated artists (") + query[8] + "%)", this.common.font_bold_height + 2 * this.common.font_height, false);

    var frame_average = this.common.drawFrame(scrollArea, 2);
    this.common.addAlbumCover(frame_average, this.icon_averages);
    this.common.addSimpleText(frame_average, qsTr("Track Averages"), 0, true);
    this.common.addSimpleText(frame_average, qsTr("average rating: ") + query[9], this.common.font_bold_height, false);
    this.common.addSimpleText(frame_average, qsTr("average score: ") + query[10], this.common.font_bold_height + this.common.font_height, false);
    var len_hour = Math.floor(query[11]/3600000);
    var len_min  = Math.floor((query[11]/1000 - len_hour*3600)/60);
    var len_sec  = Math.floor((query[11]/1000)%60);
    var len_txt  = (len_hour > 0)
                    ? len_hour + "h " + len_min + "m " + len_sec + "s"
                    : len_min + "m " + len_sec + "s";
    this.common.addSimpleText(frame_average, qsTr("average length: ") + len_txt, this.common.font_bold_height + 2 * this.common.font_height, false);
}
