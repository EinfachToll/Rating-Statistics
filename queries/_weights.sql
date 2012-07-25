create temporary table RS_WEIGHTS
ENGINE=MEMORY
select
  weight_attr,
  case when weight_attr > mean then
    (weight_attr * weight_attr - mean * mean) * least(normal_curve / current_curve, weight_attr / mean)
  else
    (weight_attr * weight_attr - mean * mean) / greatest(normal_curve * current_curve, mean / weight_attr)
  end as weight
from (
  select
    stats.*,
    weight_attr,
    1 / (stats.deviation * sqrt(2 * 3.1415)) * pow(2.7183, -0.5 * pow(((weight_attr - stats.mean)/ stats.deviation), 2)) as normal_curve,
    count_grouped / stats.count_total as current_curve
  from
    (select weight_attr, count(*) as count_grouped from RS_WORKSPACE group by weight_attr) d,
    (select
        std(__WEIGHT_ATTR__) as deviation,
        avg(__WEIGHT_ATTR__) as mean, 
        count(*) as count_total
    from
        statistics s
    where
        __WEIGHT_ATTR__ != 0
    ) stats
) weights