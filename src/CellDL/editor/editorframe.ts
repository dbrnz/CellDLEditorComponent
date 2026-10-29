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

import type { ObjectTemplate } from '#editor/components'
import type { CellDLDiagram } from '#editor/diagram'
import { type PointLike, PointMath } from '#root/utils/points'
import { SVG_ICON_HEIGHT } from '#root/utils/styling'
import { SVG_URI } from '#root/utils/svgUtils'

//==============================================================================

export const EDITOR_BACKGROUND_ID = 'celldl-editor-background'
export const EDITOR_FRAME_ID = 'celldl-editor-selection-frame'

//==============================================================================

function addElementAsString(svgGroup: SVGGElement, element: string): SVGGraphicsElement {
    svgGroup.insertAdjacentHTML('beforeend', element)
    return svgGroup.lastChild as SVGGraphicsElement
}

function addSvgElementFromTemplate(svgGroup: SVGGElement, template: ObjectTemplate, topLeft: PointLike): SVGGElement {
    const svgElement: SVGGElement = document.createElementNS(SVG_URI, 'g')
    svgElement.setAttribute('style', 'visibility: hidden')
    if (template.imageData) {
        svgElement.insertAdjacentHTML('beforeend', `<image href="${template.imageData}" height="${SVG_ICON_HEIGHT}">`)
    }
    svgGroup.append(svgElement)
    const bbox = svgElement.getBBox()
    const translation = PointMath.subtract(topLeft, bbox)
    svgElement.setAttribute('transform', `translate(${translation.x}, ${translation.y})`)
    svgElement.removeAttribute('style')
    return svgElement
}

function clearGroup(svgGroup: SVGGElement) {
    while (svgGroup.hasChildNodes()) {
        const child = svgGroup.lastChild
        if (child !== null) {
            svgGroup.removeChild(child)
        }
    }
}

//==============================================================================

export class EditorFrame {
    #backgroundGroup: SVGGElement
    #frameGroupElement: SVGGElement

    constructor(celldlDiagram: CellDLDiagram) {
        this.#backgroundGroup = this.#addEditorGroup(celldlDiagram, EDITOR_BACKGROUND_ID, true)
        this.#frameGroupElement = this.#addEditorGroup(celldlDiagram, EDITOR_FRAME_ID)

        // Remove any children that might be present
        this.clear()
    }

    #addEditorGroup(celldlDiagram: CellDLDiagram, groupId: string, prepend: boolean=false): SVGGElement {
        const svgDiagram = celldlDiagram.svgDiagram
        let editorGroup = svgDiagram.getElementById(groupId) as SVGGElement
        if (editorGroup) {
            return editorGroup
        }
        editorGroup = document.createElementNS(SVG_URI, 'g')
        editorGroup.id = groupId
        celldlDiagram.addEditorElement(editorGroup, prepend)
        return editorGroup
    }

    addElementAsString(element: string, background: boolean=false): SVGGraphicsElement {
        if (background) {
            return addElementAsString(this.#backgroundGroup, element)
        } else {
            return addElementAsString(this.#frameGroupElement, element)
        }
    }

    addSvgElementFromTemplate(template: ObjectTemplate, topLeft: PointLike, background: boolean=false): SVGGElement {
        if (background) {
            return addSvgElementFromTemplate(this.#backgroundGroup, template, topLeft)
        } else {
            return addSvgElementFromTemplate(this.#frameGroupElement, template, topLeft)
        }
    }

    clear() {
        clearGroup(this.#backgroundGroup)
        clearGroup(this.#frameGroupElement)
    }

    removeElement(element: SVGGraphicsElement | null) {
        if (element) {
            if (this.#backgroundGroup.contains(element)) {
                this.#backgroundGroup.removeChild(element)
            } else if (this.#frameGroupElement.contains(element)) {
                this.#frameGroupElement.removeChild(element)
            }
        }
    }

    restoreElement(element: SVGGraphicsElement, background: boolean=false) {
        if (background) {
            this.#backgroundGroup.appendChild(element)
        } else {
            this.#frameGroupElement.appendChild(element)
        }
    }
}

//==============================================================================
