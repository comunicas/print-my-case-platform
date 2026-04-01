ALTER TABLE stock_history 
ADD CONSTRAINT stock_history_pdv_date_brand_unique 
UNIQUE (pdv_id, snapshot_date, brand);