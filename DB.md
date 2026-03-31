# Database Reference — Pop-Up Platform

Supabase project URL: `https://aasamdcmjdqumbfiqwei.supabase.co`

This document is the authoritative reference for the database schema, RLS policies, triggers, and conventions. Use it as the starting point before writing any query in `services/`.

---

## Overview

The platform connects **customers** (who discover and follow pop-up businesses) with **businesses** (who post and manage events). There are **11 tables** in the `public` schema backed by Supabase Auth (`auth.users`).

```
auth.users
    └── profiles          (1-to-1 with every auth user)
            └── businesses        (only for role = 'business')
                    ├── events
                    │     ├── event_tags   → vibe_tags
                    │     └── inventory_status
                    ├── business_tags  → vibe_tags
                    ├── follows        ← profiles (customers)
                    └── reviews        ← profiles (customers)
profiles
    ├── user_interests → vibe_tags
    └── notifications
```

---

## Tables

### `profiles`
One row per authenticated user. Created automatically via the `trg_on_auth_user_created` trigger when a user signs up.

| Column | Type | Notes |
|---|---|---|
| `uid` | `uuid` PK | FK → `auth.users.id` |
| `role` | `text` | `'customer'` or `'business'` |
| `display_name` | `text` | |
| `avatar_url` | `text` | |
| `location` | `text` | |
| `bio` | `text` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | auto-updated by trigger |

**RLS:**
- `SELECT` — public (anyone)
- `UPDATE` — owner only (`auth.uid() = uid`)
- No `INSERT` via client — handled by `handle_new_user()` trigger

---

### `businesses`
Extended profile data for users with `role = 'business'`. Shares the same `uid` as `profiles`.

| Column | Type | Notes |
|---|---|---|
| `uid` | `uuid` PK | FK → `profiles.uid` |
| `business_name` | `text` | required |
| `short_description` | `text` | one-liner for cards |
| `story` | `text` | long-form about section |
| `logo_url` | `text` | |
| `email` | `text` | |
| `phone` | `text` | |
| `website` | `text` | |
| `follower_count` | `integer` | denormalized, synced by `trg_follower_count` |
| `avg_rating` | `numeric(3,2)` | denormalized, synced by `trg_avg_rating` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | auto-updated by trigger |

**RLS:**
- `SELECT` — public
- `INSERT` — owner only (`auth.uid() = uid`)
- `UPDATE` — owner only (`auth.uid() = uid`)

---

### `vibe_tags`
Global tag dictionary shared by businesses, events, and user interests.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `name` | `text` UNIQUE | e.g. `'coffee'`, `'pop-up'`, `'vegan'` |

**RLS:** `SELECT` — public. No client writes.

**Seeded values:** `vegan`, `vegetarian`, `coffee`, `matcha`, `tea`, `pastry`, `street food`, `asian`, `mexican`, `italian`, `dessert`, `handmade`, `vintage`, `art`, `pop-up`, `local`, `organic`, `gluten-free`, `drinks`, `food`, `single-origin`, `cold brew`, `dairy-free`, `sweet`

---

### `business_tags`
Junction table: which vibe tags a business identifies with.

| Column | Type | Notes |
|---|---|---|
| `business_uid` | `uuid` | FK → `businesses.uid` |
| `tag_id` | `integer` | FK → `vibe_tags.id` |
| PK | `(business_uid, tag_id)` | |

**RLS:** `SELECT` — public.

---

### `user_interests`
Junction table: which vibe tags a customer selects during onboarding. Drives the Explore recommendations feed.

| Column | Type | Notes |
|---|---|---|
| `user_uid` | `uuid` | FK → `profiles.uid` |
| `tag_id` | `integer` | FK → `vibe_tags.id` |
| PK | `(user_uid, tag_id)` | |

**RLS:** `ALL` — owner only (`auth.uid() = user_uid`)

---

