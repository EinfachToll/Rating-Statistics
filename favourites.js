Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

Importer.include("configuration.js");
Importer.include("queries.js");
Importer.include("display_results.js");
Importer.include("display_statistics.js");
Importer.include("display_graph.js");

var currentQuery = new Array();
var queryNames   = new Array();
var queryType    = 0;
queryNames[0] = qsTr("Statistics");
queryNames[1] = qsTr("Favourite Tracks");
queryNames[2] = qsTr("Favourite Albums");
queryNames[3] = qsTr("Favourite Artists");
queryNames[4] = qsTr("Favourite Genres");
queryNames[5] = qsTr("Most Played Tracks");
queryNames[6] = qsTr("Most Played Albums");
queryNames[7] = qsTr("Most Played Artists");
queryNames[8] = qsTr("Most Played Genres");
queryNames[9] = qsTr("Rating over Time");
queryNames[10] = qsTr("Score over Time");

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

    if (queryType == 1 || queryType == 5) playlistImporter.addTrack(id);
    if (queryType == 2 || queryType == 6) playlistImporter.addAlbum(id);
    if (queryType == 3 || queryType == 7) playlistImporter.addArtist(id);
	if (queryType == 4 || queryType == 8) playlistImporter.addGenre(id);
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

    this.groupBoxSearch     = new QGroupBox(qsTr("Query Parameters"));
    this.groupBoxResults    = new QGroupBox(qsTr("Results"));
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
    this.comboQueryType     = new QComboBox(parentWidget);
    this.searchButtonClear  = new QPushButton(qsTr("Clear"), parentWidget);
    this.searchButtonSubmit = new QPushButton(qsTr("Submit"), parentWidget);

    this.scrollAreaData     = new CustomQGraphicsScene(0, 0, 350, 600, parentWidget);
    this.scrollAreaResults  = new QGraphicsView(this.scrollAreaData, parentWidget);
    this.scrollAreaData.backgroundBrush = new QBrush(QApplication.palette().color(QPalette.Button), Qt.SolidPattern);

    for (var i=0; i<11; i++){this.comboQueryType.addItem(qsTr(queryNames[i]));}

    this.groupLayoutSearch.addWidget(this.searchLabelArtist,  0, 0, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.searchBoxArtist,    0, 1, 1, 2);
    this.groupLayoutSearch.addWidget(this.searchLabelGenre,   0, 3, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.searchBoxGenre,     0, 4, 1, 2);
    this.groupLayoutSearch.addWidget(this.searchLabelAlbum,   1, 0, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.searchBoxAlbum,     1, 1, 1, 2);
    this.groupLayoutSearch.addWidget(this.searchLabelYear,    1, 3, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.searchBoxYear,      1, 4, 1, 2);
    this.groupLayoutSearch.addWidget(this.searchLabelType,    2, 0, 1, 1, Qt.AlignRight);
    this.groupLayoutSearch.addWidget(this.comboQueryType,     2, 1, 1, 5);
    this.groupLayoutSearch.addWidget(this.searchButtonClear,  3, 4, 1, 1);
    this.groupLayoutSearch.addWidget(this.searchButtonSubmit, 3, 5, 1, 1);

    this.groupLayoutResults.addWidget(this.scrollAreaResults, 0, 0);

    this.groupBoxSearch.setLayout(this.groupLayoutSearch);
    this.groupBoxResults.setLayout(this.groupLayoutResults);
    this.mainLayout.addWidget(this.groupBoxSearch,  0, 0);
    this.mainLayout.addWidget(this.groupBoxResults, 0, 0);

    this.comboQueryType['currentIndexChanged(int)'].connect(this, this.onQueryTypeChanged);
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
    this.scrollAreaResults.toolTip = qsTr("You may double-click on tracks, albums and artists to queue them to your Amarok playlist.");

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
    this.resultsClear();
}

FavouritesTab.prototype.onQuerySubmitted = function(index)
{
    msg("Query Submitted");
    this.onQueryTypeChanged(this.comboQueryType.currentIndex);
}

FavouritesTab.prototype.onQueryTypeChanged = function(index)
{
    msg("Query Type changed to index " + index);
    if (this.mutex.tryLock(0) == false) return;

    queryType = index;
    this.resultsShowWorking();

    if (index == 0){
        this.searchBoxAlbum.enabled  = false;
        this.searchBoxArtist.enabled = false;
        this.searchBoxGenre.enabled  = false;
        this.searchBoxYear.enabled   = false;
        this.displayStatistics(fillGlobalStatisticsPage());
    }

    if (index == 1 || index == 5){
        this.searchBoxAlbum.enabled  = true;
        this.searchBoxArtist.enabled = true;
        this.searchBoxGenre.enabled  = true;
        this.searchBoxYear.enabled   = true;
        this.displayResults(fillTracksPage(this.searchBoxAlbum.text, this.searchBoxArtist.text, this.searchBoxGenre.text, this.searchBoxYear.text, index), index);
    }

    if (index == 2 || index == 6){
        this.searchBoxAlbum.enabled  = false;
        this.searchBoxArtist.enabled = true;
        this.searchBoxGenre.enabled  = true;
        this.searchBoxYear.enabled   = true;
        this.displayResults(fillAlbumsPage(this.searchBoxArtist.text, this.searchBoxGenre.text, this.searchBoxYear.text, index), index);
    }

    if (index == 3 || index == 7){
        this.searchBoxAlbum.enabled  = false;
        this.searchBoxArtist.enabled = false;
        this.searchBoxGenre.enabled  = true;
        this.searchBoxYear.enabled   = true;
        this.displayResults(fillArtistsPage(this.searchBoxGenre.text, this.searchBoxYear.text, index), index);
    }

    if (index == 4 || index == 8){
        this.searchBoxAlbum.enabled  = false;
        this.searchBoxArtist.enabled = false;
        this.searchBoxGenre.enabled  = false;
        this.searchBoxYear.enabled   = true;
        this.displayResults(fillGenresPage(this.searchBoxYear.text, index), index);
    }

    if (index == 9){
        this.searchBoxAlbum.enabled  = false;
        this.searchBoxArtist.enabled = true;
        this.searchBoxGenre.enabled  = true;
        this.searchBoxYear.enabled   = false;
        this.displayGraph(fillRatingOverTimePage(this.searchBoxArtist.text, this.searchBoxGenre.text), 10);
    }
    if (index == 10){
        this.searchBoxAlbum.enabled  = false;
        this.searchBoxArtist.enabled = true;
        this.searchBoxGenre.enabled  = true;
        this.searchBoxYear.enabled   = false;
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

FavouritesTab.prototype.displayResults = function(query_string, queryType)
{
    msg("Painting results...");

    currentQuery = sql_exec(query_string);

    if (currentQuery.length == 0){
        this.resultsShowNone();
        msg("Finished painting results (none)...");
        return;
    }

    this.Results_Painter.drawResults(this.scrollAreaData, queryType, 10, currentQuery);
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






