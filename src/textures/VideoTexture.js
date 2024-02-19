import { LinearFilter } from '../constants.js';
import { Texture } from './Texture.js';

class VideoTexture extends Texture {

	constructor( video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy ) {

		super( video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );

		this.isVideoTexture = true;

		this.minFilter = minFilter !== undefined ? minFilter : LinearFilter;
		this.magFilter = magFilter !== undefined ? magFilter : LinearFilter;

		this.generateMipmaps = false;

		const scope = this;

		function updateVideo() {

			scope.needsUpdate = true;
			video.requestVideoFrameCallback( updateVideo );

		}

		if ( 'requestVideoFrameCallback' in video ) {

			video.requestVideoFrameCallback( updateVideo );

		}

	}

	clone() {

		return new this.constructor( this.image ).copy( this );

	}

	// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
	getVideo() {

		return this.image;

	}
	get width() {

		return this.image.videoWidth;

	}
	get height() {

		return this.image.videoHeight;

	}
	play() {

		const video = this.image;
		const isPlaying = ! video.paused && ! video.ended && video.readyState > video.HAVE_CURRENT_DATA;
		if ( ! isPlaying ) {

			video.play();

		}

	}
	getDuration() {

		return this.image.duration;

	}
	setCurrentTime( t ) {

		this.image.currentTime = t;

	}
	getCurrentTime() {

		return this.image.currentTime;

	}
	pause() {

		this.image.pause();

	}
	setVolume( v ) {

		if ( v < 0.0001 ) {

			this.image.muted = true;

		} else {

			this.image.muted = false;

		}

		this.image.volume = v;
		console.log( v );

	}
	setAutoPlay( v ) {

		this.image.autoplay = v;

	}
	getAutoPlay() {

		return this.image.autoplay;

	}
	enableAutoPlay( v = true ) { // Deprecated

		console.warn( 'Deprecated: Use setAutoPlay instead of enableAutoPlay.' );
		if ( v ) {

			this.image.autoplay = true;
			// this.image.setAttribute("autoplay","");

		} else {

			this.image.autoplay = false;
			// this.image.removeAttribute("autoplay","");

		}

	}
	getVolume( v ) {

		return this.image.volume;

	}
	setLoop( v ) {

		this.image.loop = v;

	}
	getLoop( v ) {

		return this.image.loop;

	}
	getMuted() {

		return this.image.muted;

	}
	setMuted( v ) {

		this.image.muted = v;

	}
	stop() {

		this.image.pause();
		this.setCurrentTime( 0 );

	}
	dispose() {

		super.dispose();
		try {

			this.image.pause();

		} catch ( e ) {}

		this.image.currentTime = 0;

	}
	toJSON() {

		const j = super.toJSON();
		j.video_loop = this.image.loop;
		j.video_volume = this.image.volume;
		j.video_muted = this.image.muted;
		return j;

	}
	copy( obj ) {

		super.copy( obj );
		if ( obj.video_loop !== undefined ) {

			this.image.loop = obj.video_loop;
			this.image.volume = obj.video_volume;
			this.image.muted = obj.video_muted;

		} else if ( this.image?.loop !== undefined && obj.image?.loop !== undefined ) {

			this.image.loop = obj.image.loop;
			this.image.volume = obj.image.volume;
			this.image.muted = obj.image.muted;

		}

		return this;

	}
	// @DDD@ <<<<<<<<<<<<<<<<<<<<<<

	update() {

		const video = this.image;
		const hasVideoFrameCallback = 'requestVideoFrameCallback' in video;

		if ( hasVideoFrameCallback === false && video.readyState >= video.HAVE_CURRENT_DATA ) {

			this.needsUpdate = true;

		}

	}

}

export { VideoTexture };
