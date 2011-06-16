Importer.loadQtBinding( "qt.core" );
Importer.loadQtBinding( "qt.sql" );

function Configuration(){}

Configuration.prototype.settingsmodified = false;

Configuration.prototype.loadSQLText = function(aname, adefault)
{
    return Amarok.Script.readConfig(aname, String(adefault));
}


Configuration.prototype.loadSQL = function(aname, adefault)
{
    return parseInt(Amarok.Script.readConfig(aname, String(adefault)));
}

Configuration.prototype.saveSQL = function(aname, value)
{
    Amarok.Script.writeConfig(aname, String(value));
}

Configuration.prototype.saveCheckBox = function(aname, value)
{
    if (value == Qt.Unchecked){
        this.saveSQL(aname, 0);
    } else {
        this.saveSQL(aname, 1);
    }
}

Configuration.prototype.loadCheckBox = function(aname, adefault)
{
    var def = 0;
    if (adefault == Qt.Checked){def = 1;}

    var val = this.loadSQL( aname, def );
    if( val == 0 ){
        return Qt.Unchecked;
    } else {
        return Qt.Checked;
    }
}

Configuration.prototype.saveConfiguration = function()
{
    msg("Saving Configuration....");

    this.saveCheckBox("ignore_unrated",  this.skipUnrated);
    this.saveSQL("min_tracks_per_album", this.minTracksPerAlbum);
    this.saveSQL("results_limit",        this.resultsLimit);
    this.saveCheckBox("reverse_results", this.reverseResults);
//     this.saveCheckBox("exclude_enabled", this.excludeEnabled);
    this.saveSQL("weight_rating",        this.weightRating);
    this.saveSQL("weight_score",         this.weightScore);
    this.saveSQL("weight_length",        this.weightLength);
    this.saveSQL("weight_playcount",     this.weightPlaycount);
    this.saveSQL("locale",               this.locale);
    msg("done");
}

Configuration.prototype.loadConfiguration = function()
{
    var existing_tables = sql_exec( "SHOW TABLES" );
    for( var i=0; i<existing_tables.length; i++){
        if( existing_tables[i] == 'rating_statistics_config' ){
            Amarok.alert(qsTr("The Ratings Statistics script has detected an older configuration stored on Amarok's database. As of version 1.2.4, the configuration settings are stored using Amarok's Scripting API (which usually means ~/.kde4/share/config/amarokrc).\n\nThe older settings will now be cleaned up from the database, but since there is no migration procedure, the configuration will be reset to default values.\n\nPlease visit the configuration tab and review the settings. Sorry for the trouble."));
            sql_exec('DROP TABLE rating_statistics_config');
            break;
        }
    }

    msg("loadConfiguration");

    this.skipUnrated       = this.loadCheckBox('ignore_unrated',       Qt.Checked);
    this.reverseResults    = this.loadCheckBox('reverse_results',      Qt.Unchecked);
//     this.excludeEnabled    = this.loadCheckBox('exclude_enabled',      Qt.Unchecked);
    this.minTracksPerAlbum = this.loadSQL     ('min_tracks_per_album', 4);
    this.resultsLimit      = this.loadSQL     ('results_limit',        15);
    this.weightRating      = this.loadSQL     ('weight_rating',        2);
    this.weightScore       = this.loadSQL     ('weight_score',         2);
    this.weightLength      = this.loadSQL     ('weight_length',        1);
    this.weightPlaycount   = this.loadSQL     ('weight_playcount',     2);
    this.locale            = this.loadSQLText ('locale',               "amarok_rating_statistics_en.ts");
    
    msg("done");
}

Configuration.prototype.onConfigurationApply = function()
{
    msg("onConfigurationApply");

    //this.skipUnrated       = this.checkSkipUnrated.checkState();
    this.minTracksPerAlbum = this.spinMinTracksPerAlbum.value;
    this.resultsLimit      = this.spinResultsLimit.value;
    this.reverseResults    = this.checkReverseResults.checkState();
//     this.excludeEnabled    = this.checkExcludeEnabled.checkState();
    this.weightRating      = this.sliderWeightRating.value;
    this.weightScore       = this.sliderWeightScore.value;
    this.weightLength      = this.sliderWeightLength.value;
    this.weightPlaycount   = this.sliderWeightPlaycount.value;
    this.locale            = this.comboLocale.currentText;

    this.saveConfiguration();
    msg("done");
}

