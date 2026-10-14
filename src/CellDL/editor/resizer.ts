//==============================================================================
//==============================================================================

import type { CellDLDiagram } from '#editor/diagram'
import type { GridAlignOptions } from '#editor/editor/editguides'
import { Bounds, ComputedValue, RestrictedValue } from '#editor/geometry'
import { ControlPoint } from '#editor/geometry/controls'
import type { CellDLSVGElement } from '#editor/SVGElements'
import { Point, type PointLike } from '#root/utils/points'
import { svgRect } from '#root/utils/svgUtils'

import { getElementId } from '.'
import { editGuides } from './editguides'
import { EDITOR_FRAME_ID, type EditorFrame } from './editorframe'

//==============================================================================

const RESIZER_BOX_CLASS = 'editor-resizer-box'

//==============================================================================

export class Resizer {
    static #lastId = 0

    #activeControlPoint: ControlPoint|undefined
    #bottomRight: ControlPoint
    #celldlDiagram: CellDLDiagram
    #celldlSvgElement: CellDLSVGElement
    #controlPoints: ControlPoint[] = []
    #editorFrame: EditorFrame
    #id: string
    #moveStart: Point|undefined
    #moveTopLeft: Point|undefined
    #objectId: string
    #resizeTopLeft: Point = new Point()
    #resizeBottomRight: Point = new Point()
    #resizerRect: SVGRectElement|undefined
    #size: Point
    #topLeft: ControlPoint
    #xMin: RestrictedValue | null = null
    #xMax: RestrictedValue | null = null
    #yMin: RestrictedValue | null = null
    #yMax: RestrictedValue | null = null

    constructor(celldlSvgElement: CellDLSVGElement, topLeft: PointLike, size: PointLike) {
        this.#id = `resizer-${Resizer.#lastId}`
        Resizer.#lastId += 1
        this.#celldlSvgElement = celldlSvgElement
        this.#celldlDiagram = celldlSvgElement.celldlObject.celldlDiagram
        this.#objectId = celldlSvgElement.celldlObject.id
        // biome-ignore lint/style/noNonNullAssertion: the diagram has an editor frame layer
        this.#editorFrame = this.#celldlDiagram.editorFrame!
        this.#celldlDiagram.addPointerEventHandler(this.#id, this.#pointerEvent.bind(this))

        this.#topLeft = ControlPoint.fromPoint(topLeft)
        this.#bottomRight = ControlPoint.fromPoint(this.#topLeft.point.add(size))
        this.#size = Point.fromPoint(size)
        this.#resizerRect = this.#createRect()
        this.#resizerRect.id = this.#id
        this.#resizerRect.dataset.parentId = this.#objectId
        this.#drawControlHandles()
    }

    get bounds(): Bounds {
        return Bounds.fromPoints(this.#topLeft, this.#bottomRight)
    }

    close() {
        if (this.#resizerRect) {
            this.#clearControlHandles()
            this.#editorFrame.removeElement(this.#resizerRect)
        }
        this.#resizerRect = undefined
        this.#celldlDiagram.removePointerEventHandler(this.#id)
    }

    startMove(svgPoint: PointLike, _options: GridAlignOptions={}) {
        this.#activeControlPoint = undefined
        this.#moveStart = Point.fromPoint(svgPoint)
        this.#moveTopLeft = Point.fromPoint(this.#topLeft.point)
    }

    move(svgPoint: PointLike, _options: GridAlignOptions={}) {
        if (this.#moveStart && this.#moveTopLeft) {
            const delta = this.#moveStart.subtract(svgPoint)
            this.#topLeft.point = this.#moveTopLeft.subtract(delta)
            this.#bottomRight.point = this.#topLeft.point.add(this.#size)
        }
        this.#updateResizerRect(false)
    }

    endMove() {
        this.#moveStart = undefined
    }

    #createRect(): SVGRectElement {
        return this.#editorFrame.addElementAsString(svgRect(this.#topLeft, this.#bottomRight, {class: RESIZER_BOX_CLASS})) as SVGRectElement
    }

