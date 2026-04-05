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

export async function listPublishedEvents(limit = 30): Promise<EventRow[]> {
	const { data, error } = await supabase
		.from('events')
		.select('*')
		.eq('is_published', true)
		.order('event_date', { ascending: true })
		.limit(limit);

	if (error) {
		throw error;
	}

	return data;
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
