-- Add unit of measure field to stock_items table
ALTER TABLE public.stock_items 
ADD COLUMN unit_of_measure text DEFAULT 'unidade';

-- Add check constraint for valid units
ALTER TABLE public.stock_items 
ADD CONSTRAINT valid_unit_of_measure 
CHECK (unit_of_measure IN ('unidade', 'pacote', 'metro', 'grama', 'litro'));