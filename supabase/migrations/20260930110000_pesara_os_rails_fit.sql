-- Co-build model: the committee scores whether money moves through the product,
-- how much could move, and whether the venture's collections can run on Pesara Rails.
insert into public.viability_dimensions (key, label, category) values
  ('rails_flow', 'Money through the product', 'Rails fit'),
  ('rails_volume', 'Transaction volume potential', 'Rails fit'),
  ('rails_control', 'Collection control', 'Rails fit')
on conflict (key) do nothing;
