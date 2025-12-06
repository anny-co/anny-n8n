import type { INodeProperties } from 'n8n-workflow';

// Common fields for all entities
export const includeField: INodeProperties = {
	displayName: 'Include',
	name: 'include',
	type: 'string',
	default: '',
	description: 'Comma-separated list of related entities to include (e.g., "customer,resource.location")',
	placeholder: 'e.g., customer,resource,service',
};

export const searchFilter: INodeProperties = {
	displayName: 'Search',
	name: 'search',
	type: 'string',
	default: '',
	description: 'Search term to filter results',
};

export const customFiltersField: INodeProperties = {
	displayName: 'Custom Filters',
	name: 'customFilters',
	type: 'fixedCollection',
	typeOptions: {
		multipleValues: true,
	},
	default: {},
	placeholder: 'Add Filter',
	description: 'Add custom filter key-value pairs (e.g., filter[status]=active)',
	options: [
		{
			name: 'filters',
			displayName: 'Filters',
			values: [
				{
					displayName: 'Filter Key',
					name: 'key',
					type: 'string',
					default: '',
					placeholder: 'e.g., status, customer_id, from',
					description: 'The filter key (without "filter[]" wrapper)',
				},
				{
					displayName: 'Filter Value',
					name: 'value',
					type: 'string',
					default: '',
					placeholder: 'e.g., active, 2024-01-01',
				},
			],
		},
	],
};

export const returnAllField: INodeProperties = {
	displayName: 'Return All',
	name: 'returnAll',
	type: 'boolean',
	default: false,
	description: 'Whether to return all results or only up to a given limit',
};

export const limitField: INodeProperties = {
	displayName: 'Limit',
	name: 'limit',
	type: 'number',
	default: 50,
	typeOptions: {
		minValue: 1,
		maxValue: 100,
	},
	description: 'Max number of results to return',
};

export const baseSortField: INodeProperties = {
	displayName: 'Sort',
	name: 'sort',
	type: 'options',
	options: [
		{
			name: 'Created At (Oldest First)',
			value: 'created_at',
		},
		{
			name: 'Created At (Newest First)',
			value: '-created_at',
		},
	],
	default: 'created_at',
	description: 'Sort results by a field',
};

export const bookingSortField: INodeProperties = {
	displayName: 'Sort',
	name: 'sort',
	type: 'options',
	options: [
		{
			name: 'Created At (Oldest First)',
			value: 'created_at',
		},
		{
			name: 'Created At (Newest First)',
			value: '-created_at',
		},
		{
			name: 'Start Date (Earliest First)',
			value: 'start_date',
		},
		{
			name: 'Start Date (Latest First)',
			value: '-start_date',
		},
	],
	default: 'created_at',
	description: 'Sort results by a field',
};

export const resourceSortField: INodeProperties = {
	displayName: 'Sort',
	name: 'sort',
	type: 'options',
	options: [
		{
			name: 'Created At (Oldest First)',
			value: 'created_at',
		},
		{
			name: 'Created At (Newest First)',
			value: '-created_at',
		},
		{
			name: 'Name (A → Z)',
			value: 'name',
		},
		{
			name: 'Name (Z → A)',
			value: '-name',
		},
	],
	default: 'created_at',
	description: 'Sort results by a field',
};

export const bookingSelect: INodeProperties = {
	displayName: 'Booking',
	name: 'bookingId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a booking...',
			typeOptions: {
				searchListMethod: 'getBookings',
				searchable: true,
				searchFilterRequired: false,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 12345678-1234-1234-1234-123456789012',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[a-fA-F0-9-]+$',
						errorMessage: 'Not a valid Booking ID',
					},
				},
			],
		},
	],
};

export const customerSelect: INodeProperties = {
	displayName: 'Customer',
	name: 'customerId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a customer...',
			typeOptions: {
				searchListMethod: 'getCustomers',
				searchable: true,
				searchFilterRequired: false,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 12345678-1234-1234-1234-123456789012',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[a-fA-F0-9-]+$',
						errorMessage: 'Not a valid Customer ID',
					},
				},
			],
		},
	],
};

export const serviceSelect: INodeProperties = {
	displayName: 'Service',
	name: 'serviceId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a service...',
			typeOptions: {
				searchListMethod: 'getServices',
				searchable: true,
				searchFilterRequired: false,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 12345678-1234-1234-1234-123456789012',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[a-fA-F0-9-]+$',
						errorMessage: 'Not a valid Service ID',
					},
				},
			],
		},
	],
};

export const resourceSelect: INodeProperties = {
	displayName: 'Resource',
	name: 'resourceId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a resource...',
			typeOptions: {
				searchListMethod: 'getResources',
				searchable: true,
				searchFilterRequired: false,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 12345678-1234-1234-1234-123456789012',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[a-fA-F0-9-]+$',
						errorMessage: 'Not a valid Resource ID',
					},
				},
			],
		},
	],
};

export const orderSelect: INodeProperties = {
	displayName: 'Order',
	name: 'orderId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select an order...',
			typeOptions: {
				searchListMethod: 'getOrders',
				searchable: true,
				searchFilterRequired: false,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 12345678-1234-1234-1234-123456789012',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[a-fA-F0-9-]+$',
						errorMessage: 'Not a valid Order ID',
					},
				},
			],
		},
	],
};

export const invoiceSelect: INodeProperties = {
	displayName: 'Invoice',
	name: 'invoiceId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select an invoice...',
			typeOptions: {
				searchListMethod: 'getInvoices',
				searchable: true,
				searchFilterRequired: false,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 12345678-1234-1234-1234-123456789012',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[a-fA-F0-9-]+$',
						errorMessage: 'Not a valid Invoice ID',
					},
				},
			],
		},
	],
};

export const planSubscriptionSelect: INodeProperties = {
	displayName: 'Plan Subscription',
	name: 'planSubscriptionId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a plan subscription...',
			typeOptions: {
				searchListMethod: 'getPlanSubscriptions',
				searchable: true,
				searchFilterRequired: false,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 12345678-1234-1234-1234-123456789012',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[a-fA-F0-9-]+$',
						errorMessage: 'Not a valid Plan Subscription ID',
					},
				},
			],
		},
	],
};
