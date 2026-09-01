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
