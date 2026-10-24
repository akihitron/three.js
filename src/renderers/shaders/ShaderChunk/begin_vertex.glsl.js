export default /* glsl */`
vec3 transformed = vec3( position );

#ifdef USE_ALPHAHASH

	vPosition = vec3( position );

#endif

#ifdef DDD_GBUFFER // @DDD@ previous-frame position for the velocity output

	#define DDD_GBUFFER_PREV
	vec3 gbufPrevTransformed = transformed;

#endif
`;
