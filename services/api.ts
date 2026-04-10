import { supabase } from '@/lib/supabase';

type UserRole = 'customer' | 'business';

export type Profile = {
	uid: string;
	role: UserRole;
	display_name: string | null;
	avatar_url: string | null;
	location: string | null;
	bio: string | null;
	created_at: string;
	updated_at: string;
};

export type Business = {
	uid: string;
	business_name: string;
	short_description: string | null;
	story: string | null;
	logo_url: string | null;
	email: string | null;
	phone: string | null;
	website: string | null;
	follower_count: number | null;
	avg_rating: number | null;
	created_at: string;
	updated_at: string;
};

export type EventStatus =
	| 'upcoming'
	| 'open'
	| 'closing_soon'
	| 'sold_out'
	| 'paused'
	| 'closed'
	| 'cancelled';

// An event is "active" (currently happening, should appear in Right Now /
// Live now) whenever its status is one of these. Upcoming/closed/cancelled
// are not active.
export function isActiveEventStatus(status: EventStatus): boolean {
	return (
		status === 'open' ||
		status === 'closing_soon' ||
		status === 'sold_out' ||
		status === 'paused'
	);
}

export type EventRow = {
	id: number;
	host_uid: string;
	event_name: string;
	description: string | null;
	story: string | null;
	cover_url: string | null;
	event_date: string;
	start_time: string | null;
	end_time: string | null;
	location: string | null;
	latitude: number | null;
	longitude: number | null;
	status: EventStatus;
	is_published: boolean;
	created_at: string;
	updated_at: string;
};

export type ReviewRow = {
	id: number;
	reviewer_uid: string;
	business_uid: string;
	event_id: number | null;
	rating: number;
	body: string | null;
	created_at: string;
};

type EventCreateInput = {
	event_name: string;
	description?: string | null;
	story?: string | null;
	cover_url?: string | null;
	event_date: string;
	start_time?: string | null;
	end_time?: string | null;
	location?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	status?: EventStatus;
	is_published?: boolean;
};

type EventUpdateInput = Partial<EventCreateInput>;

type ReviewCreateInput = {
	business_uid: string;
	event_id?: number | null;
	rating: number;
	body?: string | null;
};

function assertRating(rating: number): void {
	if (rating < 1 || rating > 5) {
		throw new Error('Rating must be between 1 and 5.');
	}
}

async function requireUserId(): Promise<string> {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error) {
		throw error;
	}

	if (!user?.id) {
		throw new Error('You must be signed in to perform this action.');
	}

	return user.id;
}

