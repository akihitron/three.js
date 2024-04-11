import { FloatType } from '../../constants.js';
import { DataArrayTexture } from '../../textures/DataArrayTexture.js';
import { Vector4 } from '../../math/Vector4.js';
import { Vector2 } from '../../math/Vector2.js';

function WebGLMorphtargets( gl, capabilities, textures ) {

	const morphTextures = new WeakMap();
	const objectMorphTemps = new WeakMap(); // @DDD@
	const morph = new Vector4();

	function update( object, geometry, material, program ) { // @DDD@

		const objectInfluences = object.morphTargetInfluences;

		// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
		let tmp_influences = null;
		if ( object.morphTargetInfluences_backup && object.morphTargetInfluences_cache ) {

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
			tmp_influences = objectMorphTemps.get( object )?.tmp_influences;
			if ( tmp_influences == null ) tmp_influences = new Float32Array( geometry.morphAttributes.position.length );
			objectMorphTemps.set( object, { tmp_influences } );

			let m_index = 0;
			const mask = geometry.influenceMasks;
			if ( mask ) {

				for ( let i = 0, l = morphTargetInfluences.length; i < l; ++ i ) {

					const c = morphTargetInfluences[ i ];
					backup[ i ] = c;
					const r = result[ i ] = ( c + cache[ i ] ) * coef[ i ];
					const m = mask[ i ];
					const a = morphTargetInfluences[ i ] = r * m;
					if ( m > 0 ) tmp_influences[ m_index ++ ] = a;

				}

			} else {

				for ( let i = 0, l = morphTargetInfluences.length; i < l; ++ i ) {

					const c = morphTargetInfluences[ i ];
					backup[ i ] = c;
					const r = result[ i ] = ( c + cache[ i ] ) * coef[ i ];
					const a = morphTargetInfluences[ i ] = r;
					tmp_influences[ m_index ++ ] = a;

				}

			}

		} else {

			tmp_influences = object.morphTargetInfluences;

		}
		// @DDD@ <<<<<<<<<<<<<<<<<<<<<<

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
		if ( object.isInstancedMesh === true && object.morphTexture !== null ) {

			program.getUniforms().setValue( gl, 'morphTexture', object.morphTexture, textures );

		} else {

			let morphInfluencesSum = 0;

			for ( let i = 0; i < tmp_influences.length; i ++ ) { // @DDD@

				morphInfluencesSum += tmp_influences[ i ]; // @DDD@

			}

			const morphBaseInfluence = geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;


			program.getUniforms().setValue( gl, 'morphTargetBaseInfluence', morphBaseInfluence );
			if ( tmp_influences.length > 0 ) program.getUniforms().setValue( gl, 'morphTargetInfluences', tmp_influences ); // @DDD@

		}

		program.getUniforms().setValue( gl, 'morphTargetsTexture', entry.texture, textures );
		program.getUniforms().setValue( gl, 'morphTargetsTextureSize', entry.size );

	}

	// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
	function store( object, geometry ) {

		if ( object.morphTargetInfluences_backup && object.morphTargetInfluences_cache ) {

			const morphTargetInfluences = object.morphTargetInfluences;
			const backup = object.morphTargetInfluences_backup;
			for ( let i = 0, l = backup.length; i < l; i ++ ) {

				morphTargetInfluences[ i ] = backup[ i ];

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
