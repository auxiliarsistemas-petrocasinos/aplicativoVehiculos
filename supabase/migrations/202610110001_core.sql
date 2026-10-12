-- Monolito modular. Escrituras operativas exclusivamente mediante RPC transaccional.
create schema if not exists private;
revoke all on schema private from public;
create type public.app_role as enum ('driver','fleet_admin','management','it_superadmin');
create table public.fields(id uuid primary key default gen_random_uuid(),name text not null unique check(length(trim(name)) between 1 and 120),active boolean not null default true);
create table public.profiles(id uuid primary key references auth.users(id),alias text not null unique check(alias ~ '^[a-z]+\.[a-z]+(\.[a-z]+)?$'),full_name text not null,email text not null,phone text not null default '',role public.app_role not null,field_id uuid references public.fields,active boolean not null default true,must_change_password boolean not null default true,reset_in_progress boolean not null default false,invalid_before bigint not null default 0,check(role<>'driver' or field_id is not null));
create table public.vehicles(id uuid primary key default gen_random_uuid(),plate text not null unique check(plate ~ '^[A-Z0-9-]{3,12}$'),description text not null,vehicle_type text not null check(vehicle_type in ('light','heavy')),field_id uuid not null references public.fields,active boolean not null default true,fitness text not null default 'fit' check(fitness in ('fit','observations','unfit')),odometer numeric not null default 0 check(odometer>=0));
create table public.field_transfers(id uuid primary key default gen_random_uuid(),entity_type text not null,entity_id uuid not null,origin_id uuid not null references public.fields,destination_id uuid not null references public.fields,reason text not null,actor_id uuid not null references public.profiles,created_at timestamptz not null default now());
create table public.shifts(id uuid primary key default gen_random_uuid(),driver_id uuid not null references public.profiles,field_id uuid not null references public.fields,status text not null default 'opening' check(status in ('opening','active','closing','closed','regularized')),created_at timestamptz not null default now(),opened_at timestamptz,closed_at timestamptz,regularization_reason text,missing jsonb);
create unique index one_operational_shift on public.shifts(driver_id) where status in ('opening','active','closing');
create table public.vehicle_usages(id uuid primary key default gen_random_uuid(),shift_id uuid not null references public.shifts,vehicle_id uuid not null references public.vehicles,field_id uuid not null references public.fields,plate_snapshot text not null,received_at timestamptz not null default now(),delivered_at timestamptz,start_km numeric not null check(start_km>=0),end_km numeric check(end_km>=0));
create unique index one_open_vehicle_usage on public.vehicle_usages(vehicle_id) where delivered_at is null;
create unique index one_open_usage_per_shift on public.vehicle_usages(shift_id) where delivered_at is null;
create table public.form_templates(id uuid primary key default gen_random_uuid(),version text not null unique,status text not null check(status in ('demo_only','retired')),created_at timestamptz not null default now());
create table public.form_items(template_id uuid not null references public.form_templates,id text not null,label text not null,category text not null,vehicle_type text not null check(vehicle_type in ('both','light','heavy')),sources jsonb not null,position integer not null,primary key(template_id,id));
create table public.driver_assessments(id uuid primary key default gen_random_uuid(),shift_id uuid not null unique references public.shifts,driver_id uuid not null references public.profiles,version text not null,answers jsonb not null,created_at timestamptz not null default now());
create table public.inspections(id uuid primary key default gen_random_uuid(),shift_id uuid not null references public.shifts,usage_id uuid not null references public.vehicle_usages,driver_id uuid not null references public.profiles,template_id uuid not null references public.form_templates,kind text not null check(kind in ('reception','delivery')),odometer numeric not null check(odometer>=0),signature_id uuid,created_at timestamptz not null default now(),unique(usage_id,kind));
create table public.inspection_answers(inspection_id uuid not null references public.inspections,item_id text not null,rating text not null check(rating in ('good','regular','bad','na')),observation text not null default '',primary key(inspection_id,item_id));
create table public.evidences(id uuid primary key,owner_id uuid not null references public.profiles,shift_id uuid not null references public.shifts,kind text not null check(kind in ('photo','signature')),path text not null unique,entity_type text,entity_id uuid,item_id text,created_at timestamptz not null default now());
create table public.incidents(id uuid primary key default gen_random_uuid(),shift_id uuid not null references public.shifts,usage_id uuid not null references public.vehicle_usages,vehicle_id uuid not null references public.vehicles,driver_id uuid not null references public.profiles,description text not null check(length(trim(description)) between 1 and 4000),status text not null default 'pending' check(status in ('pending','following','resolved')),created_at timestamptz not null default now());
create table public.incident_actions(id uuid primary key default gen_random_uuid(),incident_id uuid not null references public.incidents,actor_id uuid not null references public.profiles,comment text not null,status text not null,created_at timestamptz not null default now());
create table public.vehicle_change_authorizations(id uuid primary key default gen_random_uuid(),shift_id uuid not null references public.shifts,old_usage_id uuid not null references public.vehicle_usages,replacement_id uuid not null references public.vehicles,actor_id uuid not null references public.profiles,reason text not null,created_at timestamptz not null default now(),used_at timestamptz);
create unique index one_pending_substitution on public.vehicle_change_authorizations(shift_id) where used_at is null;
create table public.vehicle_restrictions(id uuid primary key default gen_random_uuid(),vehicle_id uuid not null references public.vehicles,reason text not null,actor_id uuid not null references public.profiles,created_at timestamptz not null default now(),lifted_at timestamptz,lifted_by uuid references public.profiles,lift_reason text);
create table public.vehicle_documents(id uuid primary key default gen_random_uuid(),vehicle_id uuid not null references public.vehicles,name text not null,expires_on date,required boolean not null default false,created_at timestamptz not null default now());
create table public.odometer_corrections(id uuid primary key default gen_random_uuid(),usage_id uuid not null references public.vehicle_usages,reading text not null check(reading in ('start','end')),original_value numeric not null,corrected_value numeric not null check(corrected_value>=0),reason text not null,actor_id uuid not null references public.profiles,created_at timestamptz not null default now());
create table public.audit_events(id bigint generated always as identity primary key,actor_id uuid references public.profiles,action text not null,entity_id uuid,detail jsonb not null default '{}',created_at timestamptz not null default now());
create table private.command_receipts(actor_id uuid not null,request_id uuid not null,action text not null,payload jsonb not null,result jsonb not null,created_at timestamptz not null default now(),primary key(actor_id,request_id));
create table private.login_limits(key text primary key,window_start timestamptz not null,hits integer not null);
create index shifts_field_time on public.shifts(field_id,created_at);
create index shifts_driver on public.shifts(driver_id);
create index usages_shift on public.vehicle_usages(shift_id);
create index incidents_shift on public.incidents(shift_id);
create index evidence_shift on public.evidences(shift_id);
create index inspections_shift on public.inspections(shift_id);
create index restrictions_vehicle on public.vehicle_restrictions(vehicle_id) where lifted_at is null;

