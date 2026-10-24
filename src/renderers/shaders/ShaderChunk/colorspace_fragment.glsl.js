export default /* glsl */`
gl_FragColor = linearToOutputTexel( gl_FragColor );

#include <gbuffer_fragment>
`;
