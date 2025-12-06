import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	IHttpRequestOptions,
	IHttpRequestMethods,
} from 'n8n-workflow';

export function getBaseUrl(region: string): string {
	switch (region) {
		case 'eu':
			return 'https://b.anny.eu';
		case 'staging':
			return 'https://b.staging.anny.co';
		case 'co':
		default:
			return 'https://b.anny.co';
	}
}

export async function annyApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods | string,
	resource: string,
	qs: IDataObject = {},
	body?: IDataObject,
	headers: IDataObject = {},
): Promise<IDataObject> {
	const credentials = await this.getCredentials('annyOAuth2Api');
	const region = (credentials.region as string) || 'co';
	const baseUrl = getBaseUrl(region);

	// Add organization ID to query string if available
	if (credentials.organizationId) {
		qs.o = credentials.organizationId as string;
	}

	const options: IHttpRequestOptions = {
		method: method as IHttpRequestMethods,
		url: `${baseUrl}${resource}`,
		qs,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/vnd.api+json',
			...headers,
		},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'annyOAuth2Api',
			options,
		);
	} catch (error) {
		const err = error as { message?: string; statusCode?: number; response?: { body?: { error?: string; title?: string; message?: string } } };
		
		// Format error message based on status code
		let errorMessage = err.message || 'Unknown error';
		
		if (err.response?.body) {
			const body = err.response.body;
			if (body.error) {
				errorMessage = `[${err.statusCode}] ${body.error}`;
			} else if (body.title && body.message) {
				errorMessage = `[${err.statusCode}] ${body.title}: ${body.message}`;
			}
		}

		throw new Error(errorMessage);
	}
}
