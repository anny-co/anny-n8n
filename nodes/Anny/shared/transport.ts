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
		case 'local':
			return 'https://anny.test';
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
	useJsonApi: boolean = true,
	acceptJsonApi: boolean = false,
): Promise<IDataObject> {
	// Determine which authentication method is being used
	const authType = this.getNodeParameter('authentication', 0, 'oAuth2') as string;
	const credentialType = authType === 'accessToken' ? 'annyAccessTokenApi' : 'annyOAuth2Api';

	const credentials = await this.getCredentials(credentialType);
	const region = (credentials.region as string) || 'co';
	const baseUrl = getBaseUrl(region);

	// Get organization ID from credentials (stored via preAuthentication for OAuth2)
	const organizationId = credentials.organizationId as string | undefined;
	if (organizationId) {
		qs.o = organizationId;
	}

	// Use application/vnd.api+json for JSON:API requests, application/json for simple requests
	const contentType = useJsonApi ? 'application/vnd.api+json' : 'application/json';
	const acceptType = acceptJsonApi ? 'application/vnd.api+json' : 'application/json';

	const options: IHttpRequestOptions = {
		method: method as IHttpRequestMethods,
		url: `${baseUrl}${resource}`,
		qs,
		headers: {
			Accept: acceptType,
			'Content-Type': contentType,
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
			credentialType,
			options,
		);
	} catch (error) {
		const err = error as {
			message?: string;
			statusCode?: number;
			response?: {
				body?: {
					error?: string;
					title?: string;
					message?: string;
					errors?: Array<{
						status?: string;
						code?: string;
						title?: string;
						detail?: string;
					}>;
				};
			};
		};

		// Format error message based on status code
		let errorMessage = err.message || 'Unknown error';

		if (err.response?.body) {
			const body = err.response.body;

			// Handle JSON:API errors array format
			if (body.errors && Array.isArray(body.errors) && body.errors.length > 0) {
				const errorMessages = body.errors.map((e) => {
					const status = e.status || err.statusCode || '';
					return `[${status}] ${e.title}: ${e.detail}`;
				});
				errorMessage = errorMessages.join('; ');
			} else if (body.error) {
				errorMessage = `[${err.statusCode}] ${body.error}`;
			} else if (body.title && body.message) {
				errorMessage = `[${err.statusCode}] ${body.title}: ${body.message}`;
			}
		}

		throw new Error(errorMessage);
	}
}
