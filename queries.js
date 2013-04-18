Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

function createOrderString(groupBy, orderBy)
{
    result = "";
    switch(orderBy) {
        case 0:
            if(groupBy ==1)
                result += " AND s.rating > 0 ";
            else if(groupBy < 7)
                result += " HAVING numRatTr >= " + config.minTracksPerAlbum;
            if(groupBy < 7)
                result += " ORDER BY ";
            result += "rat ";
            break;
        case 1:
            if(groupBy < 7) result += " ORDER BY ";
            result += "plc ";
            break;
        case 2:
            if(groupBy != 1 && groupBy < 7)
                result += " HAVING numTr >= " + config.minTracksPerAlbum;
            if(groupBy < 7) result += " ORDER BY ";
            result += "sco ";
            break;
        case 3:
            if(config.weightRating > 0 && groupBy != 1 && groupBy < 7)
                result += " HAVING numRatTr >= 1 ";
            if(groupBy < 7) result += " ORDER BY ";
            result += "wei ";
            break;
        case 4:
            if(groupBy < 7) result += " ORDER BY ";
            result += "len ";
            break;
        case 5:
            if(groupBy < 7) result += " ORDER BY ";
            result += "numTr ";
            break;
        case 6:
            if(groupBy < 7) result += " ORDER BY ";
            result += "numAl ";
            break;
        case 7:
            if(groupBy < 7) {
                if(groupBy != 1) {
                    result += " HAVING numTr >= " + config.minTracksPerAlbum;
                    if(config.reverseResults == Qt.Checked)
                        result += " AND yea > 1";
                } else
                    if(config.reverseResults == Qt.Checked)
                        result += " AND y.itemname > 1";
                result += " ORDER BY ";
            }
            result += "yea ";
            break;
        case 8:
            if(groupBy < 7) result += " ORDER BY ";
            result += "itemname ";
            result += "COLLATE utf8_unicode_ci ";
            break;
    }

    if(groupBy < 7)
    {
        if( (orderBy <= 7 && config.reverseResults == Qt.Unchecked) ||
                (orderBy == 8 && config.reverseResults == Qt.Checked) )
            result += "DESC ";

    }

    return result;
}

function createWeightString(groupBy)
{
    if(groupBy!=1)
    {
        result = ""
          + "   (5.0 * " + config.weightRating    + (groupBy==9 ? " * s.rating)" : " * AVG(IF(s.rating < 1,  NULL, s.rating)))")
          + " + (0.6 * " + config.weightScore     + " * AVG(IF(s.score IS NULL, 0, s.score)))"
          + " + (0.5 * " + config.weightLength    + " * SQRT(SUM(t.length)/1000))"
          + " + (2.5 * " + config.weightPlaycount + (groupBy==2 || groupBy==3 ? " * SUM(s.playcount))" : " * SQRT(SUM(s.playcount)))");
    } else
    {
        result = ""
          + "   (5.0 * " + config.weightRating    + " * IF(s.rating < 1,  NULL, s.rating))"
          + " + (0.6 * " + config.weightScore     + " * s.score)"
          + " + (0.5 * " + config.weightLength    + " * SQRT(t.length)/1000)"
          + " + (2.5 * " + config.weightPlaycount + " * SQRT(s.playcount))";
    }
    return result;
}

function fillTracksPage(filterText, orderBy)
{
    var sql_query = ""
        + "SELECT t.id "
        + "       , IF(i.path IS NOT NULL, i.path, Concat( "
        + "         IF(ar1.name IS NOT NULL, Lower(ar1.name), '' "
        + "           ), Lower(al.name))) "
        + "       , t.title                      AS itemname "
        + "       , s.rating                     AS rat "
        + "       , s.playcount                  AS plc "
        + "       , s.score                      AS sco "
        + "       , "+ createWeightString(1) +"  AS wei "
        + "       , t.length                     AS len "
        + "       , al.name "
        + "       , ar.name "
        + "       , y.name                       AS yea "
        + "FROM   tracks t "
        + "       LEFT JOIN statistics s "
        + "              ON ( s.url = t.url ) "
        + "       LEFT JOIN years y "
        + "              ON ( t.year = y.id ) "
        + "       LEFT JOIN albums al "
        + "              ON ( al.id = t.album ) "
        + "       LEFT JOIN artists ar "
        + "              ON ( ar.id = t.artist ) "
        + "       LEFT JOIN images i "
        + "              ON ( i.id = al.image ) "
        + "       LEFT JOIN genres g "
        + "              ON ( g.id = t.genre ) "
        + "       LEFT JOIN artists ar1 "
        + "              ON ( al.artist = ar1.id ) "
        + "WHERE true" + playlistImporter.createFilterString(filterText)
        + createOrderString(1, orderBy)
        + "LIMIT " + config.resultsLimit;

    return sql_query;
}