create function private.ready() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.active and not p.must_change_password and not p.reset_in_progress and coalesce((auth.jwt()->>'iat')::bigint,0)>p.invalid_before);
$$;
create function private.role() returns public.app_role language sql stable security definer set search_path='' as $$ select role from public.profiles where id=auth.uid() and private.ready(); $$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select coalesce(private.role() in ('fleet_admin','it_superadmin'),false); $$;
create function private.is_observer() returns boolean language sql stable security definer set search_path='' as $$ select coalesce(private.role() in ('fleet_admin','management','it_superadmin'),false); $$;
create function private.can_shift(sid uuid) returns boolean language sql stable security definer set search_path='' as $$ select private.ready() and exists(select 1 from public.shifts where id=sid and (driver_id=auth.uid() or private.is_observer())); $$;
create function private.own_open_shift(sid uuid) returns boolean language sql stable security definer set search_path='' as $$ select private.ready() and private.role()='driver' and exists(select 1 from public.shifts where id=sid and driver_id=auth.uid() and status in ('opening','active','closing')); $$;
create function private.my_field() returns uuid language sql stable security definer set search_path='' as $$ select field_id from public.profiles where id=auth.uid() and private.ready(); $$;
grant usage on schema private to authenticated;
grant execute on function private.ready(),private.role(),private.is_admin(),private.is_observer(),private.can_shift(uuid),private.own_open_shift(uuid),private.my_field() to authenticated;

