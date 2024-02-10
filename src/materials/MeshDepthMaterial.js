import { Material } from './Material.js';
import { BasicDepthPacking } from '../constants.js';

class MeshDepthMaterial extends Material {

	constructor( parameters ) {

		super();

		this.isMeshDepthMaterial = true;

		this.type = 'MeshDepthMaterial';

		this.depthPacking = BasicDepthPacking;

		this.map = null;

		this.alphaMap = null;

		this.displacementMap = null;
		this.displacementScale = 1;
		this.displacementBias = 0;

		this.wireframe = false;
		this.wireframeLinewidth = 1;

		this.setValues( parameters );

	}

	copy( source ) {

		super.copy( source );

		this.depthPacking = source.depthPacking;

		this.map = source.map;

		this.alphaMap = source.alphaMap;

		this.displacementMap = source.displacementMap;
		this.displacementScale = source.displacementScale;
		this.displacementBias = source.displacementBias;

		this.wireframe = source.wireframe;
		this.wireframeLinewidth = source.wireframeLinewidth;

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

export { MeshDepthMaterial };