function fillArtistsPage(filterText, orderBy)
{
    var sql_query = ""
        + "SELECT c.artist "
        + "       , IF((SELECT al1.image "
        + "             FROM   albums al1 "
        + "             WHERE  al1.id = c.anyalb) IS NOT NULL, (SELECT i1.path "
        + "                                                     FROM   albums al1 "
        + "                                                            JOIN images i1 "
        + "                                                              ON (al1.image = i1.id) "
        + "                                                     WHERE  al1.id = c.anyalb), "
        + "           CONCAT(LOWER((SELECT ar1.name "
        + "                         FROM   albums al1 "
        + "                                JOIN artists ar1 "
        + "                                  ON al1.artist = ar1.id "
        + "                         WHERE  al1.id = c.anyalb)), LOWER((SELECT al1.name "
        + "                                                            FROM   albums al1 "
        + "                                                            WHERE  al1.id = c.anyalb)))"
        + "         ) "
        + "       , c.itemname "
        + "       , ROUND(c.rat, 1) "
        + "       , plc "
        + "       , ROUND(c.sco, 0) "
        + "       , wei "
        + "       , len "
        + "       , numTr "
        + "       , c.numAl "
        + "       , ROUND(yea, 0) "
        + "FROM   (SELECT t.artist "
        + "               , (SELECT al1.id "
        + "                  FROM   albums al1 "
        + "                         LEFT JOIN tracks tu "
        + "                                ON ( tu.album = al1.id ) "
        + "                  WHERE  tu.artist = t.artist "
        + "                  ORDER  BY RAND() "
        + "                  LIMIT  1)                              AS anyalb "
        + "               , ar.name                                 AS itemname "
        + "               , COUNT(DISTINCT t.album)                 AS numAl "
        + "               , AVG(IF(s.rating < 1, NULL, s.rating))   AS rat "
        + "               , AVG(IF(s.score IS NULL, 0, s.score))    AS sco "
        + "               , SUM(s.playcount)                        AS plc "
        + "               , SUM(t.length)                           AS len "
        + "               , COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr "
        + "               , COUNT(*)                                AS numTr "
        + "               , " + createWeightString(2) + "           AS wei "
        + "               , AVG(IF(y.name < 1, NULL, y.name))       AS yea "
        + "        FROM   tracks t "
        + "               LEFT JOIN statistics s "
        + "                      ON ( s.url = t.url ) "
        + "               LEFT JOIN years y "
        + "                      ON ( t.year = y.id ) "
        + "               LEFT JOIN genres g "
        + "                      ON ( t.genre = g.id ) "
        + "               LEFT JOIN artists ar "
        + "                      ON ( t.artist = ar.id ) "
        + "               LEFT JOIN albums al "
        + "                      ON ( t.album = al.id ) "
        + "               LEFT JOIN artists ar1 "
        + "                      ON ( ar1.id = al.artist ) "
        + "        WHERE true" + playlistImporter.createFilterString(filterText)
        + "        GROUP  BY t.artist "
        +          createOrderString(2, orderBy)
        + "        LIMIT " + config.resultsLimit
        + "      ) c ";

    return sql_query;
}

