-- Fundamento de seguridad y escalabilidad. Las políticas empresariales de
-- retención permanecen desactivadas hasta aprobación documentada.

create table public.evidence_upload_intents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  shift_id uuid not null references public.shifts(id),
  kind text not null check (kind in ('photo', 'signature')),
  path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  expected_bytes bigint not null check (expected_bytes between 1 and 8388608),
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'expired', 'failed')),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.evidence_upload_intents enable row level security;
revoke all on public.evidence_upload_intents from anon, authenticated;
grant select on public.evidence_upload_intents to authenticated;
create policy evidence_intents_owner_read on public.evidence_upload_intents
  for select to authenticated
  using (owner_id = (select auth.uid()) and private.own_open_shift(shift_id));

create index evidence_intents_expiry
  on public.evidence_upload_intents(expires_at, status)
  where status = 'pending';
create index evidence_owner_created on public.evidences(owner_id, created_at desc);
create index evidence_entity_created on public.evidences(entity_type, entity_id, created_at desc);
create index incidents_vehicle_status_created
  on public.incidents(vehicle_id, status, created_at desc);
create index incidents_driver_created on public.incidents(driver_id, created_at desc);
create index documents_vehicle_expiry on public.vehicle_documents(vehicle_id, expires_on);
create index audit_actor_action_created on public.audit_events(actor_id, action, created_at desc);
create index transfers_entity_created
  on public.field_transfers(entity_type, entity_id, created_at desc);
create index authorizations_replacement on public.vehicle_change_authorizations(replacement_id);
create index restrictions_actor on public.vehicle_restrictions(actor_id);
create index corrections_actor on public.odometer_corrections(actor_id);

create function public.create_evidence_upload_intent(
  shift_id_input uuid,
  kind_input text,
  mime_type_input text,
  expected_bytes_input bigint
) returns table(id uuid, path text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  intent_id uuid := gen_random_uuid();
  expiry timestamptz := now() + interval '2 hours';
  active_count integer;
  active_bytes bigint;
begin
  if actor_id is null or not private.own_open_shift(shift_id_input) then
    raise exception 'Carga no autorizada' using errcode = '42501';
  end if;
  if kind_input not in ('photo', 'signature')
    or mime_type_input not in ('image/jpeg', 'image/png', 'image/webp')
    or expected_bytes_input not between 1 and 8388608 then
    raise exception 'Archivo no permitido' using errcode = '22023';
  end if;

  -- Serializa la cuota agregada por conductor/turno. Las colisiones del hash
  -- solo reducen concurrencia; no permiten exceder el límite.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(actor_id::text || ':' || shift_id_input::text, 0)
  );

  select count(*), coalesce(sum(i.expected_bytes), 0)
    into active_count, active_bytes
  from public.evidence_upload_intents i
  where i.owner_id = actor_id
    and i.shift_id = shift_id_input
    and i.status in ('pending', 'claimed');

  -- Límites técnicos provisionales; no son una política de retención empresarial.
  if active_count >= 50 or active_bytes + expected_bytes_input > 83886080 then
    raise exception 'Límite técnico de evidencias alcanzado' using errcode = '54000';
  end if;

  insert into public.evidence_upload_intents(
    id, owner_id, shift_id, kind, path, mime_type, expected_bytes, expires_at
  ) values (
    intent_id,
    actor_id,
    shift_id_input,
    kind_input,
    actor_id::text || '/' || shift_id_input::text || '/' || intent_id::text,
    mime_type_input,
    expected_bytes_input,
    expiry
  );
  return query
    select i.id, i.path, i.expires_at
    from public.evidence_upload_intents i
    where i.id = intent_id;
end;
$$;

