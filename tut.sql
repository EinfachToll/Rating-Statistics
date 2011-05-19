    CREATE TABLE customer(
        id INTEGER NOT NULL,
        cust_name       VARCHAR(30) NOT NULL,
        phone_nbr       VARCHAR(30) NULL,
        PRIMARY KEY(id)
    );

	SEL
    INSERT INTO customer(id, cust_name, phone_nbr)
    VALUES( 1, 'Bob', '555-1210' );
    INSERT INTO customer(id, cust_name, phone_nbr)
    VALUES( 2, 'Jim', '555-1211' );
    INSERT INTO customer(id, cust_name, phone_nbr)
    VALUES( 3, 'Ted', '555-1212' );
    INSERT INTO customer(id, cust_name, phone_nbr)
    VALUES( 4, 'Sid', '555-1213' );
    INSERT INTO customer(id, cust_name, phone_nbr)
    VALUES( 5, 'Joe', '555-1214' );
    COMMIT;

    CREATE TABLE contact(
        id              INTEGER NOT NULL,
        cont_name       VARCHAR(30) NOT NULL,
        phone_nbr       VARCHAR(30) NULL,
        PRIMARY KEY(id)
    );

    INSERT INTO contact(id, cont_name, phone_nbr)
    VALUES( 10, 'Bob', '555-1210' );
    INSERT INTO contact(id, cont_name, phone_nbr)
    VALUES( 20, 'Jim', '555-1211' );
    INSERT INTO contact(id, cont_name, phone_nbr)
    VALUES( 30, 'Ted', '555-1212' );
    INSERT INTO contact(id, cont_name, phone_nbr)
    VALUES( 40, 'Sid', '555-1213' );
    INSERT INTO contact(id, cont_name, phone_nbr)
    VALUES( 50, 'Joe', '555-1214' );
    COMMIT;

    SELECT id FROM customer;

    SELECT id FROM different_owner.customer;

    SELECT id 
      INTO @cust_variable_id
      FROM customer
     WHERE cust_name LIKE :host_var_name
       AND cust_name LIKE ?
       AND id        =    @var_name;










SELECT m.MSG_ID, m.PRIORITY_ID, CUST.CUST_NBR, CUST.CUST_NM, CUST.CUST_LEGAL_NM, CUST.STORE_ADDR_1, CUST.STORE_ADDR_2, CUST.CROSS_STREET,
       XMLELEMENT(
		   'Alerts', XMLELEMENT( 'Alert_alert_id', alert_id ), XMLELEMENT( 'Alert_agent_id', agent_id ), XMLELEMENT( 'Alert_alert_type_id', alert_type_desc),
		   XMLELEMENT( 'Alert_alert_date', alert_date), XMLELEMENT( 'Alert_url_reference', url_reference), XMLELEMENT( 'Alert_read_status', read_status )
       ) CUST.STORE_CITY, CUST.STORE_ST, CUST.POST_CODE, CUST.STORE_MGR_NM,
  FROM MESSAGES m
  JOIN PRIORITY_CD P
 WHERE m.to_person_id = ?
   AND p.NAME         = 'PRI_EMERGENCY'
   AND p.JOB          = 'Plumber'
   AND m.status_id    < (
		SELECT s.STATUS_ID
		  FROM MSG_STATUS_CD s
		 WHERE s.NAME         = 'MSG_READ'
       )
 ORDER BY m.msg_id desc




SELECT c.id, i.path, c.title, concat('by ', a.name), concat(
		   '
		on ', b.name
       ), c.rating, round(c.score, 0), c.playcount, c.length, c.weight
  FROM (
		SELECT t.id, t.title, t.album, t.artist, s.rating, s.score, t.length, s.playcount, (5.0 * 3 * avg(if(s.rating <  1, null, s.rating))) + (0.6 * 0 * avg(s.score)) + (0.5 * 0 * sqrt(sum(t.length)/1000)) + (
				   2.5 * 0 *
				   sqrt(sum(s.playcount))
			   ) as weight
		  FROM statistics s
		  JOIN tracks t
			ON (s.url                                                                                                 =  t.url)
		 WHERE 1                                                                                                      =  1
		HAVING anzlieder                                                                                              >= 5
		 ORDER BY jahr LIMIT 10
       ) c
  JOIN albums b
    ON (c.album                                                                                               =  b.id)
  JOIN artists a
    ON (c.artist                                                                                              =  a.id)
  LEFT JOIN images i
    ON (b.image                                                                                               =  i.id)

Use amarokdb2;
select * from years;

SELECT c.id, i.path, c.title, concat('by ', a.name), concat(
		   '
		on ', b.name
       ), c.rating, round(c.score, 0), c.playcount, c.length, c.weight
  FROM (
		SELECT t.id, t.title, t.album, t.artist, s.rating, s.score, t.length, s.playcount, (
				   5.0 * 3 *
				   avg(if(s.rating <  1, null, s.rating))
			   ) + (0.6 * 0 * avg(s.score)) + (
				   0.5 * 0 *
				   sqrt(sum(t.length)/1000)
			   ) + (2.5 * 0 * sqrt(sum(s.playcount))) as weight
		  FROM statistics s
		  JOIN tracks t
			ON (s.url          =  t.url)
		 WHERE 1               =  1
		HAVING anzlieder       >= 5
		 ORDER BY jahr LIMIT 10
       ) c
  JOIN albums b
    ON (c.album        =  b.id)
  JOIN artists a
    ON (c.artist       =  a.id)
  LEFT JOIN images i
    ON (b.image        =  i.id)


SELECT 
		   a.name,
	(SELECT path
	  from images i
	  LEFT JOIN albums b
		ON (i.id                                                          =  b.image)
	 WHERE b.artist                                                       =  c.artist
	   AND path NOT LIKE 'amarok-sqltrackuid://%'
	 ORDER BY RAND() LIMIT 1
       ) as bild, wiedergabezaehler, anzlieder, c.anzalben, round(c.bewertung, 1),
       round(c.punkte, 0), laenge, wichtung, round(c.jahr, 0)
  FROM (
		SELECT t.artist, count(distinct t.album) as anzalben, avg(if(s.rating <  1, null,
		       s.rating)) as bewertung,
			   avg(s.score) as punkte, sum(s.playcount) as wiedergabezaehler, sum(t.length) as laenge,
			   count(if(s.rating                                              <  1, null, s.rating)) as
			   anzbew, count(*) as anzlieder, (
				   5.0 * 3 *
				   avg(if(s.rating                                                <  1, null, s.rating))
			   ) + (0.6 * 0 * avg(s.score)) + (
				   0.5 * 0 *
				   sqrt(sum(t.length)/1000)
			   ) + (2.5 * 0 * sum(s.playcount)) as wichtung,
			   avg(if(y.name                                                  <  1, null, y.name)) as jahr
		  FROM tracks t
		  LEFT JOIN statistics s
			ON (s.url                                                         =  t.url)
		  LEFT JOIN years y
			on (t.year                                                        =  y.id)
		 WHERE true
		 GROUP BY t.artist
		HAVING anzbew                                                         >= 5
		 ORDER BY bewertung DESC LIMIT 10
       ) c
  JOIN artists a
    on (c.artist                                                      =  a.id)