function fillAlbumArtistsPage(filterText, orderBy)
{
    var sql_query = ""
        + "SELECT c.artist "
        + "       , IF((SELECT al1.image "
        + "             FROM   albums al1 "
        + "             WHERE  al1.id = c.anyalb) IS NOT NULL, (SELECT i1.path "
        + "                                                     FROM   albums al1 "
        + "                                                            JOIN images i1 "
        + "                                                              ON (al1.image = i1.id) "
        + "                                                     WHERE  al1.id = c.anyalb), "
        + "           CONCAT(LOWER((SELECT ar1.name "
        + "                         FROM   albums al1 "
        + "                                JOIN artists ar1 "
        + "                                  ON al1.artist = ar1.id "
        + "                         WHERE  al1.id = c.anyalb)), LOWER((SELECT al1.name "
        + "                                                            FROM   albums al1 "
        + "                                                            WHERE  al1.id = c.anyalb)))) "
        + "       , c.itemname "
        + "       , ROUND(c.rat, 1) "
        + "       , plc "
        + "       , ROUND(c.sco, 0) "
        + "       , wei "
        + "       , len "
        + "       , numTr "
        + "       , numAl "
        + "       , ROUND(yea, 0) "
        + "FROM   (SELECT al.artist "
        + "               , (SELECT al1.id "
        + "                  FROM   albums al1 "
        + "                  where  al1.artist = al.artist "
        + "                  ORDER  BY RAND() "
        + "                  LIMIT  1)                              AS anyalb "
        + "               , AVG(IF(s.rating < 1, NULL, s.rating))   AS rat "
        + "               , AVG(IF(s.score IS NULL, 0, s.score))    AS sco "
        + "               , SUM(s.playcount)                        AS plc "
        + "               , SUM(t.length)                           AS len "
        + "               , COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr "
        + "               , COUNT(DISTINCT t.album)                 AS numAl "
        + "               , COUNT(*)                                AS numTr "
        + "               , " + createWeightString(3) + "           AS wei "
        + "               , AVG(IF(y.name < 1, NULL, y.name))       AS yea "
        + "               , ar1.name                                AS itemname "
        + "        FROM   tracks t "
        + "               LEFT JOIN statistics s "
        + "                      ON ( s.url = t.url ) "
        + "               LEFT JOIN years y "
        + "                      ON ( t.year = y.id ) "
        + "               LEFT JOIN genres g "
        + "                      ON ( t.genre = g.id ) "
        + "               LEFT JOIN albums al "
        + "                      ON ( t.album = al.id ) "
        + "               LEFT JOIN artists ar1 "
        + "                      ON ( al.artist = ar1.id ) "
        + "               LEFT JOIN artists ar "
        + "                      ON ( t.artist = ar.id ) "
        + "               LEFT JOIN images i "
        + "                      ON ( al.image = i.id ) "
        + "        WHERE true " + playlistImporter.createFilterString(filterText)
        + "        GROUP  BY al.artist "
        +          createOrderString(3, orderBy)
        + "        LIMIT  " + config.resultsLimit
        + "       ) c ";

    return sql_query;
}

function fillAlbumsPage(filterText, orderBy)
{
    var sql_query = ""
        + "SELECT c.album "
        + "       , c.img "
        + "       , c.itemname "
        + "       , ROUND(c.rat, 1) "
        + "       , plc "
        + "       , ROUND(c.sco, 0) "
        + "       , wei "
        + "       , len "
        + "       , numTr "
        + "       , c.name "
        + "       , ROUND(yea, 0) "
        + "FROM   (SELECT t.album "
        + "               , al.name                                              AS itemname "
        + "               , IF(i.path IS NOT NULL, i.path, CONCAT( "
        + "                    IF(ar1.name IS NOT NULL, LOWER(ar1.name), '' "
        + "                    ), LOWER(al.name)))                               AS img "
        + "               , AVG(IF(s.rating < 1, NULL, s.rating))                AS rat "
        + "               , AVG(IF(s.score IS NULL, 0, s.score))                 AS sco "
        + "               , SUM(s.playcount)                                     AS plc "
        + "               , SUM(t.length)                                        AS len "
        + "               , COUNT(IF(s.rating < 1, NULL, s.rating))              AS numRatTr "
        + "               , COUNT(*)                                             AS numTr "
        + "               , " + createWeightString(4) + "                        AS wei "
        + "               , AVG(IF(y.name < 1, NULL, y.name))                    AS yea "
        + "               , ar1.name "
        + "        FROM   tracks t "
        + "               LEFT JOIN statistics s "
        + "                      ON ( s.url = t.url ) "
        + "               LEFT JOIN years y "
        + "                      ON ( t.year = y.id ) "
        + "               LEFT JOIN genres g "
        + "                      ON ( t.genre = g.id ) "
        + "               LEFT JOIN artists ar "
        + "                      ON ( t.artist = ar.id ) "
        + "               LEFT JOIN albums al "
        + "                      ON ( t.album = al.id ) "
        + "               LEFT JOIN artists ar1 "
        + "                      ON ( al.artist = ar1.id ) "
        + "               LEFT JOIN images i "
        + "                      ON ( al.image = i.id ) "
        + "        WHERE true" + playlistImporter.createFilterString(filterText)
        + "        GROUP  BY t.album "
        +          createOrderString(4, orderBy)
        + "        LIMIT " + config.resultsLimit
        + "       ) c ";

    return sql_query;
}

