import { FloatType, RGFormat } from '../../constants.js';
import { DataArrayTexture } from '../../textures/DataArrayTexture.js';
import { Vector4 } from '../../math/Vector4.js';
import { Vector2 } from '../../math/Vector2.js';

function WebGLMorphtargets( gl, capabilities, textures ) {

	const morphTextures = new WeakMap();
	const objectMorphTemps = new WeakMap(); // @DDD@
	const morphUvTextures = new WeakMap(); // @DDD@ PMX uv morphs, per geometry
	const morph = new Vector4();

	function update( object, geometry, material, program ) { // @DDD@

		// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
		let tmp_influences = null;
		// PMX uv morphs (see MMDLoader buildUvMorphs): one layer per raw morph
		// whose uvMask is set, weighted from the same per-morph result.
		const morphUvs = geometry.morphUvs;
		const uvMask = morphUvs !== undefined ? geometry.uvInfluenceMasks : undefined;
		let uv_influences = null;
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
			// Kept per object and reused; remade only when the geometry's
			// counts change (a model replaced in place).
			const positionCount = geometry.morphAttributes.position !== undefined ? geometry.morphAttributes.position.length : 0;
			const uvCount = morphUvs !== undefined ? Math.ceil( morphUvs.length / 4 ) * 4 : 0;
			let temps = objectMorphTemps.get( object );
			if ( temps === undefined || temps.tmp_influences.length !== positionCount || ( temps.uv_influences?.length ?? 0 ) !== uvCount ) {

				temps = {
					tmp_influences: new Float32Array( positionCount ),
					uv_influences: uvCount > 0 ? new Float32Array( uvCount ) : null
				};
				objectMorphTemps.set( object, temps );

			}

			tmp_influences = temps.tmp_influences;
			uv_influences = temps.uv_influences;
			let u_index = 0;

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
					// `r`, not `a`: a group with only uv children has no
					// position target, so its position mask is 0.
					if ( uvMask !== undefined && uvMask[ i ] > 0 ) uv_influences[ u_index ++ ] = r;

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

			if ( uvMask !== undefined ) {

				// A model without DDD's morph arrays: weights straight from
				// the influences.
				uv_influences = new Float32Array( Math.ceil( morphUvs.length / 4 ) * 4 );
				let u_index = 0;
				for ( let i = 0, l = tmp_influences.length; i < l; ++ i ) {

					if ( uvMask[ i ] > 0 ) uv_influences[ u_index ++ ] = tmp_influences[ i ];

				}

			}

		}
		// @DDD@ <<<<<<<<<<<<<<<<<<<<<<

		// the following encodes morph targets into an array of data textures. Each layer represents a single morph target.

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

			// @DDD@ G-buffer velocity: the influences uploaded last frame. The
			// caller copies object.gbufferMorph into object.gbufferPrevMorph at
			// the end of each frame.
			const uniforms = program.getUniforms();
			if ( uniforms.map.prevMorphTargetInfluences !== undefined && tmp_influences.length > 0 ) {

				const prev = object.gbufferPrevMorph;
				const valid = prev !== undefined && prev.influences !== null && prev.influences.length === tmp_influences.length;
				uniforms.setValue( gl, 'prevMorphTargetBaseInfluence', valid ? prev.base : morphBaseInfluence );
				uniforms.setValue( gl, 'prevMorphTargetInfluences', valid ? prev.influences : tmp_influences );

				if ( object.gbufferMorph === undefined ) object.gbufferMorph = { influences: null, base: 1 };
				object.gbufferMorph.influences = tmp_influences;
				object.gbufferMorph.base = morphBaseInfluence;

			}

		}

		program.getUniforms().setValue( gl, 'morphTargetsTexture', entry.texture, textures );
		program.getUniforms().setValue( gl, 'morphTargetsTextureSize', entry.size );

		// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
		if ( morphUvs !== undefined && morphUvs.length > 0 ) {

			const uvEntry = getMorphUvTexture( geometry, morphUvs );
			const uniforms = program.getUniforms();
			uniforms.setValue( gl, 'morphUvsTexture', uvEntry.texture, textures );
			uniforms.setValue( gl, 'morphUvsTextureSize', uvEntry.size );
			uniforms.setValue( gl, 'morphUvInfluences', uv_influences );

		}
		// @DDD@ <<<<<<<<<<<<<<<<<<<<<<

	}

	// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
	/**
	 * The uv offsets of a geometry's uv morphs as an RG32F array texture,
	 * one layer per morph and one texel per vertex, wrapped into rows past
	 * the maximum texture width. Half floats would be ~5e-4 off at the
	 * offsets models use -- two texels on a 4K atlas.
	 */
	function getMorphUvTexture( geometry, morphUvs ) {

		let uvEntry = morphUvTextures.get( geometry );
		if ( uvEntry !== undefined && uvEntry.count === morphUvs.length ) return uvEntry;
		if ( uvEntry !== undefined ) uvEntry.texture.dispose();

		const vertexCount = geometry.attributes.position.count;
		let width = vertexCount;
		let height = 1;

		if ( width > capabilities.maxTextureSize ) {

			height = Math.ceil( width / capabilities.maxTextureSize );
			width = capabilities.maxTextureSize;

		}

		const layerSize = width * height * 2;
		const buffer = new Float32Array( layerSize * morphUvs.length );
		for ( let i = 0; i < morphUvs.length; i ++ ) {

			buffer.set( morphUvs[ i ].array.subarray( 0, vertexCount * 2 ), layerSize * i );

		}

		const texture = new DataArrayTexture( buffer, width, height, morphUvs.length );
		texture.format = RGFormat;
		texture.type = FloatType;
		texture.needsUpdate = true;

		uvEntry = { count: morphUvs.length, texture: texture, size: new Vector2( width, height ) };
		morphUvTextures.set( geometry, uvEntry );

		function disposeUvTexture() {

			texture.dispose();
			morphUvTextures.delete( geometry );
			geometry.removeEventListener( 'dispose', disposeUvTexture );

		}

		geometry.addEventListener( 'dispose', disposeUvTexture );

		return uvEntry;

	}
	// @DDD@ <<<<<<<<<<<<<<<<<<<<<<

	// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
	function store( object /* , geometry */ ) {

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
