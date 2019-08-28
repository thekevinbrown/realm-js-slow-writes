import uuid from 'react-native-uuid';

export class Album {
	static schema = {
		name: 'Album',
		primaryKey: 'id',
		properties: {
			id: 'string',
			name: 'string',
			photos: { type: 'linkingObjects', objectType: 'Photo', property: 'albums' },
		},
	};

	constructor(name) {
		this.id = uuid.v4();
		this.name = name;
	}
}
