/******************************************************************************

CellDL Editor

Copyright (c) 2022 - 2025 David Brooks

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

******************************************************************************/

import type {
    CellDLAnnotation,
    CellDLCompartment,
    CellDLConnectedObject,
    CellDLObject
} from '#editor/celldlObjects'
import { Bounds } from '#editor/geometry'
import { ControlPoint } from '#editor/geometry/controls'
import { Point } from '#root/utils/points'
import { MEMBRANE_GAP } from '#root/utils/styling'
import { svgRect } from '#root/utils/svgUtils'

import { type CellDLEditor, CONTEXT_MENU } from '.'
import { editGuides } from './editguides'
import type { EditorFrame } from './editorframe'

//==============================================================================

const SELECTION_BOX_ID = 'editor-selection-box'

//==============================================================================

export class BoxMaker {
    #bottomRight: ControlPoint
    #doubleBoundary: [SVGRectElement | null, SVGRectElement | null] = [null, null]
    #doubleWalled: boolean
    #drawing: boolean = false
    #editor: CellDLEditor
    #editorFrame: EditorFrame
    #selectedObjects: Map<string, CellDLObject> = new Map()
    #selectionRect: SVGRectElement | null = null
    #size: Point
    #startPoint: Point
    #topLeft: ControlPoint

    constructor(editor: CellDLEditor, startPoint: DOMPoint, doubleWalled: boolean=false) {
        this.#editor = editor
        // biome-ignore lint/style/noNonNullAssertion: the editor has a frame layer
        this.#editorFrame = editor.editorFrame!
        this.#startPoint = Point.fromPoint(editGuides.gridAlign(startPoint))
        this.#topLeft = ControlPoint.fromPoint(this.#startPoint)
        this.#bottomRight = ControlPoint.fromPoint(this.#startPoint)
        this.#size = new Point(0, 0)
        this.#drawing = true
        this.#doubleWalled = doubleWalled
    }

    get bounds(): Bounds {
        return Bounds.fromPoints(this.#topLeft, this.#bottomRight)
    }

    get count() {
        return [...this.#selectedObjects.keys()].length
    }

    get selectedObjects() {
        return [...this.#selectedObjects.values()]
    }

    #drawTo(domPoint: DOMPoint) {
        const point = editGuides.gridAlign(domPoint)
        this.#topLeft = ControlPoint.fromPoint({
            x: Math.min(this.#startPoint.x, point.x),
            y: Math.min(this.#startPoint.y, point.y)
        })
        this.#bottomRight = ControlPoint.fromPoint({
            x: Math.max(this.#startPoint.x, point.x),
            y: Math.max(this.#startPoint.y, point.y)
        })
        this.#updateSelectionRect()
    }

    #createRect(cls: string, offset: number=0): SVGRectElement {
        return this.#editorFrame.addElementAsString(svgRect(
            { x: this.#topLeft.x - offset, y: this.#topLeft.y - offset },
            { x: this.#bottomRight.x + offset, y: this.#bottomRight.y + offset },
            { class: cls }
        )) as SVGRectElement
    }

    #updateRect(rect: SVGRectElement, resized: boolean, offset: number=0) {
        rect.setAttribute('x', `${this.#topLeft.x - offset}`)
        rect.setAttribute('y', `${this.#topLeft.y - offset}`)
        if (resized) {
            rect.setAttribute('width', `${Math.max(0, this.#size.x + 2*offset)}`)
            rect.setAttribute('height', `${Math.max(0, this.#size.y + 2*offset)}`)
        }
    }

    #updateSelectionRect(resized = true) {
        if (resized) {
            this.#size = new Point(this.#bottomRight.x - this.#topLeft.x, this.#bottomRight.y - this.#topLeft.y)
        }
        const offset = MEMBRANE_GAP/2
        if (this.#selectionRect) {
            this.#updateRect(this.#selectionRect, resized)
            if (this.#doubleWalled) {
                this.#updateRect(this.#doubleBoundary[0] as SVGRectElement, resized,  offset)
                this.#updateRect(this.#doubleBoundary[1] as SVGRectElement, resized, -offset)
            }
        } else {
            this.#selectionRect = this.#createRect('draw-box-rect')
            this.#selectionRect.id = SELECTION_BOX_ID
            if (this.#doubleWalled) {
                this.#doubleBoundary[0] = this.#createRect('draw-compartment-outer',  offset)
                this.#doubleBoundary[1] = this.#createRect('draw-compartment-inner', -offset)
            }
        }
        this.#setSelectedObjects()
    }

    pointInside(point: DOMPoint): boolean {
        return (this.#topLeft.x < point.x
             && point.x < this.#bottomRight.x
             && this.#topLeft.y < point.y
             && point.y < this.#bottomRight.y)
    }

    makeCompartmentRegion(isRegion?: boolean): CellDLCompartment|CellDLAnnotation|undefined {
        return this.#editor.celldlDiagram?.makeCompartmentRegion(this.bounds, isRegion)
    }

    groupComponents() {
        if (this.count) {
            this.#editor.celldlDiagram?.groupComponents(this.bounds, [
                ...this.#selectedObjects.values()
            ])
        }
    }

    pointerEvent(event: PointerEvent, point: DOMPoint): boolean {
        if (this.#drawing) {
            if (event.type === 'pointermove') {
                this.#drawTo(point)
            } else if (event.type === 'pointerup') {
                this.#drawing = false
            }
            return true
        }
        return false
    }

    close(clearSelected: boolean=true) {
        this.#updateContextMenu(false)
        if (this.#selectionRect) {
            if (clearSelected) {
                this.#unsetSelectedObjects()
            }
            this.#editorFrame.removeElement(this.#selectionRect)
            this.#selectionRect = null

            if (this.#doubleWalled) {
                this.#editorFrame.removeElement(this.#doubleBoundary[0])
                this.#editorFrame.removeElement(this.#doubleBoundary[1])
                this.#doubleBoundary = [null, null]
            }
        }
    }

    #setSelectedObjects() {
        // biome-ignore lint/style/noNonNullAssertion: the editor has a diagram
        const selectedItems = this.#editor
            .celldlDiagram!.objectsContainedIn(this.bounds)
            .filter((c) => c.exact)
            .map((c) => c.object)
        const fullSelection = [...selectedItems]
        for (const component of selectedItems) {
            if (component.isConnectable) {
                fullSelection.push(...(<CellDLConnectedObject>component).connections.values())
            }
        }
        const selectedObjects: Map<string, CellDLObject> = new Map()
        for (const object of fullSelection) {
            if (!selectedObjects.has(object.id)) {
                if (!this.#selectedObjects.has(object.id)) {
                    this.#editor.selectObject(object, true)
                }
                selectedObjects.set(object.id, object)
            }
        }
        for (const [id, object] of this.#selectedObjects.entries()) {
            if (!selectedObjects.has(id)) {
                this.#editor.selectObject(object, false)
            }
        }
        this.#selectedObjects = selectedObjects
    }

    #unsetSelectedObjects() {
        for (const object of this.#selectedObjects.values()) {
            this.#editor.selectObject(object, false)
        }
    }

    #updateContextMenu(enabled: boolean) {
        this.#editor.enableContextMenuItem(CONTEXT_MENU.DELETE, enabled)
        this.#editor.enableContextMenuItem(CONTEXT_MENU.GROUP_OBJECTS, enabled)
    }

    updateSelectedObjects() {
        this.#setSelectedObjects()
    }
}

//==============================================================================
