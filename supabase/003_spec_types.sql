-- Run ONCE in Supabase -> SQL Editor (paste, press Run; no begin/commit).
-- Spec types: key used inside products.specs + its label in 3 languages + order of rows (compare page).
create table if not exists spec_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label_az text not null,
  label_ru text,
  label_en text,
  sort_order int not null default 0
);

-- everybody can read (labels are public); writing will be opened for admins in the admin step
alter table spec_types enable row level security;
drop policy if exists "public read spec_types" on spec_types;
create policy "public read spec_types" on spec_types for select using (true);

-- the 10 labels the site had in messages
insert into spec_types (key, label_az, label_ru, label_en, sort_order) values
  ('power',       'Güc',               'Мощность',                 'Power',         0),
  ('rpm',         'Fırlanma sürəti',   'Скорость вращения',        'Motor speed',   1),
  ('temperature', 'Temperatur',        'Температура',              'Temperature',   2),
  ('motor',       'Mühərrik',          'Двигатель',                'Motor',         3),
  ('battery_life','Batareya müddəti',  'Время работы от батареи',  'Battery life',  4),
  ('charge_time', 'Şarj müddəti',      'Время зарядки',            'Charge time',   5),
  ('blade_width', 'Bıçaq eni',         'Ширина ножа',              'Blade width',   6),
  ('size',        'Ölçü',              'Размер',                   'Size',          7),
  ('weight',      'Çəki',              'Вес',                      'Weight',        8),
  ('use',         'İstifadə',          'Использование',            'Usage',         9)
on conflict (key) do nothing;

-- check: must show 10 rows
select key, label_en, sort_order from spec_types order by sort_order;
