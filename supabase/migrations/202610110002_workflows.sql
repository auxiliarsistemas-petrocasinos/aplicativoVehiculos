create function private.claim_evidence(eid uuid,sid uuid,expected_kind text,entity text,entity_id uuid,item text default null) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.evidences e set entity_type=entity,entity_id=claim_evidence.entity_id,item_id=item where e.id=eid and e.owner_id=auth.uid() and e.shift_id=sid and e.kind=expected_kind and e.entity_id is null;
 if not found then raise exception 'Evidencia inexistente, ajena o ya utilizada'; end if;
end; $$;
create function private.eligible(vid uuid,fid uuid) returns public.vehicles language plpgsql security definer set search_path='' as $$
declare v public.vehicles;
begin
 select * into v from public.vehicles where id=vid for update;
 if not found or v.field_id<>fid or not v.active or v.fitness='unfit' or exists(select 1 from public.fields where id=fid and not active) then raise exception 'Vehículo no elegible en este campo'; end if;
 if exists(select 1 from public.vehicle_usages where vehicle_id=vid and delivered_at is null) or exists(select 1 from public.vehicle_restrictions where vehicle_id=vid and lifted_at is null) then raise exception 'Vehículo en uso o restringido'; end if;
 if exists(select 1 from public.vehicle_documents where vehicle_id=vid and required and (expires_on is null or expires_on<current_date)) then raise exception 'Documentación obligatoria sin vigencia acreditada'; end if;
 return v;