function fillGenresPage(filterText, orderBy)
{
    var sql_query = ""
        + "SELECT c.genre "
        + "       , 'genre' AS img "
        + "       , c.itemname "
        + "       , ROUND(c.rat, 1) "
        + "       , plc "
        + "       , ROUND(c.sco, 0) "
        + "       , wei "
        + "       , len "
        + "       , numTr "
        + "       , numAl "
        + "       , ROUND(yea, 0) "
        + "FROM   (SELECT t.genre "
        + "               , g.name                                  AS itemname "
        + "               , AVG(IF(s.rating < 1, NULL, s.rating))   AS rat "
        + "               , AVG(IF(s.score IS NULL, 0, s.score))    AS sco "
        + "               , SUM(s.playcount)                        AS plc "
        + "               , SUM(t.length)                           AS len "
        + "               , COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr "
        + "               , COUNT(*)                                AS numTr "
        + "               , COUNT(DISTINCT t.album)                 AS numAl "
        + "               , " + createWeightString(5) + "           AS wei "
        + "               , AVG(IF(y.name < 1, NULL, y.name))       AS yea "
        + "        FROM   tracks t "
        + "               LEFT JOIN statistics s "
        + "                      ON ( s.url = t.url ) "
        + "               LEFT JOIN years y "
        + "                      ON ( t.year = y.id ) "
        + "               LEFT JOIN genres g "
        + "                      ON ( t.genre = g.id ) "
        + "               LEFT JOIN artists ar "
        + "                      ON ( t.artist = ar.id ) "
        + "               LEFT JOIN albums al "
        + "                      ON ( t.album = al.id ) "
        + "               LEFT JOIN artists ar1 "
        + "                      ON ( al.artist = ar1.id ) "
        + "        WHERE true " + playlistImporter.createFilterString(filterText)
        + "        GROUP  BY t.genre "
        +          createOrderString(5, orderBy)
        + "        LIMIT " + config.resultsLimit
        + "       ) c ";

    return sql_query;
}

function fillLabelsPage(filterText, orderBy)
{
    var sql_query = ""
        + "SELECT c.id "
        + "       , 'label' AS img "
        + "       , c.itemname "
        + "       , ROUND(c.rat, 1) "
        + "       , plc "
        + "       , ROUND(c.sco, 0) "
        + "       , wei "
        + "       , len "
        + "       , numTr "
        + "       , numAl "
        + "       , ROUND(yea, 0) "
        + "FROM   (SELECT ul.label                                  AS id "
        + "               , l.label                                 AS itemname "
        + "               , AVG(IF(s.rating < 1, NULL, s.rating))   AS rat "
        + "               , AVG(IF(s.score IS NULL, 0, s.score))    AS sco "
        + "               , SUM(s.playcount)                        AS plc "
        + "               , SUM(t.length)                           AS len "
        + "               , COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr "
        + "               , COUNT(*)                                AS numTr "
        + "               , COUNT(DISTINCT t.album)                 AS numAl "
        + "               , " + createWeightString(6) + "           AS wei "
        + "               , AVG(IF(y.name < 1, NULL, y.name))       AS yea "
        + "        FROM   urls_labels ul "
        + "               LEFT JOIN labels l "
        + "                      ON ( l.id = ul.label ) "
        + "               JOIN tracks t "
        + "                 ON ( t.url = ul.url ) "
        + "               LEFT JOIN statistics s "
        + "                      ON ( s.url = t.url ) "
        + "               LEFT JOIN years y "
        + "                      ON ( t.year = y.id ) "
        + "               LEFT JOIN genres g "
        + "                      ON ( t.genre = g.id ) "
        + "               LEFT JOIN artists ar "
        + "                      ON ( t.artist = ar.id ) "
        + "               LEFT JOIN albums al "
        + "                      ON ( t.album = al.id ) "
        + "               LEFT JOIN artists ar1 "
        + "                      ON ( al.artist = ar1.id ) "
        + "        WHERE true " + playlistImporter.createFilterString(filterText)
        + "        GROUP  BY ul.label "
        +          createOrderString(6, orderBy)
        + "        LIMIT " + config.resultsLimit
        + "       ) c ";

    return sql_query;
}

