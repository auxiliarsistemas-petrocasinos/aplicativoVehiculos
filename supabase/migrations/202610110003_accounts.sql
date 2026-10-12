-- Estas funciones se invocan exclusivamente desde servidor, después de comprobar al actor.
create function public.resolve_login(alias_input text,limit_key text) returns text language plpgsql security definer set search_path='' as $$
declare total integer; email_result text;
begin
 insert into private.login_limits(key,window_start,hits) values(limit_key,now(),1)
 on conflict(key) do update set hits=case when private.login_limits.window_start<now()-interval '15 minutes' then 1 else private.login_limits.hits+1 end,window_start=case when private.login_limits.window_start<now()-interval '15 minutes' then now() else private.login_limits.window_start end returning hits into total;
 if total>10 then return null; end if;
 select email into email_result from public.profiles where alias=alias_input and active and not reset_in_progress;
 return email_result;
end; $$;
create function public.provision_profile(actor_id uuid,user_id uuid,data jsonb) returns void language plpgsql security definer set search_path='' as $$
declare actor public.profiles; desired public.app_role:=(data->>'role')::public.app_role;
begin
 select * into actor from public.profiles where id=actor_id and active and not must_change_password and not reset_in_progress;
 if not found or actor.role not in ('fleet_admin','it_superadmin') or (actor.role='fleet_admin' and desired<>'driver') then raise exception 'Alta de cuenta no autorizada' using errcode='42501'; end if;
 insert into public.profiles(id,alias,full_name,email,phone,role,field_id) values(user_id,data->>'alias',data->>'full_name',data->>'email',coalesce(data->>'phone',''),desired,nullif(data->>'field_id','')::uuid);
 insert into public.audit_events(actor_id,action,entity_id,detail) values(actor.id,'account_created',user_id,jsonb_build_object('role',desired));
end; $$;
create function public.reset_password_guard(actor_id uuid,target_id uuid,phase text) returns void language plpgsql security definer set search_path='' as $$
declare actor public.profiles; target public.profiles;
begin
 select * into actor from public.profiles where id=actor_id and active and not must_change_password and not reset_in_progress;
 select * into target from public.profiles where id=target_id for update;
 if actor.id is null or target.id is null or actor.role not in ('fleet_admin','it_superadmin') or (actor.role='fleet_admin' and target.role<>'driver') or actor.id=target.id then raise exception 'Restablecimiento no autorizado' using errcode='42501'; end if;
 if phase not in ('begin','finish') then raise exception 'Fase inválida'; end if;
 if phase='begin' then
  delete from auth.sessions where user_id=target.id;
  update auth.refresh_tokens set revoked=true where user_id=target.id::text;
 end if;
 update public.profiles set must_change_password=true,reset_in_progress=(phase='begin'),invalid_before=floor(extract(epoch from now()))::bigint where id=target.id;
 insert into public.audit_events(actor_id,action,entity_id) values(actor.id,'password_reset_'||phase,target.id);
end; $$;
revoke all on function public.resolve_login(text,text),public.provision_profile(uuid,uuid,jsonb),public.reset_password_guard(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.resolve_login(text,text),public.provision_profile(uuid,uuid,jsonb),public.reset_password_guard(uuid,uuid,text) to service_role;