Configuration.prototype.showConfiguration = function()
{
    msg("Displaying configuration...");

    //this.checkSkipUnrated.setCheckState(this.skipUnrated);
    this.checkReverseResults.setCheckState(this.reverseResults);
//     this.checkExcludeEnabled.setCheckState(this.excludeEnabled);
    this.spinMinTracksPerAlbum.setValue(this.minTracksPerAlbum);
    this.spinResultsLimit.setValue(this.resultsLimit);
    this.sliderWeightRating.setValue(this.weightRating);
    this.sliderWeightScore.setValue(this.weightScore);
    this.sliderWeightLength.setValue(this.weightLength);
    this.sliderWeightPlaycount.setValue(this.weightPlaycount);
    this.comboLocale.setCurrentIndex(this.comboLocale.findText(this.locale));
    
    msg("done");
}

Configuration.prototype.draw = function(parentWidget)
{
    msg("Drawing configuration tab...");
    this.mainLayout                   = new QGridLayout(parentWidget);

    //this.groupBoxTracks              = new QGroupBox(qsTr("Tracks"));
    this.groupBoxResults             = new QGroupBox(qsTr("Results"));
    this.groupBoxOrdering            = new QGroupBox(qsTr("User-specific weight"));
    this.groupBoxLocale              = new QGroupBox(qsTr("Locale"));
    this.groupBoxButtons             = new QWidget(parentWidget);

    //this.groupLayoutTracks           = new QGridLayout();
    this.groupLayoutResults          = new QGridLayout();
    this.groupLayoutOrdering         = new QGridLayout();
    this.groupLayoutButtons          = new QGridLayout();
    this.groupLayoutLocale           = new QVBoxLayout();

    //this.labelSkipUnrated            = new QLabel(qsTr("Skip Unrated Tracks: "),    parentWidget, 0);
    this.labelReverseResults         = new QLabel(qsTr("Reverse Results: "),        parentWidget, 0);
    this.labelMinTracksPerAlbum      = new QLabel(qsTr("Min Number of Rated Tracks per Album: "),   parentWidget, 0);
    this.labelResultsLimit           = new QLabel(qsTr("Results Limit: "),          parentWidget, 0);
    this.labelWeightRating           = new QLabel(qsTr("Rating Weight: "),          parentWidget, 0);
    this.labelWeightScore            = new QLabel(qsTr("Score Weight: "),           parentWidget, 0);
    this.labelWeightLength           = new QLabel(qsTr("Length Weight: "),          parentWidget, 0);
    this.labelWeightPlaycount        = new QLabel(qsTr("Playcount Weight: "),       parentWidget, 0);
    //this.checkSkipUnrated            = new QCheckBox(parentWidget);
    this.checkReverseResults         = new QCheckBox(parentWidget);
    this.spinMinTracksPerAlbum       = new QSpinBox(parentWidget);
    this.spinResultsLimit            = new QSpinBox(parentWidget);
    this.buttonFrame                 = new QFrame(parentWidget);
    this.sliderWeightRating          = new QSlider(Qt.Horizontal, parentWidget);
    this.sliderWeightScore           = new QSlider(Qt.Horizontal, parentWidget);
    this.sliderWeightLength          = new QSlider(Qt.Horizontal, parentWidget);
    this.sliderWeightPlaycount       = new QSlider(Qt.Horizontal, parentWidget);
    this.buttonApply                 = new QPushButton(qsTr("Apply"),   parentWidget);
    this.labelLocale                 = new QLabel("Sorry, you will need to re-open this window and/or disable/enable\nthis script for locale changes to take effect, for now.", parentWidget, 0);
    this.comboLocale                 = new QComboBox(parentWidget);

    this.buttonFrame.frameShape = QFrame.HLine;
    this.sliderWeightRating.setRange(0,3);
    this.sliderWeightScore.setRange(0,3);
    this.sliderWeightLength.setRange(0,3);
    this.sliderWeightPlaycount.setRange(0,3);
    this.spinResultsLimit.setRange(1,100);
    this.spinMinTracksPerAlbum.setRange(1,100);
    
    var directory = new QDir(Amarok.Info.scriptPath() + "/translations/qm/");
    var fileFilters = new Array();
    fileFilters[0] = "amarok_rating_statistics_*.qm"
    var localeList = directory.entryList(fileFilters, QDir.Files, QDir.Name)
    for (var i = 0; i < localeList.length; i++){
        this.comboLocale.addItem(localeList[i])
    }

    //this.groupLayoutTracks.addWidget(this.labelSkipUnrated,            0, 0);
    //this.groupLayoutTracks.addWidget(this.checkSkipUnrated,            0, 1);
    this.groupLayoutResults.addWidget(this.labelReverseResults,        0, 0);
    this.groupLayoutResults.addWidget(this.checkReverseResults,        0, 1);
    this.groupLayoutResults.addWidget(this.labelResultsLimit,          1, 0);
    this.groupLayoutResults.addWidget(this.spinResultsLimit,           1, 1);
    this.groupLayoutResults.addWidget(this.labelMinTracksPerAlbum,     2, 0);
    this.groupLayoutResults.addWidget(this.spinMinTracksPerAlbum,      2, 1);
    this.groupLayoutOrdering.addWidget(this.labelWeightRating,         0, 0);
    this.groupLayoutOrdering.addWidget(this.sliderWeightRating,        0, 1);
    this.groupLayoutOrdering.addWidget(this.labelWeightScore,          1, 0);
    this.groupLayoutOrdering.addWidget(this.sliderWeightScore,         1, 1);
    this.groupLayoutOrdering.addWidget(this.labelWeightPlaycount,      2, 0);
    this.groupLayoutOrdering.addWidget(this.sliderWeightPlaycount,     2, 1);
    this.groupLayoutOrdering.addWidget(this.labelWeightLength,         3, 0);
    this.groupLayoutOrdering.addWidget(this.sliderWeightLength,        3, 1);
    this.groupLayoutButtons.addWidget(this.buttonFrame,                0, 0, 1, 4);
    //this.groupLayoutButtons.addWidget(this.buttonReload,               1, 2, 1, 1);
    this.groupLayoutButtons.addWidget(this.buttonApply,                1, 3, 1, 1);
    this.groupLayoutLocale.addWidget(this.labelLocale,                 0, 0);
    this.groupLayoutLocale.addWidget(this.comboLocale,                 1, 0);

    //this.groupBoxTracks.setLayout(this.groupLayoutTracks);
    this.groupBoxResults.setLayout(this.groupLayoutResults);
    this.groupBoxOrdering.setLayout(this.groupLayoutOrdering);
    this.groupBoxButtons.setLayout(this.groupLayoutButtons);
    this.groupBoxLocale.setLayout(this.groupLayoutLocale);

    this.mainLayout.addWidget(this.groupBoxOrdering,       0, 0);
    this.mainLayout.addWidget(this.groupBoxTracks,         1, 0);
    this.mainLayout.addWidget(this.groupBoxResults,        2, 0);
    this.mainLayout.addWidget(this.groupBoxLocale,         3, 0);
    this.mainLayout.addWidget(this.groupBoxButtons,        4, 0);

    this.buttonApply.clicked.connect( this, this.onConfigurationApply);
    //this.buttonReload.clicked.connect(this, this.showConfiguration);


    //this.checkSkipUnrated.toolTip      = qsTr("If set, any tracks that do not have a rating set are not displayed.\n"
     //                                  + "Otherwise, such tracks are assumed to have a rating and a score of 50% for ranking purposes.");

    this.spinMinTracksPerAlbum.toolTip = qsTr("Any albums that do not have at least that many tracks are not displayed.\n"
                                       + "This works in conjuction with the 'Skip Unrated Tracks' option;\n"
                                       + "in this case an album is required to have at least that many _rated_ tracks.\n"
                                       + "A value of 1 is equivalent to disabling this feature.");

    this.spinResultsLimit.toolTip      = qsTr("Sets an upper limit on the number of results displayed. A lot of results might take a while to render.");

    this.checkReverseResults.toolTip   = qsTr("If set, the results are ranked from worst to best.");

    this.sliderWeightLength.toolTip    = qsTr("Sets the importance of an entry's length for ranking purposes.\n"
                                       + "The settings are from left to right: Disabled, 50%, 100%, 150%.");

    this.sliderWeightPlaycount.toolTip = qsTr("Sets the importance of an entry's playcount for ranking purposes.\n"
                                       + "The settings are from left to right: Disabled, 50%, 100%, 150%.");

    this.sliderWeightRating.toolTip    = qsTr("Sets the importance of an entry's rating for ranking purposes.\n"
                                       + "The settings are from left to right: Disabled, 50%, 100%, 150%.");

    this.sliderWeightScore.toolTip     = qsTr("Sets the importance of an entry's score for ranking purposes.\n"
                                       + "The settings are from left to right: Disabled, 50%, 100%, 150%.");


//     this.checkExcludeEnabled.setCheckState(Qt.Unchecked);
//     this.checkExcludeEnabled.enabled = false;

    msg("Finished drawing configuration tab...");
}
