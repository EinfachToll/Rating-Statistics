Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

Importer.include("configuration.js");
Importer.include("queries.js");
Importer.include("display_results.js");
Importer.include("display_statistics.js");
Importer.include("display_graph.js");

var currentQuery = new Array();

var icon_statistics		= new QIcon(Amarok.Info.iconPath( "amarok_mostplayed", 16));
var icon_track			= new QIcon(Amarok.Info.iconPath( "filename-title-amarok", 16));
var icon_artist			= new QIcon(Amarok.Info.iconPath( "filename-artist-amarok", 16));
var icon_albumartist	= new QIcon(Amarok.Info.iconPath( "amarok_artist", 16));
var icon_album			= new QIcon(Amarok.Info.iconPath( "filename-album-amarok", 16));
var icon_genre			= new QIcon(Amarok.Info.iconPath( "filename-genre-amarok", 16));
var icon_year			= new QIcon(Amarok.Info.iconPath( "filename-year-amarok", 16));
var icon_rating			= new QIcon(Amarok.Info.scriptPath() + "/smallerstar.png");
var icon_playcount		= new QIcon(Amarok.Info.iconPath( "amarok_playcount", 16));
var icon_score			= new QIcon(Amarok.Info.iconPath( "love_amarok", 16));
var icon_weight			= new QIcon(Amarok.Info.iconPath( "view-media-visualization-amarok", 16));
var icon_length			= new QIcon(Amarok.Info.iconPath( "amarok_clock", 16));
var icon_numtracks		= new QIcon(Amarok.Info.iconPath( "amarok_track", 16));
var icon_numalbums		= new QIcon(Amarok.Info.iconPath( "filename-track-amarok", 16));




function extend(subclass, superclass) {
    function Dummy(){}
    Dummy.prototype = superclass.prototype;
    subclass.prototype = new Dummy();
    subclass.prototype.constructor = subclass;
    subclass.superclass = superclass;
    subclass.superproto = superclass.prototype;
}

function CustomQGraphicsScene() {
    CustomQGraphicsScene.superclass.call(this);
    msg("CustomQGraphicsScene constructed");
}

extend(CustomQGraphicsScene, QGraphicsScene);

CustomQGraphicsScene.prototype.mouseDoubleClickEvent = function(event)
{
    var item_index = Math.floor((event.scenePos().y() - 5)/(96+5));
    var id = currentQuery[item_index * 10];

    if (id == null) return;

    if (this.comboGroupBy.currentIndex == 1) playlistImporter.addTrack(id);
    if (this.comboGroupBy.currentIndex == 2) playlistImporter.addArtist(id);
    if (this.comboGroupBy.currentIndex == 3) playlistImporter.addAlbumArtist(id);
    if (this.comboGroupBy.currentIndex == 4) playlistImporter.addAlbum(id);
	if (this.comboGroupBy.currentIndex == 5) playlistImporter.addGenre(id);
}


function FavouritesTab(displayCommon)
{
    this.statisticsPainter = new StatisticsPainter(displayCommon);
    this.Results_Painter   = new DisplayResults(displayCommon);
    this.graphPainter      = new GraphPainter(displayCommon);

    this.mutex             = new QMutex(1);
    msg("FavouritesTab initialized.");
}

