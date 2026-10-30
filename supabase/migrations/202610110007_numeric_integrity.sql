-- numeric admite valores especiales; ningún odómetro puede ser NaN o infinito por API directa.
alter table public.vehicles add constraint finite_vehicle_odometer check(odometer not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric));
alter table public.vehicle_usages add constraint finite_usage_readings check(start_km not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) and (end_km is null or end_km not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)));
alter table public.inspections add constraint finite_inspection_odometer check(odometer not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric));
alter table public.odometer_corrections add constraint finite_corrected_reading check(corrected_value not in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric));
