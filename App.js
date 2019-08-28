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
		await PhotoManager.startPhotoImport(this.pageImported);
	};

	pageImported = ({ photoCount, complete }) => {
		const samples = Profiler.sampleAll();

		// ---------------------------------

		Profiler.start('3 Photos Query');
		const photos = RealmManager.sharedInstance
			.objects('Photo')
			.filtered('inTrash == false')
			.sorted('timestamp');

		// This is super slow beyond a few thousand photos
		// const mostRecentPhotos = photos.slice(Math.max(photos.length - 3, 0));

		// But this is fast?
		const mostRecentPhotos = photos.slice(0, 3);

		Profiler.stop('3 Photos Query');

		// ---------------------------------

		Profiler.start('Sorted Photos Query');
		const sortedPhotos = RealmManager.sharedInstance
			.objects('Photo')
			.filtered('inTrash == false')
			.filtered('albums.@count > 0')
			.sorted('timestamp');

		const sortedPhotoCount = sortedPhotos.length;

		Profiler.stop('Sorted Photos Query');

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
