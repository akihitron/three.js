export default /* glsl */`
#ifdef USE_SKINNING

	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );

	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;

	transformed = ( bindMatrixInverse * skinned ).xyz;

	#ifdef DDD_GBUFFER_PREV // @DDD@

		vec4 gbufPrevSkinVertex = bindMatrix * vec4( gbufPrevTransformed, 1.0 );

		vec4 gbufPrevSkinned = vec4( 0.0 );
		gbufPrevSkinned += getPrevBoneMatrix( skinIndex.x ) * gbufPrevSkinVertex * skinWeight.x;
		gbufPrevSkinned += getPrevBoneMatrix( skinIndex.y ) * gbufPrevSkinVertex * skinWeight.y;
		gbufPrevSkinned += getPrevBoneMatrix( skinIndex.z ) * gbufPrevSkinVertex * skinWeight.z;
		gbufPrevSkinned += getPrevBoneMatrix( skinIndex.w ) * gbufPrevSkinVertex * skinWeight.w;

		gbufPrevTransformed = ( bindMatrixInverse * gbufPrevSkinned ).xyz;

	#endif

#endif
`;
