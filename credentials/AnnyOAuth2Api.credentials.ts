import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

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
					name: 'anny.co (International)',
					value: 'co',
				},
				{
					name: 'anny.eu (Europe)',
					value: 'eu',
				},
				{
					name: 'Sandbox (Staging)',
					value: 'staging',
				},
			],
			default: 'co',
			description: 'The Anny region to connect to',
		},
		{
			displayName: 'Tenant UUID',
			name: 'tenantUuid',
			type: 'string',
			default: '',
			description: 'Your Anny tenant UUID (optional)',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'user:read b.organizations:index b.resources:index b.services:index b.bookings:* b.customers:*',
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
				'={{$self["region"] === "co" ? "https://auth.anny.co" : $self["region"] === "eu" ? "https://auth.anny.eu" : "https://auth.staging.anny.co"}}/oauth/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default:
				'={{$self["region"] === "co" ? "https://auth.anny.co" : $self["region"] === "eu" ? "https://auth.anny.eu" : "https://auth.staging.anny.co"}}/oauth/token',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '={{$self["tenantUuid"] ? "tenant=" + $self["tenantUuid"] : ""}}',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
