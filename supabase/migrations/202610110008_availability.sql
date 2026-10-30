-- Exponer disponibilidad autorizada sin revelar turnos ni identidades ajenas.
create function public.vehicle_availability() returns table(vehicle_id uuid,in_use boolean,eligible boolean) language sql stable security definer set search_path='' as $$
 select v.id,
 exists(select 1 from public.vehicle_usages u where u.vehicle_id=v.id and u.delivered_at is null),
 v.active and f.active and v.fitness<>'unfit'
 and not exists(select 1 from public.vehicle_usages u where u.vehicle_id=v.id and u.delivered_at is null)
 and not exists(select 1 from public.vehicle_restrictions r where r.vehicle_id=v.id and r.lifted_at is null)
 and not exists(select 1 from public.vehicle_documents d where d.vehicle_id=v.id and d.required and (d.expires_on is null or d.expires_on<current_date))
 from public.vehicles v join public.fields f on f.id=v.field_id
 where private.ready() and (private.is_observer() or v.field_id=private.my_field());
$$;
revoke all on function public.vehicle_availability() from public,anon;
grant execute on function public.vehicle_availability() to authenticated;