FavouritesTab.prototype.draw = function(parentWidget)
{
    msg("Drawing favourites tab...");
    this.mainLayout         = new QVBoxLayout(parentWidget);

    this.groupBoxSearch     = new QGroupBox(); //qsTr("Query Parameters"));
    this.groupBoxResults    = new QGroupBox();
    this.groupLayoutSearch  = new QGridLayout();
    this.groupLayoutResults = new QVBoxLayout();
    this.groupLayoutSearch.spacing = 0;

    this.searchLabelAlbum   = new QLabel(qsTr("Album: "),  parentWidget, 0);
    this.searchLabelArtist  = new QLabel(qsTr("Artist: "), parentWidget, 0);
    this.searchLabelGenre   = new QLabel(qsTr("Genre: "),  parentWidget, 0);
    this.searchLabelYear    = new QLabel(qsTr("Year: "),   parentWidget, 0);
    this.searchLabelType    = new QLabel(qsTr("Query Type: "), parentWidget, 0);
    this.searchBoxAlbum     = new QLineEdit(parentWidget);
    this.searchBoxArtist    = new QLineEdit(parentWidget);
    this.searchBoxGenre     = new QLineEdit(parentWidget);
    this.searchBoxYear      = new QLineEdit(parentWidget);
    this.comboGroupBy	    = new QComboBox(parentWidget);
	this.comboOrderBy		= new QComboBox(parentWidget);
    this.searchButtonClear  = new QPushButton(qsTr("Clear"), parentWidget);
    this.searchButtonSubmit = new QPushButton(qsTr("Submit"), parentWidget);

    this.scrollAreaData     = new CustomQGraphicsScene(0, 0, 350, 600, parentWidget);
    this.scrollAreaResults  = new QGraphicsView(this.scrollAreaData, parentWidget);
    this.scrollAreaData.backgroundBrush = new QBrush(QApplication.palette().color(QPalette.Button), Qt.SolidPattern);

	this.comboGroupBy.addItem(icon_statistics,	qsTr("Statistics"));
	this.comboGroupBy.addItem(icon_track,		qsTr("Tracks"));
	this.comboGroupBy.addItem(icon_artist,		qsTr("Artists"));
	this.comboGroupBy.addItem(icon_albumartist,	qsTr("Album Artists"));
	this.comboGroupBy.addItem(icon_album,		qsTr("Albums"));
	this.comboGroupBy.addItem(icon_genre,		qsTr("Genres"));
	this.comboGroupBy.addItem(icon_year,		qsTr("Years"));

	this.comboOrderBy.addItem(icon_rating,		qsTr("Rating"));
	this.comboOrderBy.addItem(icon_playcount,	qsTr("Play count"));
	this.comboOrderBy.addItem(icon_score,		qsTr("Score"));
	this.comboOrderBy.addItem(icon_weight,		qsTr("Weight"));
	this.comboOrderBy.addItem(icon_length,		qsTr("Length"));
	this.comboOrderBy.addItem(icon_numtracks,	qsTr("Number of Tracks"));
	this.comboOrderBy.addItem(icon_numalbums,	qsTr("Number of Albums"));
	this.comboOrderBy.addItem(icon_year,		qsTr("Year"));

    this.groupLayoutSearch.addWidget(this.searchLabelArtist,  0, 0, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.searchBoxArtist,    0, 1, 1, 2);
    this.groupLayoutSearch.addWidget(this.searchLabelGenre,   0, 3, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.searchBoxGenre,     0, 4, 1, 2);
    this.groupLayoutSearch.addWidget(this.searchLabelAlbum,   1, 0, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.searchBoxAlbum,     1, 1, 1, 2);
    this.groupLayoutSearch.addWidget(this.searchLabelYear,    1, 3, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.searchBoxYear,      1, 4, 1, 2);
    this.groupLayoutSearch.addWidget(this.searchLabelType,    2, 0, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.comboGroupBy,       2, 1, 1, 2);
	this.groupLayoutSearch.addWidget(this.comboOrderBy,		  2, 3, 1, 2);
    this.groupLayoutSearch.addWidget(this.searchButtonClear,  3, 4, 1, 1);
    this.groupLayoutSearch.addWidget(this.searchButtonSubmit, 3, 5, 1, 1);

    this.groupLayoutResults.addWidget(this.scrollAreaResults, 0, 0);

    this.groupBoxSearch.setLayout(this.groupLayoutSearch);
    this.groupBoxResults.setLayout(this.groupLayoutResults);
    this.mainLayout.addWidget(this.groupBoxSearch,  0, 0);
    this.mainLayout.addWidget(this.groupBoxResults, 0, 0);

    this.comboGroupBy['currentIndexChanged()'].connect(this, this.onQueryTypeChanged);
    this.comboOrderBy['currentIndexChanged()'].connect(this, this.onQueryTypeChanged);
    this.searchButtonClear.clicked.connect(    this, this.onQueryCleared);
    this.searchBoxAlbum.returnPressed.connect( this, this.onQuerySubmitted);
    this.searchBoxArtist.returnPressed.connect(this, this.onQuerySubmitted);
    this.searchBoxGenre.returnPressed.connect( this, this.onQuerySubmitted);
    this.searchBoxYear.returnPressed.connect(  this, this.onQuerySubmitted);
    this.searchButtonSubmit.clicked.connect(   this, this.onQuerySubmitted);

    this.searchBoxAlbum.toolTip    = qsTr("Filter results by album name.");
    this.searchBoxArtist.toolTip   = qsTr("Filter results by artist name.");
    this.searchBoxGenre.toolTip    = qsTr("Filter results by genre name.");
    this.searchBoxYear.toolTip     = qsTr("Filter results by year.");
    //this.scrollAreaResults.toolTip = qsTr("You may double-click on tracks, albums and artists to queue them to your Amarok playlist.");

    msg("Finished drawing favourites tab...");

    this.onQueryTypeChanged(0);
}

FavouritesTab.prototype.closeEvent = function(CloseEvent)
{
    msg("Close event received on FavouritesTab");
}

