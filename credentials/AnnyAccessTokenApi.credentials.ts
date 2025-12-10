import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class AnnyAccessTokenApi implements ICredentialType {
	name = 'annyAccessTokenApi';

	displayName = 'Anny Access Token API';

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
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The access token from the anny admin interface',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.region === "co" ? "https://b.anny.co" : $credentials.region === "eu" ? "https://b.anny.eu" : $credentials.region === "local" ? "https://anny.test" : "https://b.staging.anny.co"}}',
			url: '/api/v1/user',
			headers: {
				Accept: 'application/json',
			},
		},
	};
}
