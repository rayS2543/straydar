# Design decisions

Short notes on the non-obvious tradeoffs in this codebase — written for
whoever (including future-me) wonders "why is it built this way."

## Supabase over a hand-rolled API

The app originally stored everything in `localStorage`, which meant no two
users ever saw the same map. The fix needed a real datastore, but this is a
side project without ops capacity for a hand-rolled backend. Supabase gives
Postgres + auto-generated REST + Realtime + Auth for free, so `src/services/db.js`
is a ~70-line wrapper instead of a server codebase. The cost: the client
talks to the database almost directly, so authorization has to live entirely
in Postgres Row Level Security policies rather than in application code —
see the next point.

## Anonymous writes now, auth-shaped schema already

Row Level Security is enabled but currently permissive (`using (true)` for
select/insert/update) — anyone can write any cat or sighting, no login
required. That's deliberate for now: this is a community reporting tool, and
requiring signup before someone can report an injured stray adds friction
for exactly the moment it matters least. But `cats.owner_id` and
`sightings.reporter_id` are already nullable foreign keys to `auth.users`
(see `supabase/migrations/0001_init.sql`), so turning on real auth later is
"add a login screen, tighten two RLS policies to `auth.uid() = owner_id`" —
not a schema migration or a client rewrite.

## Attribute-scored duplicate detection, not fuzzy matching or ML

When someone reports a cat, `src/services/matching.js` has to guess whether
it's a cat that's already tracked. Rather than reach for a fuzzy-string
library or an embedding-based similarity model, matching is: sightings
within 150m, ranked by a small additive score (shared temperament +2,
shared non-stopword description keywords +1 each). It's legible — you can
read the score and know exactly why two reports were considered a match —
and cheap enough to run synchronously on every submission. The tradeoff is
it's naive about synonyms ("orange" vs "ginger" don't match) and doesn't
learn from corrections; that's an acceptable gap for a v1 where a human
always confirms the match via the dedup modal before anything is written.

## Client-side AI assistant with a canned-response fallback

`src/services/aiAssistant.js` calls the Anthropic SDK directly from the
browser with the user's own API key (`dangerouslyAllowBrowser: true`),
rather than proxying through a backend. For a tool meant to be forked and
self-hosted casually, avoiding a server-side key to manage and secure was
worth the tradeoff of exposing the SDK call client-side — the key stored is
always the *user's own*, entered locally, never bundled or shared. Without a
key, `getAssistantReply` falls back to keyword-matched canned responses, so
the assistant UI is still fully demoable and testable without anyone
needing to provide an API key at all.