    #updateRect(rect: SVGRectElement) {
        rect.setAttribute('x', `${this.#topLeft.x}`)
        rect.setAttribute('y', `${this.#topLeft.y}`)
        rect.setAttribute('width', `${Math.max(0, this.#size.x)}`)
        rect.setAttribute('height', `${Math.max(0, this.#size.y)}`)
    }

    #updateResizerRect(resized: boolean) {
        if (resized) {
            const newSize = new Point(this.#bottomRight.x - this.#topLeft.x, this.#bottomRight.y - this.#topLeft.y)
            if (newSize.equals(this.#size) || newSize.x <= 0 || newSize.y <= 0) {
                return
            }
            this.#size = newSize
        }
        if (this.#resizerRect) {
            this.#updateRect(this.#resizerRect)
        }
        for (const controlPoint of this.#controlPoints) {
            controlPoint.redraw()
        }
        if (resized) {
            this.#celldlSvgElement.resize(this.#topLeft.point.subtract(this.#resizeTopLeft),
                                          this.#bottomRight.point.subtract(this.#resizeBottomRight))
        }
    }

    #pointerEvent(eventType: string, svgElement: SVGGraphicsElement, svgCoords: PointLike): boolean {
        if (this.#activeControlPoint) {
            if (eventType === 'pointermove') {
                if (this.#activeControlPoint !== null) {
                    this.#activeControlPoint.point = editGuides.gridAlign(svgCoords)
                }
                // only if change??
                this.#updateResizerRect(true)
            } else if (eventType === 'pointerup') {
                this.#activeControlPoint = undefined
                this.#celldlSvgElement.endResize()
            }
            return true
        } else {
            if (svgElement.dataset.resizerId === this.#id && svgElement.parentElement?.id === EDITOR_FRAME_ID) {
                const currentIndex = svgElement.dataset.controlIndex ? +svgElement.dataset.controlIndex : -1
                if (eventType === 'pointerdown') {
                  if (currentIndex >= 0) {
                        // biome-ignore lint/style/noNonNullAssertion: currentIndex is in range
                        this.#activeControlPoint = this.#controlPoints[currentIndex]!
                        this.#moveStart = undefined

                        this.#resizeTopLeft = Point.fromPoint(this.#topLeft)
                        this.#resizeBottomRight = Point.fromPoint(this.#bottomRight)
                        this.#celldlSvgElement.startResize()
                    }
                }
                    return true
            }
        }
        return false
    }

    #clearControlHandles() {
        for (const controlPoint of this.#controlPoints) {
            controlPoint.removeSvgElement()
        }
        this.#controlPoints = []
    }

    #drawControlHandles() {
        this.#xMin = new RestrictedValue(this.#topLeft.x)
        this.#xMax = new RestrictedValue(this.#bottomRight.x)
        this.#xMin.reassignMaximum(this.#xMax)
        this.#xMax.reassignMinimum(this.#xMin)
        // biome-ignore lint/style/noNonNullAssertion: we have both xMin and xMax
        const xMid = new ComputedValue((() => (this.#xMin!.value + this.#xMax!.value) / 2).bind(this))

        this.#yMin = new RestrictedValue(this.#topLeft.y)
        this.#yMax = new RestrictedValue(this.#bottomRight.y)
        this.#yMin.reassignMaximum(this.#yMax)
        this.#yMax.reassignMinimum(this.#yMin)
        // biome-ignore lint/style/noNonNullAssertion: we have both yMin and yMax
        const yMid = new ComputedValue((() => (this.#yMin!.value + this.#yMax!.value) / 2).bind(this))

        this.#controlPoints = [
            new ControlPoint(this.#xMin, this.#yMin),
            new ControlPoint(xMid, this.#yMin),
            new ControlPoint(this.#xMax, this.#yMin),
            new ControlPoint(this.#xMax, yMid),
            new ControlPoint(this.#xMax, this.#yMax),
            new ControlPoint(xMid, this.#yMax),
            new ControlPoint(this.#xMin, this.#yMax),
            new ControlPoint(this.#xMin, yMid)
        ]
        // biome-ignore lint/style/noNonNullAssertion: controlPoints is 8 long
        this.#topLeft = this.#controlPoints[0]!
        // biome-ignore lint/style/noNonNullAssertion: controlPoints is 8 long
        this.#bottomRight = this.#controlPoints[4]!
        let index = 0
        const styles = ['', 'gripper-h', '', 'gripper-v', '', 'gripper-h', '', 'gripper-v']
        const cursors = ['move', 'ns-resize', 'move', 'ew-resize', 'move', 'ns-resize', 'move', 'ew-resize']
        for (const controlPoint of this.#controlPoints) {
            const svgElement = controlPoint.createSvgElement(this.#editorFrame, styles[index])
            // biome-ignore lint/style/noNonNullAssertion: index is in range
            svgElement.style.setProperty('cursor', cursors[index]!)
            svgElement.dataset.parentId = this.#objectId
            svgElement.dataset.resizerId = this.#id
            svgElement.dataset.controlIndex = `${index}`
            index += 1
        }
        this.#activeControlPoint = undefined
    }
}

//==============================================================================
