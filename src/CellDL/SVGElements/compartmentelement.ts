//==============================================================================
//==============================================================================

import type { CellDLObject } from '#editor/celldlObjects'
import { Resizer } from '#editor/editor/resizer'
import type { PointLike } from '#root/utils/points'

import type { Styling } from '#root/utils/styling'
import type { ElementMoveOptions } from '.'

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
    #resizer: Resizer|undefined

    constructor(celldlObject: CellDLObject, svgElement: SVGGraphicsElement, options: CompartmentElementOptions={}) {
        super(celldlObject, svgElement, {
            align: !!options.align,
            edgeAligned: true,
            gridAligned: !!options.gridAligned
        })
        this.#compartment = new Compartment(celldlObject, !!options.isRegion)
    }

//==============================================================================

    clearControlHandles() {
        if (this.#resizer) {
            this.#resizer.close()
            this.#resizer = undefined
        }
    }

    drawControlHandles() {
        if (!this.#resizer) {
            this.#resizer = new Resizer(this, this.topLeft, this.size)
        }
    }

//==============================================================================

    startMove(svgPoint: PointLike, options: ElementMoveOptions={}) {
        super.startMove(svgPoint, options)
        if (this.#resizer) {
            this.#resizer.startMove(this.centroid, options)
        }
    }

    move(svgPoint: PointLike, options: ElementMoveOptions={}) {
        super.move(svgPoint, options)
        if (this.#resizer) {
            this.#resizer.move(this.centroid, options)
        }
    }

    endMove() {
        super.endMove()
        if (this.#resizer) {
            this.#resizer.endMove()
        }
    }

//==============================================================================

    startResize() {
        this.#compartment.startResize()
        super.startResize()
    }

    resize(topLeftDelta: PointLike, bottomRightDelta: PointLike) {
        this.#compartment.resize(topLeftDelta, bottomRightDelta)
        super.resize(topLeftDelta, bottomRightDelta)
    }

    endResize() {
        this.#compartment.endResize()
        super.endResize()
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
