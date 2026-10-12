create table public.operation_drafts(shift_id uuid not null references public.shifts,owner_id uuid not null references public.profiles,kind text not null check(kind in ('opening','closing','substitution','incident')),data jsonb not null,updated_at timestamptz not null default now(),primary key(shift_id,kind));
alter table public.operation_drafts enable row level security;
revoke all on public.operation_drafts from anon,authenticated;
grant select on public.operation_drafts to authenticated;
create policy draft_owner_only on public.operation_drafts for select to authenticated using(private.ready() and owner_id=auth.uid());
create function public.save_draft(shift_id uuid,kind text,data jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.own_open_shift(shift_id) then raise exception 'Borrador no autorizado' using errcode='42501'; end if;
 if pg_column_size(data)>200000 or jsonb_typeof(data)<>'object' then raise exception 'Borrador no válido'; end if;
 insert into public.operation_drafts values(shift_id,auth.uid(),kind,data,now()) on conflict on constraint operation_drafts_pkey do update set data=excluded.data,updated_at=now();
end; $$;
revoke all on function public.save_draft(uuid,text,jsonb) from public,anon;
grant execute on function public.save_draft(uuid,text,jsonb) to authenticated;
-- Elimina borradores terminados, sin generar ni completar evidencia faltante.
create function private.clean_completed_draft() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='active' and old.status='opening' then delete from public.operation_drafts where shift_id=new.id and kind='opening'; end if;
 if new.status in ('closed','regularized') then delete from public.operation_drafts where shift_id=new.id; end if;
 return new;
end; $$;
create trigger completed_draft after update of status on public.shifts for each row execute function private.clean_completed_draft();
revoke all on function private.clean_completed_draft() from public,anon,authenticated;
