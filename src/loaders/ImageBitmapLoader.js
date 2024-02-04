import { Cache } from './Cache.js';
import { Loader } from './Loader.js';

class ImageBitmapLoader extends Loader {

	constructor( manager ) {

		super( manager );

		this.isImageBitmapLoader = true;

		if ( typeof createImageBitmap === 'undefined' ) {

			console.warn( 'THREE.ImageBitmapLoader: createImageBitmap() not supported.' );

		}

		if ( typeof fetch === 'undefined' ) {

			console.warn( 'THREE.ImageBitmapLoader: fetch() not supported.' );

		}

		this.options = { premultiplyAlpha: 'none' };

	}

	setOptions( options ) {

		this.options = options;

		return this;

	}

	load( url, onLoad, onProgress, onError ) { // @DDD@


		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const scope = this;

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		if (url.indexOf(":")==-1 && window.external_io) {
			if ( url === undefined ) url = '';
			if ( this.path !== undefined ) url = this.path + url;
			url = this.manager.resolveURL( url );
			const scope = this;
			const cached = Cache.get( url );
			if ( cached !== undefined ) {
				scope.manager.itemStart( url );
				setTimeout( function () {
					if ( onLoad ) onLoad( cached );
					scope.manager.itemEnd( url );
				}, 0 );
				return cached;
			} else {
				let io = window.external_io;
				scope.manager.itemStart( url );
				io.get(url).then(data=>{
					let blob = new Blob([data], {type: 'application/octet-stream'});
					createImageBitmap( blob, Object.assign( scope.options, { colorSpaceConversion: 'none' } ) ).
					then(response=>{
						console.warn(response);
						Cache.add( url, response );
						if ( onLoad ) onLoad( response );
						scope.manager.itemEnd( url );
					}).catch(error=>{
						console.error(error);
						if ( onError ) onError( error );
						scope.manager.itemError( url );
						scope.manager.itemEnd( url );
					});

				}).catch(error=>{
					console.error(error);
					if ( onError ) onError( error );
					scope.manager.itemError( url );
					scope.manager.itemEnd( url );
				});
				return null;
			}
		} else {
			return this._load_(url, onLoad, onProgress, onError);

		}
	}

	_load( url, onLoad, onProgress, onError ) { // @DDD@

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const scope = this;

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			// If cached is a promise, wait for it to resolve
			if ( cached.then ) {

				cached.then( imageBitmap => {

					if ( onLoad ) onLoad( imageBitmap );

					scope.manager.itemEnd( url );

				} ).catch( e => {

					if ( onError ) onError( e );

				} );
				return;

			}

			// If cached is not a promise (i.e., it's already an imageBitmap)
			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		const fetchOptions = {};
		fetchOptions.credentials = ( this.crossOrigin === 'anonymous' ) ? 'same-origin' : 'include';
		fetchOptions.headers = this.requestHeader;

		const promise = fetch( url, fetchOptions ).then( function ( res ) {

			return res.blob();

		} ).then( function ( blob ) {

			return createImageBitmap( blob, Object.assign( scope.options, { colorSpaceConversion: 'none' } ) );

		} ).then( function ( imageBitmap ) {

			Cache.add( url, imageBitmap );

			if ( onLoad ) onLoad( imageBitmap );

			scope.manager.itemEnd( url );

			return imageBitmap;

		} ).catch( function ( e ) {

			if ( onError ) onError( e );

			Cache.remove( url );

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		} );

		Cache.add( url, promise );
		scope.manager.itemStart( url );

	}

}

export { ImageBitmapLoader };
