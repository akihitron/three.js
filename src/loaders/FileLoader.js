import { Cache } from './Cache.js';
import { Loader } from './Loader.js';

const loading = {};

class HttpError extends Error {

	constructor( message, response ) {

		super( message );
		this.response = response;

	}

}

class FileLoader extends Loader {

	constructor( manager, _params = {} ) { //@DDD@

		super( manager );

		this.params = { file_system: 'external_io' };
		if ( _params ) Object.assign( this.params, _params );

	}


	// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
	load( url, onLoad, onProgress, onError ) {

		const scope = this;
		const isDataURL = window.is_data_url( url );
		const file_system = scope.params.file_system;
		if ( window.external_io && isDataURL == false && file_system == 'external_io' ) {

			if ( url === undefined ) url = '';
			if ( this.path !== undefined ) url = this.path + url;
			url = this.manager.resolveURL( url );
			const cached = Cache.get( url );
			if ( cached != null ) {

				scope.manager.itemStart( url );
				setTimeout( function () {

					if ( onLoad ) onLoad( cached );
					scope.manager.itemEnd( url );

				}, 0 );
				return cached;

			} else {

				const io = window.external_io;
				io.get( url ).then( data=>{

					let response;
					const responseType = ( scope.responseType || '' ).toLowerCase();
					switch ( responseType ) {

						case 'arraybuffer':
						case 'blob':
							const view = data;
							// const view = new Uint8Array( data.length );

							// for ( let i = 0; i < data.length; i ++ ) {

							// 	view[ i ] = data.charCodeAt( i );

							// }
							if ( responseType === 'blob' ) {

								const mimeType = 'application/octet-stream';
								response = new Blob( [ view.buffer ], { type: mimeType } );

							} else {

								if ( view?.buffer instanceof ArrayBuffer ) {

									response = view.buffer;

								} else if ( view instanceof ArrayBuffer ) {

									response = view;

								}

							}

							break;

						case 'document':
							console.error( 'Deprecated' );

							// const parser = new DOMParser();
							// response = parser.parseFromString( data, "application/octet-stream" );

							break;

						case 'json':
							const txt = new TextDecoder().decode( data );

							response = JSON.parse( txt );

							break;
						case 'text':

							response = new TextDecoder().decode( data );

							break;

						default: // 'text' or other

							response = data;

							break;

					}


					Cache.add( url, response );
					if ( onLoad ) onLoad( response );
					scope.manager.itemEnd( url );

				} ).catch( error=>{

					if ( onError ) onError( error );
					scope.manager.itemError( url );
					scope.manager.itemEnd( url );

				} );

			}

		} else {

			if ( window.nodejs && ! window.external_io && isDataURL == false && file_system == 'system_resource' ) {

				url = scope.manager.resolveURL( url );
				const cached = Cache.get( url );
				if ( cached != null ) {

					scope.manager.itemStart( url );
					setTimeout( function () {

						if ( onLoad ) onLoad( cached );
						scope.manager.itemEnd( url );

					}, 0 );
					return cached;

				}

				const nodejs = window.nodejs;
				try {

					const buffer = nodejs.fs.readFileSync( url );
					Cache.add( url, buffer );
					if ( onLoad ) onLoad( buffer );
					scope.manager.itemEnd( url );

				} catch ( e ) {

					console.error( 'FileLoader: ', e );
					onError( e );

				}

				scope.manager.itemEnd( url );
				return;

			}

			return this._load_( url, onLoad, onProgress, onError );

		}

	}
	// @DDD@ <<<<<<<<<<<<<<<<<<<<<<

