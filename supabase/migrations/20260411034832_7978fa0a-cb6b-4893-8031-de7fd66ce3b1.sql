ALTER TABLE pending_allocations 
ADD CONSTRAINT pending_allocations_pdv_id_fkey 
FOREIGN KEY (pdv_id) REFERENCES pdvs(id);