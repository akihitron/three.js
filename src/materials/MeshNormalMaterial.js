import { TangentSpaceNormalMap } from '../constants.js';
import { Material } from './Material.js';
import { Vector2 } from '../math/Vector2.js';

class MeshNormalMaterial extends Material {

	constructor( parameters ) {

		super();

		this.isMeshNormalMaterial = true;

		this.type = 'MeshNormalMaterial';

		this.bumpMap = null;
		this.bumpScale = 1;

		this.normalMap = null;
		this.normalMapType = TangentSpaceNormalMap;
		this.normalScale = new Vector2( 1, 1 );

		this.displacementMap = null;
		this.displacementScale = 1;
		this.displacementBias = 0;

		this.wireframe = false;
		this.wireframeLinewidth = 1;

		this.flatShading = false;

		this.setValues( parameters );

	}

	copy( source ) {

		super.copy( source );

		this.bumpMap = source.bumpMap;
		this.bumpScale = source.bumpScale;

		this.normalMap = source.normalMap;
		this.normalMapType = source.normalMapType;
		this.normalScale.copy( source.normalScale );

		this.displacementMap = source.displacementMap;
		this.displacementScale = source.displacementScale;
		this.displacementBias = source.displacementBias;

		this.wireframe = source.wireframe;
		this.wireframeLinewidth = source.wireframeLinewidth;

		this.flatShading = source.flatShading;

		return this;

	}

	onBeforeRender(_this/*WebGLRender*/, scene, camera, geometry, object, group ) {  // @DDD@
		let object_material = null;
		if (group) { // MultiMaterial
			const materialIndex = group.materialIndex;
			object_material = object.material[materialIndex];
		} else { // SingleMaterial
			object_material = object.material;
		}

		if (this.opacity != object_material.opacity) this.opacity = object_material.opacity;
		if (this.alphaTest != object_material.alphaTest) this.alphaTest = object_material.alphaTest;
		if (this.alphaMap != object_material.alphaMap) this.alphaMap = object_material.alphaMap;
		if (this.side != object_material.side) this.side = object_material.side;
		if (this.transparent != object_material.transparent) this.side = object_material.transparent;
		// normalMaterial.map = normalMaterial.alphaMap;//TODO
		if (object_material.visible == false || object_material.opacity < object_material.alphaTest || object_material.depthWrite == false) {
			return false;
		}
		return true;
	};

}

export { MeshNormalMaterial };
