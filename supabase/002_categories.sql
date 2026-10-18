-- Run ONCE in Supabase -> SQL Editor (paste, press Run; no begin/commit).
-- 1) new columns
alter table categories add column if not exists is_hidden boolean not null default false;
alter table categories add column if not exists compare_group text references categories(slug) on update cascade on delete set null;

-- 2) the 8 categories with the names the site shows now (creates missing ones, fixes names of existing ones)
insert into categories (slug, name_az, name_ru, name_en, sort_order) values
  ('clippers',    'Saçqırxanlar',                'Машинки для стрижки',  'Clippers',                        0),
  ('trimmers',    'Trimmerlər',                  'Триммеры',             'Trimmers',                        1),
  ('dryers',      'Fenlər',                      'Фены',                 'Hair dryers',                     2),
  ('irons',       'Saç düzləyiciləri və maşalar','Утюжки и плойки',      'Straighteners & curling irons',   3),
  ('scissors',    'Qayçılar',                    'Ножницы',              'Scissors',                        4),
  ('shavers',     'Şeyverlər',                   'Шейверы',              'Shavers',                         5),
  ('blades',      'Bıçaqlar',                    'Ножи',                 'Blades',                          6),
  ('accessories', 'Başlıqlar və aksesuarlar',    'Насадки и аксессуары', 'Guards & accessories',            7)
on conflict (slug) do update set
  name_az = excluded.name_az, name_ru = excluded.name_ru, name_en = excluded.name_en, sort_order = excluded.sort_order;

-- 3) accessories are compared together with blades
update categories set compare_group = 'blades' where slug = 'accessories';

-- check: must show 8 rows
select slug, name_en, sort_order, is_hidden, compare_group from categories order by sort_order;
