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

import * as vue from 'vue'

import { DCT, RDFS, type Term } from '@celldl/rdf'

//==============================================================================

import type * as locApi from '#root/libopencor/locUIJsonApi'

import type { CellDLObject } from '#editor/celldlObjects'
import type { NamedProperty } from '#editor/components'

import type { IPathStyle } from '#root/utils/svgUtils'
import { componentLibraryPlugin } from '#root/plugins'

//==============================================================================

export type ItemDetails = locApi.IUiJsonInput & {
    itemId: string
    property: string
    value?: string|number
    possibleValues?: locApi.IUiJsonDiscreteInputPossibleValue[]
    units?: string
    optional?: boolean
    numeric?: boolean
}

export type StyleObject = {
    fillColours?: string[]
    pathStyle?: IPathStyle
}

export interface PropertyGroup {
    groupId: string
    items: ItemDetails[]
    styling?: StyleObject
    title: string
}

export type StylingGroup = PropertyGroup & {
    styling: StyleObject
}

export interface ValueChange {
    oldValue: string
    newValue: string
}

//==============================================================================

export const METADATA_GROUP_ID = 'cd-metadata'

function OBJECT_METADATA(): NamedProperty[] {
    return [
        {
            name: 'Label',
            property: RDFS.uri('label').value
        },
        {
            name: 'Description',
            property: DCT.uri('description').value
        }
    ]
}

function METADATA_GROUP(): PropertyGroup {
    return {
        groupId: METADATA_GROUP_ID,
        title: 'Metadata',
        items: OBJECT_METADATA().map((nameUri: NamedProperty) => {
            return {
                itemId: nameUri.property,
                property: nameUri.property,
                name: nameUri.name,
                defaultValue: ''
            }
        })
    }
}

//==============================================================================

export const STYLING_GROUP_ID = 'object-styling'

export const STYLING_GROUP: PropertyGroup = {
    groupId: STYLING_GROUP_ID,
    title: 'Style',
    items: [],
    styling: {}
}

//==============================================================================
//==============================================================================

export function getItemProperty(celldlObject: CellDLObject,
                                itemTemplate: ItemDetails): ItemDetails|undefined {
    const objectUri = celldlObject.uri.toString()
    let value: string|undefined

    celldlObject.rdfStore.query(`
        PREFIX : <${celldlObject.celldlDiagram.uri}#>

        SELECT ?value WHERE {
            ${objectUri} <${itemTemplate.property}> ?value
        }`
    ).forEach((r: Map<string, Term>) => {
        value = r.get('value')?.value
    })

    if (value === undefined) {
        if (!itemTemplate.optional) {
            return Object.assign({
                ...itemTemplate,
                value: itemTemplate.defaultValue || ''
            })
        }
        return undefined
    }
    if (itemTemplate.numeric) {
        const valueUnits = value.split(' ')
        return {
            ...itemTemplate,
            // @ts-expect-error
            value:  Number(valueUnits[0]),
            units: valueUnits[1]
        }
    }
    // @ts-expect-error
    return {
        ...itemTemplate,
        value: value
    }
}

//==============================================================================

export function updateItemProperty(property: string, value: ValueChange,
                                   celldlObject: CellDLObject) {
    const objectUri = celldlObject.uri.toString()

    celldlObject.rdfStore.update(`
        PREFIX : <${celldlObject.celldlDiagram.uri}#>

        DELETE {
            ${objectUri} <${property}> ?value
        }
        WHERE {
            ${objectUri} <${property}> ?value
        }`)
    const newValue = String(value.newValue).trim()
    if (newValue) {
        celldlObject.rdfStore.update(`
            PREFIX : <${celldlObject.celldlDiagram.uri}#>

            INSERT DATA { ${objectUri} <${property}> """${newValue.replace('\\', '\\\\')}""" }
        `)
    }
}

//==============================================================================

export class ObjectPropertiesPanel {
    #componentProperties = vue.ref<PropertyGroup[]>([])
    #propertyGroups: PropertyGroup[]
    #metadataIndex: number = -1

    constructor() {
        this.#propertyGroups = [
            ...componentLibraryPlugin.getPropertyGroups(),
            METADATA_GROUP(),
            componentLibraryPlugin.getStylingGroup()
        ]
        this.#propertyGroups.forEach((group, index) => {
            if (group.groupId === METADATA_GROUP_ID) {
                this.#metadataIndex = index
            }
        })
        this.#componentProperties.value = structuredClone(this.#propertyGroups)
        for (const group of this.#componentProperties.value) {
            group.items = []
        }
        // Make data available to the properties panel

        vue.provide<vue.Ref<PropertyGroup[]>>('componentProperties', this.#componentProperties)
    }

    //==================================

    clearObjectProperties() {
        // Clear each group's list of items
        for (const group of this.#componentProperties.value) {
            group.items = []
            if (group.styling) {
                group.styling = {}
            }
        }
    }

    setObjectProperties(celldlObject: CellDLObject|null) {
        this.clearObjectProperties()
        if (celldlObject) {
            // Update component properties with plugin specific values

            componentLibraryPlugin.loadComponentProperties(celldlObject, this.#componentProperties.value)

            if (this.#metadataIndex >= 0) {
                // Update component properties in the METADATA_GROUP

                // biome-ignore lint/style/noNonNullAssertion: `metadataIndex` is in range
                const group = this.#componentProperties.value[this.#metadataIndex]!
                METADATA_GROUP().items.forEach((itemTemplate: ItemDetails) => {
                    const item = getItemProperty(celldlObject, itemTemplate)
                    if (item) {
                        group.items.push(item)
                    }
                })
            }
        }
    }

    //==================================

    async updateObjectProperties(celldlObject: CellDLObject|null,
                                 itemId: string, value: ValueChange) {
        if (celldlObject) {
            // Save plugin specific component properties

            await componentLibraryPlugin.updateObjectProperties(celldlObject, itemId, value,
                                                             this.#componentProperties.value)

            // Save component properties in the METADATA_GROUP

            // biome-ignore lint/style/noNonNullAssertion: `metadataIndex` is in range
            const metadataGroup = this.#propertyGroups[this.#metadataIndex]!
            for (const itemTemplate of metadataGroup.items) {
                if (itemId === itemTemplate.itemId) {
                    updateItemProperty(itemTemplate.property, value, celldlObject)
                    break
                }
            }
        }
    }

    //==================================

    async updateObjectStyling(celldlObject: CellDLObject|null, objectType: string, styling: StyleObject) {
        if (celldlObject) {
            await componentLibraryPlugin.updatedComponentStyling(celldlObject, objectType, styling)
        }
    }
}

//==============================================================================
//==============================================================================