end; $$;
create function private.inspect(s public.shifts,u public.vehicle_usages,k text,p jsonb,needs_signature boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare iid uuid:=gen_random_uuid(); tid uuid:=(p->>'template_id')::uuid; a jsonb; item public.form_items; count_expected integer; vidtype text; photo jsonb; sig uuid;
begin
 if not exists(select 1 from public.form_templates where id=tid and status='demo_only') then raise exception 'Plantilla no disponible para demostración'; end if;
 select vehicle_type into vidtype from public.vehicles where id=u.vehicle_id;
 select count(*) into count_expected from public.form_items where template_id=tid and vehicle_type in ('both',vidtype);
 if jsonb_typeof(p->'answers') is distinct from 'array' or jsonb_array_length(p->'answers')<>count_expected or count_expected=0 then raise exception 'Inspección incompleta'; end if;
 if p->>'odometer' is null or (p->>'odometer')::numeric<0 then raise exception 'Registra el odómetro'; end if;
 if (p->>'odometer')::numeric < (case when k='delivery' then u.start_km else (select odometer from public.vehicles where id=u.vehicle_id) end) then
  insert into public.audit_events(actor_id,action,entity_id,detail) values(auth.uid(),'odometer_inconsistency',u.id,jsonb_build_object('reading',p->'odometer','kind',k));
 end if;
 sig:=(p->>'signature')::uuid;
 if needs_signature and sig is null then raise exception 'La firma de apertura es obligatoria'; end if;
 insert into public.inspections(id,shift_id,usage_id,driver_id,template_id,kind,odometer,signature_id) values(iid,s.id,u.id,auth.uid(),tid,k,(p->>'odometer')::numeric,sig);
 if sig is not null then perform private.claim_evidence(sig,s.id,'signature','inspection',iid); end if;
 for a in select * from jsonb_array_elements(p->'answers') loop
  select * into item from public.form_items where template_id=tid and id=a->>'item_id' and vehicle_type in ('both',vidtype);
  if not found or coalesce(a->>'rating','') not in ('good','regular','bad','na') then raise exception 'Respuesta no válida'; end if;
  if jsonb_typeof(a->'photos') is distinct from 'array' or jsonb_array_length(a->'photos')>5 then raise exception 'Lista de fotografías no válida'; end if;
  if a->>'rating' in ('regular','bad') and (length(trim(coalesce(a->>'observation','')))=0 or jsonb_array_length(a->'photos')=0) then raise exception 'Regular/Malo requiere observación y fotografía'; end if;
  if length(coalesce(a->>'observation',''))>2000 then raise exception 'Observación demasiado extensa'; end if;
  insert into public.inspection_answers values(iid,item.id,a->>'rating',coalesce(a->>'observation',''));
  for photo in select * from jsonb_array_elements(a->'photos') loop perform private.claim_evidence((photo#>>'{}')::uuid,s.id,'photo','inspection',iid,item.id); end loop;
 end loop;
 -- PK rechaza ítems repetidos; cardinalidad + pertenencia asegura totalidad.
 return iid;
end; $$;

create function public.execute_command(action text,payload jsonb,request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
<<operation>>
declare actor public.profiles; s public.shifts; u public.vehicle_usages; v public.vehicles; v2 public.vehicles; a public.vehicle_change_authorizations; iid uuid; sid uuid; eid uuid; result jsonb; receipt private.command_receipts; photo jsonb; idx integer; origin uuid; reason text; target uuid; tmp jsonb;
begin
 if not private.ready() then raise exception 'Acceso no autorizado o cambio de contraseña pendiente' using errcode='42501'; end if;
 if request_id is null then raise exception 'Falta identificador de reintento'; end if;
 select * into actor from public.profiles where id=auth.uid();
 if actor.role='management' then raise exception 'Gerencia tiene acceso de solo lectura' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor.id::text,0));
 select * into receipt from private.command_receipts r where r.actor_id=actor.id and r.request_id=execute_command.request_id;
 if found then
  if receipt.action<>action or receipt.payload<>payload then raise exception 'Identificador reutilizado con datos diferentes'; end if;
  return receipt.result;
 end if;
 reason:=trim(coalesce(payload->>'reason',''));
 if action in ('create_field','update_field','create_vehicle','update_vehicle','transfer_vehicle','transfer_driver','restrict_vehicle','lift_restriction','add_document','authorize_substitution','regularize','follow_incident','correct_odometer','set_driver_active') and not private.is_admin() then raise exception 'Requiere administración' using errcode='42501'; end if;
 if action in ('start_shift','confirm_opening','begin_closing','close_shift','substitute','report_incident','register_evidence') and actor.role<>'driver' then raise exception 'Requiere conductor' using errcode='42501'; end if;
 if action in ('transfer_vehicle','transfer_driver','restrict_vehicle','lift_restriction','authorize_substitution','regularize','correct_odometer') and length(reason)=0 then raise exception 'Escribe una justificación'; end if;
 if action in ('confirm_opening','begin_closing','close_shift','substitute','report_incident','register_evidence','authorize_substitution','regularize') then
  select * into s from public.shifts where id=(payload->>'shift_id')::uuid for update;
  if not found or (actor.role='driver' and s.driver_id<>actor.id) then raise exception 'Turno no autorizado' using errcode='42501'; end if;
  select * into u from public.vehicle_usages where shift_id=s.id and delivered_at is null for update;
 end if;
 case action
 when 'create_field' then
  insert into public.fields(name) values(trim(payload->>'name')) returning id into eid;
 when 'update_field' then
  eid:=(payload->>'id')::uuid;
  update public.fields set name=trim(payload->>'name'),active=(payload->>'active')::boolean where id=eid;
  if not found then raise exception 'Campo inexistente'; end if;
 when 'create_vehicle' then
  insert into public.vehicles(plate,description,vehicle_type,field_id,odometer) values(upper(regexp_replace(payload->>'plate','\s','','g')),payload->>'description',payload->>'vehicle_type',(payload->>'field_id')::uuid,(payload->>'odometer')::numeric) returning id into eid;
 when 'update_vehicle' then
  eid:=(payload->>'id')::uuid;
  perform 1 from public.vehicles where id=eid for update;
  update public.vehicles set description=payload->>'description',active=(payload->>'active')::boolean,fitness=payload->>'fitness' where id=eid;
  if not found then raise exception 'Vehículo inexistente'; end if;
 when 'set_driver_active' then
  eid:=(payload->>'id')::uuid;
  update public.profiles set active=(payload->>'active')::boolean where id=eid and role='driver';
  if not found then raise exception 'Conductor inexistente'; end if;
 when 'transfer_vehicle','transfer_driver' then
  eid:=(payload->>'id')::uuid; target:=(payload->>'field_id')::uuid;
  if not exists(select 1 from public.fields where id=target and active) then raise exception 'Campo destino inactivo'; end if;
  if action='transfer_vehicle' then
   select field_id into origin from public.vehicles where id=eid for update;
   if exists(select 1 from public.vehicle_usages where vehicle_id=eid and delivered_at is null) then raise exception 'Traslado con utilización vigente pendiente de política aprobada'; end if;
   update public.vehicles set field_id=target where id=eid;
  else
   perform pg_advisory_xact_lock(hashtextextended(eid::text,0));
   select field_id into origin from public.profiles where id=eid and role='driver' for update;
   if exists(select 1 from public.shifts where driver_id=eid and status in ('opening','active','closing')) then raise exception 'Traslado con turno vigente pendiente de política aprobada'; end if;
   update public.profiles set field_id=target where id=eid and role='driver';
  end if;
  if origin is null or origin=target then raise exception 'Revisa origen y destino'; end if;
  insert into public.field_transfers(entity_type,entity_id,origin_id,destination_id,reason,actor_id) values(case when action='transfer_vehicle' then 'vehicle' else 'driver' end,eid,origin,target,reason,actor.id);
 when 'restrict_vehicle' then
  perform 1 from public.vehicles where id=(payload->>'vehicle_id')::uuid for update;
  insert into public.vehicle_restrictions(vehicle_id,reason,actor_id) values((payload->>'vehicle_id')::uuid,reason,actor.id) returning id into eid;
 when 'lift_restriction' then
  eid:=(payload->>'id')::uuid;
  update public.vehicle_restrictions set lifted_at=now(),lifted_by=actor.id,lift_reason=operation.reason where id=eid and lifted_at is null;
  if not found then raise exception 'Restricción no vigente'; end if;
 when 'add_document' then
  perform 1 from public.vehicles where id=(payload->>'vehicle_id')::uuid for update;
  insert into public.vehicle_documents(vehicle_id,name,expires_on,required) values((payload->>'vehicle_id')::uuid,payload->>'name',nullif(payload->>'expires_on','')::date,(payload->>'required')::boolean) returning id into eid;
 when 'start_shift' then
  if not exists(select 1 from public.fields where id=actor.field_id and active) then raise exception 'Campo inactivo'; end if;
  insert into public.shifts(driver_id,field_id) values(actor.id,actor.field_id) returning id into eid;
 when 'register_evidence' then
  if s.status not in ('opening','active','closing') then raise exception 'Turno finalizado'; end if;
  eid:=(payload->>'id')::uuid;
  if payload->>'path'<>actor.id::text||'/'||s.id::text||'/'||eid::text or payload->>'kind' not in ('photo','signature') then raise exception 'Ruta no autorizada'; end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='evidence' and o.name=payload->>'path' and o.metadata->>'mimetype' in ('image/jpeg','image/png','image/webp') and (o.metadata->>'size')::bigint between 1 and 8388608) then raise exception 'Archivo no persistido o no permitido'; end if;
  insert into public.evidences(id,owner_id,shift_id,kind,path) values(eid,actor.id,s.id,payload->>'kind',payload->>'path');
 when 'confirm_opening' then
  if s.status<>'opening' then raise exception 'El turno no está en apertura'; end if;
  v:=private.eligible((payload->>'vehicle_id')::uuid,s.field_id);
  if jsonb_typeof(payload->'assessment') is distinct from 'object' or (select count(*) from jsonb_object_keys(payload->'assessment'))<>6 then raise exception 'Completa las seis preguntas del conductor'; end if;
  for idx in 1..6 loop if jsonb_typeof(payload->'assessment'->('F09-'||idx)) is distinct from 'boolean' then raise exception 'Responde Sí/No a cada pregunta'; end if; end loop;
  insert into public.driver_assessments(shift_id,driver_id,version,answers) values(s.id,actor.id,'GA-FO-09-v00',payload->'assessment');
  insert into public.vehicle_usages(shift_id,vehicle_id,field_id,plate_snapshot,start_km) values(s.id,v.id,s.field_id,v.plate,(payload->'inspection'->>'odometer')::numeric) returning * into u;
  perform private.inspect(s,u,'reception',payload->'inspection',true);
  update public.vehicles set odometer=u.start_km where id=v.id;
  update public.shifts set status='active',opened_at=now() where id=s.id; eid:=s.id;
 when 'begin_closing' then
  if s.status not in ('active','closing') then raise exception 'Turno no activo'; end if;
  update public.shifts set status='closing' where id=s.id;eid:=s.id;
 when 'close_shift' then
  if s.status<>'closing' or u.id is null then raise exception 'Inicia el cierre del turno'; end if;
  perform 1 from public.vehicles where id=u.vehicle_id for update;
  perform private.inspect(s,u,'delivery',payload->'inspection');
  update public.vehicle_usages set delivered_at=now(),end_km=(payload->'inspection'->>'odometer')::numeric where id=u.id;
  update public.vehicles set odometer=(payload->'inspection'->>'odometer')::numeric where id=u.vehicle_id;
  update public.shifts set status='closed',closed_at=now() where id=s.id;eid:=s.id;
 when 'report_incident' then
  if s.status not in ('active','closing') or u.id is null then raise exception 'Se requiere una utilización activa'; end if;
  if jsonb_typeof(payload->'photos') is distinct from 'array' or jsonb_array_length(payload->'photos') not between 1 and 8 then raise exception 'La incidencia requiere fotografía'; end if;
  insert into public.incidents(shift_id,usage_id,vehicle_id,driver_id,description) values(s.id,u.id,u.vehicle_id,actor.id,trim(payload->>'description')) returning id into eid;
  for photo in select * from jsonb_array_elements(payload->'photos') loop perform private.claim_evidence((photo#>>'{}')::uuid,s.id,'photo','incident',eid); end loop;
 when 'follow_incident' then
  eid:=(payload->>'id')::uuid;
  if length(trim(coalesce(payload->>'comment','')))=0 then raise exception 'Escribe el seguimiento'; end if;
  update public.incidents set status=payload->>'status' where id=eid;
  if not found then raise exception 'Incidencia inexistente'; end if;
  insert into public.incident_actions(incident_id,actor_id,comment,status) values(eid,actor.id,payload->>'comment',payload->>'status');
 when 'authorize_substitution' then
  if s.status<>'active' or u.id is null then raise exception 'Turno no activo'; end if;
  v:=private.eligible((payload->>'replacement_id')::uuid,s.field_id);
  insert into public.vehicle_change_authorizations(shift_id,old_usage_id,replacement_id,actor_id,reason) values(s.id,u.id,v.id,actor.id,reason) returning id into eid;
 when 'substitute' then
  if s.status<>'active' or u.id is null then raise exception 'Turno no activo'; end if;
  select * into a from public.vehicle_change_authorizations where shift_id=s.id and id=(payload->>'authorization_id')::uuid and old_usage_id=u.id and used_at is null for update;
  if not found then raise exception 'Cambio no autorizado'; end if;
  -- Orden estable para evitar interbloqueos entre dos sustituciones.
  perform 1 from public.vehicles where id in (u.vehicle_id,a.replacement_id) order by id for update;
  v:=private.eligible(a.replacement_id,s.field_id);
  perform private.inspect(s,u,'delivery',payload->'delivery');
  update public.vehicle_usages set delivered_at=now(),end_km=(payload->'delivery'->>'odometer')::numeric where id=u.id;
  update public.vehicles set odometer=(payload->'delivery'->>'odometer')::numeric where id=u.vehicle_id;
  insert into public.vehicle_usages(shift_id,vehicle_id,field_id,plate_snapshot,start_km) values(s.id,v.id,s.field_id,v.plate,(payload->'reception'->>'odometer')::numeric) returning * into u;
  perform private.inspect(s,u,'reception',payload->'reception');
  update public.vehicles set odometer=u.start_km where id=v.id;
  update public.vehicle_change_authorizations set used_at=now() where id=a.id;eid:=s.id;
 when 'regularize' then
  if s.status not in ('opening','active','closing') then raise exception 'Turno finalizado'; end if;
  tmp:=case when s.status='opening' then '["autoevaluación","recepción","firma","odómetro inicial","entrega","odómetro final","evidencia de entrega"]'::jsonb else '["inspección de entrega","odómetro final","evidencia de entrega"]'::jsonb end;
  update public.shifts set status='regularized',closed_at=now(),regularization_reason=reason,missing=tmp where id=s.id;
  -- Se conserva el segmento abierto. No acredita entrega ni libera vehículo.
  eid:=s.id;
 when 'correct_odometer' then
  select * into u from public.vehicle_usages where id=(payload->>'usage_id')::uuid;
  if not found or (payload->>'reading'='end' and u.end_km is null) then raise exception 'No se corrige una lectura inexistente'; end if;
  insert into public.odometer_corrections(usage_id,reading,original_value,corrected_value,reason,actor_id) values(u.id,payload->>'reading',case when payload->>'reading'='start' then u.start_km else u.end_km end,(payload->>'value')::numeric,reason,actor.id) returning id into eid;
 else raise exception 'Operación desconocida';
 end case;
 -- Nunca volcar cuestionarios, contraseñas ni descripciones sensibles en auditoría.
 insert into public.audit_events(actor_id,action,entity_id,detail) values(actor.id,action,eid,jsonb_strip_nulls(jsonb_build_object('reason',nullif(reason,''),'shift_id',s.id)));
 result:=jsonb_build_object('id',eid,'confirmed',true);
 insert into private.command_receipts values(actor.id,request_id,action,payload,result,now());
 return result;
end; $$;
revoke all on function public.execute_command(text,jsonb,uuid) from public,anon;
grant execute on function public.execute_command(text,jsonb,uuid) to authenticated;
revoke all on all functions in schema private from public,anon;
-- Helpers de mutación quedan inaccesibles, incluso por RPC de usuario autenticado.
revoke execute on function private.claim_evidence(uuid,uuid,text,text,uuid,text),private.eligible(uuid,uuid),private.inspect(public.shifts,public.vehicle_usages,text,jsonb,boolean),private.on_password_change() from authenticated;
