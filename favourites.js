Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

Importer.include("configuration.js");
Importer.include("queries.js");
Importer.include("display_results.js");
Importer.include("display_statistics.js");
Importer.include("display_graph.js");

var currentQuery = new Array();
var indexGr = 0;
var indexOrd = 0;

var icon_statistics		= new QIcon(Amarok.Info.iconPath( "amarok_mostplayed", 16));
var icon_track			= new QIcon(Amarok.Info.iconPath( "filename-title-amarok", 16));
var icon_artist			= new QIcon(Amarok.Info.iconPath( "filename-artist-amarok", 16));
var icon_albumartist	= new QIcon(Amarok.Info.iconPath( "amarok_artist", 16));
var icon_album			= new QIcon(Amarok.Info.iconPath( "filename-album-amarok", 16));
var icon_genre			= new QIcon(Amarok.Info.iconPath( "filename-genre-amarok", 16));
var icon_year			= new QIcon(Amarok.Info.iconPath( "filename-year-amarok", 16));
var icon_rating			= new QIcon(Amarok.Info.scriptPath() + "/smallerstar.png");
var icon_playcount		= new QIcon(Amarok.Info.iconPath( "amarok_playcount", 16));
var icon_score			= new QIcon(Amarok.Info.iconPath( "love-amarok", 16));
var icon_weight			= new QIcon(Amarok.Info.iconPath( "view-media-visualization-amarok", 16));
var icon_length			= new QIcon(Amarok.Info.iconPath( "amarok_clock", 16));
var icon_numtracks		= new QIcon(Amarok.Info.iconPath( "amarok_track", 16));
var icon_numalbums		= new QIcon(Amarok.Info.iconPath( "filename-track-amarok", 16));
var icon_label			= new QIcon(Amarok.Info.iconPath( "label-amarok", 16));



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
    var id = currentQuery[item_index * 11];
    if (id == null) return;

    if (indexGr == 1) playlistImporter.addTrack(id);
    if (indexGr == 2) playlistImporter.addArtist(id);
    if (indexGr == 3) playlistImporter.addAlbumArtist(id);
    if (indexGr == 4) playlistImporter.addAlbum(id);
	if (indexGr == 5) playlistImporter.addGenre(id);
	if (indexGr == 6) playlistImporter.addLabel(id);
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

    this.groupBoxSearch     = new QGroupBox();
    this.groupBoxResults    = new QGroupBox();
    this.groupLayoutSearch  = new QGridLayout();
    this.groupLayoutResults = new QVBoxLayout();
    this.groupLayoutSearch.spacing = 0;

    this.filterLabel			= new QLabel(qsTr("Filter:"), parentWidget);
    this.groupByLabel			= new QLabel(qsTr("Show:"), parentWidget);
	this.orderByLabel			= new QLabel(qsTr("Order by:"), parentWidget);
    this.filterBox				= new QLineEdit(parentWidget);
    this.comboGroupBy			= new QComboBox(parentWidget);
	this.comboOrderBy			= new QComboBox(parentWidget);

    this.scrollAreaData     = new CustomQGraphicsScene(0, 0, 350, 600, parentWidget);
    this.scrollAreaResults  = new QGraphicsView(this.scrollAreaData, parentWidget);
	this.scrollAreaResults.alignment = Qt.AlignHCenter;
    this.scrollAreaData.backgroundBrush = new QBrush(QApplication.palette().color(QPalette.Button), Qt.SolidPattern);

	this.comboGroupBy.addItem(icon_statistics,	qsTr("Statistics"));
	this.comboGroupBy.addItem(icon_track,		qsTr("Tracks"));
	this.comboGroupBy.addItem(icon_artist,		qsTr("Artists"));
	this.comboGroupBy.addItem(icon_albumartist,	qsTr("Album Artists"));
	this.comboGroupBy.addItem(icon_album,		qsTr("Albums"));
	this.comboGroupBy.addItem(icon_genre,		qsTr("Genres"));
	this.comboGroupBy.addItem(icon_label,		qsTr("Labels"));
	this.comboGroupBy.addItem(icon_year,		qsTr("Years"));

	this.comboOrderBy.addItem(icon_rating,		qsTr("Rating"));
	this.comboOrderBy.addItem(icon_playcount,	qsTr("Play count"));
	this.comboOrderBy.addItem(icon_score,		qsTr("Score"));
	this.comboOrderBy.addItem(icon_weight,		qsTr("Weight"));
	this.comboOrderBy.addItem(icon_length,		qsTr("Length"));
	this.comboOrderBy.addItem(icon_numtracks,	qsTr("Number of Tracks"));
	this.comboOrderBy.addItem(icon_numalbums,	qsTr("Number of Albums"));
	this.comboOrderBy.addItem(icon_year,		qsTr("Year"));

    this.groupLayoutSearch.addWidget(this.filterLabel,		0, 0, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.filterBox,		0, 1, 1, 5);
    this.groupLayoutSearch.addWidget(this.groupByLabel,		1, 0, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.comboGroupBy,		1, 1, 1, 2);
	this.groupLayoutSearch.addWidget(this.orderByLabel,		1, 3, 1, 1, Qt.AlignRight);
	this.groupLayoutSearch.addWidget(this.comboOrderBy,		1, 4, 1, 2);

    this.groupLayoutResults.addWidget(this.scrollAreaResults, 0, 0);

	this.groupBoxSearch.flat = true;
	this.groupBoxResults.flat = true;
    this.groupBoxSearch.setLayout(this.groupLayoutSearch);
    this.groupBoxResults.setLayout(this.groupLayoutResults);
    this.mainLayout.addWidget(this.groupBoxSearch,  0, 0);
    this.mainLayout.addWidget(this.groupBoxResults, 0, 0);

    this.comboGroupBy['currentIndexChanged(int)'].connect(this, this.onQueryTypeChanged);
    this.comboOrderBy['currentIndexChanged(int)'].connect(this, this.onQueryTypeChanged);
    this.filterBox.returnPressed.connect( this, this.onQuerySubmitted);

    this.filterBox.toolTip    = qsTr("Filter by artist, album, album artist, genre or year.");
    //this.scrollAreaResults.toolTip = qsTr("You may double-click on tracks, albums and artists to queue them to your Amarok playlist.");

    msg("Finished drawing favourites tab...");

    this.onQueryTypeChanged();
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

