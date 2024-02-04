import { FloatType } from '../../constants.js';
import { DataArrayTexture } from '../../textures/DataArrayTexture.js';
import { Vector4 } from '../../math/Vector4.js';
import { Vector2 } from '../../math/Vector2.js';

function numericalSort( a, b ) {

	return a[ 0 ] - b[ 0 ];

}

function absNumericalSort( a, b ) {

	return Math.abs( b[ 1 ] ) - Math.abs( a[ 1 ] );

}

function WebGLMorphtargets( gl, capabilities, textures ) {

	const influencesList = {};
	const morphInfluences = new Float32Array( 8 );
	const morphTextures = new WeakMap();
	const objectMorphTemps = new WeakMap(); // @DDD@
	const morph = new Vector4();

	const workInfluences = [];

	for ( let i = 0; i < 8; i ++ ) {

		workInfluences[ i ] = [ i, 0 ];

	}

	function update( object, geometry, material, program ) {

		const objectInfluences = object.morphTargetInfluences;

		// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
		let tmp_influences = null;
		if (object.morphTargetInfluences_backup && object.morphTargetInfluences_cache) {
			const morphTargetInfluences = object.morphTargetInfluences;
			const backup = object.morphTargetInfluences_backup;
			const cache = object.morphTargetInfluences_cache;
			const coef = object.morphTargetInfluences_coef;
			const result = object.morphTargetInfluences_result;

			// if (geometry.isMMDMorph) {
			// 	tmp_influences = objectMorphTemps.get(object)?.tmp_influences;
			// 	if (tmp_influences == null) tmp_influences = new Float32Array(geometry.morphAttributes.position.length);
			// 	objectMorphTemps.set(object, {tmp_influences});
			// }
			tmp_influences = objectMorphTemps.get(object)?.tmp_influences;
			if (tmp_influences == null) tmp_influences = new Float32Array(geometry.morphAttributes.position.length);
			objectMorphTemps.set(object, {tmp_influences});
		
			let m_index = 0;
			const mask = geometry.influenceMasks;
			if (mask) {
				for (let i = 0,l=morphTargetInfluences.length;i<l;++i) {
					const c = morphTargetInfluences[i];
					backup[i] = c;
					const r = result[i] = (c + cache[i]) * coef[i];
					const m = mask[i];
					const a = morphTargetInfluences[i] = r * m;
					if (m > 0) tmp_influences[m_index++] = a;
				}
	
			} else {
				for (let i = 0,l=morphTargetInfluences.length;i<l;++i) {
					const c = morphTargetInfluences[i];
					backup[i] = c;
					const r = result[i] = (c + cache[i]) * coef[i];
					const a = morphTargetInfluences[i] = r;
					tmp_influences[m_index++] = a;
				}
			}
		} else {
			tmp_influences = object.morphTargetInfluences;
		}
		// @DDD@ <<<<<<<<<<<<<<<<<<<<<<
		

		if ( capabilities.isWebGL2 === true ) {

			// instead of using attributes, the WebGL 2 code path encodes morph targets
			// into an array of data textures. Each layer represents a single morph target.

			const morphAttribute = geometry.morphAttributes.position || geometry.morphAttributes.normal || geometry.morphAttributes.color;
			const morphTargetsCount = ( morphAttribute !== undefined ) ? morphAttribute.length : 0;

			let entry = morphTextures.get( geometry );

			if ( entry === undefined || entry.count !== morphTargetsCount ) {

				if ( entry !== undefined ) entry.texture.dispose();

				const hasMorphPosition = geometry.morphAttributes.position !== undefined;
				const hasMorphNormals = geometry.morphAttributes.normal !== undefined;
				const hasMorphColors = geometry.morphAttributes.color !== undefined;

				const morphTargets = geometry.morphAttributes.position || [];
				const morphNormals = geometry.morphAttributes.normal || [];
				const morphColors = geometry.morphAttributes.color || [];

				let vertexDataCount = 0;

				if ( hasMorphPosition === true ) vertexDataCount = 1;
				if ( hasMorphNormals === true ) vertexDataCount = 2;
				if ( hasMorphColors === true ) vertexDataCount = 3;

				let width = geometry.attributes.position.count * vertexDataCount;
				let height = 1;

				if ( width > capabilities.maxTextureSize ) {

					height = Math.ceil( width / capabilities.maxTextureSize );
					width = capabilities.maxTextureSize;

				}

				const buffer = new Float32Array( width * height * 4 * morphTargetsCount );

				const texture = new DataArrayTexture( buffer, width, height, morphTargetsCount );
				texture.type = FloatType;
				texture.needsUpdate = true;

				// fill buffer

				const vertexDataStride = vertexDataCount * 4;

				for ( let i = 0; i < morphTargetsCount; i ++ ) {

					const morphTarget = morphTargets[ i ];
					const morphNormal = morphNormals[ i ];
					const morphColor = morphColors[ i ];

					const offset = width * height * 4 * i;

					for ( let j = 0; j < morphTarget.count; j ++ ) {

						const stride = j * vertexDataStride;

						if ( hasMorphPosition === true ) {

							morph.fromBufferAttribute( morphTarget, j );

							buffer[ offset + stride + 0 ] = morph.x;
							buffer[ offset + stride + 1 ] = morph.y;
							buffer[ offset + stride + 2 ] = morph.z;
							buffer[ offset + stride + 3 ] = 0;

						}

						if ( hasMorphNormals === true ) {

							morph.fromBufferAttribute( morphNormal, j );

							buffer[ offset + stride + 4 ] = morph.x;
							buffer[ offset + stride + 5 ] = morph.y;
							buffer[ offset + stride + 6 ] = morph.z;
							buffer[ offset + stride + 7 ] = 0;

						}

						if ( hasMorphColors === true ) {

							morph.fromBufferAttribute( morphColor, j );

							buffer[ offset + stride + 8 ] = morph.x;
							buffer[ offset + stride + 9 ] = morph.y;
							buffer[ offset + stride + 10 ] = morph.z;
							buffer[ offset + stride + 11 ] = ( morphColor.itemSize === 4 ) ? morph.w : 1;

						}

					}

				}

				entry = {
					count: morphTargetsCount,
					texture: texture,
					size: new Vector2( width, height )
				};

				morphTextures.set( geometry, entry );

				function disposeTexture() {

					texture.dispose();

					morphTextures.delete( geometry );

					geometry.removeEventListener( 'dispose', disposeTexture );

				}

				geometry.addEventListener( 'dispose', disposeTexture );

			}

			//

			let morphInfluencesSum = 0;

			for ( let i = 0; i < tmp_influences.length; i ++ ) { // @DDD@

				morphInfluencesSum += tmp_influences[ i ]; // @DDD@

			}

			const morphBaseInfluence = geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;

			program.getUniforms().setValue( gl, 'morphTargetBaseInfluence', morphBaseInfluence );
			if (tmp_influences.length > 0)  program.getUniforms().setValue( gl, 'morphTargetInfluences', tmp_influences ); // @DDD@

			program.getUniforms().setValue( gl, 'morphTargetsTexture', entry.texture, textures );
			program.getUniforms().setValue( gl, 'morphTargetsTextureSize', entry.size );


		} else {

			// When object doesn't have morph target influences defined, we treat it as a 0-length array
			// This is important to make sure we set up morphTargetBaseInfluence / morphTargetInfluences

			const length = objectInfluences === undefined ? 0 : objectInfluences.length;

			let influences = influencesList[ geometry.id ];

			if ( influences === undefined || influences.length !== length ) {

				// initialise list

				influences = [];

				for ( let i = 0; i < length; i ++ ) {

					influences[ i ] = [ i, 0 ];

				}

				influencesList[ geometry.id ] = influences;

			}

			// Collect influences

			for ( let i = 0; i < length; i ++ ) {

				const influence = influences[ i ];

				influence[ 0 ] = i;
				influence[ 1 ] = objectInfluences[ i ];

			}

			influences.sort( absNumericalSort );

			for ( let i = 0; i < 8; i ++ ) {

				if ( i < length && influences[ i ][ 1 ] ) {

					workInfluences[ i ][ 0 ] = influences[ i ][ 0 ];
					workInfluences[ i ][ 1 ] = influences[ i ][ 1 ];

				} else {

					workInfluences[ i ][ 0 ] = Number.MAX_SAFE_INTEGER;
					workInfluences[ i ][ 1 ] = 0;

				}

			}

			workInfluences.sort( numericalSort );

			const morphTargets = geometry.morphAttributes.position;
			const morphNormals = geometry.morphAttributes.normal;

			let morphInfluencesSum = 0;

			for ( let i = 0; i < 8; i ++ ) {

				const influence = workInfluences[ i ];
				const index = influence[ 0 ];
				const value = influence[ 1 ];

				if ( index !== Number.MAX_SAFE_INTEGER && value ) {

					if ( morphTargets && geometry.getAttribute( 'morphTarget' + i ) !== morphTargets[ index ] ) {

						geometry.setAttribute( 'morphTarget' + i, morphTargets[ index ] );

					}

					if ( morphNormals && geometry.getAttribute( 'morphNormal' + i ) !== morphNormals[ index ] ) {

						geometry.setAttribute( 'morphNormal' + i, morphNormals[ index ] );

					}

					morphInfluences[ i ] = value;
					morphInfluencesSum += value;

				} else {

					if ( morphTargets && geometry.hasAttribute( 'morphTarget' + i ) === true ) {

						geometry.deleteAttribute( 'morphTarget' + i );

					}

					if ( morphNormals && geometry.hasAttribute( 'morphNormal' + i ) === true ) {

						geometry.deleteAttribute( 'morphNormal' + i );

					}

					morphInfluences[ i ] = 0;

				}

			}

			// GLSL shader uses formula baseinfluence * base + sum(target * influence)
			// This allows us to switch between absolute morphs and relative morphs without changing shader code
			// When baseinfluence = 1 - sum(influence), the above is equivalent to sum((target - base) * influence)
			const morphBaseInfluence = geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;

			program.getUniforms().setValue( gl, 'morphTargetBaseInfluence', morphBaseInfluence );
			program.getUniforms().setValue( gl, 'morphTargetInfluences', morphInfluences );

		}

	}

	
	// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
	function store(object, geometry) {
		if (object.morphTargetInfluences_backup && object.morphTargetInfluences_cache) {
			const morphTargetInfluences = object.morphTargetInfluences;
			const backup = object.morphTargetInfluences_backup;
			for (let i = 0,l=backup.length;i<l;i++) {
				morphTargetInfluences[i] = backup[i];
			}

		}
	}

	return {

		update: update,
		store: store,

	};
	// @DDD@ <<<<<<<<<<<<<<<<<<<<<<
}


export { WebGLMorphtargets };