FavouritesTab.prototype.resultsShowNone = function()
{
    this.scrollAreaData.clear();
    this.scrollAreaData.sceneRect = new QRectF(0,0,1,1);
}

FavouritesTab.prototype.resultsShowWorking = function()
{
    this.scrollAreaData.clear();
    this.scrollAreaData.sceneRect = new QRectF(0,0,1,1);
}

FavouritesTab.prototype.resultsClear = function()
{
    this.scrollAreaData.clear();
    this.scrollAreaData.sceneRect = new QRectF(0,0,1,1);
}

FavouritesTab.prototype.onQueryCleared = function(index)
{
    msg("Query Cleared");
    this.searchBoxAlbum.text  = "";
    this.searchBoxArtist.text = "";
    this.searchBoxGenre.text  = "";
    this.searchBoxYear.text   = "";
    //this.resultsClear();
	this.onQueryTypeChanged(this.comboGroupBy.currentIndex);
}

FavouritesTab.prototype.onQuerySubmitted = function(index)
{
    msg("Query Submitted");
    this.onQueryTypeChanged(this.comboGroupBy.currentIndex);
}

FavouritesTab.prototype.onQueryTypeChanged = function()
{
	indexGr  = this.comboGroupBy.currentIndex;
	indexOrd = this.comboOrderBy.currentIndex;
    msg("Query Type changed to index " + indexGr + ", " + indexOrd);
    if (this.mutex.tryLock(0) == false) return;

    this.resultsShowWorking();

    if (indexGr == 0){
        this.searchBoxAlbum.enabled  = false;
        this.searchBoxArtist.enabled = false;
        this.searchBoxGenre.enabled  = false;
        this.searchBoxYear.enabled   = false;
		this.comboOrderBy.enabled	 = false;
        this.displayStatistics(fillGlobalStatisticsPage());
    } else {
        this.searchBoxAlbum.enabled  = true;
        this.searchBoxArtist.enabled = true;
        this.searchBoxGenre.enabled  = true;
        this.searchBoxYear.enabled   = true;
		this.comboOrderBy.enabled	 = true;
	}

    if (indexGr == 1){
        this.displayResults(fillTracksPage(this.searchBoxAlbum.text, this.searchBoxArtist.text, this.searchBoxGenre.text, this.searchBoxYear.text, indexOrd));
    }

    if (indexGr == 2){
        this.displayResults(fillArtistsPage(this.searchBoxAlbum.text, this.searchBoxArtist.text, this.searchBoxGenre.text, this.searchBoxYear.text, indexOrd));
    }

	if (indexGr == 3){
		this.displayResults(fillAlbumArtistsPage(this.searchBoxAlbum.text, this.searchBoxArtist.text, this.searchBoxGenre.text, this.searchBoxYear.text, indexOrd));
	}

    if (indexGr == 4){
        this.displayResults(fillAlbumsPage(this.searchBoxAlbum.text, this.searchBoxArtist.text, this.searchBoxGenre.text, this.searchBoxYear.text, indexOrd));
    }

    if (indexGr == 5){
        this.displayResults(fillGenresPage(this.searchBoxAlbum.text, this.searchBoxArtist.text, this.searchBoxGenre.text, this.searchBoxYear.text, indexOrd));
    }

    if (indexGr == 6){
        this.displayGraph(fillRatingOverTimePage(this.searchBoxArtist.text, this.searchBoxGenre.text), 10);
    }

    if (indexGr == 7){
        this.displayGraph(fillScoreOverTimePage(this.searchBoxArtist.text, this.searchBoxGenre.text), 100);
    }

    this.mutex.unlock();
}

FavouritesTab.prototype.displayStatistics = function(query_string)
{
    msg("Painting statistics...");

    currentQuery = sql_exec(query_string);

    if (currentQuery.length == 0){
        this.resultsShowNone();
        msg("Got no statistics!!");
        return;
    }

    this.statisticsPainter.drawStatistics(this.scrollAreaData, currentQuery);

    msg("Finished painting statistics...");
}

FavouritesTab.prototype.displayResults = function(query_string)
{
    msg("Painting results...");

    currentQuery = sql_exec(query_string);

    if (currentQuery.length == 0){
        this.resultsShowNone();
        msg("Finished painting results (none)...");
        return;
    }

    this.Results_Painter.drawResults(this.scrollAreaData, indexGr, currentQuery);
}

FavouritesTab.prototype.displayGraph = function(query_string, maxValue)
{
    msg("Painting graph...");

    currentQuery = sql_exec(query_string);

    if (currentQuery.length == 0){
        this.resultsShowNone();
        msg("Finished painting graph (none)...");
        return;
    }

    this.graphPainter.drawGraph(this.scrollAreaData, currentQuery, maxValue);
}






