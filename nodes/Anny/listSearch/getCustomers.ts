import type {
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { annyApiRequest } from '../shared/transport';

interface CustomerItem {
	id: string;
	attributes?: {
		email?: string;
		first_name?: string;
		last_name?: string;
		name?: string;
	};
	email?: string;
	first_name?: string;
	last_name?: string;
	name?: string;
}

interface ApiResponse {
	data?: CustomerItem[];
	meta?: {
		current_page?: number;
		last_page?: number;
		total?: number;
	};
}

export async function getCustomers(
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
		responseData = await annyApiRequest.call(this, 'GET', '/api/v1/customers', qs) as ApiResponse;
	} catch {
		// Return empty if request fails
	}

	const items = responseData.data || [];
	const results: INodeListSearchItems[] = items.map((item: CustomerItem) => {
		const attrs = item.attributes || item;
		const email = attrs.email || '';
		const firstName = attrs.first_name || '';
		const lastName = attrs.last_name || '';
		const name = attrs.name || `${firstName} ${lastName}`.trim();
		
		return {
			name: name ? `${name} (${email})` : email,
			value: item.id,
		};
	});

	const hasMore = responseData.meta?.current_page !== undefined && 
		responseData.meta?.last_page !== undefined &&
		responseData.meta.current_page < responseData.meta.last_page;
	
	const nextPaginationToken = hasMore ? String(page + 1) : undefined;

	return { results, paginationToken: nextPaginationToken };
}
