import type {
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
	IDataObject,
} from 'n8n-workflow';
import { annyApiRequest } from '../shared/transport';

interface CustomerItem {
	id: string;
	email?: string;
	given_name?: string;
	family_name?: string;
	name?: string;
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

	let items: CustomerItem[] = [];
	let meta: IDataObject = {};

	try {
		const response = await annyApiRequest.call(this, 'GET', '/api/v1/customers', qs) as IDataObject;
		items = (response.data || response) as CustomerItem[];
		meta = (response.meta || {}) as IDataObject;
	} catch {
		// Return empty if request fails
	}

	const results: INodeListSearchItems[] = (Array.isArray(items) ? items : []).map((item: CustomerItem) => {
		const email = item.email || '';
		const firstName = item.given_name || '';
		const lastName = item.family_name || '';
		const name = item.name || `${firstName} ${lastName}`.trim();

		return {
			name: name ? `${name} (${email})` : email,
			value: item.id,
		};
	});

	const hasMore = meta.current_page !== undefined && 
		meta.last_page !== undefined &&
		(meta.current_page as number) < (meta.last_page as number);
	
	const nextPaginationToken = hasMore ? String(page + 1) : undefined;

	return { results, paginationToken: nextPaginationToken };
}
