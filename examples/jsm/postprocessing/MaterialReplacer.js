import {
	Color,
} from 'three';

class MaterialReplacer {

	constructor() {

        this.materialCacheTable = new Map();
		this.originalClearColor = new Color();
		this.scene = null;
		this.camera = null;
        this.current = 0;

	}


	_updateMaterial( c, m ) {

		let needsUpdate = false;
		let shouldVisible = m.visible;
		if ( m.depthWrite == false ) {

			shouldVisible = false;

		}

		if ( m.opacity <= m.alphaTest ) {

			shouldVisible = false;

		}

		if ( c.visible !== shouldVisible ) {

			c.visible = shouldVisible;
			needsUpdate = true;

		}

		if ( c.depthWrite !== m.depthWrite ) {

			c.depthWrite = m.depthWrite;
			needsUpdate = true;

		}

		if ( c.depthTest !== m.depthTest ) {

			c.depthTest = m.depthTest;
			needsUpdate = true;

		}

		if ( c.depthFunc !== m.depthFunc ) {

			c.depthFunc = m.depthFunc;
			needsUpdate = true;

		}


		if ( c.alphaHash !== m.alphaHash ) {

			c.alphaHash = m.alphaHash;
			needsUpdate = true;

		}

		if ( c.transparent !== m.transparent ) {

			c.transparent = m.transparent;
			needsUpdate = true;

		}

		if ( c.alphaToCoverage !== m.alphaToCoverage ) {

			c.alphaToCoverage = m.alphaToCoverage;
			needsUpdate = true;

		}

		if ( c.side !== m.side ) {

			c.side = m.side;
			needsUpdate = true;

		}

		if ( c.normalMapType !== m.normalMapType ) {

			c.normalMapType = m.normalMapType;
			needsUpdate = true;

		}

		if ( c.flatShading !== m.flatShading ) {

			c.flatShading = m.flatShading;
			needsUpdate = true;

		}

		if ( c.map !== m.map ) {

			c.map = m.map;
			needsUpdate = true;

		}

		if ( c.alphaMap !== m.alphaMap ) {

			c.alphaMap = m.alphaMap;
			needsUpdate = true;

		}

		if ( c.normalMap !== undefined && c.normalMap !== m.normalMap ) {

			c.normalMap = m.normalMap;
			needsUpdate = true;

		}

		if ( c.displacementMap !== undefined && c.displacementMap != m.displacementMap ) {

			c.displacementMap = m.displacementMap;
			needsUpdate = true;

		}

		if ( m.normalScale !== undefined && c.normalScale ) c.normalScale.copy( m.normalScale );
		if ( m.displacementScale !== undefined && c.displacementScale != undefined ) c.displacementScale = m.displacementScale;
		if ( m.opacity !== undefined ) c.opacity = m.opacity;
		if ( m.alphaTest !== undefined ) c.alphaTest = m.alphaTest;
		if ( m.displacementBias !== undefined && c.displacementBias != undefined ) c.displacementBias = m.displacementBias;

		if ( needsUpdate ) c.needsUpdate = true;

	}

	_makeMaterial( m, material_constructor ) {

		let cached = this.materialCacheTable.get( m );

		if ( cached == null ) {

			const mat = material_constructor();
            cached = { material: mat };
			this.materialCacheTable.set( m, cached );

		}
        cached.current = this.current;

		this._updateMaterial( cached.material, m );

		return cached.material;

	}

	replaceMaterials( o, material_constructor ) {

		if ( o.material ) {

			const is_array = Array.isArray( o.material );
			let need_update = o._original_material_ == null;

			if ( need_update == false ) {

				if ( is_array ) {

					need_update = o._original_material_[ 0 ] !== o.material[ 0 ];

				} else {

					need_update = o._original_material_ !== o.material;

				}

			}

			if ( need_update ) o._original_material_ = Array.isArray( o.material ) ? o.material.slice() : o.material;

			if ( Array.isArray( o._original_material_ ) ) {

				const ms = o._original_material_;

				for ( let i = 0; i < ms.length; ++ i ) {

					o.material[ i ] = this._makeMaterial( ms[ i ], material_constructor );

				}

			} else {

				o.material = this._makeMaterial( o._original_material_, material_constructor );

			}

		}

		for ( const c of o.children ) this.replaceMaterials( c, material_constructor );

	}

	restoreMaterials( o, is_root = true ) {
        if (is_root) {
            const cache_table = this.materialCacheTable;
            cache_table.forEach((v, k) => {
                if (v.current !== this.current) {
                    v.material.dispose();
                    cache_table.delete(k);
                    console.log("Drop:", v.material.name);
                }
            });
            this.current++;
        }

		if ( o._original_material_ ) {

			if ( Array.isArray( o._original_material_ ) ) {

				const ms = o.material;

				for ( let i = 0; i < ms.length; ++ i ) {

					ms[ i ] = o._original_material_[ i ];

				}

			} else {

				o.material = o._original_material_;

			}

		}

		for ( const c of o.children ) this.restoreMaterials( c, false );
	}


	renderPass( scene, camera, renderer, renderTarget, clearColor, clearAlpha ) {
		// save original state
		renderer.getClearColor( this.originalClearColor );
		const originalClearAlpha = renderer.getClearAlpha();
		const originalAutoClear = renderer.autoClear;

		renderer.setRenderTarget( renderTarget );

		// setup pass state
		renderer.autoClear = false;
		if ( ( clearColor !== undefined ) && ( clearColor !== null ) ) {

			renderer.setClearColor( clearColor );
			renderer.setClearAlpha( clearAlpha || 0.0 );
			renderer.clear();

		}

		renderer.render( scene, camera );

		// restore original state
		renderer.autoClear = originalAutoClear;
		renderer.setClearColor( this.originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );

	}


}

export { MaterialReplacer };
