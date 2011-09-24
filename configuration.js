
function Configuration(){}

Configuration.prototype.loadConfigText = function(aname, adefault)
{
    return Amarok.Script.readConfig(aname, String(adefault));
};

Configuration.prototype.loadConfig = function(aname, adefault)
{
    return parseInt(Amarok.Script.readConfig(aname, String(adefault)));
};

Configuration.prototype.saveConfig = function(aname, value)
{
    Amarok.Script.writeConfig(aname, String(value));
};

Configuration.prototype.saveCheckBox = function(aname, value)
{
    if (value == Qt.Unchecked){
        this.saveConfig(aname, 0);
    } else {
        this.saveConfig(aname, 1);
    }
};

Configuration.prototype.loadCheckBox = function(aname, adefault)
{
    var def = 0;
    if (adefault == Qt.Checked){def = 1;}

    var val = this.loadConfig( aname, def );
    if( val == 0 ){
        return Qt.Unchecked;
    } else {
        return Qt.Checked;
    }
};

Configuration.prototype.saveConfiguration = function()
{
    msg("Saving Configuration....");

    this.saveCheckBox("ignore_unrated",			this.skipUnrated);
    this.saveConfig("min_tracks_per_album",		this.minTracksPerAlbum);
    this.saveConfig("results_limit",			this.resultsLimit);
    this.saveCheckBox("reverse_results",		this.reverseResults);
    this.saveConfig("weight_rating",			this.weightRating);
    this.saveConfig("weight_score",				this.weightScore);
    this.saveConfig("weight_length",			this.weightLength);
    this.saveConfig("weight_playcount",			this.weightPlaycount);
    msg("done");
};

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

    this.skipUnrated		= this.loadCheckBox('ignore_unrated',		Qt.Checked);
    this.reverseResults		= this.loadCheckBox('reverse_results',		Qt.Unchecked);
    this.minTracksPerAlbum	= this.loadConfig('min_tracks_per_album',	3);
    this.resultsLimit		= this.loadConfig('results_limit',			15);
    this.weightRating		= this.loadConfig('weight_rating',			2);
    this.weightScore		= this.loadConfig('weight_score',			2);
    this.weightLength		= this.loadConfig('weight_length',			1);
    this.weightPlaycount	= this.loadConfig('weight_playcount',		2);
    
    msg("done");
};

Configuration.prototype.onConfigurationApply = function()
{
    msg("onConfigurationApply");

    this.minTracksPerAlbum = this.spinMinTracksPerAlbum.value;
    this.resultsLimit      = this.spinResultsLimit.value;
    this.reverseResults    = this.checkReverseResults.checkState();
    this.weightRating      = this.sliderWeightRating.value;
    this.weightScore       = this.sliderWeightScore.value;
    this.weightLength      = this.sliderWeightLength.value;
    this.weightPlaycount   = this.sliderWeightPlaycount.value;

    this.saveConfiguration();
    msg("done");
};

Configuration.prototype.showConfiguration = function()
{
    msg("Displaying configuration...");

    this.checkReverseResults.setCheckState(this.reverseResults);
    this.spinMinTracksPerAlbum.setValue(this.minTracksPerAlbum);
    this.spinResultsLimit.setValue(this.resultsLimit);
    this.sliderWeightRating.setValue(this.weightRating);
    this.sliderWeightScore.setValue(this.weightScore);
    this.sliderWeightLength.setValue(this.weightLength);
    this.sliderWeightPlaycount.setValue(this.weightPlaycount);
    
    msg("done");
};