FavouritesTab.prototype.onQuerySubmitted = function(index)
{
    msg("Query Submitted");
    this.onQueryTypeChanged();
}

FavouritesTab.prototype.onQueryTypeChanged = function()
{
	playlistImporter.filterText = this.filterBox.text;
	indexGr  = this.comboGroupBy.currentIndex;
	indexOrd = this.comboOrderBy.currentIndex;
    msg("Query Type changed to index " + indexGr + ", " + indexOrd);
    if (this.mutex.tryLock(0) == false) return;

    this.resultsShowWorking();

    if (indexGr == 0){
		this.filterBox.enabled = false;
        this.displayStatistics(fillGlobalStatisticsPage());
    } else {
		this.filterBox.enabled = true;
		this.comboOrderBy.enabled	 = true;
	}

    if (indexGr == 1)
        this.displayResults(fillTracksPage(this.filterBox.text, indexOrd), indexOrd);

    if (indexGr == 2)
        this.displayResults(fillArtistsPage(this.filterBox.text, indexOrd), indexOrd);

	if (indexGr == 3)
		this.displayResults(fillAlbumArtistsPage(this.filterBox.text, indexOrd), indexOrd);

    if (indexGr == 4)
        this.displayResults(fillAlbumsPage(this.filterBox.text, indexOrd), indexOrd);

    if (indexGr == 5)
        this.displayResults(fillGenresPage(this.filterBox.text, indexOrd), indexOrd);

	if (indexGr == 6)
		this.displayResults(fillLabelsPage(this.filterBox.text, indexOrd), indexOrd);

    if (indexGr == 7)
        this.displayGraph(fillRatingOverTimePage(this.filterBox.text, indexOrd), indexOrd);

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

FavouritesTab.prototype.displayResults = function(query_string, indexOrd)
{
    msg("Painting results...");

    currentQuery = sql_exec(query_string);

    if (currentQuery.length == 0){
        this.resultsShowNone();
        msg("Finished painting results (none)...");
        return;
    }

    this.Results_Painter.drawResults(this.scrollAreaData, currentQuery, indexGr, indexOrd);
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
