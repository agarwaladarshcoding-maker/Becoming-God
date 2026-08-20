use sql_store;
select * from products
where quantity_in_stock  NOT in (49, 38, 72);