use sql_store;
select * from order_items
where order_id  = 6 AND (quantity* unit_price) >=10; 