-- Cambiar la clave en Auth, incluso por API directa, cumple el desafío; el reset administrativo conserva el bloqueo.
create function private.on_password_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.encrypted_password is distinct from new.encrypted_password then
  update public.profiles set must_change_password=false where id=new.id and must_change_password and not reset_in_progress;
 end if;
 return new;
end; $$;
create trigger password_changed after update of encrypted_password on auth.users for each row execute function private.on_password_change();

DO $$ declare t text; begin
 foreach t in array array['fields','profiles','vehicles','field_transfers','shifts','vehicle_usages','form_templates','form_items','driver_assessments','inspections','inspection_answers','evidences','incidents','incident_actions','vehicle_change_authorizations','vehicle_restrictions','vehicle_documents','odometer_corrections','audit_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create policy fields_read on public.fields for select to authenticated using(private.ready() and (private.is_observer() or id=private.my_field()));
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or private.is_admin());
create policy vehicles_read on public.vehicles for select to authenticated using(private.ready() and (private.is_observer() or field_id=private.my_field()));
create policy transfers_read on public.field_transfers for select to authenticated using(private.is_observer());
create policy shifts_read on public.shifts for select to authenticated using(private.can_shift(id));
create policy usages_read on public.vehicle_usages for select to authenticated using(private.can_shift(shift_id));
create policy templates_read on public.form_templates for select to authenticated using(private.ready());
create policy items_read on public.form_items for select to authenticated using(private.ready());
create policy fatigue_private on public.driver_assessments for select to authenticated using(private.ready() and driver_id=auth.uid());
create policy inspections_read on public.inspections for select to authenticated using(private.can_shift(shift_id));
create policy answers_read on public.inspection_answers for select to authenticated using(exists(select 1 from public.inspections i where i.id=inspection_id and private.can_shift(i.shift_id)));
create policy evidence_read on public.evidences for select to authenticated using(private.can_shift(shift_id) and (owner_id=auth.uid() or entity_id is not null));
create policy incidents_read on public.incidents for select to authenticated using(private.can_shift(shift_id));
create policy actions_read on public.incident_actions for select to authenticated using(exists(select 1 from public.incidents i where i.id=incident_id and private.can_shift(i.shift_id)));
create policy authorization_read on public.vehicle_change_authorizations for select to authenticated using(private.can_shift(shift_id));
create policy restrictions_read on public.vehicle_restrictions for select to authenticated using(exists(select 1 from public.vehicles v where v.id=vehicle_id));
create policy documents_read on public.vehicle_documents for select to authenticated using(exists(select 1 from public.vehicles v where v.id=vehicle_id));
create policy corrections_read on public.odometer_corrections for select to authenticated using(exists(select 1 from public.vehicle_usages u where u.id=usage_id and private.can_shift(u.shift_id)));
create policy audit_read on public.audit_events for select to authenticated using(private.role()='it_superadmin');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('evidence','evidence',false,8388608,array['image/jpeg','image/png','image/webp']);
create function private.can_upload(path text) returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 return split_part(path,'/',1)=auth.uid()::text and array_length(string_to_array(path,'/'),1)=3 and private.own_open_shift(split_part(path,'/',2)::uuid);
exception when invalid_text_representation then return false;
end; $$;
grant execute on function private.can_upload(text) to authenticated;
create policy evidence_upload on storage.objects for insert to authenticated with check(bucket_id='evidence' and private.can_upload(name));
create policy evidence_download on storage.objects for select to authenticated using(bucket_id='evidence' and exists(select 1 from public.evidences e where e.path=name and private.can_shift(e.shift_id) and (e.owner_id=auth.uid() or e.entity_id is not null)));
-- No UPDATE/DELETE para clientes: no se pueden sustituir ni borrar pruebas históricas.
