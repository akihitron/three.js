/**
 * A class with loader utility functions.
 */
class LoaderUtils {

	/**
	 * Extracts the base URL from the given URL.
	 *
	 * @param {string} url -The URL to extract the base URL from.
	 * @return {string} The extracted base URL.
	 */
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

	/**
	 * Resolves relative URLs against the given path. Absolute paths, data urls,
	 * and blob URLs will be returned as is. Invalid URLs will return an empty
	 * string.
	 *
	 * @param {string} url -The URL to resolve.
	 * @param {string} path - The base path for relative URLs to be resolved against.
	 * @return {string} The resolved URL.
	 */
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
