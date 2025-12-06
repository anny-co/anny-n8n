import type { INodeProperties } from 'n8n-workflow';

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