Configuration.prototype.draw = function(parentWidget)
{
    msg("Drawing configuration tab...");
    this.mainLayout                   = new QGridLayout(parentWidget);

    this.groupBoxResults             = new QGroupBox(qsTr("Results"));
    this.groupBoxOrdering            = new QGroupBox(qsTr("User-specific weight"));
    this.buttonBox					 = new QDialogButtonBox(parentWidget);

    this.groupLayoutResults          = new QGridLayout();
    this.groupLayoutOrdering         = new QGridLayout();

    this.labelReverseResults         = new QLabel(qsTr("Reverse Results: "),        parentWidget, 0);
    this.labelMinTracksPerAlbum      = new QLabel(qsTr("Min Number of (Rated) Tracks: "),   parentWidget, 0);
    this.labelResultsLimit           = new QLabel(qsTr("Results Limit: "),          parentWidget, 0);
    this.labelWeightRating           = new QLabel(qsTr("Rating Weight: "),          parentWidget, 0);
    this.labelWeightScore            = new QLabel(qsTr("Score Weight: "),           parentWidget, 0);
    this.labelWeightLength           = new QLabel(qsTr("Length Weight: "),          parentWidget, 0);
    this.labelWeightPlaycount        = new QLabel(qsTr("Playcount Weight: "),       parentWidget, 0);
    this.checkReverseResults         = new QCheckBox(parentWidget);
    this.spinMinTracksPerAlbum       = new QSpinBox(parentWidget);
    this.spinResultsLimit            = new QSpinBox(parentWidget);
    this.sliderWeightRating          = new QSlider(Qt.Horizontal, parentWidget);
    this.sliderWeightScore           = new QSlider(Qt.Horizontal, parentWidget);
    this.sliderWeightLength          = new QSlider(Qt.Horizontal, parentWidget);
    this.sliderWeightPlaycount       = new QSlider(Qt.Horizontal, parentWidget);

    this.sliderWeightRating.setRange(0,3);
    this.sliderWeightScore.setRange(0,3);
    this.sliderWeightLength.setRange(0,3);
    this.sliderWeightPlaycount.setRange(0,3);
    this.spinResultsLimit.setRange(1,100);
    this.spinMinTracksPerAlbum.setRange(1,100);
    
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
	this.buttonBox.addButton(QDialogButtonBox.Apply);

    this.groupBoxResults.setLayout(this.groupLayoutResults);
    this.groupBoxOrdering.setLayout(this.groupLayoutOrdering);

    this.mainLayout.addWidget(this.groupBoxResults,		0, 0);
    this.mainLayout.addWidget(this.groupBoxOrdering,	1, 0);
    this.mainLayout.addWidget(this.buttonBox,			2, 0);

    this.spinMinTracksPerAlbum.toolTip  = qsTr("Where this setting makes sense, just albums/genres/etc. with that many tracks are shown, and with that many rated tracks, respectively.\nA value of 1 is equivalent to disabling this feature.");
	this.labelMinTracksPerAlbum.toolTip = this.spinMinTracksPerAlbum.toolTip;

    this.spinResultsLimit.toolTip      = qsTr("Sets an upper limit on the number of results displayed. A lot of results might take a while to render.");
	this.labelResultsLimit.toolTip     = this.spinResultsLimit.toolTip;

    this.checkReverseResults.toolTip   = qsTr("If set, the results are ranked from worst to best.");
	this.labelReverseResults.toolTip   = this.checkReverseResults.toolTip;

    this.sliderWeightLength.toolTip    = qsTr("Sets the importance of an entry's length for ranking purposes.\n"
                                       + "The settings are from left to right: Disabled, 50%, 100%, 150%.");
	this.labelWeightLength.toolTip	= this.sliderWeightLength.toolTip;

    this.sliderWeightPlaycount.toolTip = qsTr("Sets the importance of an entry's playcount for ranking purposes.\n"
                                       + "The settings are from left to right: Disabled, 50%, 100%, 150%.");
	this.labelWeightPlaycount.toolTip = this.sliderWeightPlaycount.toolTip;

    this.sliderWeightRating.toolTip    = qsTr("Sets the importance of an entry's rating for ranking purposes.\n"
                                       + "The settings are from left to right: Disabled, 50%, 100%, 150%.");
	this.labelWeightRating.toolTip = this.sliderWeightRating.toolTip;

    this.sliderWeightScore.toolTip     = qsTr("Sets the importance of an entry's score for ranking purposes.\n"
                                       + "The settings are from left to right: Disabled, 50%, 100%, 150%.");
	this.labelWeightScore.toolTip = this.sliderWeightScore.toolTip;

    msg("Finished drawing configuration tab...");
};
