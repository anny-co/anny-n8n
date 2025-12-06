import type { IDataObject } from 'n8n-workflow';

/**
 * Converts flat attributes to JSON:API payload format
 */
export function toJsonApiPayload(
	type: string,
	attributes: IDataObject,
	relationships?: IDataObject,
	id?: string,
): IDataObject {
	const data: IDataObject = {
		type,
		attributes,
	};

	if (id) {
		data.id = id;
	}

	if (relationships && Object.keys(relationships).length > 0) {
		data.relationships = relationships;
	}

	return { data };
}

/**
 * Extracts data from JSON:API response
 */
export function fromJsonApiResponse(response: IDataObject): IDataObject | IDataObject[] {
	if (response.data) {
		const data = response.data;
		
		if (Array.isArray(data)) {
			return (data as IDataObject[]).map((item) => normalizeJsonApiItem(item, response.included as IDataObject[] | undefined));
		}
		
		return normalizeJsonApiItem(data as IDataObject, response.included as IDataObject[] | undefined);
	}
	
	return response;
}

/**
 * Normalizes a single JSON:API item
 */
function normalizeJsonApiItem(item: IDataObject, included?: IDataObject[]): IDataObject {
	const result: IDataObject = {
		id: item.id,
		type: item.type,
		...(item.attributes as IDataObject || {}),
	};

	// Include relationships if present
	if (item.relationships) {
		result.relationships = item.relationships;
	}

	// Resolve included resources if present
	if (included && item.relationships) {
		const relationships = item.relationships as IDataObject;
		const resolved: IDataObject = {};

		for (const [key, value] of Object.entries(relationships)) {
			const relData = (value as IDataObject)?.data;
			if (relData) {
				if (Array.isArray(relData)) {
					resolved[key] = (relData as IDataObject[]).map((rel) => 
						findIncluded(included, rel.type as string, rel.id as string) || rel
					);
				} else {
					resolved[key] = findIncluded(included, (relData as IDataObject).type as string, (relData as IDataObject).id as string) || relData;
				}
			}
		}

		if (Object.keys(resolved).length > 0) {
			result.resolved = resolved;
		}
	}

	return result;
}

/**
 * Finds an included resource by type and id
 */
function findIncluded(included: IDataObject[], type: string, id: string): IDataObject | undefined {
	const found = included.find(
		(item) => item.type === type && item.id === id
	);
	
	if (found) {
		return {
			id: found.id,
			type: found.type,
			...(found.attributes as IDataObject || {}),
		};
	}
	
	return undefined;
}

/**
 * Formats a date to ISO 8601 string
 */
export function formatDateTime(date: string | Date): string {
	if (typeof date === 'string') {
		return new Date(date).toISOString();
	}
	return date.toISOString();
}
