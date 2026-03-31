# Backend Routes Reference

All routes are implemented as direct Supabase client calls in `services/api.ts`.
There is no separate REST server — "routes" here means the logical service functions that wrap Supabase queries. Each function maps to one screen action.

See `DB.md` for full schema, RLS rules, and column details.

---

## Auth

### Sign Up
**Screen:** Onboarding
**Function:** `signUp(email, password, role, displayName)`

```ts
supabase.auth.signUp({
  email, password,
  options: { data: { role, display_name: displayName } }
})
// Trigger handle_new_user() auto-creates profiles row
// role = 'customer' | 'business'
```

### Sign In
**Function:** `signIn(email, password)`

```ts
supabase.auth.signInWithPassword({ email, password })
```

### Sign Out
**Function:** `signOut()`

```ts
supabase.auth.signOut()
```

### Get Current Session
**Function:** `getSession()`

```ts
supabase.auth.getSession()
```

---

## Profiles

### Get Profile
**Screen:** `profile.tsx`, `user_business_profile.tsx`, `dashboard.tsx`
**Function:** `getProfile(uid)`

```ts
supabase
  .from('profiles')
  .select('*')
  .eq('uid', uid)
  .single()
```

**RLS:** Public — no auth required.

---

### Update Profile
**Screen:** `edit_profile.tsx` → Save button
**Function:** `updateProfile(uid, data)`

```ts
// data: { display_name, avatar_url, location, bio }
supabase
  .from('profiles')
  .update(data)
  .eq('uid', uid)
```

**RLS:** Owner only. User must be signed in.

---

## Businesses

### Get Business
**Screen:** `user_business_profile.tsx`, `dashboard.tsx`, `profile.tsx`
**Function:** `getBusiness(uid)`

Fetches business row + its vibe tags in one query:

```ts
supabase
  .from('businesses')
  .select(`
    *,
    business_tags ( vibe_tags ( id, name ) )
  `)
  .eq('uid', uid)
  .single()
```

**RLS:** Public.

---

### Create Business Profile
**Screen:** Business onboarding (after sign-up with `role = 'business'`)
**Function:** `createBusiness(uid, data)`

```ts
// data: { business_name, short_description, story, logo_url, email, phone, website }
supabase
  .from('businesses')
  .insert({ uid, ...data })
```

**RLS:** Owner only (`auth.uid() = uid`).

---

### Update Business Profile
**Screen:** `edit_profile.tsx` → Save button
**Function:** `updateBusiness(uid, data)`

```ts
// data: { business_name, short_description, story, logo_url, email, phone, website }
supabase
  .from('businesses')
  .update(data)
  .eq('uid', uid)
```

**RLS:** Owner only.

---

### Set Business Vibe Tags
**Screen:** `edit_profile.tsx` → vibe tag section
**Function:** `setBusinessTags(businessUid, tagNames)`

Delete existing tags then re-insert selected ones:

```ts
// 1. Resolve tag IDs by name
const { data: tags } = await supabase
  .from('vibe_tags')
  .select('id, name')
  .in('name', tagNames)

// 2. Delete old tags
await supabase
  .from('business_tags')
  .delete()
  .eq('business_uid', businessUid)

// 3. Insert new tags
await supabase
  .from('business_tags')
  .insert(tags.map(t => ({ business_uid: businessUid, tag_id: t.id })))
```

**Note:** `business_tags` has no client write policy — this must be called from a privileged context (Edge Function) or a policy must be added for the owner.

---

## Events

### Get Published Events (Explore Feed)
**Screen:** Explore tab
**Function:** `getPublishedEvents(filters?)`

```ts
// filters: { status?, date?, tagIds? }
supabase
  .from('events')
  .select(`
    *,
    businesses ( business_name, logo_url, avg_rating ),
    event_tags ( vibe_tags ( name ) )
  `)
  .eq('is_published', true)
  .order('event_date', { ascending: true })
```

Add `.in('status', ['upcoming','open','closing_soon'])` to filter active events only.

**RLS:** Public — only `is_published = true` rows returned.

---

### Get Events for a Business
**Screen:** `dashboard.tsx` (recent events list), `user_business_profile.tsx` (upcoming events)
**Function:** `getBusinessEvents(hostUid, status?)`

```ts
supabase
  .from('events')
  .select('*, event_tags( vibe_tags(name) ), inventory_status(*)')
  .eq('host_uid', hostUid)
  .eq('is_published', true)
  .order('event_date', { ascending: false })
```

**RLS:** Public (published only). To fetch unpublished drafts, use service role key server-side.

---

### Get Single Event
**Function:** `getEvent(eventId)`

```ts
supabase
  .from('events')
  .select(`
    *,
    businesses ( * ),
    event_tags ( vibe_tags ( name ) ),
    inventory_status ( * )
  `)
  .eq('id', eventId)
  .single()
```

