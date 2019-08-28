export class Photo {
	static schema = {
		name: 'Photo',
		primaryKey: 'uri',
		properties: {
			timestamp: { type: 'date', indexed: true },
			uri: 'string',
			width: 'double',
			height: 'double',
			albums: 'Album[]',
			inTrash: { type: 'bool', default: false, indexed: true },
			lastSeenImportId: { type: 'string?', indexed: true },
		},
	};

	constructor(timestamp, uri, width, height) {
		this.timestamp = timestamp;
		this.uri = uri;
		this.width = width;
		this.height = height;
		this.inTrash = false;
	}
}
