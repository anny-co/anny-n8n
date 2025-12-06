import type { INodeProperties } from 'n8n-workflow';
import { bookingSelect, serviceSelect } from '../../shared/descriptions';

const showOnlyForBooking = {
	resource: ['booking'],
};

export const bookingDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForBooking,
		},
		options: [
			{
				name: 'Cancel',
				value: 'cancel',
				action: 'Cancel a booking',
				description: 'Cancel an existing booking',
			},
			{
				name: 'Check In',
				value: 'checkIn',
				action: 'Check in a booking',
				description: 'Check in a customer for their booking',
			},
			{
				name: 'Check Out',
				value: 'checkOut',
				action: 'Check out a booking',
				description: 'Check out a customer from their booking',
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a booking',
				description: 'Create a new booking',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a booking',
				description: 'Get a single booking by ID',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many bookings',
				description: 'Get multiple bookings',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a booking',
				description: 'Update an existing booking',
			},
		],
		default: 'getAll',
	},
	// Booking ID for get, update, cancel, checkIn, checkOut
	{
		...bookingSelect,
		displayOptions: {
			show: {
				...showOnlyForBooking,
				operation: ['get', 'update', 'cancel', 'checkIn', 'checkOut'],
			},
		},
	},
	// Create operation fields
	{
		...serviceSelect,
		displayOptions: {
			show: {
				...showOnlyForBooking,
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Starts At',
		name: 'startsAt',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForBooking,
				operation: ['create'],
			},
		},
		description: 'The start date and time of the booking',
	},
	{
		displayName: 'Ends At',
		name: 'endsAt',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForBooking,
				operation: ['create'],
			},
		},
		description: 'The end date and time of the booking',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForBooking,
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				default: '',
				description: 'The ID of the customer for this booking',
			},
			{
				displayName: 'Resource ID',
				name: 'resourceId',
				type: 'string',
				default: '',
				description: 'The ID of the resource (e.g., room, staff) for this booking',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Additional notes for the booking',
			},
			{
				displayName: 'Instant Booking',
				name: 'instantBooking',
				type: 'boolean',
				default: false,
				description: 'Whether to create an instant booking (bypasses availability checks)',
			},
		],
	},
	// Update operation fields
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForBooking,
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Starts At',
				name: 'startsAt',
				type: 'dateTime',
				default: '',
				description: 'The new start date and time of the booking',
			},
			{
				displayName: 'Ends At',
				name: 'endsAt',
				type: 'dateTime',
				default: '',
				description: 'The new end date and time of the booking',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Updated notes for the booking',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Pending', value: 'pending' },
					{ name: 'Confirmed', value: 'confirmed' },
					{ name: 'Cancelled', value: 'cancelled' },
				],
				default: 'confirmed',
				description: 'The new status of the booking',
			},
		],
	},
	// Get Many filters
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				...showOnlyForBooking,
				operation: ['getAll'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		displayOptions: {
			show: {
				...showOnlyForBooking,
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForBooking,
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				default: '',
				description: 'Filter bookings by customer ID',
			},
			{
				displayName: 'From Date',
				name: 'from',
				type: 'dateTime',
				default: '',
				description: 'Filter bookings starting from this date',
			},
			{
				displayName: 'Resource ID',
				name: 'resourceId',
				type: 'string',
				default: '',
				description: 'Filter bookings by resource ID',
			},
			{
				displayName: 'Service ID',
				name: 'serviceId',
				type: 'string',
				default: '',
				description: 'Filter bookings by service ID',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Checked In', value: 'checked_in' },
					{ name: 'Checked Out', value: 'checked_out' },
					{ name: 'Confirmed', value: 'confirmed' },
					{ name: 'Pending', value: 'pending' },
				],
				default: '',
				description: 'Filter bookings by status',
			},
			{
				displayName: 'To Date',
				name: 'to',
				type: 'dateTime',
				default: '',
				description: 'Filter bookings until this date',
			},
		],
	},
];