	_load_( url, onLoad, onProgress, onError ) { // @DDD@ original

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			this.manager.itemStart( url );

			setTimeout( () => {

				if ( onLoad ) onLoad( cached );

				this.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		// Check if request is duplicate

		if ( loading[ url ] !== undefined ) {

			loading[ url ].push( {

				onLoad: onLoad,
				onProgress: onProgress,
				onError: onError

			} );

			return;

		}

		// Initialise array for duplicate requests
		loading[ url ] = [];

		loading[ url ].push( {
			onLoad: onLoad,
			onProgress: onProgress,
			onError: onError,
		} );

		// create request
		const req = new Request( url, {
			headers: new Headers( this.requestHeader ),
			credentials: this.withCredentials ? 'include' : 'same-origin',
			// An abort controller could be added within a future PR
		} );

		// record states ( avoid data race )
		const mimeType = this.mimeType;
		const responseType = this.responseType;

		// start the fetch
		fetch( req )
			.then( response => {

				if ( response.status === 200 || response.status === 0 ) {

					// Some browsers return HTTP Status 0 when using non-http protocol
					// e.g. 'file://' or 'data://'. Handle as success.

					if ( response.status === 0 ) {

						console.warn( 'THREE.FileLoader: HTTP Status 0 received.' );

					}

					// Workaround: Checking if response.body === undefined for Alipay browser #23548

					if ( typeof ReadableStream === 'undefined' || response.body === undefined || response.body.getReader === undefined ) {

						return response;

					}

					const callbacks = loading[ url ];
					const reader = response.body.getReader();

					// Nginx needs X-File-Size check
					// https://serverfault.com/questions/482875/why-does-nginx-remove-content-length-header-for-chunked-content
					const contentLength = response.headers.get( 'X-File-Size' ) || response.headers.get( 'Content-Length' );
					const total = contentLength ? parseInt( contentLength ) : 0;
					const lengthComputable = total !== 0;
					let loaded = 0;

					// periodically read data into the new stream tracking while download progress
					const stream = new ReadableStream( {
						start( controller ) {

							readData();

							function readData() {

								reader.read().then( ( { done, value } ) => {

									if ( done ) {

										controller.close();

									} else {

										loaded += value.byteLength;

										const event = new ProgressEvent( 'progress', { lengthComputable, loaded, total } );
										for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

											const callback = callbacks[ i ];
											if ( callback.onProgress ) callback.onProgress( event );

										}

										controller.enqueue( value );
										readData();

									}

								}, ( e ) => {

									controller.error( e );

								} );

							}

						}

					} );

					return new Response( stream );

				} else {

					throw new HttpError( `fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`, response );

				}

			} )
			.then( response => {

				switch ( responseType ) {

					case 'arraybuffer':

						return response.arrayBuffer();

					case 'blob':

						return response.blob();

					case 'document':

						return response.text()
							.then( text => {

								const parser = new DOMParser();
								return parser.parseFromString( text, mimeType );

							} );

					case 'json':

						return response.json();

					default:

						if ( mimeType === undefined ) {

							return response.text();

						} else {

							// sniff encoding
							const re = /charset="?([^;"\s]*)"?/i;
							const exec = re.exec( mimeType );
							const label = exec && exec[ 1 ] ? exec[ 1 ].toLowerCase() : undefined;
							const decoder = new TextDecoder( label );
							return response.arrayBuffer().then( ab => decoder.decode( ab ) );

						}

				}

			} )
			.then( data => {

				// Add to cache only on HTTP success, so that we do not cache
				// error response bodies as proper responses to requests.
				Cache.add( url, data );

				const callbacks = loading[ url ];
				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

					const callback = callbacks[ i ];
					if ( callback.onLoad ) callback.onLoad( data );

				}

			} )
			.catch( err => {

				// Abort errors and other errors are handled the same

				const callbacks = loading[ url ];

				if ( callbacks === undefined ) {

					// When onLoad was called and url was deleted in `loading`
					this.manager.itemError( url );
					throw err;

				}

				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

					const callback = callbacks[ i ];
					if ( callback.onError ) callback.onError( err );

				}

				this.manager.itemError( url );

			} )
			.finally( () => {

				this.manager.itemEnd( url );

			} );

		this.manager.itemStart( url );

	}

	setResponseType( value ) {

		this.responseType = value;
		return this;

	}

	setMimeType( value ) {

		this.mimeType = value;
		return this;

	}

}


export { FileLoader };
