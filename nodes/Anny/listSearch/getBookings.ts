import type {
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { annyApiRequest } from '../shared/transport';

interface BookingItem {
	id: string;
	attributes?: {
		starts_at?: string;
		ends_at?: string;
		status?: string;
	};
	starts_at?: string;
	ends_at?: string;
	status?: string;
}

interface ApiResponse {
	data?: BookingItem[];
	meta?: {
		current_page?: number;
		last_page?: number;
		total?: number;
	};
}

export async function getBookings(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? +paginationToken : 1;
	const perPage = 30;

	const qs: Record<string, string | number> = {
		'page[number]': page,
		'page[size]': perPage,
	};

	if (filter) {
		qs['filter[search]'] = filter;
	}

	let responseData: ApiResponse = { data: [] };

	try {
		responseData = await annyApiRequest.call(this, 'GET', '/api/v1/bookings', qs) as ApiResponse;
	} catch {
		// Return empty if request fails
	}

	const items = responseData.data || [];
	const results: INodeListSearchItems[] = items.map((item: BookingItem) => {
		const attrs = item.attributes || item;
		const startsAt = attrs.starts_at ? new Date(attrs.starts_at).toLocaleString() : '';
		const status = attrs.status || '';
		
		return {
			name: `${startsAt} - ${status}`,
			value: item.id,
		};
	});

	const hasMore = responseData.meta?.current_page !== undefined && 
		responseData.meta?.last_page !== undefined &&
		responseData.meta.current_page < responseData.meta.last_page;
	
	const nextPaginationToken = hasMore ? String(page + 1) : undefined;

	return { results, paginationToken: nextPaginationToken };
}
