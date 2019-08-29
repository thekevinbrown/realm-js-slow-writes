import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import { PhotoManager } from './PhotoManager';
import { RealmManager } from './RealmManager';
import { Profiler } from './Profiler';

export default class App extends Component {
	state = {
		photoCount: 0,
		complete: false,
		mostRecentPhotos: [],
		samples: {},
	};

	componentDidMount = async () => {
		await RealmManager.init();
		// Subscribe to future changes of App Settings.
		this.appSettings = RealmManager.sharedInstance.objects('AppSettings');
		this.appSettings.addListener(this.updateTestComponentVisibility);

		await PhotoManager.startPhotoImport(this.pageImported);

		this.updateTestComponentVisibility();
	};

	componentWillUnmount = () => {
		if (this.appSettings) {
			this.appSettings.removeListener(this.updateTestComponentVisibility);
			delete this.appSettings;
		}
	};

	updateTestComponentVisibility = () => {
		// In the real app we're reading the setting so we can hide or show onboarding info, so like this.
		// this.setState({ testComponentVisible: AppSettings.sharedInstance.anySetting });

		// But actually just accessing it in any way causes the crash
		AppSettings.sharedInstance.anySetting;

		// My unproven theory that I have no direct evidence for is that the listener triggers before the write commits, so we end up in this loop:
		//   1. Let's subscribe to app setting changes.
		//   2. Let's get our app settings
		//   3. There aren't any. We'll create one.
		//   4. That's a change to the query so the listener fires
		//      - We then go back to #2, and there still aren't any.
		//      - So this is an infinite loop.
		//
		// This doesn't present as a normal infinite loop though, as I'd expect a stack overflow, instead
		// we get this:
		//
		// 2019-08-29 14:56:06.063 15723-15723/? A/DEBUG: pid: 15624, tid: 15677, name: mqt_js  >>> com.awesomeproject <<<
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #01 pc 0000000000705d20  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so (__gnu_cxx::__verbose_terminate_handler()+348)
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #02 pc 00000000006b3468  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so (__cxxabiv1::__terminate(void (*)())+8)
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #03 pc 00000000006b34d4  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so (std::terminate()+12)
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #04 pc 00000000006b3610  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so (__cxa_throw+136)
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #05 pc 00000000001528b0  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #06 pc 000000000015292c  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #07 pc 00000000001bfec8  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #08 pc 000000000023c708  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #09 pc 00000000002862c4  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #10 pc 000000000028b6e8  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #11 pc 000000000028b7b0  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #12 pc 0000000000289344  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #13 pc 00000000002a29f0  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #14 pc 000000000033fd00  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #15 pc 00000000002e3e60  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #16 pc 00000000002e48b8  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/lib/arm64/librealmreact.so
		// 2019-08-29 14:56:06.162 15723-15723/? A/DEBUG:     #29 pc 00000000001b4c52  /data/app/com.awesomeproject-tZLiaQ07w9JfnmOtA3evPw==/oat/arm64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$4.run+74)
		// 2019-08-29 14:56:06.451 4858-15728/? W/ActivityManager: crash : com.awesomeproject,0
	};

	pageImported = ({ photoCount, complete }) => {
		Profiler.start('3 Photos Query');
		const photos = RealmManager.sharedInstance
			.objects('Photo')
			.filtered('inTrash == false')
			.sorted('timestamp');

		// This is super slow beyond a few thousand photos
		const mostRecentPhotos = photos.slice(Math.max(photos.length - 3, 0));

		// But this is fast?
		// const mostRecentPhotos = photos.slice(0, 3);

		Profiler.stop('3 Photos Query');

		const samples = Profiler.sampleAll();

		this.setState({
			samples,
			photoCount,
			complete,
			mostRecentPhotos,
		});
	};

	render() {
		const { samples, photoCount, complete, mostRecentPhotos } = this.state;

		return (
			<ScrollView style={styles.fill} contentContainerStyle={styles.container}>
				<Text>Imported {photoCount} photos</Text>
				{complete ? <Text>Complete</Text> : <Text>In Progress</Text>}
				{Object.entries(samples).map(([key, sample]) => (
					<View key={key}>
						<Text style={styles.heading}>{key}</Text>
						<Text>Most recent: {(sample.mostRecent / 1000).toFixed(5)} seconds</Text>
						<Text>Average: {(sample.average / 1000).toFixed(5)} seconds</Text>
					</View>
				))}

				<View style={styles.photoContainer}>
					{mostRecentPhotos.map(photo => (
						<Image key={photo.uri} source={{ uri: photo.uri }} style={styles.image} />
					))}
				</View>
			</ScrollView>
		);
	}
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	container: {
		flex: 1,
		marginHorizontal: 20,
	},
	heading: {
		marginTop: 10,
		fontSize: 16,
		borderBottomWidth: 1,
	},
	photoContainer: {
		flexDirection: 'row',
	},
	image: {
		width: '33%',
		aspectRatio: 1,
	},
});
