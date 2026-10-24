export default /* glsl */`
#ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	transformed *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];

	}

	#ifdef DDD_GBUFFER_PREV // @DDD@

		#ifdef USE_INSTANCING_MORPH

			gbufPrevTransformed = transformed;

		#else

			gbufPrevTransformed *= prevMorphTargetBaseInfluence;

			for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

				if ( prevMorphTargetInfluences[ i ] != 0.0 ) gbufPrevTransformed += getMorph( gl_VertexID, i, 0 ).xyz * prevMorphTargetInfluences[ i ];

			}

		#endif

	#endif

#endif
`;