export async function getMyProfile(): Promise<Profile | null> {
	const userId = await requireUserId();
	const { data, error } = await supabase
		.from('profiles')
		.select('*')
		.eq('uid', userId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data;
}

export async function updateMyProfile(input: {
	display_name?: string | null;
	avatar_url?: string | null;
	location?: string | null;
	bio?: string | null;
}): Promise<Profile> {
	const userId = await requireUserId();
	const { data, error } = await supabase
		.from('profiles')
		.update(input)
		.eq('uid', userId)
		.select('*')
		.single();

	if (error) {
		throw error;
	}

	return data;
}

export async function getBusinessByUid(uid: string): Promise<Business | null> {
	const { data, error } = await supabase.from('businesses').select('*').eq('uid', uid).maybeSingle();
	if (error) {
		throw error;
	}
	return data;
}

export async function upsertMyBusiness(input: {
	business_name: string;
	short_description?: string | null;
	story?: string | null;
	logo_url?: string | null;
	email?: string | null;
	phone?: string | null;
	website?: string | null;
}): Promise<Business> {
	const uid = await requireUserId();
	const payload = { uid, ...input };

	const { data, error } = await supabase
		.from('businesses')
		.upsert(payload, { onConflict: 'uid' })
		.select('*')
		.single();

	if (error) {
		throw error;
	}

	return data;
}

export async function listPublishedEvents(limit = 30): Promise<EventWithBusiness[]> {
	const { data, error } = await supabase
		.from('events')
		.select('*')
		.eq('is_published', true)
		.order('event_date', { ascending: true })
		.limit(limit);

	if (error) throw error;
	if (!data || data.length === 0) return [];

	const hostUids = [...new Set(data.map((e) => e.host_uid))];
	const { data: bizData } = await supabase
		.from('businesses')
		.select('uid, business_name')
		.in('uid', hostUids);

	const bizMap: Record<string, string> = {};
	for (const b of bizData ?? []) {
		bizMap[b.uid] = b.business_name;
	}

	return data.map((row) => ({ ...row, business_name: bizMap[row.host_uid] ?? 'Pop-Up Business' }));
}

export async function listMyEvents(limit = 50): Promise<EventRow[]> {
	const uid = await requireUserId();
	const { data, error } = await supabase
		.from('events')
		.select('*')
		.eq('host_uid', uid)
		.order('event_date', { ascending: false })
		.limit(limit);

	if (error) {
		throw error;
	}

	return data;
}

export async function createMyEvent(input: EventCreateInput): Promise<EventRow> {
	const host_uid = await requireUserId();
	const payload = {
		host_uid,
		event_name: input.event_name,
		description: input.description ?? null,
		story: input.story ?? null,
		cover_url: input.cover_url ?? null,
		event_date: input.event_date,
		start_time: input.start_time ?? null,
		end_time: input.end_time ?? null,
		location: input.location ?? null,
		latitude: input.latitude ?? null,
		longitude: input.longitude ?? null,
		status: input.status ?? 'upcoming',
		is_published: input.is_published ?? false,
	};

	const { data, error } = await supabase.from('events').insert(payload).select('*').single();

	if (error) {
		throw error;
	}

	return data;
}

export async function updateMyEvent(eventId: number, input: EventUpdateInput): Promise<EventRow> {
	const uid = await requireUserId();
	const { data, error } = await supabase
		.from('events')
		.update(input)
		.eq('id', eventId)
		.eq('host_uid', uid)
		.select('*')
		.single();

	if (error) {
		throw error;
	}

	return data;
}

export async function deleteMyEvent(eventId: number): Promise<void> {
	const uid = await requireUserId();
	const { error } = await supabase.from('events').delete().eq('id', eventId).eq('host_uid', uid);
	if (error) {
		throw error;
	}
}

export async function listReviewsForBusiness(businessUid: string, limit = 50): Promise<ReviewRow[]> {
	const { data, error } = await supabase
		.from('reviews')
		.select('*')
		.eq('business_uid', businessUid)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) {
		throw error;
	}

	return data;
}

export async function createMyReview(input: ReviewCreateInput): Promise<ReviewRow> {
	const reviewer_uid = await requireUserId();
	assertRating(input.rating);

	const payload = {
		reviewer_uid,
		business_uid: input.business_uid,
		event_id: input.event_id ?? null,
		rating: input.rating,
		body: input.body ?? null,
	};

	const { data, error } = await supabase.from('reviews').insert(payload).select('*').single();

	if (error) {
		throw error;
	}

	return data;
}

export async function updateMyReview(reviewId: number, input: { rating?: number; body?: string | null }): Promise<ReviewRow> {
	const reviewer_uid = await requireUserId();
	if (input.rating !== undefined) {
		assertRating(input.rating);
	}

	const { data, error } = await supabase
		.from('reviews')
		.update(input)
		.eq('id', reviewId)
		.eq('reviewer_uid', reviewer_uid)
		.select('*')
		.single();

	if (error) {
		throw error;
	}

	return data;
}

export async function followBusiness(business_uid: string): Promise<void> {
	const follower_uid = await requireUserId();
	const { error } = await supabase
		.from('follows')
		.upsert({ follower_uid, business_uid }, { onConflict: 'follower_uid,business_uid' });

	if (error) {
		throw error;
	}
}

export async function unfollowBusiness(business_uid: string): Promise<void> {
	const follower_uid = await requireUserId();
	const { error } = await supabase
		.from('follows')
		.delete()
		.eq('follower_uid', follower_uid)
		.eq('business_uid', business_uid);

	if (error) {
		throw error;
	}
}

export async function isFollowing(business_uid: string): Promise<boolean> {
	const follower_uid = await requireUserId();
	const { data } = await supabase
		.from('follows')
		.select('follower_uid')
		.eq('follower_uid', follower_uid)
		.eq('business_uid', business_uid)
		.maybeSingle();
	return data !== null;
}

export async function getMyReviews(limit = 50): Promise<ReviewRow[]> {
	const uid = await requireUserId();
	const { data, error } = await supabase
		.from('reviews')
		.select('*')
		.eq('reviewer_uid', uid)
		.order('created_at', { ascending: false })
		.limit(limit);
	if (error) throw error;
	return data;
}