### `events`
Pop-up events posted by a business.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` PK | auto-generated identity |
| `host_uid` | `uuid` | FK → `businesses.uid` |
| `event_name` | `text` | required |
| `story` | `text` | description / narrative |
| `cover_url` | `text` | |
| `event_date` | `date` | required |
| `start_time` | `time` | |
| `end_time` | `time` | |
| `location` | `text` | human-readable address |
| `latitude` | `double precision` | for geo queries |
| `longitude` | `double precision` | for geo queries |
| `status` | `text` | see values below |
| `is_published` | `boolean` | default `false` — gates public visibility |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | auto-updated by trigger |

**`status` values:** `upcoming` · `open` · `closing_soon` · `sold_out` · `paused` · `closed` · `cancelled`

**RLS:**
- `SELECT` — public, but **only `is_published = true`** rows
- `INSERT` — business owner only (`auth.uid() = host_uid`)
- `UPDATE` — business owner only
- `DELETE` — business owner only

**Indexes:** `host_uid`, `event_date`, `status`, `(latitude, longitude)`

---

### `event_tags`
Junction table: vibe tags for a specific event.

| Column | Type | Notes |
|---|---|---|
| `event_id` | `bigint` | FK → `events.id` |
| `tag_id` | `integer` | FK → `vibe_tags.id` |
| PK | `(event_id, tag_id)` | |

**RLS:** `SELECT` — public.

---

### `inventory_status`
Real-time stock status per product per event. Updated live during an event by the business.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` PK | auto-generated identity |
| `event_id` | `bigint` | FK → `events.id` |
| `business_uid` | `uuid` | FK → `businesses.uid` |
| `product_name` | `text` | e.g. `'Iced Matcha Latte'` |
| `availability` | `text` | see values below |
| `custom_message` | `text` | optional status blurb |
| `updated_at` | `timestamptz` | |
| UNIQUE | `(event_id, business_uid, product_name)` | |

**`availability` values:** `full_stock` · `low_stock` · `limited_menu` · `closing_early` · `closed_today`

**RLS:**
- `SELECT` — public
- `ALL` (insert/update/delete) — business owner only (`auth.uid() = business_uid`)

**Index:** `event_id`

---

### `follows`
A customer following a business. Triggers `follower_count` update on `businesses`.

| Column | Type | Notes |
|---|---|---|
| `follower_uid` | `uuid` | FK → `profiles.uid` |
| `business_uid` | `uuid` | FK → `businesses.uid` |
| `created_at` | `timestamptz` | |
| PK | `(follower_uid, business_uid)` | |

**RLS:** `ALL` — owner only (`auth.uid() = follower_uid`)

**Index:** `business_uid`

---

### `reviews`
A customer's review of a business, optionally tied to a specific event.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` PK | auto-generated identity |
| `reviewer_uid` | `uuid` | FK → `profiles.uid` |
| `business_uid` | `uuid` | FK → `businesses.uid` |
| `event_id` | `bigint` nullable | FK → `events.id` (set null on event delete) |
| `rating` | `smallint` | 1–5 |
| `body` | `text` | |
| `created_at` | `timestamptz` | |
| UNIQUE | `(reviewer_uid, business_uid, event_id)` | one review per user per event |

**RLS:**
- `SELECT` — public
- `INSERT` — reviewer only (`auth.uid() = reviewer_uid`)
- `UPDATE` — reviewer only

**Index:** `business_uid`

---

