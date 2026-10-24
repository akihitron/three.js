export default /* glsl */`
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_BATCHING

	mvPosition = batchingMatrix * mvPosition;

#endif

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;

#ifdef DDD_GBUFFER // @DDD@ clip positions of this and the previous frame for the velocity output

	#ifdef DDD_GBUFFER_PREV

		vec4 gbufPrevMv = vec4( gbufPrevTransformed, 1.0 );

	#else

		vec4 gbufPrevMv = vec4( transformed, 1.0 );

	#endif

	#ifdef USE_BATCHING

		gbufPrevMv = batchingMatrix * gbufPrevMv;

	#endif

	#ifdef USE_INSTANCING

		gbufPrevMv = instanceMatrix * gbufPrevMv;

	#endif

	vGbufPrevClip = prevProjectionMatrix * ( prevModelViewMatrix * gbufPrevMv );
	vGbufCurClip = gl_Position;

#endif
`;
