export default /* glsl */`
#ifdef DDD_GBUFFER // @DDD@ extra G-buffer outputs (see WebGLProgram)

	{

		vec3 gbufN = vec3( 0.0 ); // zero length = no normal (unlit shaders)
		float gbufRoughness = 1.0;
		float gbufMetalness = 0.0;

		#ifdef DDD_HAS_NORMAL

			gbufN = normal;

		#endif

		#ifdef STANDARD

			gbufRoughness = roughnessFactor;
			gbufMetalness = metalnessFactor;

		#endif

		vec2 gbufVel = vec2( 0.0 );
		float gbufHasVel = 0.0; // 0 = derive camera motion from depth in post

		#ifdef DDD_GBUFFER_VELOCITY

			gbufVel = ( vGbufCurClip.xy / vGbufCurClip.w - vGbufPrevClip.xy / vGbufPrevClip.w ) * 0.5;
			gbufHasVel = 1.0;

		#endif

		#if DDD_GBUFFER_BLEND == 1

			gbufNormal = vec4( gbufN, gbufRoughness );
			gbufVelocity = vec4( gbufVel, gbufMetalness, gbufHasVel );

		#elif DDD_GBUFFER_BLEND == 2

			// Blended like the color, so translucent surfaces (hair) mix their
			// normal and velocity into the surface below by alpha.
			float gbufA = gl_FragColor.a;

			#ifdef PREMULTIPLIED_ALPHA

				gbufNormal = vec4( gbufN * gbufA, gbufA );
				gbufVelocity = vec4( vec3( gbufVel, gbufMetalness ) * gbufA, gbufA );

			#else

				gbufNormal = vec4( gbufN, gbufA );
				gbufVelocity = vec4( gbufVel, gbufMetalness, gbufA );

			#endif

		#elif DDD_GBUFFER_BLEND == 4

			gbufNormal = vec4( 1.0 );
			gbufVelocity = vec4( 1.0 );

		#else

			gbufNormal = vec4( 0.0 );
			gbufVelocity = vec4( 0.0 );

		#endif

	}

#endif
`;
