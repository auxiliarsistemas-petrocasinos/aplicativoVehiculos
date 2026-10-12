-- Solo campos y vehículos ficticios. Cuentas a través de Auth: npm run seed:demo.
insert into public.fields(id,name) values('20000000-0000-4000-8000-000000000001','Campo Aurora · DEMO'),('20000000-0000-4000-8000-000000000002','Campo Horizonte · DEMO');
insert into public.vehicles(id,plate,description,vehicle_type,field_id,odometer) values
('30000000-0000-4000-8000-000000000001','DEM001','Camioneta de demostración','light','20000000-0000-4000-8000-000000000001',12500),
('30000000-0000-4000-8000-000000000002','DEM002','Camión de demostración','heavy','20000000-0000-4000-8000-000000000001',23000),
('30000000-0000-4000-8000-000000000003','DEM003','Camioneta de demostración','light','20000000-0000-4000-8000-000000000002',8000);
