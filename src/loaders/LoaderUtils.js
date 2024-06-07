class LoaderUtils {

	static decodeText( array ) { // @deprecated, r165

		console.warn( 'THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead.' );

		if ( typeof TextDecoder !== 'undefined' ) {

			return new TextDecoder().decode( array );

		}

		// Avoid the String.fromCharCode.apply(null, array) shortcut, which
		// throws a "maximum call stack size exceeded" error for large arrays.

		let s = '';

		for ( let i = 0, il = array.length; i < il; i ++ ) {

			// Implicitly assumes little-endian.
			s += String.fromCharCode( array[ i ] );

		}

		try {

			// merges multi-byte utf-8 characters.

			return decodeURIComponent( escape( s ) );

		} catch ( e ) { // see #16358

			return s;

		}

	}

	static extractUrlBase( url ) {

		// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
		const nodejs = window.nodejs;
		if ( nodejs ) {

			if ( nodejs.path.isAbsolute( url ) ) {

				if ( url.slice( - 1 ) == '/' ) return url.replace( /\//g, '/' );
				return nodejs.path.dirname( url ).replace( /\//g, '/' ) + '/';

			}

		}
		// @DDD@ <<<<<<<<<<<<<<<<<<<<<<


		const index = url.lastIndexOf( '/' );

		if ( index === - 1 ) return './';

		return url.slice( 0, index + 1 );

	}

	static resolveURL( url, path ) {

		// Invalid URL
		if ( typeof url !== 'string' || url === '' ) return '';

		// Host Relative URL
		if ( /^https?:\/\//i.test( path ) && /^\//.test( url ) ) {

			path = path.replace( /(^https?:\/\/[^\/]+).*/i, '$1' );

		}

		// Absolute URL http://,https://,//
		if ( /^(https?:)?\/\//i.test( url ) ) return url;

		// Data URI
		if ( /^data:.*,.*$/i.test( url ) ) return url;

		// Blob URL
		if ( /^blob:.*$/i.test( url ) ) return url;

		// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
		let result = path + url;
		const driver = window.external_io?.driver;
		if ( driver != 'http' ) {

			result = decodeURI( result );

		}

		// Relative URL
		return result;
		// @DDD@ <<<<<<<<<<<<<<<<<<<<<<

	}

}

export { LoaderUtils };
