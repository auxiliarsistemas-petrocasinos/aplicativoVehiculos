create function private.clean_incident_draft() returns trigger language plpgsql security definer set search_path='' as $$
begin delete from public.operation_drafts where shift_id=new.shift_id and kind='incident';return new;end; $$;
create trigger incident_draft_completed after insert on public.incidents for each row execute function private.clean_incident_draft();
create function private.clean_substitution_draft() returns trigger language plpgsql security definer set search_path='' as $$
begin if new.used_at is not null then delete from public.operation_drafts where shift_id=new.shift_id and kind='substitution';end if;return new;end; $$;
create trigger substitution_draft_completed after update of used_at on public.vehicle_change_authorizations for each row execute function private.clean_substitution_draft();
revoke all on function private.clean_incident_draft(),private.clean_substitution_draft() from public,anon,authenticated;