export async function getFollowedBusinesses(): Promise<Business[]> {
	const uid = await requireUserId();
	const { data, error } = await supabase
		.from('follows')
		.select('businesses(*)')
		.eq('follower_uid', uid);
	if (error) throw error;
	return ((data ?? []) as any[]).map((row) => row.businesses).filter(Boolean);
}

export type VibeTag = { id: number; name: string };

export async function getAllTags(): Promise<VibeTag[]> {
	const { data, error } = await supabase.from('vibe_tags').select('id, name').order('name');
	if (error) throw error;
	return data;
}

export async function setMyUserInterests(tagIds: number[]): Promise<void> {
	const user_uid = await requireUserId();
	const { error: deleteError } = await supabase.from('user_interests').delete().eq('user_uid', user_uid);
	if (deleteError) throw deleteError;

	if (tagIds.length === 0) {
		return;
	}

	const rows = tagIds.map((tag_id) => ({ user_uid, tag_id }));
	const { error: insertError } = await supabase.from('user_interests').insert(rows);
	if (insertError) throw insertError;
}

export async function setMyBusinessTags(tagIds: number[]): Promise<void> {
	const business_uid = await requireUserId();
	const { error: deleteError } = await supabase.from('business_tags').delete().eq('business_uid', business_uid);
	if (deleteError) throw deleteError;

	if (tagIds.length === 0) {
		return;
	}

	const rows = tagIds.map((tag_id) => ({ business_uid, tag_id }));
	const { error: insertError } = await supabase.from('business_tags').insert(rows);
	if (insertError) throw insertError;
}

export type EventWithBusiness = EventRow & { business_name: string };

export async function listMappableEvents(limit = 100): Promise<EventWithBusiness[]> {
	const { data, error } = await supabase
		.from('events')
		.select('*')
		.eq('is_published', true)
		.not('latitude', 'is', null)
		.not('longitude', 'is', null)
		.order('event_date', { ascending: true })
		.limit(limit);

	if (error) throw error;
	if (!data || data.length === 0) return [];

	const hostUids = [...new Set(data.map((e) => e.host_uid))];
	const { data: bizData } = await supabase
		.from('businesses')
		.select('uid, business_name')
		.in('uid', hostUids);

	const bizMap: Record<string, string> = {};
	for (const b of bizData ?? []) {
		bizMap[b.uid] = b.business_name;
	}

	return data.map((row) => ({ ...row, business_name: bizMap[row.host_uid] ?? 'Pop-Up Business' }));
}

export async function getEventById(eventId: number): Promise<EventRow | null> {
	const { data, error } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
	if (error) throw error;
	return data;
}

export async function getBusinessEvents(hostUid: string, limit = 20): Promise<EventRow[]> {
	const { data, error } = await supabase
		.from('events')
		.select('*')
		.eq('host_uid', hostUid)
		.eq('is_published', true)
		.order('event_date', { ascending: true })
		.limit(limit);
	if (error) throw error;
	return data;
}

export type InventoryItem = {
	id: number;
	event_id: number;
	business_uid: string;
	product_name: string;
	availability: string;
	custom_message: string | null;
	updated_at: string;
};

export async function getInventory(eventId: number): Promise<InventoryItem[]> {
	const { data, error } = await supabase.from('inventory_status').select('*').eq('event_id', eventId);
	if (error) throw error;
	return data;
}

export async function upsertInventoryItem(
	eventId: number,
	product: { product_name: string; availability: string; custom_message?: string | null },
): Promise<void> {
	const businessUid = await requireUserId();
	const { error } = await supabase
		.from('inventory_status')
		.upsert({ event_id: eventId, business_uid: businessUid, ...product }, { onConflict: 'event_id,business_uid,product_name' });
	if (error) throw error;
}

// ─── Collaborate ────────────────────────────────────────────────────────────
// Lists all other businesses (excluding the caller) for the Collaborate
// Discover tab.
export async function listBusinessesForCollaborate(limit = 100): Promise<Business[]> {
	const uid = await requireUserId();
	const { data, error } = await supabase
		.from('businesses')
		.select('*')
		.neq('uid', uid)
		.order('follower_count', { ascending: false, nullsFirst: false })
		.limit(limit);
	if (error) throw error;
	return data ?? [];
}
