import { supabase } from './supabaseClient'

export async function fetchCats() {
  const { data, error } = await supabase.from('cats').select('*')
  if (error) throw error
  return data
}

export async function fetchSightings() {
  const { data, error } = await supabase
    .from('sightings')
    .select('*')
    .order('sighting_time', { ascending: false })
  if (error) throw error
  return data
}

export async function insertCat(cat) {
  const { data, error } = await supabase.from('cats').insert(cat).select().single()
  if (error) throw error
  return data
}

export async function updateCatRow(catId, patch) {
  const { data, error } = await supabase
    .from('cats')
    .update(patch)
    .eq('id', catId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function insertSighting(sighting) {
  const { data, error } = await supabase.from('sightings').insert(sighting).select().single()
  if (error) throw error
  return data
}

export async function fetchFollowedCatIds(userId) {
  const { data, error } = await supabase.from('follows').select('cat_id').eq('user_id', userId)
  if (error) throw error
  return data.map((row) => row.cat_id)
}

export async function insertFollow(userId, catId) {
  const { error } = await supabase.from('follows').insert({ user_id: userId, cat_id: catId })
  if (error) throw error
}

export async function deleteFollow(userId, catId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('user_id', userId)
    .eq('cat_id', catId)
  if (error) throw error
}
