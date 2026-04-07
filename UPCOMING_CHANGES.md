# Upcoming Changes

## Tab Navigation Cleanup

### Before
- **Business**: Dashboard, Create Event, Status, Business Profile, Edit Profile, My Events, Map (7 tabs)
- **Customer**: Explore, Account, Write Review, View Event, Business, Map (6 tabs)

### After
- **Business**: Dashboard, My Events, Status, Map, Profile (5 tabs)
- **Customer**: Explore, Map, Account (3 tabs)

### Hidden screens (routable but removed from tab bar)
| Screen | Route | Accessible From |
|---|---|---|
| `create_business_event` | `/(tabs)/create_business_event` | Dashboard "Create Event" button, My Events header |
| `edit_profile` | `/(tabs)/edit_profile` | Dashboard "Edit Profile" button |
| `buisness_events_drafts` | `/(tabs)/buisness_events_drafts` | My Events "My drafts" button |
| `view_event` | `/(tabs)/view_event?eventId=` | Explore cards, Map "View Details", Business profile event cards |
| `user_business_profile` | `/(tabs)/user_business_profile?businessUid=` | Profile followed business cards |
| `add_review` | `/(tabs)/add_review?businessUid=&eventId=` | View Event "Add Review" button |

---

## Customer Navigation Fixes

### `app/(tabs)/explore.tsx`
- Added `router` import from `expo-router`
- **GridCard**, **FeatureCard**, and **ListCard** components changed from `View` to `TouchableOpacity`
- All three card types now navigate to `/(tabs)/view_event` with `eventId` param on tap

### `app/(tabs)/profile.tsx`
- `FollowedBusinessCard` already had `TouchableOpacity` but no `onPress`
- Added `onPress` → navigates to `/(tabs)/user_business_profile` with `businessUid` param

### `app/(tabs)/map.tsx`
- Added `router` import from `expo-router`
- Added **"View Details"** button to the slide-up event card
- Button hides the card and navigates to `/(tabs)/view_event` with `eventId` param
- Added `viewDetailsBtn` and `viewDetailsBtnText` styles

### `app/(tabs)/user_business_profile.tsx`
- Added `router` import from `expo-router`
- Added `Share` import from `react-native`
- Event cards in "Upcoming Events" section now navigate to `/(tabs)/view_event` with `eventId` param on tap
- **Share Profile** button now opens the native share sheet via `Share.share()`

### `app/(tabs)/view_event.tsx`
- Added `Share` import from `react-native`
- **Share** button now opens the native share sheet via `Share.share()`

---

## Full Customer Navigation Graph (after changes)

```
Explore
  ├── [tap any event card] → view_event
  │     ├── [Add Review] → add_review → (back)
  │     └── [Share] → native share sheet
  └── [search] → local filter

Map
  ├── [tap marker] → slide-up card
  └── [View Details] → view_event

Profile (Account)
  ├── [tap followed business] → user_business_profile
  │     ├── [Follow/Unfollow] → API call
  │     ├── [Share Profile] → native share sheet
  │     └── [tap event card] → view_event
  └── [Sign Out] → /auth
```

---

## Known Remaining Issues

| Screen | Issue |
|---|---|
| `profile.tsx` | Location edit button has no implementation |
| `add_review.tsx` | Quality, Value, Service ratings + tags + recommend choice are collected in UI but not sent to API |
| `user_business_profile.tsx` | Phone/email/website are displayed as text but not tappable links |
