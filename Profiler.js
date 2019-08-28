export class Profiler {
	static timers = {};
	static samples = {};

	static start(identifier) {
		this.timers[identifier] = new Date();
	}

	static stop(identifier) {
		const diff = new Date().getTime() - this.timers[identifier].getTime();

		delete this.timers[identifier];

		if (!this.samples[identifier]) this.samples[identifier] = [];
		this.samples[identifier].push(diff);
	}

	static sample(identifier) {
		const samples = this.samples[identifier];

		if (!samples) {
			return {
				total: 0,
				average: 0,
				mostRecent: 0,
			};
		}

		let total = 0;
		samples.forEach(sample => (total += sample));

		const mostRecent = samples[samples.length - 1];

		return {
			total,
			average: total / samples.length,
			mostRecent,
		};
	}

	static sampleAll() {
		const result = {};

		for (const key of Object.keys(this.samples)) {
			result[key] = this.sample(key);
		}

		return result;
	}
}
