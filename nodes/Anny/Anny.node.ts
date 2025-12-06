import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { bookingDescription } from './resources/booking';
import { customerDescription } from './resources/customer';
import { getBookings } from './listSearch/getBookings';
import { getCustomers } from './listSearch/getCustomers';
import { getServices } from './listSearch/getServices';
import { getResources } from './listSearch/getResources';
import { annyApiRequest } from './shared/transport';
import { toJsonApiPayload } from './shared/utils';

export class Anny implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Anny',
		name: 'anny',
		icon: 'file:../../icons/anny.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Anny booking platform API',
		defaults: {
			name: 'Anny',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'annyOAuth2Api',
				required: true,
			},
		],
		requestDefaults: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/vnd.api+json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Booking',
						value: 'booking',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'Make an API Call',
						value: 'apiCall',
					},
				],
				default: 'booking',
			},
			...bookingDescription,
			...customerDescription,
			// API Call properties
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['apiCall'],
					},
				},
				options: [
					{ name: 'GET', value: 'GET' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PATCH', value: 'PATCH' },
					{ name: 'DELETE', value: 'DELETE' },
				],
				default: 'GET',
				description: 'The HTTP method to use',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['apiCall'],
					},
				},
				default: '/v1/resources',
				placeholder: '/v1/resources',
				description: 'Path relative to the API base URL (e.g., /v1/resources)',
				required: true,
			},
			{
				displayName: 'Page Number',
				name: 'pageNumber',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['apiCall'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
			},
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['apiCall'],
					},
				},
				default: 15,
				description: 'Number of items per page (max 30)',
				typeOptions: {
					minValue: 1,
					maxValue: 30,
				},
			},
			{
				displayName: 'Query Parameters',
				name: 'queryParameters',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						resource: ['apiCall'],
					},
				},
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Parameter',
				options: [
					{
						name: 'parameters',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Headers',
				name: 'headers',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						resource: ['apiCall'],
					},
				},
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Header',
				options: [
					{
						name: 'header',
						displayName: 'Header',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['apiCall'],
						method: ['POST', 'PATCH'],
					},
				},
				default: '',
				description: 'Request body as JSON',
			},
		],
	};

	methods = {
		listSearch: {
			getBookings,
			getCustomers,
			getServices,
			getResources,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'apiCall') {
					const method = this.getNodeParameter('method', i) as string;
					const url = this.getNodeParameter('url', i) as string;
					const pageNumber = this.getNodeParameter('pageNumber', i) as number;
					const pageSize = this.getNodeParameter('pageSize', i) as number;
					const queryParameters = this.getNodeParameter('queryParameters', i) as {
						parameters?: Array<{ key: string; value: string }>;
					};
					const headers = this.getNodeParameter('headers', i) as {
						header?: Array<{ key: string; value: string }>;
					};

					const qs: Record<string, string | number> = {
						'page[number]': pageNumber,
						'page[size]': pageSize,
					};

					if (queryParameters.parameters) {
						for (const param of queryParameters.parameters) {
							qs[param.key] = param.value;
						}
					}

					const additionalHeaders: Record<string, string> = {};
					if (headers.header) {
						for (const header of headers.header) {
							additionalHeaders[header.key] = header.value;
						}
					}

					let body: IDataObject | undefined;
					if (method === 'POST' || method === 'PATCH') {
						const bodyStr = this.getNodeParameter('body', i, '') as string;
						if (bodyStr) {
							body = JSON.parse(bodyStr) as IDataObject;
						}
					}

					const response = await annyApiRequest.call(
						this,
						method,
						`/api${url}`,
						qs,
						body,
						additionalHeaders,
					);

					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				} else if (resource === 'booking') {
					const operation = this.getNodeParameter('operation', i) as string;
					let response;

					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i) as {
							status?: string;
							from?: string;
							to?: string;
							customerId?: string;
							serviceId?: string;
							resourceId?: string;
						};

						const qs: Record<string, string | number> = {};
						if (filters.status) qs['filter[status]'] = filters.status;
						if (filters.from) qs['filter[from]'] = filters.from;
						if (filters.to) qs['filter[to]'] = filters.to;
						if (filters.customerId) qs['filter[customer_id]'] = filters.customerId;
						if (filters.serviceId) qs['filter[service_id]'] = filters.serviceId;
						if (filters.resourceId) qs['filter[resource_id]'] = filters.resourceId;

						if (returnAll) {
							response = await annyApiRequestAllItems.call(this, '/api/v1/bookings', qs);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs['page[size]'] = Math.min(limit, 30);
							response = await annyApiRequest.call(this, 'GET', '/api/v1/bookings', qs);
							response = response.data || response;
						}
					} else if (operation === 'get') {
						const bookingId = this.getNodeParameter('bookingId', i, '', { extractValue: true }) as string;
						response = await annyApiRequest.call(this, 'GET', `/api/v1/bookings/${bookingId}`);
						response = response.data || response;
					} else if (operation === 'create') {
						const serviceId = this.getNodeParameter('serviceId', i, '', { extractValue: true }) as string;
						const startsAt = this.getNodeParameter('startsAt', i) as string;
						const endsAt = this.getNodeParameter('endsAt', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as {
							customerId?: string;
							resourceId?: string;
							notes?: string;
							instantBooking?: boolean;
						};

						const attributes: IDataObject = {
							starts_at: startsAt,
							ends_at: endsAt,
						};

						const relationships: IDataObject = {
							service: {
								data: { type: 'services', id: serviceId },
							},
						};

						if (additionalFields.customerId) {
							relationships.customer = {
								data: { type: 'customers', id: additionalFields.customerId },
							};
						}
						if (additionalFields.resourceId) {
							relationships.resource = {
								data: { type: 'resources', id: additionalFields.resourceId },
							};
						}
						if (additionalFields.notes) {
							attributes.notes = additionalFields.notes;
						}

						const body = toJsonApiPayload('bookings', attributes, relationships);
						const endpoint = additionalFields.instantBooking
							? '/api/v1/bookings/instant'
							: '/api/v1/bookings';

						response = await annyApiRequest.call(this, 'POST', endpoint, {}, body);
						response = response.data || response;
					} else if (operation === 'update') {
						const bookingId = this.getNodeParameter('bookingId', i, '', { extractValue: true }) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as {
							startsAt?: string;
							endsAt?: string;
							notes?: string;
							status?: string;
						};

						const attributes: IDataObject = {};
						if (updateFields.startsAt) attributes.starts_at = updateFields.startsAt;
						if (updateFields.endsAt) attributes.ends_at = updateFields.endsAt;
						if (updateFields.notes) attributes.notes = updateFields.notes;
						if (updateFields.status) attributes.status = updateFields.status;

						const body = toJsonApiPayload('bookings', attributes, undefined, bookingId);
						response = await annyApiRequest.call(this, 'PATCH', `/api/v1/bookings/${bookingId}`, {}, body);
						response = response.data || response;
					} else if (operation === 'cancel') {
						const bookingId = this.getNodeParameter('bookingId', i, '', { extractValue: true }) as string;
						response = await annyApiRequest.call(this, 'POST', `/api/v1/bookings/${bookingId}/cancel`);
						response = response.data || response;
					} else if (operation === 'checkIn') {
						const bookingId = this.getNodeParameter('bookingId', i, '', { extractValue: true }) as string;
						response = await annyApiRequest.call(this, 'POST', `/api/v1/bookings/${bookingId}/check-in`);
						response = response.data || response;
					} else if (operation === 'checkOut') {
						const bookingId = this.getNodeParameter('bookingId', i, '', { extractValue: true }) as string;
						response = await annyApiRequest.call(this, 'POST', `/api/v1/bookings/${bookingId}/check-out`);
						response = response.data || response;
					}

					const items = Array.isArray(response) ? response : [response];
					for (const item of items) {
						returnData.push({
							json: item,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'customer') {
					const operation = this.getNodeParameter('operation', i) as string;
					let response;

					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i) as {
							email?: string;
							search?: string;
						};

						const qs: Record<string, string | number> = {};
						if (filters.email) qs['filter[email]'] = filters.email;
						if (filters.search) qs['filter[search]'] = filters.search;

						if (returnAll) {
							response = await annyApiRequestAllItems.call(this, '/api/v1/customers', qs);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs['page[size]'] = Math.min(limit, 30);
							response = await annyApiRequest.call(this, 'GET', '/api/v1/customers', qs);
							response = response.data || response;
						}
					} else if (operation === 'get') {
						const customerId = this.getNodeParameter('customerId', i, '', { extractValue: true }) as string;
						response = await annyApiRequest.call(this, 'GET', `/api/v1/customers/${customerId}`);
						response = response.data || response;
					} else if (operation === 'create') {
						const email = this.getNodeParameter('email', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as {
							firstName?: string;
							lastName?: string;
							phone?: string;
							company?: string;
							notes?: string;
						};

						const attributes: IDataObject = {
							email,
						};

						if (additionalFields.firstName) attributes.first_name = additionalFields.firstName;
						if (additionalFields.lastName) attributes.last_name = additionalFields.lastName;
						if (additionalFields.phone) attributes.phone = additionalFields.phone;
						if (additionalFields.company) attributes.company = additionalFields.company;
						if (additionalFields.notes) attributes.notes = additionalFields.notes;

						const body = toJsonApiPayload('customers', attributes);
						response = await annyApiRequest.call(this, 'POST', '/api/v1/customers', {}, body);
						response = response.data || response;
					} else if (operation === 'update') {
						const customerId = this.getNodeParameter('customerId', i, '', { extractValue: true }) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as {
							email?: string;
							firstName?: string;
							lastName?: string;
							phone?: string;
							company?: string;
							notes?: string;
						};

						const attributes: IDataObject = {};
						if (updateFields.email) attributes.email = updateFields.email;
						if (updateFields.firstName) attributes.first_name = updateFields.firstName;
						if (updateFields.lastName) attributes.last_name = updateFields.lastName;
						if (updateFields.phone) attributes.phone = updateFields.phone;
						if (updateFields.company) attributes.company = updateFields.company;
						if (updateFields.notes) attributes.notes = updateFields.notes;

						const body = toJsonApiPayload('customers', attributes, undefined, customerId);
						response = await annyApiRequest.call(this, 'PATCH', `/api/v1/customers/${customerId}`, {}, body);
						response = response.data || response;
					} else if (operation === 'delete') {
						const customerId = this.getNodeParameter('customerId', i, '', { extractValue: true }) as string;
						await annyApiRequest.call(this, 'DELETE', `/api/v1/customers/${customerId}`);
						response = { success: true, id: customerId };
					}

					const items = Array.isArray(response) ? response : [response];
					for (const item of items) {
						returnData.push({
							json: item,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

interface AnnyApiResponse {
	data?: unknown[];
	meta?: {
		current_page?: number;
		last_page?: number;
	};
	links?: {
		next?: string;
	};
}

async function annyApiRequestAllItems(
	this: IExecuteFunctions,
	endpoint: string,
	qs: Record<string, string | number> = {},
): Promise<unknown[]> {
	const returnData: unknown[] = [];
	let page = 1;
	const pageSize = 30;

	let responseData: AnnyApiResponse;
	do {
		qs['page[number]'] = page;
		qs['page[size]'] = pageSize;
		responseData = await annyApiRequest.call(this, 'GET', endpoint, qs) as AnnyApiResponse;

		const data = responseData.data || responseData;
		if (Array.isArray(data)) {
			returnData.push(...data);
		}

		page++;
	} while (
		(responseData.meta?.current_page !== undefined && 
		responseData.meta?.last_page !== undefined &&
		responseData.meta.current_page < responseData.meta.last_page) ||
		responseData.links?.next
	);

	return returnData;
}
