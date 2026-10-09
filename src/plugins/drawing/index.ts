//==============================================================================
//==============================================================================

import type { MetadataStore } from '@celldl/metadata'

import type {
    CellDLConnection,
    CellDLObject
} from '#editor/celldlObjects'
import { alert } from '#editor/editor/alerts'

import type { PluginInterface } from '#root/plugins'
import {
    PANEL_ID,
    type PropertyGroup,
    type ValueChange
} from '#root/utils/editor-types'
import type {
    Styling
} from '#root/utils/styling'

//==============================================================================

export const PLUGIN_ID = 'drawing-plugin'

const STYLE_GROUP_ID = 'drawing-element-style'

const STYLING_TEMPLATE: PropertyGroup = {
    groupId: STYLE_GROUP_ID,
    items: [],
    styling: {}
}

//==============================================================================


interface PluginData {
    managed?: boolean
}

//==============================================================================

export class DrawingPlugin implements PluginInterface {
    readonly id: string = PLUGIN_ID

    get componentLibrary() {
        return {
            id: this.id,
            name: 'Drawing',
            templates: []
        }
    }

    getPanelTemplates(panelId: PANEL_ID) {
        if (panelId === PANEL_ID.STYLE_PANEL) {
            // check...
            return [STYLING_TEMPLATE]
        }
        return []
    }

    getTemplateName(_rdfType: string) {
        return undefined
    }

    getObjectTemplateById(_id: string) {
        return undefined
    }

    //==========================================================================

    openDiagram(_uri: string, _rdfStore: MetadataStore) {
    }


    addPluginMetadataToStore(_rdfStore: MetadataStore) {
    }

    getPluginData(celldlObject: CellDLObject): object {
        if (celldlObject.isCompartment) {
            return {
                managed: true
            }
        }
        return {}
    }

    statusText(celldlObject: CellDLObject): string {
        return celldlObject.typeName
    }


    //==========================================================================

    addComponent(_component: CellDLObject) {
    }

    componentDeleted(_component: CellDLObject) {
    }

    addConnection(_connection: CellDLConnection) {
    }

    checkConnectionValid(_sourceObject: CellDLObject, _targetObject: CellDLObject) {
        return undefined
    }

    connectionDeleted(_connection: CellDLConnection) {
    }

    getMaxConnections(_celldlObject: CellDLObject): number {
        return -1
    }

    //==========================================================================

    loadComponentProperties(properties: PropertyGroup[], panelId: PANEL_ID, celldlObject: CellDLObject) {
        alert.clear()
        if (panelId === PANEL_ID.STYLE_PANEL
         && celldlObject.celldlSvgElement
         && (<PluginData>celldlObject.pluginData(this.id)).managed) {
            properties.forEach(group => {
                if (group.groupId === STYLE_GROUP_ID) {
                    if (celldlObject.celldlSvgElement) {
                        group.styling = { ...celldlObject.celldlSvgElement.getStyle() }
                    }
                }
            })
        }
    }

    async updateObjectProperties(celldlObject: CellDLObject, panelId: PANEL_ID, itemId: string, value: ValueChange,
                                 _componentProperties: PropertyGroup[]) {
        celldlObject.celldlSvgElement?.updateElement()
    }

    async updatedComponentStyling(celldlObject: CellDLObject, styling: Styling) {
        celldlObject.celldlSvgElement?.setStyle(styling)
    }

    styleRules(): string {
        return ''
    }

    svgDefinitions(): string {
        return ''
    }

}

//==============================================================================
//==============================================================================
