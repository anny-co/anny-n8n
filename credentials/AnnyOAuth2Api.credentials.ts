import type {
	ICredentialType,
	INodeProperties,
	Icon,
	ICredentialDataDecryptedObject,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { getBaseUrl } from '../nodes/Anny/shared/transport';

export class AnnyOAuth2Api implements ICredentialType {
	name = 'annyOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Anny OAuth2 API';

	icon: Icon = 'file:../icons/anny.svg';

	documentationUrl = 'https://docs.anny.co';

	properties: INodeProperties[] = [
		{
			displayName: 'Region',
			name: 'region',
			type: 'options',
			options: [
				{
					name: 'anny.co (default)',
					value: 'co',
				},
				{
					name: 'anny.eu (Gov-Cloud)',
					value: 'eu',
				},
				{
					name: 'Sandbox (Staging)',
					value: 'staging',
				},
				{
					name: 'Local (Development)',
					value: 'local',
				},
			],
			default: 'co',
			description: 'The anny region to connect to',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default:
				'user:read b.* b.webhook-subscriptions:*',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default:
				'={{$self["region"] === "co" ? "https://auth.anny.co" : $self["region"] === "eu" ? "https://auth.anny.eu" : $self["region"] === "local" ? "https://auth.anny.test" : "https://auth.staging.anny.co"}}/oauth/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default:
				'={{$self["region"] === "co" ? "https://auth.anny.co" : $self["region"] === "eu" ? "https://auth.anny.eu" : $self["region"] === "local" ? "https://auth.anny.test" : "https://auth.staging.anny.co"}}/oauth/token',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
		// Override parent clientId/clientSecret to be hidden with pre-configured values
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'hidden',
			default:
				'={{$self["region"] === "co" ? "a087a0ba-46c7-4221-8472-8fc16702f84a" : $self["region"] === "eu" ? "a087a108-0c7b-4c09-963d-6e51defeac16" : $self["region"] === "local" ? "a087a15e-6337-48a9-b126-eb861ef48486" : "a087a050-ae57-4f29-923c-efb296462024"}}',
		},
		{
			displayName: 'Organization ID',
			name: 'organizationId',
			type: 'hidden',
			default: '',
		},
	];

	// Pre-authentication hook to fetch and store organization ID
	async preAuthentication(
		this: { helpers: { httpRequest: (options: IHttpRequestOptions) => Promise<IDataObject> } },
		credentials: ICredentialDataDecryptedObject,
	): Promise<IDataObject> {
		const baseUrl = getBaseUrl(credentials.region as string);
		const oauthTokenData = credentials.oauthTokenData as IDataObject | undefined;
		const accessToken = oauthTokenData?.access_token as string | undefined;

		// Fetch user with active organization
		const response = await this.helpers.httpRequest({
			method: 'GET',
			url: `${baseUrl}/api/v1/user?include=active_organization`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		// Extract organization ID from response
		let organizationId = '';
		if (response.data && typeof response.data === 'object') {
			const data = response.data as IDataObject;
			const relationships = data.relationships as IDataObject | undefined;
			if (relationships?.active_organization) {
				const activeOrg = relationships.active_organization as IDataObject;
				const orgData = activeOrg.data as IDataObject | undefined;
				if (orgData?.id) {
					organizationId = orgData.id as string;
				}
			}
		}

		return { organizationId };
	}
}
