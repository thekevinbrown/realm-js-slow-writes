import uuid from 'react-native-uuid';

import { RealmManager } from '../RealmManager';

export class AppSettings {
	static schema = {
		name: 'AppSettings',
		primaryKey: 'installationId',
		properties: {
			installationId: 'string',
			anySetting: 'bool',
		},
	};

	static get sharedInstance() {
		const settings = RealmManager.sharedInstance
			.objects('AppSettings')
			// Let's make this deterministic. We should never have two
			// instances, but if we ever do, at least return the same one.
			.sorted('installationId');

		if (settings.length > 0) return settings[0];

		// Ok, at this point we don't have any and we need to make one.
		let newSettings = new AppSettings();
		const createSettings = () => {
			newSettings = RealmManager.sharedInstance.create(
				'AppSettings',
				newSettings,
				Realm.UpdateMode.Modified
			);
		};

		console.log('-------> Before Realm Write in App Settings');
		// How the heck do we ever end up here with RealmManager.sharedInstance.isInTransaction
		// being true? I thought JavaScript didn't have threads?
		if (RealmManager.sharedInstance.isInTransaction) createSettings();
		else RealmManager.sharedInstance.write(createSettings);
		console.log('-------> After Realm Write in App Settings');

		return newSettings;
	}

	constructor() {
		this.installationId = uuid.v4();
		this.anySetting = false;
	}
}
