//==============================================================================
//==============================================================================

import type { CellDLObject } from '#editor/celldlObjects'

import type { Styling } from '#root/utils/styling'

import { BoundedElement } from './boundedelement'
import { Compartment } from './utils/compartment'

//==============================================================================

export type CompartmentElementOptions = {
    align?: boolean
    gridAligned?: boolean
    isRegion?: boolean
}

//==============================================================================

export class CompartmentElement extends BoundedElement {
    #compartment: Compartment

    constructor(celldlObject: CellDLObject, svgElement: SVGGraphicsElement, options: CompartmentElementOptions={}) {
        super(celldlObject, svgElement, !!options.gridAligned, !!options.align)
        this.#compartment = new Compartment(celldlObject, !!options.isRegion)
    }

//==============================================================================

    updateElement() {
        this.#compartment.update()
    }

//==============================================================================

    getStyle(): Styling {
        return this.#compartment.styling
    }

    setStyle(styling: Styling) {
        return this.#compartment.setStyling(styling)
    }
}

//==============================================================================
//==============================================================================
