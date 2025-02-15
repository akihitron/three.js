import { Object3D } from '../core/Object3D.js';

class Audio extends Object3D {

	constructor( listener ) {

		super();

		this.type = 'Audio';

		this.listener = listener;
		this.context = listener.context;

		this.gain = this.context.createGain();
		this.gain.connect( listener.getInput() );

		this.autoplay = false;

		this.buffer = null;
		this.detune = 0;
		this.loop = false;
		this.loopStart = 0;
		this.loopEnd = 0;
		this.offset = 0;
		this.duration = undefined;
		this.playbackRate = 1;
		this.isPlaying = false;
		this.hasPlaybackControl = true;
		this.source = null;
		this.sourceType = 'empty';

		this._startedAt = 0;
		this._progress = 0;
		this._connected = false;

		this.filters = [];

		this.prepare(listener);//@DDD@
	}

	prepare(listener) {	//@DDD@

		if (listener) {
			this.listener = listener;
			this.context = listener.context;
		}
		if (this.source == null && this.context) { 
	
			this.gain = this.context.createGain();
			this.gain.connect( listener.getInput() );

			this.source = this.context.createBufferSource();
			this.source.buffer = this.buffer;
			if (this.buffer) {
				try {
					this.source.start( this._startedAt, this._progress + this.offset, this.duration );
					this.source.stop();
				} catch (e) {
					console.error(e);
				}
			}
		}
	}

	setVolume( value ) {// @DDD@
		if (DMC?.sound_listener && this.source == null) this.prepare(context.sound_listener);
		if (this.gain) this.gain.gain.setTargetAtTime( value, this.context.currentTime, 0.01 ); 
		else console.warn("No gain.");
		return this;

	}



	getOutput() {

		return this.gain;

	}

	setNodeSource( audioNode ) {

		this.hasPlaybackControl = false;
		this.sourceType = 'audioNode';
		this.source = audioNode;
		this.connect();

		return this;

	}

	setMediaElementSource( mediaElement ) {

		this.hasPlaybackControl = false;
		this.sourceType = 'mediaNode';
		this.source = this.context.createMediaElementSource( mediaElement );
		this.connect();

		return this;

	}

	setMediaStreamSource( mediaStream ) {

		this.hasPlaybackControl = false;
		this.sourceType = 'mediaStreamNode';
		this.source = this.context.createMediaStreamSource( mediaStream );
		this.connect();

		return this;

	}

	setBuffer( audioBuffer ) {

		this.buffer = audioBuffer;
		this.sourceType = 'buffer';

		if ( this.autoplay ) this.play();

		return this;

	}

	play( delay = 0 ) {

		if ( this.isPlaying === true ) {

			console.warn( 'THREE.Audio: Audio is already playing.' );
			return;

		}

		if ( this.hasPlaybackControl === false ) {

			console.warn( 'THREE.Audio: this Audio has no playback control.' );
			return;

		}

		if (DMC?.sound_listener && this.source == null) this.prepare(context.sound_listener);
		if (this.context == null) {console.warn("Audio object must prepare audio context before play.");return;}// @DDD@
		const start_offset = - Math.min(delay,0); // @DDD@
		delay = Math.max(delay, 0); // @DDD@

		this._startedAt = this.context.currentTime + delay;

		const source = this.context.createBufferSource();
		source.buffer = this.buffer;
		source.loop = this.loop;
		source.loopStart = this.loopStart;
		source.loopEnd = this.loopEnd;
		source.onended = this.onEnded.bind( this );
		source.start( this._startedAt, this._progress + this.offset, this.duration );

		this.isPlaying = true;

		this.source = source;

		this.setDetune( this.detune );
		this.setPlaybackRate( this.playbackRate );

		if (this.__on_started_audio__) this.__on_started_audio__(); // @DDD@

		return this.connect();

	}


	time() {// @DDD@
		if ( this.isPlaying === true ) return this._progress + this.offset + Math.max( this.context.currentTime - this._startedAt, 0 ) * this.playbackRate;
		return this._progress + this.offset;
	}


