import type { IDataObject } from 'n8n-workflow';

/**
 * Converts flat attributes to JSON:API payload format for POST/PATCH requests.
 * Note: Responses from the API are normalized when Accept: application/json is used.
 */
export function toJsonApiPayload(
	type: string,
	attributes: IDataObject,
	relationships?: IDataObject,
	id?: string,
): IDataObject {
	const data: IDataObject = {
		type,
		attributes,
	};

	if (id) {
		data.id = id;
	}

	if (relationships && Object.keys(relationships).length > 0) {
		data.relationships = relationships;
	}

	return { data };
}

/**
 * Formats a date to ISO 8601 string
 */
export function formatDateTime(date: string | Date): string {
	if (typeof date === 'string') {
		return new Date(date).toISOString();
	}
	return date.toISOString();
}

function compact(data: IDataObject): IDataObject {
	const acc: IDataObject = {};
	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined) {
			acc[key] = value;
		}
	}
	return acc;
}

function simplifyBooking(record: IDataObject): IDataObject {
	const customer = record.customer as IDataObject | undefined;
	const resource = record.resource as IDataObject | undefined;
	const service = record.service as IDataObject | undefined;

	return compact({
		id: record.id,
		number: record.number,
		description: record.description,
		start_date: record.start_date,
		end_date: record.end_date,
		status: record.status,
		created_at: record.created_at,
		resource: resource
			? compact({ id: resource.id, name: resource.name })
			: undefined,
		service: service
			? compact({ id: service.id, name: service.name })
			: undefined,
		customer: customer
			? compact({
				id: customer.id,
				full_name: customer.full_name ?? customer.name,
				email: customer.email,
			})
			: undefined,
	});
}

function simplifyCustomer(record: IDataObject): IDataObject {
	const address = record.address as IDataObject | undefined;

	return compact({
		id: record.id,
		uuid: record.uuid,
		full_name: record.full_name,
		email: record.email,
		phone: record.phone ?? record.mobile,
		mobile: record.mobile,
		company: record.company,
		locale: record.locale,
		created_at: record.created_at,
		address: address
			? compact({
				name: address.name,
				street_address: address.street_address,
				city: address.city,
				country_code: address.country_code,
			})
			: undefined,
	});
}

function simplifyOrder(record: IDataObject): IDataObject {
	const customer = record.customer as IDataObject | undefined;
	const bookings = Array.isArray(record.bookings) ? record.bookings : [];

	return compact({
		id: record.id,
		number: record.number,
		status: record.status,
		total: record.total,
		currency: record.currency,
		start_date: record.start_date,
		end_date: record.end_date,
		created_at: record.created_at,
		customer: customer
			? compact({
				id: customer.id,
				full_name: customer.full_name ?? customer.name,
				email: customer.email,
			})
			: undefined,
		bookings: bookings.map((booking) => {
			const bookingData = booking as IDataObject;
			return compact({
				id: bookingData.id,
				number: bookingData.number,
				start_date: bookingData.start_date,
				end_date: bookingData.end_date,
				status: bookingData.status,
			});
		}),
	});
}

function simplifyInvoice(record: IDataObject): IDataObject {
	const meta = record.meta as IDataObject | undefined;

	return compact({
		id: record.id,
		number: record.number,
		formatted_number: record.formatted_number,
		status: record.status,
		total: record.total,
		currency: record.currency,
		issued_at: record.issued_at,
		due_date: record.due_date,
		created_at: record.created_at,
		download_url: meta?.download_url,
	});
}

function simplifyService(record: IDataObject): IDataObject {
	return compact({
		id: record.id,
		name: record.name,
		slug: record.slug,
		description: record.description,
		price: record.price,
		currency: record.currency,
		hidden: record.hidden,
		is_online: record.is_online,
		allow_resource_selection: record.allow_resource_selection,
		created_at: record.created_at,
	});
}

function simplifyResource(record: IDataObject): IDataObject {
	const parent = record.parent as IDataObject | undefined;
	const category = record.category as IDataObject | undefined;
	const group = record.group as IDataObject | undefined;

	return compact({
		id: record.id,
		name: record.name,
		slug: record.slug,
		description: record.description,
		quantity: record.quantity,
		timezone: record.timezone,
		created_at: record.created_at,
		group: group ? compact({ id: group.id, name: group.name }) : undefined,
		category: category ? compact({ id: category.id, name: category.name, slug: category.slug }) : undefined,
		parent: parent ? compact({ id: parent.id, name: parent.name, slug: parent.slug }) : undefined,
	});
}

function simplifyPlanSubscription(record: IDataObject): IDataObject {
	const customer = record.customer as IDataObject | undefined;
	const plan = record.plan as IDataObject | undefined;

	return compact({
		id: record.id,
		status: record.status,
		start_date: record.start_date,
		end_date: record.end_date,
		renewal_date: record.renewal_date ?? record.next_billing_at,
		amount: record.amount ?? record.total,
		currency: record.currency,
		auto_renew: record.auto_renew,
		created_at: record.created_at,
		customer: customer
			? compact({
				id: customer.id,
				full_name: customer.full_name ?? customer.name,
				email: customer.email,
			})
			: undefined,
		plan: plan ? compact({ id: plan.id, name: plan.name }) : undefined,
	});
}

export function simplifyByResource(resource: string, data: unknown): unknown {
	if (Array.isArray(data)) {
		return data.map((item) => simplifyByResource(resource, item)) as unknown[];
	}

	const record = data as IDataObject;

	switch (resource) {
		case 'booking':
			return simplifyBooking(record);
		case 'customer':
			return simplifyCustomer(record);
		case 'order':
			return simplifyOrder(record);
		case 'invoice':
			return simplifyInvoice(record);
		case 'service':
			return simplifyService(record);
		case 'resource':
			return simplifyResource(record);
		case 'planSubscription':
			return simplifyPlanSubscription(record);
		default:
			return data;
	}
}
