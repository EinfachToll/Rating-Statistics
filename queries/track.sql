select
    id,
    album_id,
    title,
    rating,
    playcount,
    score,
    rating as weight,
    length,
    album_name,
    artist_name,
    year_name
from
    RS_WORKSPACE
__ORDER__
limit
    __LIMIT__