function fillYearGraph(filterText, indexOrd)
{
    var sql_query = ""
        + "SELECT c.yid "
        + "       , c.itemname "
        + "       , c." + createOrderString(7, indexOrd)
        + "FROM   (SELECT t.year                                    AS yid "
        + "               , y.name                                  AS itemname "
        + "               , AVG(IF(s.rating < 1, NULL, s.rating))   AS rat "
        + "               , AVG(IF(s.score IS NULL, 0, s.score))    AS sco "
        + "               , SUM(s.playcount)                        AS plc "
        + "               , SUM(t.length)                           AS len "
        + "               , COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr "
        + "               , COUNT(*)                                AS numTr "
        + "               , COUNT(DISTINCT t.album)                 AS numAl "
        + "               , " + createWeightString(7) + "           AS wei "
        + "        FROM   tracks t "
        + "               LEFT JOIN statistics s "
        + "                      ON ( s.url = t.url ) "
        + "               LEFT JOIN years y "
        + "                      ON ( t.year = y.id ) "
        + "               LEFT JOIN genres g "
        + "                      ON ( t.genre = g.id ) "
        + "               LEFT JOIN artists ar "
        + "                      ON ( t.artist = ar.id ) "
        + "               LEFT JOIN albums al "
        + "                      ON ( t.album = al.id ) "
        + "               LEFT JOIN artists ar1 "
        + "                      ON ( al.artist = ar1.id ) "
        + "        WHERE true " + playlistImporter.createFilterString(filterText)
        + "        GROUP  BY t.year "
        + "        HAVING itemname != 0 "
        +                 (indexOrd == 0 ? (" AND numRatTr >= " + config.minTracksPerAlbum) : "" )
        + "        ORDER  BY 2 "
        + "       ) c ";

    return sql_query;
}

function fillDecadeGraph(filterText, indexOrd)
{
    var sql_query = ""
        + "SELECT c.itemname "
        + "       , c.itemname "
        + "       , c." + createOrderString(8, indexOrd)
        + "FROM   (SELECT FLOOR(y.name / 10) * 10                   AS itemname "
        + "               , AVG(IF(s.rating < 1, NULL, s.rating))   AS rat "
        + "               , AVG(IF(s.score IS NULL, 0, s.score))    AS sco "
        + "               , SUM(s.playcount)                        AS plc "
        + "               , SUM(t.length)                           AS len "
        + "               , COUNT(IF(s.rating < 1, NULL, s.rating)) AS numRatTr "
        + "               , COUNT(*)                                AS numTr "
        + "               , COUNT(DISTINCT t.album)                 AS numAl "
        + "               , " + createWeightString(8) + "           AS wei "
        + "        FROM   tracks t "
        + "               LEFT JOIN statistics s "
        + "                      ON ( s.url = t.url ) "
        + "               LEFT JOIN years y "
        + "                      ON ( t.year = y.id ) "
        + "               LEFT JOIN genres g "
        + "                      ON ( t.genre = g.id ) "
        + "               LEFT JOIN artists ar "
        + "                      ON ( t.artist = ar.id ) "
        + "               LEFT JOIN albums al "
        + "                      ON ( t.album = al.id ) "
        + "               LEFT JOIN artists ar1 "
        + "                      ON ( al.artist = ar1.id ) "
        + "        WHERE true " + playlistImporter.createFilterString(filterText)
        + "        GROUP  BY itemname "
        + "        HAVING itemname != 0 "
        +                 (indexOrd == 0 ? (" AND numRatTr >= " + config.minTracksPerAlbum) : "")
        + "        ORDER  BY 1 "
        + "       ) c ";

    return sql_query;
}

