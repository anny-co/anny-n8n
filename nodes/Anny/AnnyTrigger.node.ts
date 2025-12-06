import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError } from 'n8n-workflow';
import { annyApiRequest } from './shared/transport';

export class AnnyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Anny Trigger',
		name: 'annyTrigger',
		icon: 'file:../../icons/anny.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when Anny events occur',
		defaults: {
			name: 'Anny Trigger',
		},
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'annyOAuth2Api',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description: 'The events to listen to',
				options: [
					{
						name: 'Booking Checked In',
						value: 'bookings.checked-in',
					},
					{
						name: 'Booking Checked Out',
						value: 'bookings.checked-out',
					},
					{
						name: 'Booking Created',
						value: 'bookings.created',
					},
					{
						name: 'Booking Deleted',
						value: 'bookings.deleted',
					},
					{
						name: 'Booking Ended',
						value: 'bookings.ended',
					},
					{
						name: 'Booking Started',
						value: 'bookings.started',
					},
					{
						name: 'Booking Updated',
						value: 'bookings.updated',
					},
					{
						name: 'Customer Created',
						value: 'customers.created',
					},
					{
						name: 'Customer Deleted',
						value: 'customers.deleted',
					},
					{
						name: 'Customer Updated',
						value: 'customers.updated',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				if (staticData.webhookId) {
					// Verify webhook still exists on Anny side
					try {
						await annyApiRequest.call(
							this,
							'GET',
							`/api/v1/webhook-subscriptions/${staticData.webhookId}`,
						);
						return true;
					} catch {
						// Webhook doesn't exist anymore, clean up
						delete staticData.webhookId;
						return false;
					}
				}
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];
				const workflowId = this.getWorkflow().id;

				const body: IDataObject = {
					data: {
						type: 'webhook-subscriptions',
						attributes: {
							url: webhookUrl,
							name: `n8n Workflow ${workflowId}`,
							events: events,
						},
					},
				};

				try {
					const response = await annyApiRequest.call(
						this,
						'POST',
						'/api/v1/webhook-subscriptions',
						{},
						body,
					);

					const webhookId = (response.data as IDataObject)?.id as string;
					if (!webhookId) {
						throw new NodeApiError(this.getNode(), {
							message: 'No webhook ID returned from Anny API',
						});
					}

					const staticData = this.getWorkflowStaticData('node');
					staticData.webhookId = webhookId;

					return true;
				} catch (error) {
					throw new NodeApiError(this.getNode(), {
						message: 'Failed to create Anny webhook',
						description: (error as Error).message,
					});
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string;

				if (!webhookId) {
					// Nothing to delete
					return true;
				}

				try {
					await annyApiRequest.call(
						this,
						'DELETE',
						`/api/v1/webhook-subscriptions/${webhookId}`,
					);
				} catch {
					// Webhook might already be deleted, continue cleanup
				}

				delete staticData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const headers = this.getHeaderData();

		// Return the webhook payload to the workflow
		return {
			workflowData: [
				[
					{
						json: {
							event: headers['x-anny-event'] || 'unknown',
							timestamp: headers['x-anny-timestamp'] || new Date().toISOString(),
							...body,
						},
					},
				],
			],
		};
	}
}