### `notifications`
In-app notifications sent to a user. Currently three types.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` PK | auto-generated identity |
| `recipient_uid` | `uuid` | FK → `profiles.uid` |
| `type` | `text` | `'new_event'` · `'status_update'` · `'review_received'` |
| `title` | `text` | |
| `body` | `text` | |
| `payload` | `jsonb` | flexible data e.g. `{ event_id, business_uid }` |
| `is_read` | `boolean` | default `false` |
| `created_at` | `timestamptz` | |

**RLS:**
- `SELECT` — recipient only (`auth.uid() = recipient_uid`)
- `UPDATE` — recipient only (used to mark as read)

**Index:** `(recipient_uid, is_read)`

---

## Triggers & Functions

| Trigger | Table | Event | Function | Effect |
|---|---|---|---|---|
| `trg_on_auth_user_created` | `auth.users` | `AFTER INSERT` | `handle_new_user()` | Auto-creates a `profiles` row from `raw_user_meta_data` |
| `trg_profiles_updated_at` | `profiles` | `BEFORE UPDATE` | `set_updated_at()` | Stamps `updated_at = now()` |
| `trg_businesses_updated_at` | `businesses` | `BEFORE UPDATE` | `set_updated_at()` | Stamps `updated_at = now()` |
| `trg_events_updated_at` | `events` | `BEFORE UPDATE` | `set_updated_at()` | Stamps `updated_at = now()` |
| `trg_avg_rating` | `reviews` | `AFTER INSERT/UPDATE/DELETE` | `refresh_avg_rating()` | Recomputes `businesses.avg_rating` |
| `trg_follower_count` | `follows` | `AFTER INSERT/DELETE` | `refresh_follower_count()` | Recomputes `businesses.follower_count` |

**`handle_new_user()` reads from `raw_user_meta_data`:**
```json
{ "role": "customer" | "business", "display_name": "..." }
```
Pass these during sign-up:
```ts
supabase.auth.signUp({
  email, password,
  options: { data: { role: 'customer', display_name: 'Jamie' } }
})
```

---

## RLS Quick Reference

| Table | Public SELECT | Owner Write | Notes |
|---|---|---|---|
| `profiles` | yes | UPDATE only | INSERT via trigger |
| `businesses` | yes | INSERT + UPDATE | No DELETE via client |
| `vibe_tags` | yes | — | Read-only for clients |
| `business_tags` | yes | — | No write policy defined |
| `user_interests` | — | ALL | Scoped to `user_uid` |
| `events` | published only | INSERT/UPDATE/DELETE | `is_published` gate |
| `event_tags` | yes | — | No write policy defined |
| `inventory_status` | yes | ALL | Scoped to `business_uid` |
| `follows` | — | ALL | Scoped to `follower_uid` |
| `reviews` | yes | INSERT + UPDATE | One per user/business/event |
| `notifications` | — | UPDATE (mark read) | Scoped to `recipient_uid` |

---

## API Conventions for `services/`

### Auth
The client in `lib/supabase.ts` attaches the session JWT automatically. All owner-gated writes require the user to be signed in. Pass `role` and `display_name` in `signUp` metadata so the trigger creates the profile correctly.

### Nested selects
Supabase resolves foreign key relationships in a single query:

```ts
// Event card with host business and tags
supabase
  .from('events')
  .select(`
    *,
    businesses ( business_name, logo_url, avg_rating ),
    event_tags ( vibe_tags ( name ) )
  `)
  .eq('is_published', true)
```

### Common patterns

**Explore feed — events matching a customer's interests:**
```ts
// 1. Fetch user's tag IDs
const { data: interests } = await supabase
  .from('user_interests')
  .select('tag_id')
  .eq('user_uid', userId)

const tagIds = interests.map(i => i.tag_id)

// 2. Fetch matching event IDs
const { data: matched } = await supabase
  .from('event_tags')
  .select('event_id')
  .in('tag_id', tagIds)

const eventIds = [...new Set(matched.map(e => e.event_id))]

// 3. Query those events
supabase.from('events')
  .select('*, businesses(business_name, logo_url)')
  .in('id', eventIds)
  .eq('is_published', true)
```

**Business's active events:**
```ts
supabase.from('events')
  .select('*')
  .eq('host_uid', uid)
  .in('status', ['upcoming', 'open', 'closing_soon'])
  .eq('is_published', true)
```

**Upsert inventory (idempotent live updates):**
```ts
supabase.from('inventory_status')
  .upsert(
    { event_id, business_uid, product_name, availability, custom_message },
    { onConflict: 'event_id,business_uid,product_name' }
  )
```

**Toggle follow:**
```ts
// Follow
supabase.from('follows').insert({ follower_uid: userId, business_uid })
// Unfollow
supabase.from('follows').delete()
  .eq('follower_uid', userId)
  .eq('business_uid', businessUid)
// follower_count on businesses updates automatically via trigger
```

**Mark notification read:**
```ts
supabase.from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId)
  // RLS enforces recipient_uid — no extra filter needed
```

**Submit a review:**
```ts
supabase.from('reviews').insert({
  reviewer_uid: userId,
  business_uid,
  event_id,   // optional — null if not tied to a specific event
  rating,     // 1–5
  body
})
// avg_rating on businesses updates automatically via trigger
```

---

## Gotchas

- **Unpublished events are invisible to all client queries.** There is no policy for a business to read their own drafts via the anon key. Use the Supabase service role key in an Edge Function if you need a draft preview flow.
- **Never write `follower_count` or `avg_rating` directly.** Both are maintained by triggers and will be overwritten on the next fire.
- **Tag IDs are environment-specific.** `vibe_tags.id` is a serial — IDs differ between dev and prod. Always look up tags by `name`, never hardcode an ID.
- **Notifications have no client INSERT policy.** Create them server-side via an Edge Function or database trigger.
- **`business_tags` and `event_tags` have no write policy defined.** These need to be inserted server-side or via a Postgres function with elevated privileges when a business or event is created/updated.