	pause() {

		if ( this.hasPlaybackControl === false ) {

			console.warn( 'THREE.Audio: this Audio has no playback control.' );
			return;

		}

		if ( this.isPlaying === true ) {

			// update current progress

			this._progress += Math.max( this.context.currentTime - this._startedAt, 0 ) * this.playbackRate;

			if ( this.loop === true ) {

				// ensure _progress does not exceed duration with looped audios

				this._progress = this._progress % ( this.duration || this.buffer.duration );

			}

			this.source.stop();
			this.source.onended = null;

			this.isPlaying = false;

		}

		return this;

	}

	stop() {

		if ( this.hasPlaybackControl === false ) {

			console.warn( 'THREE.Audio: this Audio has no playback control.' );
			return;

		}

		this._progress = 0;

		if ( this.source !== null ) {

			this.source.stop();
			this.source.onended = null;

		}

		this.isPlaying = false;

		return this;

	}

	connect() {

		if ( this.filters.length > 0 ) {

			this.source.connect( this.filters[ 0 ] );

			for ( let i = 1, l = this.filters.length; i < l; i ++ ) {

				this.filters[ i - 1 ].connect( this.filters[ i ] );

			}

			this.filters[ this.filters.length - 1 ].connect( this.getOutput() );

		} else {

			this.source.connect( this.getOutput() );

		}

		this._connected = true;

		return this;

	}

	disconnect() {

		if ( this._connected === false ) {

			return;

		}

		if ( this.filters.length > 0 ) {

			this.source.disconnect( this.filters[ 0 ] );

			for ( let i = 1, l = this.filters.length; i < l; i ++ ) {

				this.filters[ i - 1 ].disconnect( this.filters[ i ] );

			}

			this.filters[ this.filters.length - 1 ].disconnect( this.getOutput() );

		} else {

			this.source.disconnect( this.getOutput() );

		}

		this._connected = false;

		return this;

	}

	getFilters() {

		return this.filters;

	}

	setFilters( value ) {

		if ( ! value ) value = [];

		if ( this._connected === true ) {

			this.disconnect();
			this.filters = value.slice();
			this.connect();

		} else {

			this.filters = value.slice();

		}

		return this;

	}

	setDetune( value ) {

		this.detune = value;

		if ( this.isPlaying === true && this.source.detune !== undefined ) {

			this.source.detune.setTargetAtTime( this.detune, this.context.currentTime, 0.01 );

		}

		return this;

	}

	getDetune() {

		return this.detune;

	}

	getFilter() {

		return this.getFilters()[ 0 ];

	}

	setFilter( filter ) {

		return this.setFilters( filter ? [ filter ] : [] );

	}

	setPlaybackRate( value ) {

		if ( this.hasPlaybackControl === false ) {

			console.warn( 'THREE.Audio: this Audio has no playback control.' );
			return;

		}

		this.playbackRate = value;

		if ( this.isPlaying === true ) {

			this.source.playbackRate.setTargetAtTime( this.playbackRate, this.context.currentTime, 0.01 );

		}

		return this;

	}

	getPlaybackRate() {

		return this.playbackRate;

	}

	onEnded() {

		this.isPlaying = false;

	}

	getLoop() {

		if ( this.hasPlaybackControl === false ) {

			console.warn( 'THREE.Audio: this Audio has no playback control.' );
			return false;

		}

		return this.loop;

	}

	setLoop( value ) {

		if ( this.hasPlaybackControl === false ) {

			console.warn( 'THREE.Audio: this Audio has no playback control.' );
			return;

		}

		this.loop = value;

		if ( this.isPlaying === true ) {

			this.source.loop = this.loop;

		}

		return this;

	}

	setLoopStart( value ) {

		this.loopStart = value;

		return this;

	}

	setLoopEnd( value ) {

		this.loopEnd = value;

		return this;

	}

	getVolume() {

		return this.gain.gain.value;

	}


}

export { Audio };
