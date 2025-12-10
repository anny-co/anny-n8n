import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { getBookings } from './listSearch/getBookings';
import { getServices } from './listSearch/getServices';
import { getResources } from './listSearch/getResources';
import { getCustomers } from './listSearch/getCustomers';
import { annyApiRequest } from './shared/transport';
import { simplifyByResource, toJsonApiPayload } from './shared/utils';
import {
	bookingSelect,
	serviceSelect,
	resourceSelect,
	customerSelect,
	orderSelect,
	invoiceSelect,
	planSubscriptionSelect,
	includeField,
	pageSizeField,
	pageNumberField,
	searchFilter,
	customFiltersField,
	baseSortField,
	bookingSortField,
	resourceSortField,
} from './shared/descriptions';

export class Anny implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Anny',
		name: 'anny',
		icon: 'file:../../icons/anny.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the anny booking platform',
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
		properties: [
			// Resource selector
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
						name: 'Invoice',
						value: 'invoice',
					},
					{
						name: 'Order',
						value: 'order',
					},
					{
						name: 'Plan Subscription',
						value: 'planSubscription',
					},
					{
						name: 'Resource',
						value: 'resource',
					},
					{
						name: 'Service',
						value: 'service',
					},
				],
				default: 'booking',
			},
			{
				displayName: 'Simplify',
				name: 'simplify',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
				displayOptions: {
					show: {
						resource: ['booking', 'customer', 'invoice', 'order', 'planSubscription', 'resource', 'service'],
						operation: ['get', 'getAll'],
					},
				},
			},

			// ==================== BOOKING OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['booking'],
					},
				},
				options: [
					{
						name: 'Cancel',
						value: 'cancel',
						action: 'Cancel booking',
						description: 'Cancel an existing booking',
					},
					{
						name: 'Check In',
						value: 'checkIn',
						action: 'Check in booking',
						description: 'Check in a customer for their booking',
					},
					{
						name: 'Check Out',
						value: 'checkOut',
						action: 'Check out booking',
						description: 'Check out a customer from their booking',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get booking',
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
						action: 'Update booking',
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
						resource: ['booking'],
						operation: ['get', 'update', 'cancel', 'checkIn', 'checkOut'],
					},
				},
			},
			// Include field for booking get operation
			{
				...includeField,
				displayOptions: {
					show: {
						resource: ['booking'],
						operation: ['get'],
					},
				},
			},
			// Booking Update operation fields
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['booking'],
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
			// Booking Get Many options
			{
				...pageSizeField,
				displayOptions: {
					show: {
						resource: ['booking'],
						operation: ['getAll'],
					},
				},
			},
			{
				...pageNumberField,
				displayOptions: {
					show: {
						resource: ['booking'],
						operation: ['getAll'],
					},
				},
			},
			// Include field for booking getAll operation
			{
				...includeField,
				description: 'Comma-separated related entities to include (e.g., "customer,resource,service")',
				displayOptions: {
					show: {
						resource: ['booking'],
						operation: ['getAll'],
					},
				},
			},
			// Search field for booking getAll operation
			{
				...searchFilter,
				description: 'Search bookings by various fields',
				displayOptions: {
					show: {
						resource: ['booking'],
						operation: ['getAll'],
					},
				},
			},
			// Custom filters for booking getAll operation
			{
				...customFiltersField,
				displayOptions: {
					show: {
						resource: ['booking'],
						operation: ['getAll'],
					},
				},
			},
			// Sorting for booking getAll operation
			{
				...bookingSortField,
				displayOptions: {
					show: {
						resource: ['booking'],
						operation: ['getAll'],
					},
				},
			},

			// ==================== CUSTOMER OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['customer'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create customer',
						description: 'Create a new customer',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete customer',
						description: 'Delete an existing customer',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get customer',
						description: 'Get a single customer by ID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many customers',
						description: 'Get multiple customers',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update customer',
						description: 'Update an existing customer',
					},
				],
				default: 'getAll',
			},
			// Customer ID for get, update, delete
			{
				...customerSelect,
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['get', 'update', 'delete'],
					},
				},
			},
			// Include field for customer get operation
			{
				...includeField,
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['get'],
					},
				},
			},
			// Customer Create operation fields
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['create'],
					},
				},
				description: 'The email address of the customer',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Company',
						name: 'company',
						type: 'string',
						default: '',
						description: 'The company name of the customer',
					},
					{
						displayName: 'First Name',
						name: 'firstName',
						type: 'string',
						default: '',
						description: 'The first name of the customer',
					},
					{
						displayName: 'Last Name',
						name: 'lastName',
						type: 'string',
						default: '',
						description: 'The last name of the customer',
					},
					{
						displayName: 'Notes',
						name: 'notes',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
						description: 'Additional notes about the customer',
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
						description: 'The phone number of the customer',
					},
				],
			},
			// Customer Update operation fields
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Company',
						name: 'company',
						type: 'string',
						default: '',
						description: 'The new company name of the customer',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
						description: 'The new email address of the customer',
					},
					{
						displayName: 'First Name',
						name: 'firstName',
						type: 'string',
						default: '',
						description: 'The new first name of the customer',
					},
					{
						displayName: 'Last Name',
						name: 'lastName',
						type: 'string',
						default: '',
						description: 'The new last name of the customer',
					},
					{
						displayName: 'Notes',
						name: 'notes',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
						description: 'Updated notes about the customer',
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
						description: 'The new phone number of the customer',
					},
				],
			},
			// Customer Get Many options
			{
				...pageSizeField,
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['getAll'],
					},
				},
			},
			{
				...pageNumberField,
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['getAll'],
					},
				},
			},
			// Include field for customer getAll operation
			{
				...includeField,
				description: 'Comma-separated related entities to include (e.g., "address")',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['getAll'],
					},
				},
			},
			// Search field for customer getAll operation
			{
				...searchFilter,
				description: 'Search customers by name, email, or other fields',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['getAll'],
					},
				},
			},
			// Custom filters for customer getAll operation
			{
				...customFiltersField,
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['getAll'],
					},
				},
			},
			// Sorting for customer getAll operation
			{
				...baseSortField,
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['getAll'],
					},
				},
			},

			// ==================== ORDER OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['order'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get order',
						description: 'Get a single order by ID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many orders',
						description: 'Get multiple orders',
					},
				],
				default: 'getAll',
			},
			// Order ID for get
			{
				...orderSelect,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['get'],
					},
				},
			},
			// Include field for order get operation
			{
				...includeField,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['get'],
					},
				},
			},
			// Order Get Many options
			{
				...pageSizeField,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getAll'],
					},
				},
			},
			{
				...pageNumberField,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getAll'],
					},
				},
			},
			// Include field for order getAll operation
			{
				...includeField,
				description: 'Comma-separated related entities to include (e.g., "customer,items")',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getAll'],
					},
				},
			},
			// Search field for order getAll operation
			{
				...searchFilter,
				description: 'Search orders by various fields',
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getAll'],
					},
				},
			},
			// Custom filters for order getAll operation
			{
				...customFiltersField,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getAll'],
					},
				},
			},
			// Sorting for order getAll operation
			{
				...baseSortField,
				displayOptions: {
					show: {
						resource: ['order'],
						operation: ['getAll'],
					},
				},
			},

			// ==================== INVOICE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['invoice'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get invoice',
						description: 'Get a single invoice by ID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many invoices',
						description: 'Get multiple invoices',
					},
				],
				default: 'getAll',
			},
			// Invoice ID for get
			{
				...invoiceSelect,
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['get'],
					},
				},
			},
			// Include field for invoice get operation
			{
				...includeField,
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['get'],
					},
				},
			},
			// Invoice Get Many options
			{
				...pageSizeField,
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['getAll'],
					},
				},
			},
			{
				...pageNumberField,
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['getAll'],
					},
				},
			},
			// Include field for invoice getAll operation
			{
				...includeField,
				description: 'Comma-separated related entities to include (e.g., "customer,items")',
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['getAll'],
					},
				},
			},
			// Search field for invoice getAll operation
			{
				...searchFilter,
				description: 'Search invoices by various fields',
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['getAll'],
					},
				},
			},
			// Custom filters for invoice getAll operation
			{
				...customFiltersField,
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['getAll'],
					},
				},
			},
			// Sorting for invoice getAll operation
			{
				...baseSortField,
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['getAll'],
					},
				},
			},

			// ==================== SERVICE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['service'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get service',
						description: 'Get a single service by ID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many services',
						description: 'Get multiple services',
					},
				],
				default: 'getAll',
			},
			// Service ID for get
			{
				...serviceSelect,
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['get'],
					},
				},
			},
			// Include field for service get operation
			{
				...includeField,
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['get'],
					},
				},
			},
			// Service Get Many options
			{
				...pageSizeField,
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['getAll'],
					},
				},
			},
			{
				...pageNumberField,
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['getAll'],
					},
				},
			},
			// Include field for service getAll operation
			{
				...includeField,
				description: 'Comma-separated related entities to include (e.g., "resources,add_ons")',
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['getAll'],
					},
				},
			},
			// Search field for service getAll operation
			{
				...searchFilter,
				description: 'Search services by name or other fields',
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['getAll'],
					},
				},
			},
			// Custom filters for service getAll operation
			{
				...customFiltersField,
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['getAll'],
					},
				},
			},
			// Sorting for service getAll operation
			{
				...baseSortField,
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['getAll'],
					},
				},
			},

			// ==================== RESOURCE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['resource'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get resource',
						description: 'Get a single resource by ID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many resources',
						description: 'Get multiple resources',
					},
				],
				default: 'getAll',
			},
			// Resource ID for get
			{
				...resourceSelect,
				displayOptions: {
					show: {
						resource: ['resource'],
						operation: ['get'],
					},
				},
			},
			// Include field for resource get operation
			{
				...includeField,
				displayOptions: {
					show: {
						resource: ['resource'],
						operation: ['get'],
					},
				},
			},
			// Resource Get Many options
			{
				...pageSizeField,
				displayOptions: {
					show: {
						resource: ['resource'],
						operation: ['getAll'],
					},
				},
			},
			{
				...pageNumberField,
				displayOptions: {
					show: {
						resource: ['resource'],
						operation: ['getAll'],
					},
				},
			},
			// Include field for resource getAll operation
			{
				...includeField,
				description: 'Comma-separated related entities to include (e.g., "location,services")',
				displayOptions: {
					show: {
						resource: ['resource'],
						operation: ['getAll'],
					},
				},
			},
			// Search field for resource getAll operation
			{
				...searchFilter,
				description: 'Search resources by name or other fields',
				displayOptions: {
					show: {
						resource: ['resource'],
						operation: ['getAll'],
					},
				},
			},
			// Custom filters for resource getAll operation
			{
				...customFiltersField,
				displayOptions: {
					show: {
						resource: ['resource'],
						operation: ['getAll'],
					},
				},
			},
			// Sorting for resource getAll operation
			{
				...resourceSortField,
				displayOptions: {
					show: {
						resource: ['resource'],
						operation: ['getAll'],
					},
				},
			},

			// ==================== PLAN SUBSCRIPTION OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['planSubscription'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get plan subscription',
						description: 'Get a single plan subscription by ID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many plan subscriptions',
						description: 'Get multiple plan subscriptions',
					},
				],
				default: 'getAll',
			},
			// Plan Subscription ID for get
			{
				...planSubscriptionSelect,
				displayOptions: {
					show: {
						resource: ['planSubscription'],
						operation: ['get'],
					},
				},
			},
			// Include field for plan subscription get operation
			{
				...includeField,
				displayOptions: {
					show: {
						resource: ['planSubscription'],
						operation: ['get'],
					},
				},
			},
			// Plan Subscription Get Many options
			{
				...pageSizeField,
				displayOptions: {
					show: {
						resource: ['planSubscription'],
						operation: ['getAll'],
					},
				},
			},
			{
				...pageNumberField,
				displayOptions: {
					show: {
						resource: ['planSubscription'],
						operation: ['getAll'],
					},
				},
			},
			// Include field for planSubscription getAll operation
			{
				...includeField,
				description: 'Comma-separated related entities to include (e.g., "customer,plan")',
				displayOptions: {
					show: {
						resource: ['planSubscription'],
						operation: ['getAll'],
					},
				},
			},
			// Search field for planSubscription getAll operation
			{
				...searchFilter,
				description: 'Search plan subscriptions by various fields',
				displayOptions: {
					show: {
						resource: ['planSubscription'],
						operation: ['getAll'],
					},
				},
			},
			// Custom filters for planSubscription getAll operation
			{
				...customFiltersField,
				displayOptions: {
					show: {
						resource: ['planSubscription'],
						operation: ['getAll'],
					},
				},
			},
			// Sorting for plan subscription getAll operation
			{
				...baseSortField,
				displayOptions: {
					show: {
						resource: ['planSubscription'],
						operation: ['getAll'],
					},
				},
			},
		],
	};

	methods = {
		listSearch: {
			getBookings,
			getServices,
			getResources,
			getCustomers,
			async getOrders(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const page = paginationToken ? parseInt(paginationToken, 10) : 1;
				const qs: IDataObject = {
					'page[number]': page,
					'page[size]': 20,
				};

				if (filter) {
					qs['filter[search]'] = filter;
				}

				const response = await annyApiRequest.call(this, 'GET', '/api/v1/orders', qs);
				const data = ((response as IDataObject).data || response) as IDataObject[];
				const meta = (response as IDataObject).meta as IDataObject | undefined;

				const results = (Array.isArray(data) ? data : []).map((order) => {
					return {
						name: `Order #${order.number || order.id}`,
						value: order.id as string,
					};
				});

				const hasMore = meta?.current_page !== undefined &&
					meta?.last_page !== undefined &&
					(meta.current_page as number) < (meta.last_page as number);

				return {
					results,
					paginationToken: hasMore ? String(page + 1) : undefined,
				};
			},
			async getInvoices(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const page = paginationToken ? parseInt(paginationToken, 10) : 1;
				const qs: IDataObject = {
					'page[number]': page,
					'page[size]': 20,
				};

				if (filter) {
					qs['filter[search]'] = filter;
				}

				const response = await annyApiRequest.call(this, 'GET', '/api/v1/invoices', qs);
				const data = ((response as IDataObject).data || response) as IDataObject[];
				const meta = (response as IDataObject).meta as IDataObject | undefined;

				const results = (Array.isArray(data) ? data : []).map((invoice) => {
					return {
						name: `Invoice #${invoice.number || invoice.id}`,
						value: invoice.id as string,
					};
				});

				const hasMore = meta?.current_page !== undefined &&
					meta?.last_page !== undefined &&
					(meta.current_page as number) < (meta.last_page as number);

				return {
					results,
					paginationToken: hasMore ? String(page + 1) : undefined,
				};
			},
			async getPlanSubscriptions(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const page = paginationToken ? parseInt(paginationToken, 10) : 1;
				const qs: IDataObject = {
					'page[number]': page,
					'page[size]': 20,
				};

				if (filter) {
					qs['filter[search]'] = filter;
				}

				const response = await annyApiRequest.call(this, 'GET', '/api/v1/plan-subscriptions', qs);
				const data = ((response as IDataObject).data || response) as IDataObject[];
				const meta = (response as IDataObject).meta as IDataObject | undefined;

				const results = (Array.isArray(data) ? data : []).map((subscription) => {
					return {
						name: `Subscription #${subscription.number || subscription.id}`,
						value: subscription.id as string,
					};
				});

				const hasMore = meta?.current_page !== undefined &&
					meta?.last_page !== undefined &&
					(meta.current_page as number) < (meta.last_page as number);

				return {
					results,
					paginationToken: hasMore ? String(page + 1) : undefined,
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const defaultIncludes: Record<string, string> = {
			booking: 'resource,service,customer',
			customer: 'address',
			invoice: 'items',
			order: 'customer.address,bookings.resource,bookings.service,invoice.items',
			planSubscription: 'customer,plan',
			resource: 'category,group,location',
			service: 'group',
		};

			for (let i = 0; i < items.length; i++) {
				try {
					const resource = this.getNodeParameter('resource', i) as string;
					const operation = this.getNodeParameter('operation', i) as string;
					const shouldSimplify = ['get', 'getAll'].includes(operation)
						? (this.getNodeParameter('simplify', i) as boolean)
						: false;
					let response;

					// ==================== BOOKING ====================
					if (resource === 'booking') {
						if (operation === 'getAll') {
							const pageSize = this.getNodeParameter('pageSize', i) as number;
							const pageNumber = this.getNodeParameter('pageNumber', i) as number;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.booking;
							const search = this.getNodeParameter('search', i, '') as string;
							const sort = this.getNodeParameter('sort', i, '') as string;
							const customFilters = this.getNodeParameter('customFilters', i, {}) as {
								filters?: Array<{ key: string; value: string }>;
							};

							const qs: Record<string, string | number> = {};
							if (include) qs.include = include;
							if (search) qs['filter[search]'] = search;
							if (sort) qs.sort = sort;
							qs['page[size]'] = Math.min(pageSize, 30);
							qs['page[number]'] = pageNumber;

							// Apply custom filters
							if (customFilters.filters) {
								for (const filter of customFilters.filters) {
									if (filter.key && filter.value) {
										qs[`filter[${filter.key}]`] = filter.value;
									}
								}
							}

							const result = await annyApiRequest.call(this, 'GET', '/api/v1/bookings', qs);
							response = (result as IDataObject).data || result;
						} else if (operation === 'get') {
							const bookingId = this.getNodeParameter('bookingId', i, '', { extractValue: true }) as string;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.booking;
							const qs: IDataObject = {};
							if (include) qs.include = include;
							response = await annyApiRequest.call(this, 'GET', `/api/v1/bookings/${bookingId}`, qs);
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
					} else if (operation === 'cancel') {
						const bookingId = this.getNodeParameter('bookingId', i, '', { extractValue: true }) as string;
						response = await annyApiRequest.call(this, 'POST', `/api/v1/bookings/${bookingId}/cancel`);
					} else if (operation === 'checkIn') {
						const bookingId = this.getNodeParameter('bookingId', i, '', { extractValue: true }) as string;
						response = await annyApiRequest.call(this, 'POST', `/api/v1/bookings/${bookingId}/check-in`);
					} else if (operation === 'checkOut') {
						const bookingId = this.getNodeParameter('bookingId', i, '', { extractValue: true }) as string;
						response = await annyApiRequest.call(this, 'POST', `/api/v1/bookings/${bookingId}/check-out`);
					}
				}

				// ==================== CUSTOMER ====================
				else if (resource === 'customer') {
						if (operation === 'getAll') {
							const pageSize = this.getNodeParameter('pageSize', i) as number;
							const pageNumber = this.getNodeParameter('pageNumber', i) as number;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.customer;
							const search = this.getNodeParameter('search', i, '') as string;
							const sort = this.getNodeParameter('sort', i, '') as string;
							const customFilters = this.getNodeParameter('customFilters', i, {}) as {
								filters?: Array<{ key: string; value: string }>;
							};

							const qs: Record<string, string | number> = {};
							if (include) qs.include = include;
							if (search) qs['filter[search]'] = search;
							if (sort) qs.sort = sort;
							qs['page[size]'] = Math.min(pageSize, 30);
							qs['page[number]'] = pageNumber;

							// Apply custom filters
							if (customFilters.filters) {
								for (const filter of customFilters.filters) {
									if (filter.key && filter.value) {
										qs[`filter[${filter.key}]`] = filter.value;
									}
								}
							}

							const result = await annyApiRequest.call(this, 'GET', '/api/v1/customers', qs);
							response = (result as IDataObject).data || result;
						} else if (operation === 'get') {
							const customerId = this.getNodeParameter('customerId', i, '', { extractValue: true }) as string;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.customer;
							const qs: IDataObject = {};
							if (include) qs.include = include;
							response = await annyApiRequest.call(this, 'GET', `/api/v1/customers/${customerId}`, qs);
					} else if (operation === 'create') {
						const email = this.getNodeParameter('email', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as {
							firstName?: string;
							lastName?: string;
							phone?: string;
							company?: string;
							notes?: string;
						};

						const attributes: IDataObject = { email };
						if (additionalFields.firstName) attributes.first_name = additionalFields.firstName;
						if (additionalFields.lastName) attributes.last_name = additionalFields.lastName;
						if (additionalFields.phone) attributes.phone = additionalFields.phone;
						if (additionalFields.company) attributes.company = additionalFields.company;
						if (additionalFields.notes) attributes.notes = additionalFields.notes;

						const body = toJsonApiPayload('customers', attributes);
						response = await annyApiRequest.call(this, 'POST', '/api/v1/customers', {}, body);
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
					} else if (operation === 'delete') {
						const customerId = this.getNodeParameter('customerId', i, '', { extractValue: true }) as string;
						await annyApiRequest.call(this, 'DELETE', `/api/v1/customers/${customerId}`);
						response = { deleted: true };
					}
				}

				// ==================== ORDER ====================
					else if (resource === 'order') {
						if (operation === 'getAll') {
							const pageSize = this.getNodeParameter('pageSize', i) as number;
							const pageNumber = this.getNodeParameter('pageNumber', i) as number;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.order;
							const search = this.getNodeParameter('search', i, '') as string;
							const sort = this.getNodeParameter('sort', i, '') as string;
							const customFilters = this.getNodeParameter('customFilters', i, {}) as {
								filters?: Array<{ key: string; value: string }>;
							};

							const qs: Record<string, string | number> = {};
							if (include) qs.include = include;
							if (search) qs['filter[search]'] = search;
							if (sort) qs.sort = sort;
							qs['page[size]'] = Math.min(pageSize, 30);
							qs['page[number]'] = pageNumber;

							// Apply custom filters
							if (customFilters.filters) {
								for (const filter of customFilters.filters) {
									if (filter.key && filter.value) {
										qs[`filter[${filter.key}]`] = filter.value;
									}
								}
							}

							const result = await annyApiRequest.call(this, 'GET', '/api/v1/orders', qs);
							response = (result as IDataObject).data || result;
						} else if (operation === 'get') {
							const orderId = this.getNodeParameter('orderId', i, '', { extractValue: true }) as string;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.order;
							const qs: IDataObject = {};
							if (include) qs.include = include;
							response = await annyApiRequest.call(this, 'GET', `/api/v1/orders/${orderId}`, qs);
						}
					}

				// ==================== INVOICE ====================
					else if (resource === 'invoice') {
						if (operation === 'getAll') {
							const pageSize = this.getNodeParameter('pageSize', i) as number;
							const pageNumber = this.getNodeParameter('pageNumber', i) as number;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.invoice;
							const search = this.getNodeParameter('search', i, '') as string;
							const sort = this.getNodeParameter('sort', i, '') as string;
							const customFilters = this.getNodeParameter('customFilters', i, {}) as {
								filters?: Array<{ key: string; value: string }>;
							};

							const qs: Record<string, string | number> = {};
							if (include) qs.include = include;
							if (search) qs['filter[search]'] = search;
							if (sort) qs.sort = sort;
							qs['page[size]'] = Math.min(pageSize, 30);
							qs['page[number]'] = pageNumber;

							// Apply custom filters
							if (customFilters.filters) {
								for (const filter of customFilters.filters) {
									if (filter.key && filter.value) {
										qs[`filter[${filter.key}]`] = filter.value;
									}
								}
							}

							const result = await annyApiRequest.call(this, 'GET', '/api/v1/invoices', qs);
							response = (result as IDataObject).data || result;
						} else if (operation === 'get') {
							const invoiceId = this.getNodeParameter('invoiceId', i, '', { extractValue: true }) as string;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.invoice;
							const qs: IDataObject = {};
							if (include) qs.include = include;
							response = await annyApiRequest.call(this, 'GET', `/api/v1/invoices/${invoiceId}`, qs);
						}
					}

				// ==================== SERVICE ====================
					else if (resource === 'service') {
						if (operation === 'getAll') {
							const pageSize = this.getNodeParameter('pageSize', i) as number;
							const pageNumber = this.getNodeParameter('pageNumber', i) as number;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.service;
							const search = this.getNodeParameter('search', i, '') as string;
							const sort = this.getNodeParameter('sort', i, '') as string;
							const customFilters = this.getNodeParameter('customFilters', i, {}) as {
								filters?: Array<{ key: string; value: string }>;
							};

							const qs: Record<string, string | number> = {};
							if (include) qs.include = include;
							if (search) qs['filter[search]'] = search;
							if (sort) qs.sort = sort;
							qs['page[size]'] = Math.min(pageSize, 30);
							qs['page[number]'] = pageNumber;

							// Apply custom filters
							if (customFilters.filters) {
								for (const filter of customFilters.filters) {
									if (filter.key && filter.value) {
										qs[`filter[${filter.key}]`] = filter.value;
									}
								}
							}

							const result = await annyApiRequest.call(this, 'GET', '/api/v1/services', qs);
							response = (result as IDataObject).data || result;
						} else if (operation === 'get') {
							const serviceId = this.getNodeParameter('serviceId', i, '', { extractValue: true }) as string;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.service;
							const qs: IDataObject = {};
							if (include) qs.include = include;
							response = await annyApiRequest.call(this, 'GET', `/api/v1/services/${serviceId}`, qs);
						}
					}

				// ==================== RESOURCE ====================
					else if (resource === 'resource') {
						if (operation === 'getAll') {
							const pageSize = this.getNodeParameter('pageSize', i) as number;
							const pageNumber = this.getNodeParameter('pageNumber', i) as number;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.resource;
							const search = this.getNodeParameter('search', i, '') as string;
							const sort = this.getNodeParameter('sort', i, '') as string;
							const customFilters = this.getNodeParameter('customFilters', i, {}) as {
								filters?: Array<{ key: string; value: string }>;
							};

							const qs: Record<string, string | number> = {};
							if (include) qs.include = include;
							if (search) qs['filter[search]'] = search;
							if (sort) qs.sort = sort;
							qs['page[size]'] = Math.min(pageSize, 30);
							qs['page[number]'] = pageNumber;

							// Apply custom filters
							if (customFilters.filters) {
								for (const filter of customFilters.filters) {
									if (filter.key && filter.value) {
										qs[`filter[${filter.key}]`] = filter.value;
									}
								}
							}

							const result = await annyApiRequest.call(this, 'GET', '/api/v1/resources', qs);
							response = (result as IDataObject).data || result;
						} else if (operation === 'get') {
							const resourceId = this.getNodeParameter('resourceId', i, '', { extractValue: true }) as string;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.resource;
							const qs: IDataObject = {};
							if (include) qs.include = include;
							response = await annyApiRequest.call(this, 'GET', `/api/v1/resources/${resourceId}`, qs);
						}
					}

				// ==================== PLAN SUBSCRIPTION ====================
					else if (resource === 'planSubscription') {
						if (operation === 'getAll') {
							const pageSize = this.getNodeParameter('pageSize', i) as number;
							const pageNumber = this.getNodeParameter('pageNumber', i) as number;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.planSubscription;
							const search = this.getNodeParameter('search', i, '') as string;
							const sort = this.getNodeParameter('sort', i, '') as string;
							const customFilters = this.getNodeParameter('customFilters', i, {}) as {
								filters?: Array<{ key: string; value: string }>;
							};

							const qs: Record<string, string | number> = {};
							if (include) qs.include = include;
							if (search) qs['filter[search]'] = search;
							if (sort) qs.sort = sort;
							qs['page[size]'] = Math.min(pageSize, 30);
							qs['page[number]'] = pageNumber;

							// Apply custom filters
							if (customFilters.filters) {
								for (const filter of customFilters.filters) {
									if (filter.key && filter.value) {
										qs[`filter[${filter.key}]`] = filter.value;
									}
								}
							}

							const result = await annyApiRequest.call(this, 'GET', '/api/v1/plan-subscriptions', qs);
							response = (result as IDataObject).data || result;
						} else if (operation === 'get') {
							const planSubscriptionId = this.getNodeParameter('planSubscriptionId', i, '', { extractValue: true }) as string;
							const include =
								this.getNodeParameter('include', i, '') as string ||
								defaultIncludes.planSubscription;
							const qs: IDataObject = {};
							if (include) qs.include = include;
							response = await annyApiRequest.call(this, 'GET', `/api/v1/plan-subscriptions/${planSubscriptionId}`, qs);
						}
					}

					if (shouldSimplify && response !== undefined) {
						const payload = (response as IDataObject).data ?? response;
						response = simplifyByResource(resource, payload);
					}

					const resultItems = Array.isArray(response) ? response : [response];
				for (const item of resultItems) {
					returnData.push({
						json: item as IDataObject,
						pairedItem: { item: i },
					});
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
