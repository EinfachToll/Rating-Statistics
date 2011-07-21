Importer.loadQtBinding( "qt.core" );
Importer.loadQtBinding( "qt.sql" );
Importer.loadQtBinding( "qt.gui");

Importer.include("configuration.js");
Importer.include("window.js");
Importer.include("playlist.js");

function msg( str ){
    Amarok.debug(str);
}

function sql_exec(query){
	msg("[SQL] " + query);
	var res = Amarok.Collection.query(query);
	msg(res);
	return res;
}

function qsTr(msg){
    return QCoreApplication.translate("Rating Statistics", msg);
}

function quit(){
    stWindow.close();
    config.close();
    msg("script finished");
    Amarok.end(); //FIXME: http://bugs.kde.org/show_bug.cgi?id=175049 on older versions crashes amarok:
}

function showWindowCallback() {
	msg("Creating new translator");
	this.trans = new QTranslator;
	var localeFile = Amarok.Info.scriptPath() + "/translations/qm/amarok_rating_statistics_" + QLocale.system().name() + ".qm";
	msg("locale File: " + localeFile);
	msg(this.trans.load(localeFile));
	QCoreApplication.installTranslator(this.trans);
	
    msg("Showing main window...");
    var stWindow   = new StatisticsWindow();
    stWindow.show();
    
    msg("Removing translator");
    QCoreApplication.removeTranslator(this.trans);
    msg("done");
    
    msg("Removing translator");
    QCoreApplication.removeTranslator(this.trans);
    msg("done");
}

if (Amarok.Window.addToolsMenu("rating_statistics", "Rating Statistics", "emblem-favorite-amarok")){
    var rating_statistics_button = Amarok.Window.ToolsMenu.rating_statistics;
    rating_statistics_button['triggered()'].connect(showWindowCallback);
} else {
    msg("Rating Statistics menu already exists!");
}

var config = new Configuration;
var playlistImporter = new PlaylistImporter;
config.loadConfiguration();

//showWindowCallback();
