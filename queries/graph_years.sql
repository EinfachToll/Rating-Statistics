select
    year_name,
    round(avg(s.rating), 0),
    sum(playcount),
    round(avg(score), 0),
    sum(weight),
    sum(length)
from
    RS_WORKSPACE s
join
    RS_WEIGHTS w on s.weight_attr = w.weight_attr
where
    year_name != 0
group by
    year_name
order by
    year_name