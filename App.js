import React, { Component } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
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

		Profiler.start('query');
		const photos = RealmManager.sharedInstance
			.objects('Photo')
			.filtered('inTrash == false')
			.sorted('timestamp', false);

		const mostRecentPhotos = photos.slice(Math.max(photos.length - 3, 0));
		Profiler.stop('query');

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
			<View style={styles.container}>
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
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
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