create function public.finalize_evidence_upload_intent(intent_id_input uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  intent public.evidence_upload_intents;
  object_metadata jsonb;
  object_size bigint;
  object_mime text;
begin
  select * into intent
  from public.evidence_upload_intents
  where id = intent_id_input
  for update;

  if intent.id is null or intent.owner_id <> actor_id then
    raise exception 'Carga no autorizada' using errcode = '42501';
  end if;
  if intent.status = 'claimed' then
    return intent.id;
  end if;
  if intent.status <> 'pending' or intent.expires_at <= now()
    or not private.own_open_shift(intent.shift_id) then
    raise exception 'La intención de carga venció' using errcode = '22023';
  end if;

  select metadata into object_metadata
  from storage.objects
  where bucket_id = 'evidence' and name = intent.path;
  if object_metadata is null then
    raise exception 'El objeto cargado no existe' using errcode = '22023';
  end if;
  object_size := nullif(object_metadata ->> 'size', '')::bigint;
  object_mime := object_metadata ->> 'mimetype';
  if object_size is distinct from intent.expected_bytes
    or object_size > 8388608
    or object_mime is distinct from intent.mime_type then
    raise exception 'El objeto no coincide con la intención' using errcode = '22023';
  end if;

  insert into public.evidences(id, owner_id, shift_id, kind, path)
  values(intent.id, intent.owner_id, intent.shift_id, intent.kind, intent.path)
  on conflict (id) do nothing;
  update public.evidence_upload_intents
    set status = 'claimed', claimed_at = now()
    where id = intent.id;
  return intent.id;
end;
$$;

revoke all on function public.create_evidence_upload_intent(uuid, text, text, bigint)
  from public, anon;
revoke all on function public.finalize_evidence_upload_intent(uuid)
  from public, anon;
grant execute on function public.create_evidence_upload_intent(uuid, text, text, bigint)
  to authenticated;
grant execute on function public.finalize_evidence_upload_intent(uuid)
  to authenticated;

-- Dos señales independientes y una ventana por señal evitan que un único alias
-- haga crecer la tabla sin límite. Las claves son HMAC, nunca alias ni IP.
create table private.login_limit_events (
  scope text not null check (scope in ('identifier', 'network')),
  key text not null,
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  primary key(scope, key)
);
create index login_limit_expiry on private.login_limit_events(window_start);

create or replace function public.resolve_login(
  alias_input text,
  identifier_key text,
  network_key text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  identifier_hits integer;
  network_hits integer;
  email_result text;
begin
  delete from private.login_limit_events
  where ctid in (
    select ctid from private.login_limit_events
    where window_start < now() - interval '1 day'
    order by window_start
    limit 200
  );

  insert into private.login_limit_events(scope, key, window_start, hits)
  values ('identifier', identifier_key, now(), 1)
  on conflict(scope, key) do update set
    hits = case
      when private.login_limit_events.window_start < now() - interval '15 minutes' then 1
      else private.login_limit_events.hits + 1
    end,
    window_start = case
      when private.login_limit_events.window_start < now() - interval '15 minutes' then now()
      else private.login_limit_events.window_start
    end
  returning hits into identifier_hits;

  if nullif(network_key, '') is not null then
    insert into private.login_limit_events(scope, key, window_start, hits)
    values ('network', network_key, now(), 1)
    on conflict(scope, key) do update set
      hits = case
        when private.login_limit_events.window_start < now() - interval '15 minutes' then 1
        else private.login_limit_events.hits + 1
      end,
      window_start = case
        when private.login_limit_events.window_start < now() - interval '15 minutes' then now()
        else private.login_limit_events.window_start
      end
    returning hits into network_hits;
  end if;

  if identifier_hits > 10 or coalesce(network_hits, 0) > 50 then
    return null;
  end if;
  select p.email into email_result
  from public.profiles p
  where p.alias = alias_input and p.active and not p.reset_in_progress;
  return email_result;
end;
$$;
revoke all on function public.resolve_login(text, text, text) from public, anon, authenticated;
grant execute on function public.resolve_login(text, text, text) to service_role;
drop function public.resolve_login(text, text);

drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());
drop policy fatigue_private on public.driver_assessments;
create policy fatigue_private on public.driver_assessments for select to authenticated
  using (private.ready() and driver_id = (select auth.uid()));
drop policy evidence_read on public.evidences;
create policy evidence_read on public.evidences for select to authenticated
  using (
    private.can_shift(shift_id)
    and (owner_id = (select auth.uid()) or entity_id is not null)
  );
drop policy draft_owner_only on public.operation_drafts;
create policy draft_owner_only on public.operation_drafts for select to authenticated
  using (private.ready() and owner_id = (select auth.uid()));

create table public.retention_policies (
  category text primary key,
  retention_days integer check (retention_days > 0),
  enabled boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  updated_at timestamptz not null default now(),
  check (not enabled or (retention_days is not null and approved_by is not null and approved_at is not null))
);
insert into public.retention_policies(category) values
  ('photographs'), ('signatures'), ('fatigue'), ('incidents'), ('audit'),
  ('inactive_accounts'), ('exports'), ('login_limits');
alter table public.retention_policies enable row level security;
revoke all on public.retention_policies from anon, authenticated;
grant select on public.retention_policies to authenticated;
create policy retention_it_read on public.retention_policies
  for select to authenticated using (private.role() = 'it_superadmin');

-- Las funciones privilegiadas nuevas no quedan expuestas por el privilegio
-- EXECUTE que PostgreSQL concede a PUBLIC de forma predeterminada.
revoke execute on function public.create_evidence_upload_intent(uuid, text, text, bigint)
  from public;
revoke execute on function public.finalize_evidence_upload_intent(uuid)
  from public;
