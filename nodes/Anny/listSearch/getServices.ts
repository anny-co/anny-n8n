import type {
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
	IDataObject,
} from 'n8n-workflow';
import { annyApiRequest } from '../shared/transport';

interface ServiceItem {
	id: string;
	name: string;
}

export async function getServices(
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

	let items: ServiceItem[] = [];
	let meta: IDataObject = {};

	try {
		const response = await annyApiRequest.call(this, 'GET', '/api/v1/services', qs) as IDataObject;
		items = (response.data || response) as ServiceItem[];
		meta = (response.meta || {}) as IDataObject;
	} catch {
		// Return empty if request fails
	}

	const results: INodeListSearchItems[] = (Array.isArray(items) ? items : []).map((item: ServiceItem) => {
		const name = item.name;
	
		return {
			name,
			value: item.id,
		};
	});

	const hasMore = meta.current_page !== undefined && 
		meta.last_page !== undefined &&
		(meta.current_page as number) < (meta.last_page as number);
	
	const nextPaginationToken = hasMore ? String(page + 1) : undefined;

	return { results, paginationToken: nextPaginationToken };
}
