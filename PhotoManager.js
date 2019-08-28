import { Platform, PermissionsAndroid, InteractionManager } from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';
import uuid from 'react-native-uuid';
import { UpdateMode } from 'realm';
import { RealmManager } from './RealmManager';
import { Profiler } from './Profiler';

// Returns true if permission granted, false if permissions not granted
// Android only
async function requestAccessToPhotos() {
	if (Platform.OS !== 'android') return true;

	try {
		const granted = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
			{
				title: 'POP Photo Books',
				message: 'POP Photo Books needs access to your photos so you can start sorting',
				buttonNeutral: 'Ask Me Later',
				buttonPositive: 'OK',
			}
		);
		return granted === PermissionsAndroid.RESULTS.GRANTED;
	} catch (err) {
		console.warn(
			'There was a problem getting permissions to access the photos. The error was: ',
			err
		);
		return false;
	}
}

const photosFromEdges = edges =>
	edges.map(edge => {
		const timestamp = new Date(edge.node.timestamp * 1000); // TODO: Suspect that this is returning the timestamp in the wrong timezone.
		const { uri, width, height } = edge.node.image;

		return { timestamp, uri, width, height };
	});

class PhotoManagerImplementation {
	startPhotoImport = async notificationReceiver => {
		const importId = uuid.v4();

		const permissionGranted = await requestAccessToPhotos();
		if (!permissionGranted) {
			notificationReceiver && notificationReceiver({ importId, photoCount: 0, complete: true });
			return;
		}

		let photoCount = 0;

		const importPage = async afterCursor => {
			const options = {
				first: 50,
				after: afterCursor,
				assetType: 'Photos',
				groupTypes: 'All',
			};

			Profiler.start('CameraRoll.getPhotos');
			const nativePhotos = await CameraRoll.getPhotos(options);
			Profiler.stop('CameraRoll.getPhotos');

			const photos = photosFromEdges(nativePhotos.edges);

			photoCount += nativePhotos.edges.length;

			// Write the photos to Realm
			this.storePhotos(importId, photos);

			InteractionManager.runAfterInteractions(() => {
				notificationReceiver && notificationReceiver({ importId, photoCount, complete: false });
			});

			if (nativePhotos.page_info.has_next_page) {
				InteractionManager.runAfterInteractions(() =>
					importPage(nativePhotos.page_info.end_cursor)
				);
			} else {
				InteractionManager.runAfterInteractions(deleteExtraPhotos);
			}
		};

		const deleteExtraPhotos = () => {
			Profiler.start('deleteExtraPhotos');

			// Now that we have all the latest photos from the camera roll
			// anything that doesn't have our importId on it has been deleted
			// and needs to get removed from our UI as well.
			const deletedPhotos = RealmManager.sharedInstance
				.objects('Photo')
				.filtered('lastSeenImportId != $0', importId);

			RealmManager.sharedInstance.write(() => {
				for (const deletedPhoto of deletedPhotos) {
					RealmManager.sharedInstance.delete(deletedPhoto);
				}
			});

			Profiler.stop('deleteExtraPhotos');

			notificationReceiver && notificationReceiver({ importId, photoCount, complete: true });
		};

		InteractionManager.runAfterInteractions(importPage);
	};

	storePhotos = (importId, photos) => {
		// This is a speed optimisation. We're already looping and spreading the photos here,
		// so simply keep track of the months and weeks we're hitting as we go so we don't have
		// to refetch by URI down below.
		try {
			Profiler.start('realm.write');
			RealmManager.sharedInstance.write(() => {
				for (const photo of photos) {
					// This is an upsert, so if the photo doesn't exist it's created, otherwise it's upserted.
					RealmManager.sharedInstance.create(
						'Photo',
						{ ...photo, lastSeenImportId: importId },
						UpdateMode.Modified
					);
				}
			});
			Profiler.stop('realm.write');
		} catch (err) {
			console.error('loadPhotos: Error on creation: ', err);
		}
	};
}

export const PhotoManager = new PhotoManagerImplementation();
