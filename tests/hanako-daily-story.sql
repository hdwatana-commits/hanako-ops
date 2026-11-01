-- Rollback-only integration checks. pg_net does not send before COMMIT, so this
-- never calls OpenAI, uploads images, or publishes a social-media post.
begin;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

do $$
declare
  test_owner uuid := gen_random_uuid();
  first_result jsonb;
  second_result jsonb;
  claimed jsonb;
  item jsonb;
  instagram_id uuid;
  threads_id uuid;
  legacy_id uuid := gen_random_uuid();
  denied boolean := false;
begin
  insert into auth.users(id) values (test_owner);
  insert into public.hanako_auto_settings(user_id, instagram_enabled, threads_enabled,
    instagram_time, threads_time, photo_consent, reference_path, look)
  values (test_owner, false, false, '23:59', '23:59', true, test_owner::text || '/personal.jpg',
    '{"instagramImageCount":4,"threadsImageCount":3,"autoVariation":true}'::jsonb);

  if has_function_privilege('authenticated', 'public.hanako_start_daily_drafts(uuid,text[])', 'execute')
    or has_function_privilege('anon', 'public.hanako_dispatch_daily_worker()', 'execute') then
    raise exception 'Server-only RPC is client-accessible';
  end if;
  first_result := public.hanako_start_daily_drafts(test_owner, array['Instagram', 'Threads']);
  if jsonb_array_length(first_result -> 'drafts') <> 2 then raise exception 'Both platforms were not queued'; end if;
  for item in select value from jsonb_array_elements(first_result -> 'drafts') loop
    if item ->> 'created' <> 'true' or item ->> 'status' <> 'pending' then raise exception 'New draft not pending'; end if;
    if item ->> 'platform' = 'Instagram' then
      instagram_id := (item ->> 'id')::uuid;
      if item ->> 'imageCount' <> '4' then raise exception 'Instagram count lost'; end if;
    else
      threads_id := (item ->> 'id')::uuid;
      if item ->> 'imageCount' <> '3' then raise exception 'Threads count lost'; end if;
    end if;
  end loop;

  second_result := public.hanako_start_daily_drafts(test_owner, array['Instagram', 'Threads']);
  if exists (select 1 from jsonb_array_elements(second_result -> 'drafts') d where d ->> 'created' <> 'false') then
    raise exception 'Repeated click created a second draft';
  end if;
  if (select count(*) from public.hanako_auto_drafts where user_id = test_owner) <> 2 then raise exception 'Duplicate draft'; end if;
  if exists (select 1 from public.hanako_auto_drafts where user_id = test_owner and not manual_requested) then
    raise exception 'Manual continuation permission lost';
  end if;
  -- A worker may rewrite the look JSON. The independent manual flag must survive.
  update public.hanako_auto_drafts set look = look - 'manualRequested' where user_id = test_owner;
  claimed := public.hanako_claim_daily_image(test_owner);
  if claimed is null then raise exception 'Manual draft cannot run with both daily switches OFF'; end if;
  if public.hanako_claim_daily_image(test_owner) ->> 'id' = claimed ->> 'id' then raise exception 'Live lease claimed twice'; end if;
  if public.hanako_claim_daily_image(test_owner) is not null then raise exception 'Leased work claimed again'; end if;

  -- Changing future settings must not resize already queued/finished drafts.
  update public.hanako_auto_settings set look = '{"instagramImageCount":3,"threadsImageCount":4}' where user_id = test_owner;
  update public.hanako_auto_drafts set status = 'ready', caption = '完成した下書き',
    image_paths = array[test_owner::text || '/drafts/' || instagram_id || '/1.jpg',
      test_owner::text || '/drafts/' || instagram_id || '/2.jpg', test_owner::text || '/drafts/' || instagram_id || '/3.jpg',
      test_owner::text || '/drafts/' || instagram_id || '/4.jpg'] where id = instagram_id;
  second_result := public.hanako_start_daily_drafts(test_owner, array['Instagram']);
  if second_result #>> '{drafts,0,status}' <> 'ready' or second_result #>> '{drafts,0,imageCount}' <> '4' then
    raise exception 'Finished draft was changed by a repeated start';
  end if;
  update public.hanako_auto_drafts set image_paths = image_paths[1:3] where id = instagram_id;
  denied := false;
  begin perform public.hanako_begin_publish(instagram_id, test_owner);
  exception when others then denied := true; end;
  if not denied then raise exception 'Incomplete four-image draft was published'; end if;
  update public.hanako_auto_drafts set image_paths = array_append(image_paths,
    test_owner::text || '/drafts/' || instagram_id || '/4.jpg') where id = instagram_id;
  item := public.hanako_begin_publish(instagram_id, test_owner);
  if item ->> 'caption' <> '完成した下書き' or jsonb_array_length(item -> 'image_paths') <> 4 then raise exception 'Four-image publish rejected'; end if;

  update public.hanako_auto_drafts set status = 'failed', manual_requested = false, error = 'retry example' where id = threads_id;
  second_result := public.hanako_start_daily_drafts(test_owner, array['Threads']);
  if second_result #>> '{drafts,0,status}' <> 'failed'
    or not (select manual_requested from public.hanako_auto_drafts where id = threads_id) then
    raise exception 'Failed job must remain failed and become manually resumable';
  end if;
  update public.hanako_auto_drafts set status = 'pending', lease_until = null where id = threads_id;
  claimed := public.hanako_claim_daily_image(test_owner);
  if claimed ->> 'id' <> threads_id::text then raise exception 'Manual retry did not continue'; end if;

  insert into public.hanako_auto_drafts(id, user_id, platform, local_date, reference_path, status, caption, image_paths)
  values (legacy_id, test_owner, 'Instagram', (now() at time zone 'Asia/Tokyo')::date - 1,
    test_owner::text || '/personal.jpg', 'ready', '既存3枚', array['old/1.jpg', 'old/2.jpg', 'old/3.jpg']);
  item := public.hanako_begin_publish(legacy_id, test_owner);
  if jsonb_array_length(item -> 'image_paths') <> 3 then raise exception 'Legacy three-image draft was changed'; end if;

  denied := false;
  begin perform public.hanako_start_daily_drafts(test_owner, array['Instagram', 'Instagram']);
  exception when others then denied := true; end;
  if not denied then raise exception 'Duplicate platform accepted'; end if;
  denied := false;
  begin perform public.hanako_start_daily_drafts(test_owner, array['X']);
  exception when others then denied := true; end;
  if not denied then raise exception 'Unsupported platform accepted'; end if;
  update public.hanako_auto_settings set photo_consent = false where user_id = test_owner;
  denied := false;
  begin perform public.hanako_start_daily_drafts(test_owner, array['Threads']);
  exception when others then denied := true; end;
  if not denied then raise exception 'Missing photo consent accepted'; end if;
  if public.hanako_claim_daily_image(test_owner) is not null then raise exception 'Revoked consent was ignored'; end if;
end;
$$;
rollback;
