-- Demo data, ported from src/services/seedData.js so a fresh Supabase
-- project starts with the same seed cats/sightings the app used to write
-- into localStorage on first load. Fixed UUIDs + `on conflict do nothing`
-- make this safe to re-run.

insert into public.cats
  (id, is_seed, name, status, description, temperament, needs_medical_attention,
   medical_details, primary_photo_url, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', true, 'Marmalade', 'stray_resident',
   'Orange tabby, friendly, hangs out near the community garden.', 'friendly', false, null,
   'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
   now() - interval '40 days', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000002', true, 'Shadow', 'stray_resident',
   'Black shorthair, part of the alley colony behind the laundromat.', 'skittish', false, null,
   'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=400',
   now() - interval '90 days', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000003', true, 'Unknown Cat', 'sighted_temporary',
   'Grey and white, seen once near the taqueria dumpsters.', 'unknown', false, null,
   'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400',
   now() - interval '2 days', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000004', true, 'Biscuit', 'lost',
   'Cream-colored longhair, microchipped, last seen wearing a blue collar.', 'friendly', false, null,
   'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400',
   now() - interval '5 days', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000005', true, 'Patches', 'stray_resident',
   'Calico, feeds at the colony feeding station on 24th St.', 'feral', true,
   'Limping on front-right paw, possible thorn or minor injury.',
   'https://images.unsplash.com/photo-1517849845537-4d257902861a?w=400',
   now() - interval '60 days', now() - interval '6 hours'),
  ('00000000-0000-0000-0000-000000000006', true, 'Unknown Cat', 'found',
   'Small tuxedo kitten, found wandering alone, currently fostered nearby.', 'friendly', false, null,
   'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400',
   now() - interval '1 day', now() - interval '1 day')
on conflict (id) do nothing;

insert into public.sightings
  (id, cat_id, latitude, longitude, sighting_time, photo_url, last_fed_date, notes, created_at)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001',
   37.7611, -122.4156, now() - interval '1 day',
   'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
   now() - interval '1 day', 'Fed near the garden gate, very food-motivated.',
   now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001',
   37.7614, -122.4159, now() - interval '6 days', null,
   now() - interval '6 days', 'Sunning on the fence post.',
   now() - interval '6 days'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002',
   37.7581, -122.4126, now() - interval '3 days',
   'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=400',
   now() - interval '3 days', 'Ran off when approached, stays close to the dumpsters.',
   now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000003',
   37.7604, -122.4117, now() - interval '2 days',
   'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400',
   null, 'First time seeing this one, no collar.',
   now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000004',
   37.7590, -122.4173, now() - interval '1 day', null, null,
   'Neighbor reported seeing a cream longhair matching the flyer.',
   now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000005',
   37.7621, -122.4139, now() - interval '6 hours',
   'https://images.unsplash.com/photo-1517849845537-4d257902861a?w=400',
   now() - interval '6 hours', 'Still limping, watching closely before deciding on a vet trip.',
   now() - interval '6 hours'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000005',
   37.7619, -122.4141, now() - interval '4 days', null,
   now() - interval '4 days', 'Fed at the usual station.',
   now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000006',
   37.7568, -122.4162, now() - interval '1 day',
   'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400',
   now() - interval '1 day', 'Now with a foster, doing well.',
   now() - interval '1 day')
on conflict (id) do nothing;
