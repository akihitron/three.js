import {
	Color
} from 'three';
import { Pass } from './Pass.js';

// @DDD@ 
import { ShaderPass } from '../../jsm/postprocessing/ShaderPass.js';
import { CopyShader } from '../../jsm/shaders/CopyShader.js';

class RenderPass extends Pass {

	constructor( scene, camera, overrideMaterial = null, clearColor = null, clearAlpha = null ) {

		super();

		this.scene = scene;
		this.camera = camera;

		this.overrideMaterial = overrideMaterial;

		this.clearColor = clearColor;
		this.clearAlpha = clearAlpha;

		this.clear = true;
		this.clearDepth = false;
		this.needsSwap = false;
		this._oldClearColor = new Color();

		this.copy_pass = new ShaderPass(CopyShader); // @DDD@
	}

	// @DDD@ >>>>>>>>>>>>>>>>>>>>>>
	render( renderer, writeBuffer, readBuffer , deltaTime, maskActive, params ) {
		const effect_composer = params.effect_composer;

		const oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		let oldClearAlpha, oldOverrideMaterial;

		if ( this.overrideMaterial !== null ) {

			oldOverrideMaterial = this.scene.overrideMaterial;

			this.scene.overrideMaterial = this.overrideMaterial;

		}

		if ( this.clearColor !== null ) {

			renderer.getClearColor( this._oldClearColor );
			renderer.setClearColor( this.clearColor );

		}

		if ( this.clearAlpha !== null ) {

			oldClearAlpha = renderer.getClearAlpha();
			renderer.setClearAlpha( this.clearAlpha );

		}

		if ( this.clearDepth == true ) {

			renderer.clearDepth();

		}

		const render_target = this.renderToScreen ? null : effect_composer.renderTarget3;
		renderer.setRenderTarget( render_target );
		
		if ( this.clear === true ) {

			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
			renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );

		}

		DMC.start_gpu_status_check();
		renderer.render( this.scene, this.camera );
		if (this.outline_effect) this.outline_effect.renderOutline(this.scene, this.camera);
		if (effect_composer.renderTarget3 == render_target) {
			this.copy_pass.render(renderer, readBuffer, effect_composer.renderTarget3);
		}
		DMC.end_gpu_status_check();

		// restore

		if ( this.clearColor !== null ) {

			renderer.setClearColor( this._oldClearColor );

		}

		if ( this.clearAlpha !== null ) {

			renderer.setClearAlpha( oldClearAlpha );

		}

		if ( this.overrideMaterial !== null ) {

			this.scene.overrideMaterial = oldOverrideMaterial;

		}

		renderer.autoClear = oldAutoClear;

	}
	// @DDD@ <<<<<<<<<<<<<<<<<<<<<<

}

export { RenderPass };
