import { ImageLoader } from './ImageLoader.js';
import { Texture } from '../textures/Texture.js';
import { Loader } from './Loader.js';

/**
 * Class for loading textures. Images are internally
 * loaded via {@link ImageLoader}.
 *
 * ```js
 * const loader = new THREE.TextureLoader();
 * const texture = await loader.loadAsync( 'textures/land_ocean_ice_cloud_2048.jpg' );
 *
 * const material = new THREE.MeshBasicMaterial( { map:texture } );
 * ```
 * Please note that `TextureLoader` has dropped support for progress
 * events in `r84`. For a `TextureLoader` that supports progress events, see
 * [this thread](https://github.com/mrdoob/three.js/issues/10439#issuecomment-293260145).
 *
 * @augments Loader
 */
class TextureLoader extends Loader {

	/**
	 * Constructs a new texture loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

	}

	// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
	/**
	 * Starts loading from the given URL and pass the fully loaded texture
	 * to the `onLoad()` callback. The method also returns a new texture object which can
	 * directly be used for material creation. If you do it this way, the texture
	 * may pop up in your scene once the respective loading process is finished.
	 *
	 * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param {function(Texture)} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} onProgress - Unsupported in this loader.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 * @return {Texture} The texture.
	 */
	load( url, onLoad, onProgress, onError, params = {} ) {

		const original_url = url;
		const texture = new Texture();
		const is_data_url = window.is_data_url( url );
		if ( ! is_data_url ) texture._source_file_ = ( this.path + original_url ).replace( /\\/g, '/' );

		// texture.image = {
		// 	is_dummy: true,
		// 	image_data: new ImageData(new Uint8ClampedArray([255,255,255,255, 255,255,255,255, 255,255,255,255 ,255,255,255,255]), 2, 2),
		// 	width: 2,
		// 	height: 2,
		// 	channels: 4,
		// 	depth: 4
		// }
		// texture.image = ImageData2ImageElement(new ImageData(new Uint8ClampedArray([255,255,255,255, 255,255,255,255, 255,255,255,255 ,255,255,255,255]), 2, 2));
		// texture.image = await ImageData2ImageElement(new ImageData(new Uint8ClampedArray([255,255,255,255, 255,255,255,255, 255,255,255,255 ,255,255,255,255]), 2, 2));
		// texture.image = new Image();
		// texture.image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8L/n/PwMQMMIYAEMrBi9x/4F7AAAAAElFTkSuQmCC";


		const loader = new ImageLoader( this.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.setPath( this.path );

		{

			const url = this.path + original_url;

			const tm = window.TimeDurationChecker( `TextureLoader:load-N: ${url.slice( 0, 100 ).split( '/' ).pop()}` );

			loader.load( url, function ( image ) {

				texture.image = image;
				texture.needsUpdate = true;

				if ( onLoad !== undefined ) {

					onLoad( texture );

				}

				tm.finish();

			}, onProgress, onError, params );

		}

		return texture;

	}
	// @DDD@ <<<<<<<<<<<<<<<<<<<<<<

	_load( url, onLoad, onProgress, onError ) { // @DDD@ older

		const texture = new Texture();

		const loader = new ImageLoader( this.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.setPath( this.path );

		loader.load( url, function ( image ) {

			texture.image = image;
			texture.needsUpdate = true;

			if ( onLoad !== undefined ) {

				onLoad( texture );

			}

		}, onProgress, onError );

		return texture;

	}

}


export { TextureLoader };