---

### Create Event
**Screen:** `create_business_event.tsx` → Create button
**Function:** `createEvent(hostUid, data)`

```ts
// data: { event_name, story, cover_url, event_date, start_time, end_time, location, latitude, longitude }
const { data: event } = await supabase
  .from('events')
  .insert({ host_uid: hostUid, is_published: false, status: 'upcoming', ...data })
  .select()
  .single()

// Then attach tags (see setEventTags below)
// Set is_published = true when ready to go live
```

**RLS:** Owner only (`auth.uid() = host_uid`).

---

### Update Event
**Function:** `updateEvent(eventId, data)`

```ts
supabase
  .from('events')
  .update(data)
  .eq('id', eventId)
```

**RLS:** Owner only.

---

### Publish / Unpublish Event
**Function:** `setEventPublished(eventId, isPublished)`

```ts
supabase
  .from('events')
  .update({ is_published: isPublished })
  .eq('id', eventId)
```

---

### Update Event Status
**Screen:** `update_status.tsx` → Update button (overall status field)
**Function:** `updateEventStatus(eventId, status)`

```ts
// status: 'upcoming' | 'open' | 'closing_soon' | 'sold_out' | 'paused' | 'closed' | 'cancelled'
supabase
  .from('events')
  .update({ status })
  .eq('id', eventId)
```

**RLS:** Owner only.

---

### Delete Event
**Function:** `deleteEvent(eventId)`

```ts
supabase
  .from('events')
  .delete()
  .eq('id', eventId)
```

**RLS:** Owner only.

---

### Set Event Vibe Tags
**Screen:** `create_business_event.tsx` → vibe tag section
**Function:** `setEventTags(eventId, tagNames)`

```ts
// 1. Resolve tag IDs
const { data: tags } = await supabase
  .from('vibe_tags')
  .select('id, name')
  .in('name', tagNames)

// 2. Delete existing
await supabase.from('event_tags').delete().eq('event_id', eventId)

// 3. Insert new
await supabase
  .from('event_tags')
  .insert(tags.map(t => ({ event_id: eventId, tag_id: t.id })))
```

**Note:** Same as `business_tags` — no client write policy exists. Needs Edge Function or added policy.

---

## Inventory Status

### Get Inventory for an Event
**Screen:** Event detail view, `update_status.tsx`
**Function:** `getInventory(eventId)`

```ts
supabase
  .from('inventory_status')
  .select('*')
  .eq('event_id', eventId)
```

**RLS:** Public.

---

### Upsert Inventory Item
**Screen:** `update_status.tsx` → per-product availability
**Function:** `upsertInventoryItem(eventId, businessUid, product)`

```ts
// product: { product_name, availability, custom_message }
// availability: 'full_stock' | 'low_stock' | 'limited_menu' | 'closing_early' | 'closed_today'
supabase
  .from('inventory_status')
  .upsert(
    { event_id: eventId, business_uid: businessUid, ...product },
    { onConflict: 'event_id,business_uid,product_name' }
  )
```

**RLS:** Owner only (`auth.uid() = business_uid`).

---

### Delete Inventory Item
**Function:** `deleteInventoryItem(eventId, businessUid, productName)`

```ts
supabase
  .from('inventory_status')
  .delete()
  .eq('event_id', eventId)
  .eq('business_uid', businessUid)
  .eq('product_name', productName)
```

---

## Follows

### Follow a Business
**Screen:** `user_business_profile.tsx` → Follow button
**Function:** `followBusiness(followerUid, businessUid)`

```ts
supabase
  .from('follows')
  .insert({ follower_uid: followerUid, business_uid: businessUid })
// businesses.follower_count updates automatically via trigger
```

**RLS:** Owner only (`auth.uid() = follower_uid`).

---

### Unfollow a Business
**Screen:** `user_business_profile.tsx` → Following button (toggle)
**Function:** `unfollowBusiness(followerUid, businessUid)`

```ts
supabase
  .from('follows')
  .delete()
  .eq('follower_uid', followerUid)
  .eq('business_uid', businessUid)
```

---

### Check if Following
**Screen:** `user_business_profile.tsx` (initial follow button state)
**Function:** `isFollowing(followerUid, businessUid)`

```ts
const { data } = await supabase
  .from('follows')
  .select('follower_uid')
  .eq('follower_uid', followerUid)
  .eq('business_uid', businessUid)
  .maybeSingle()

return data !== null
```

---

### Get Businesses a User Follows
**Function:** `getFollowedBusinesses(followerUid)`

```ts
supabase
  .from('follows')
  .select('businesses( * )')
  .eq('follower_uid', followerUid)
```

---

## Reviews

