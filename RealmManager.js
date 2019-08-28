import Realm from 'realm';
import { Album, Photo } from './models';

export class RealmManager {
	static _instance;

	static async init() {
		if (RealmManager._instance) return RealmManager._instance;
		RealmManager._instance = await Realm.open({
			schema: [Album.schema, Photo.schema],

			// This needs to be bumped every time there's a change to the schema.
			schemaVersion: 16,
		});

		console.log('Realm file: ', RealmManager._instance.path);

		return RealmManager._instance;
	}

	static get sharedInstance() {
		return RealmManager._instance;
	}
}
