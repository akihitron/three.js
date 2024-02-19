import { ImageLoader } from './ImageLoader.js';
import { Texture } from '../textures/Texture.js';
import { Loader } from './Loader.js';

class TextureLoader extends Loader {

	constructor( manager ) {

		super( manager );

	}

	// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
	load( url, onLoad, onProgress, onError ) {

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

			}, onProgress, onError );

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