### Get Reviews for a Business
**Screen:** `dashboard.tsx`, `profile.tsx`, `user_business_profile.tsx`
**Function:** `getBusinessReviews(businessUid)`

```ts
supabase
  .from('reviews')
  .select(`
    *,
    profiles ( display_name, avatar_url ),
    events ( event_name )
  `)
  .eq('business_uid', businessUid)
  .order('created_at', { ascending: false })
```

**RLS:** Public.

---

### Submit a Review
**Function:** `submitReview(reviewerUid, businessUid, eventId, rating, body)`

```ts
supabase
  .from('reviews')
  .insert({ reviewer_uid: reviewerUid, business_uid: businessUid, event_id: eventId, rating, body })
// businesses.avg_rating updates automatically via trigger
// eventId can be null if not tied to a specific event
```

**RLS:** Reviewer only (`auth.uid() = reviewer_uid`).

---

### Update a Review
**Function:** `updateReview(reviewId, data)`

```ts
// data: { rating?, body? }
supabase
  .from('reviews')
  .update(data)
  .eq('id', reviewId)
```

**RLS:** Reviewer only.

---

## Notifications

### Get Notifications for Current User
**Screen:** Notifications tab / bell icon
**Function:** `getNotifications(recipientUid)`

```ts
supabase
  .from('notifications')
  .select('*')
  .eq('recipient_uid', recipientUid)
  .order('created_at', { ascending: false })
```

**RLS:** Recipient only.

---

### Get Unread Count
**Function:** `getUnreadCount(recipientUid)`

```ts
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('recipient_uid', recipientUid)
  .eq('is_read', false)
```

---

### Mark Notification as Read
**Function:** `markNotificationRead(notificationId)`

```ts
supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId)
// RLS enforces recipient_uid — no extra filter needed
```

---

### Mark All Notifications as Read
**Function:** `markAllNotificationsRead(recipientUid)`

```ts
supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('recipient_uid', recipientUid)
  .eq('is_read', false)
```

---

## Tags (Vibe Tags)

### Get All Tags
**Screen:** `edit_profile.tsx`, `create_business_event.tsx` — tag picker
**Function:** `getAllTags()`

```ts
supabase
  .from('vibe_tags')
  .select('id, name')
  .order('name')
```

**RLS:** Public.

---

## Explore / Discovery

### Get Explore Feed (Interest-Matched Events)
**Screen:** Explore tab
**Function:** `getExploreFeed(userUid)`

```ts
// 1. Get user's interest tag IDs
const { data: interests } = await supabase
  .from('user_interests')
  .select('tag_id')
  .eq('user_uid', userUid)

const tagIds = interests.map(i => i.tag_id)

// 2. Get matching event IDs
const { data: matched } = await supabase
  .from('event_tags')
  .select('event_id')
  .in('tag_id', tagIds)

const eventIds = [...new Set(matched.map(e => e.event_id))]

// 3. Fetch those events
return supabase
  .from('events')
  .select('*, businesses( business_name, logo_url, avg_rating, follower_count )')
  .in('id', eventIds)
  .eq('is_published', true)
  .in('status', ['upcoming', 'open', 'closing_soon'])
  .order('event_date', { ascending: true })
```

---

### Get / Set User Interests
**Screen:** Customer onboarding — interest picker
**Function:** `setUserInterests(userUid, tagNames)`

```ts
// 1. Resolve tag IDs
const { data: tags } = await supabase
  .from('vibe_tags').select('id, name').in('name', tagNames)

// 2. Delete old
await supabase.from('user_interests').delete().eq('user_uid', userUid)

// 3. Insert new
await supabase
  .from('user_interests')
  .insert(tags.map(t => ({ user_uid: userUid, tag_id: t.id })))
```

**RLS:** Owner only (`auth.uid() = user_uid`).

---

## Screen → Function Map

| Screen | Functions Needed |
|---|---|
| `dashboard.tsx` | `getBusiness`, `getBusinessEvents`, `getBusinessReviews` |
| `profile.tsx` | `getProfile`, `getBusiness`, `getBusinessReviews` |
| `edit_profile.tsx` | `getBusiness`, `updateProfile`, `updateBusiness`, `setBusinessTags`, `getAllTags` |
| `user_business_profile.tsx` | `getBusiness`, `getBusinessReviews`, `isFollowing`, `followBusiness`, `unfollowBusiness` |
| `create_business_event.tsx` | `createEvent`, `updateEvent`, `setEventTags`, `getAllTags` |
| `update_status.tsx` | `updateEventStatus`, `upsertInventoryItem`, `getInventory` |
| Explore tab | `getExploreFeed`, `getAllTags`, `setUserInterests` |
| Notifications | `getNotifications`, `getUnreadCount`, `markNotificationRead`, `markAllNotificationsRead` |
| Auth screens | `signUp`, `signIn`, `signOut`, `getSession` |
