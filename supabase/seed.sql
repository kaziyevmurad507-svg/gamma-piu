-- Synthetic LOCAL / CI catalog only. Never apply this file to a live project.
insert into public.brands(id,slug,name) values
  ('10000000-0000-4000-8000-000000000001','fixture-brand','Fixture brand');
insert into public.categories(id,slug,name_az,name_ru,name_en,is_hidden,sort_order) values
  ('20000000-0000-4000-8000-000000000001','clippers','Saçqırxanlar','Машинки','Clippers',false,0),
  ('20000000-0000-4000-8000-000000000002','dryers','Fenlər','Фены','Hairdryers',false,1),
  ('20000000-0000-4000-8000-000000000003','fixture-hidden','Gizli','Скрытая','Hidden fixture',true,2);
insert into public.products(id,category_id,brand_id,slug,name_az,name_ru,name_en,description_az,description_ru,description_en,is_published,is_featured,is_new) values
  ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','fixture-clipper','Sınaq saçqırxan','Тестовая машинка','Fixture clipper','Sınaq təsviri','Тестовое описание','Synthetic fixture description',true,true,true),
  ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','fixture-dryer','Sınaq fen','Тестовый фен','Fixture dryer','Sınaq təsviri','Тестовое описание','Synthetic fixture description',true,true,false),
  ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','fixture-hidden','Gizli məhsul','Скрытый товар','Hidden fixture product','Gizli','Скрыто','Hidden',true,false,false);
insert into public.product_variants(id,product_id,sku,name_az,name_ru,name_en,price,stock,is_active,sort_order) values
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','FIXTURE-BLACK','Qara','Чёрный','Black',100,2,true,0),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','FIXTURE-WHITE','Ağ','Белый','White',150,0,true,1),
  ('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','FIXTURE-DRYER','Qara','Чёрный','Black',120,5,true,0),
  ('40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000003','FIXTURE-HIDDEN','Qara','Чёрный','Black',999,9,true,0);
insert into public.product_images(id,product_id,variant_id,path,sort_order,is_main) values
  ('50000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','fixture-clipper/black.png',0,true),
  ('50000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','fixture-clipper/white.png',1,false),
  ('50000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000003','fixture-dryer/black.png',0,true),
  ('50000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000003',null,'fixture-hidden/black.png',0,true);
insert into public.ambassadors(id,name,image_path,is_published) values
  ('60000000-0000-4000-8000-000000000001','Fixture ambassador','ambassadors/old.png',true);
-- Three same-category products exercise the comparison limit at narrow widths.
insert into public.products(id,category_id,brand_id,slug,name_az,name_ru,name_en,is_published,specs) values
  ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','fixture-dryer-two','Sınaq fen 2','Тестовый фен 2','Fixture dryer two',true,'{"power":"1800 W"}'),
  ('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','fixture-dryer-three','Sınaq fen 3','Тестовый фен 3','Fixture dryer three',true,'{"power":"2000 W"}');
insert into public.product_variants(id,product_id,sku,name_az,name_ru,name_en,price,stock,is_active) values
  ('40000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000004','FIXTURE-DRYER-TWO','Qara','Чёрный','Black',130,5,true),
  ('40000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000005','FIXTURE-DRYER-THREE','Ağ','Белый','White',140,5,true);
