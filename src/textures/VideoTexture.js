import { LinearFilter } from '../constants.js';
import { Texture } from './Texture.js';

/**
 * A texture for use with a video.
 *
 * ```js
 * // assuming you have created a HTML video element with id="video"
 * const video = document.getElementById( 'video' );
 * const texture = new THREE.VideoTexture( video );
 * ```
 *
 * Note: When using video textures with {@link WebGPURenderer}, {@link Texture#colorSpace} must be
 * set to THREE.SRGBColorSpace.
 *
 * Note: After the initial use of a texture, its dimensions, format, and type
 * cannot be changed. Instead, call {@link Texture#dispose} on the texture and instantiate a new one.
 *
 * @augments Texture
 */
class VideoTexture extends Texture {

	/**
	 * Constructs a new video texture.
	 *
	 * @param {HTMLVideoElement} video - The video element to use as a data source for the texture.
	 * @param {number} [mapping=Texture.DEFAULT_MAPPING] - The texture mapping.
	 * @param {number} [wrapS=ClampToEdgeWrapping] - The wrapS value.
	 * @param {number} [wrapT=ClampToEdgeWrapping] - The wrapT value.
	 * @param {number} [magFilter=LinearFilter] - The mag filter value.
	 * @param {number} [minFilter=LinearFilter] - The min filter value.
	 * @param {number} [format=RGBAFormat] - The texture format.
	 * @param {number} [type=UnsignedByteType] - The texture type.
	 * @param {number} [anisotropy=Texture.DEFAULT_ANISOTROPY] - The anisotropy value.
	 */
	constructor( video, mapping, wrapS, wrapT, magFilter = LinearFilter, minFilter = LinearFilter, format, type, anisotropy ) {

		super( video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isVideoTexture = true;

		/**
		 * Whether to generate mipmaps (if possible) for a texture.
		 *
		 * Overwritten and set to `false` by default.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.generateMipmaps = false;

		/**
		 * The video frame request callback identifier, which is a positive integer.
		 *
		 * Value of 0 represents no scheduled rVFC.
		 *
		 * @private
		 * @type {number}
		 */
		this._requestVideoFrameCallbackId = 0;

		const scope = this;

		function updateVideo() {

			scope.needsUpdate = true;
			scope._requestVideoFrameCallbackId = video.requestVideoFrameCallback( updateVideo );

		}

		if ( 'requestVideoFrameCallback' in video ) {

			this._requestVideoFrameCallbackId = video.requestVideoFrameCallback( updateVideo );

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

	/**
	 * This method is called automatically by the renderer and sets {@link Texture#needsUpdate}
	 * to `true` every time a new frame is available.
	 *
	 * Only relevant if `requestVideoFrameCallback` is not supported in the browser.
	 */
	update() {

		const video = this.image;
		const hasVideoFrameCallback = 'requestVideoFrameCallback' in video;

		if ( hasVideoFrameCallback === false && video.readyState >= video.HAVE_CURRENT_DATA ) {

			this.needsUpdate = true;

		}

	}

	dispose() {

		if ( this._requestVideoFrameCallbackId !== 0 ) {

			this.source.data.cancelVideoFrameCallback( this._requestVideoFrameCallbackId );

		}

		super.dispose();

	}

}

export { VideoTexture };
