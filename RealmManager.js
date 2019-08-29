import Realm from 'realm';
import { Album, Photo, AppSettings } from './models';
import { Profiler } from './Profiler';

export class RealmManager {
	static _instance;

	static async init() {
		if (RealmManager._instance) return RealmManager._instance;
		Profiler.start('Realm.open');

		RealmManager._instance = await Realm.open({
			schema: [Album.schema, AppSettings, Photo.schema],

			// This needs to be bumped every time there's a change to the schema.
			schemaVersion: 17,
		});

		Profiler.stop('Realm.open');

		console.log('Realm file: ', RealmManager._instance.path);

		return RealmManager._instance;
	}

	static get sharedInstance() {
		return RealmManager._instance;
	}
}