function fillRatingGraph(filterText, indexOrd)
{
    var sql_query = ""
        + "SELECT c.itemname "
        + "       , c.itemname "
        + "       , c." + createOrderString(9, indexOrd)
        + "FROM   (SELECT s.rating                               AS itemname "
        + "               , AVG(IF(y.name < 1, NULL, y.name))    AS yea "
        + "               , AVG(IF(s.score IS NULL, 0, s.score)) AS sco "
        + "               , SUM(s.playcount)                     AS plc "
        + "               , SUM(t.length)                        AS len "
        + "               , COUNT(*)                             AS numTr "
        + "               , COUNT(DISTINCT t.album)              AS numAl "
        + "               , " + createWeightString(9) + "        AS wei "
        + "        FROM   tracks t "
        + "               LEFT JOIN statistics s "
        + "                      ON ( s.url = t.url ) "
        + "               LEFT JOIN years y "
        + "                      ON ( t.year = y.id ) "
        + "               LEFT JOIN genres g "
        + "                      ON ( t.genre = g.id ) "
        + "               LEFT JOIN artists ar "
        + "                      ON ( t.artist = ar.id ) "
        + "               LEFT JOIN albums al "
        + "                      ON ( t.album = al.id ) "
        + "               LEFT JOIN artists ar1 "
        + "                      ON ( al.artist = ar1.id ) "
        + "        WHERE true " + playlistImporter.createFilterString(filterText)
        + "        GROUP  BY itemname "
        + "        ORDER  BY 1 "
        + "       ) c ";

    return sql_query;
}

function fillGlobalStatisticsPage(filterText)
{
    var sql_query = ""
        + "SELECT COUNT(*)                                                                     AS total_tracks "
        + "       , COUNT(DISTINCT t.album)                                                    AS total_albums "
        + "       , COUNT(DISTINCT t.artist)                                                   AS total_artists "
        + "       , SUM(t.length)                                                              AS sum_length "
        + "       , COUNT(DISTINCT s.id)                                                       AS rated_tracks "
        + "       , ROUND(100 * ( COUNT(DISTINCT s.id) ) / COUNT(*), 2)                        AS perc_rated_tracks "
        + "       , COUNT(DISTINCT amb.album)                                                  AS rated_albums "
        + "       , ROUND(100 * ( COUNT(DISTINCT amb.album) ) / COUNT(DISTINCT t.album), 2)    AS perc_rated_albums "
        + "       , COUNT(DISTINCT bmb.artist)                                                 AS rated_artists "
        + "       , ROUND(100 * ( COUNT(DISTINCT bmb.artist) ) / COUNT(DISTINCT t.artist), 2)  AS perc_rated_artists "
        + "       , ROUND(AVG(s.rating) / 2, 1)                                                AS avg_rating "
        + "       , ROUND(AVG(IF(s.score IS NULL, 0, s.score)), 0)                             AS avg_score "
        + "       , ROUND(AVG(t.length), 0)                                                    AS avg_length "
        + "FROM   tracks t "
        + "       LEFT JOIN artists ar "
        + "              ON ( t.artist = ar.id ) "
        + "       LEFT JOIN albums al "
        + "              ON ( t.album = al.id ) "
        + "       LEFT JOIN statistics s "
        + "              ON ( s.url = t.url "
        + "                   AND s.rating > 0 ) "
        + "       LEFT JOIN years y "
        + "              ON ( t.year = y.id ) "
        + "       LEFT JOIN genres g "
        + "              ON ( t.genre = g.id ) "
        + "       LEFT JOIN artists ar1 "
        + "              ON ( ar1.id = al.artist ) "
        + "       LEFT JOIN (SELECT DISTINCT t.album "
        + "                  FROM   tracks t "
        + "                         JOIN statistics s "
        + "                           ON ( s.url = t.url ) "
        + "                  WHERE  rating > 0 "
        + "                  GROUP  BY t.album "
        + "                  HAVING COUNT(*) >= " + config.minTracksPerAlbum
        + "                  UNION "
        + "                  SELECT DISTINCT t.album "
        + "                  FROM   tracks t "
        + "                         JOIN statistics s "
        + "                           ON ( s.url = t.url ) "
        + "                  GROUP  BY t.album "
        + "                  HAVING MIN(rating) > 0) amb "
        + "              ON ( t.album = amb.album ) "
        + "       LEFT JOIN (SELECT DISTINCT t.artist "
        + "                  FROM   tracks t "
        + "                         JOIN statistics s "
        + "                           ON ( s.url = t.url ) "
        + "                  WHERE  rating > 0 "
        + "                  GROUP  BY t.artist "
        + "                  HAVING COUNT(*) >= " + config.minTracksPerAlbum
        + "                  UNION "
        + "                  SELECT DISTINCT t.artist "
        + "                  FROM   tracks t "
        + "                         JOIN statistics s "
        + "                           ON ( s.url = t.url ) "
        + "                  GROUP  BY t.artist "
        + "                  HAVING MIN(rating) > 0) bmb "
        + "              ON ( t.artist = bmb.artist ) "
        + "WHERE true " + playlistImporter.createFilterString(filterText)

    return sql_query;
}
