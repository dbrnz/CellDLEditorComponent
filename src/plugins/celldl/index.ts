//==============================================================================

import {
    MetadataPropertiesMap,
    type MetadataProperty,
    type MetadataStore,
    SPARQL_PREFIXES
} from '@celldl/metadata'

import * as $rdf from '@celldl/rdf'

//==============================================================================

import {
    type ItemDetails,
    PANEL_ID,
    type PropertyGroup,
    type StyleObject,
    type ValueChange
} from '#root/utils/editor-types'
import type { ConnectionStatus, PluginInterface } from '#root/plugins'
import {
    getSvgFillStyle,
    getSvgPathStyle,
    setSvgPathStyle,
    type IPathStyle
} from '#root/utils/svgUtils'

import { alert } from '#editor/editor/alerts'
import {
    CellDLComponent,
    type CellDLObject
} from '#editor/celldlObjects'
import type {
    ComponentLibrary,
    ElementTypeName,
    ObjectTemplate
} from '#editor/components'

//==============================================================================

export const PLUGIN_ID = 'core-celldl-components'

//==============================================================================
//==============================================================================

//==============================================================================

const CELLDL_STYLE_GROUP_ID = 'celldl-element-style'

const BG_STYLING_TEMPLATE: PropertyGroup = {
    groupId: CELLDL_STYLE_GROUP_ID,
    items: [],
    styling: {}
}

//==============================================================================
//==============================================================================

export class BondgraphPlugin implements PluginInterface {
    readonly id: string = PLUGIN_ID

    #baseComponents: Map<string, BGBaseComponent> = new Map()                       // Indexed by component.type
    #baseComponentToElementTemplates: Map<string, ElementTemplate[]> = new Map()    // Indexed by component.type
    #domainGraph: DomainGraph = new DomainGraph(undefined)
    #elementTemplates: Map<string, ElementTemplate> = new Map()                     // Indexed by element.type
    #elementPropertiesTemplate: Map<string, IndexedPropertyGroup> = new Map()
    #componentLibrary: BGComponentLibrary = {
        id: this.id,
        name: 'Bondgraph',
        templates: []
    }
    #componentTemplates: Map<string, BGLibraryComponentTemplate> = new Map()
    #currentDocumentUri: string = ''
    #physicalDomains: Map<string, PhysicalDomain> = new Map()
    #rdfStore: $rdf.RdfStore = new $rdf.RdfStore()
    #transformNodeType = BGF.uri('TransformNode').value

    constructor() {
    }

    //==========================================================================

    get componentLibrary(): ComponentLibrary {
        return this.#componentLibrary
    }

    #getName(type: string): string {
        if (this.#elementTemplates.has(type)) {
            return this.#elementTemplates.get(type)!.name
        }
        if (this.#baseComponents.has(type)) {
            return this.#baseComponents.get(type)!.name || ''
        }
        return ''
    }

    getPanelTemplates(panelId: PANEL_ID): PropertyGroup[]
    {
        if (panelId === PANEL_ID.PROPERTIES_PANEL) {
            return [...this.#elementPropertiesTemplate.values()]
        } else if (panelId === PANEL_ID.STYLE_PANEL) {
            return [BG_STYLING_TEMPLATE]
        }
        return []
    }

    getTemplateName(rdfType: string): string|undefined {
        const elementTemplate = this.#elementTemplates.get(rdfType)
        if (elementTemplate) {
            return elementTemplate.name
        }
        const baseComponent = this.#baseComponents.get(rdfType)
        if (baseComponent) {
            return baseComponent.name
        }
    }

    getObjectTemplateById(id: string): ObjectTemplate|undefined {
        const componentTemplate = this.#componentTemplates.get(id)
        if (componentTemplate) {
            const metadataProperties: MetadataProperty[] = [
                [ $rdf.RDF.uri('type'), $rdf.namedNode(componentTemplate.type)],
                [ BGF.uri('hasSymbol'), $rdf.literal(componentTemplate.symbol)]
            ]
            if (!componentTemplate.noSpeciesLocation) {
                metadataProperties.push(
                    [ BGF.uri('hasSpecies'), $rdf.literal(DEFAULT_SPECIES) ],
                    [ BGF.uri('hasLocation'), $rdf.literal(DEFAULT_LOCATION) ]
                )
            }
            if (componentTemplate.type === this.#transformNodeType) {
                metadataProperties.push(
                    // Passing a number causes a memory exception in oxigraph...
                    [ BGF.uri('hasValue'), $rdf.literal(String(DEFAULT_TRANSFORM_RATIO)) ],
                )
            }
            return {
                CellDLClass: CellDLComponent,
                imageData: componentTemplate.imageData,
                metadataProperties: MetadataPropertiesMap.fromProperties(metadataProperties),
                name: this.#getName(componentTemplate.type)
            }
        }
    }

    //==========================================================================

    openDiagram(uri: string, rdfStore: MetadataStore) {
        // We are creating a BondgraphModel
        rdfStore.add($rdf.namedNode(uri), $rdf.RDF.uri('type'), BGF.uri('BondgraphModel'))

        this.#currentDocumentUri = uri

        // Add a copy of the BG-RDF framework as a **named graph**, to use when
        // finding BondElements and JunctionStructures
        const bgfGraph = $rdf.namedNode(BGF_ONTOLOGY_URI)
        for (const statement of this.#rdfStore.statements()) {
            rdfStore.add(statement.subject, statement.predicate, statement.object, bgfGraph)
        }
        this.#domainGraph = new DomainGraph(rdfStore, uri)
    }

    //======================================

    addPluginMetadataToStore(rdfStore: MetadataStore) {
        // First remove existing statements about components in the document

        rdfStore.update(`${SPARQL_PREFIXES}
            DELETE {
                <${this.#currentDocumentUri}> bgf:hasBondElement ?uri
            }
            WHERE {
                <${this.#currentDocumentUri}> bgf:hasBondElement ?uri
            }`)
        rdfStore.update(`${SPARQL_PREFIXES}
            DELETE {
                <${this.#currentDocumentUri}> bgf:hasJunctionStructure ?uri
            }
            WHERE {
                <${this.#currentDocumentUri}> bgf:hasJunctionStructure ?uri
            }`)

        const statements: string[] = []

        // Find the BondElements in the diagram

        rdfStore.query(`${SPARQL_PREFIXES}
            PREFIX : <${this.#currentDocumentUri}#>
            SELECT ?uri
            WHERE {
                ?uri a ?type .
                ?type rdfs:subClassOf* bgf:BondElement
            }`, true)
        .forEach((r: Map<string, $rdf.Term>) => {
            statements.push(`<${this.#currentDocumentUri}> bgf:hasBondElement ${r.get('uri')!.toString()} .`)
        })

        // Find the JunctionStructures in the diagram

        rdfStore.query(`${SPARQL_PREFIXES}
            PREFIX : <${this.#currentDocumentUri}#>

            SELECT ?uri
            WHERE {
                ?uri a ?type .
                ?type rdfs:subClassOf* bgf:JunctionStructure
            }`, true)
        .forEach((r: Map<string, $rdf.Term>) => {
            statements.push(`<${this.#currentDocumentUri}> bgf:hasJunctionStructure ${r.get('uri')!.toString()} .`)
        })

        // And add them to the BondgraphModel

        rdfStore.update(`${SPARQL_PREFIXES}
            INSERT DATA {
                ${statements.join('\n')}
            }
        `)
    }

    //==========================================================================
    //==========================================================================

    getPluginData(celldlObject: CellDLObject): object {
        if (celldlObject.isConnection) {
            return {
                baseComponent: {}
            }
        }
        const rows = celldlObject.rdfStore.query(`${SPARQL_PREFIXES}
            PREFIX : <${this.#currentDocumentUri}#>
            SELECT ?type ?symbol WHERE {
                ${celldlObject.uri.toString()} a ?type
                OPTIONAL { ${celldlObject.uri.toString()} bgf:hasSymbol ?symbol }
            }`
        )
        let pluginData: PluginData|undefined
        for (const r of rows) {
            const rdfType = r.get('type')!.value
            if (rdfType.startsWith(BGF_URI)) {
                const symbol = r.get('symbol')
                const baseComponent = this.#baseComponents.get(rdfType)
                if (baseComponent && !pluginData) {
                    pluginData = { baseComponent } as PluginData
                    if (baseComponent.junctionType) {
                        pluginData.junctionType = baseComponent.junctionType
                    }
                }
                if (this.#elementTemplates.has(rdfType)) {
                    const elementTemplate = this.#elementTemplates.get(rdfType)!
                    if (pluginData) {
                        pluginData.elementTemplate = elementTemplate
                    } else {
                        pluginData = {
                            baseComponent: elementTemplate.baseComponent,
                            elementTemplate: elementTemplate
                        }
                    }
                }
                if (symbol && pluginData) {
                    pluginData.symbol = symbol.value
                }
            }
        }
        return pluginData || {}
    }

    statusText(celldlObject: CellDLObject): string {
        const pluginData = <PluginData>celldlObject.pluginData(this.id)
        let domain: string|undefined
        if (pluginData.baseComponent?.isBondElement) {
            domain = pluginData.elementTemplate?.domain
        } else {
            domain = this.#domainGraph.getDomain(celldlObject.uri.value)
        }
        return domain ? $rdf.getFragment(domain) : ''
    }

    //==========================================================================
    //==========================================================================

    addComponent(component: CellDLObject) {
        const pluginData = <PluginData>component.pluginData(this.id)
        this.#domainGraph.addNode(component.uri.value,
            pluginData.elementTemplate?.domain,
            pluginData.baseComponent.type === this.#transformNodeType)
    }

    componentDeleted(component: CellDLObject) {
        this.#domainGraph.deleteNode(component.uri.value)
    }

    //==========================================================================
    //==========================================================================

    addConnection(connection: CellDLConnection) {
        this.#domainGraph.addEdge(connection.uri.value, [connection.source!.uri.value, connection.target!.uri.value])
        const uri = connection.uri.toString()
        connection.rdfStore.update(`${SPARQL_PREFIXES}
            PREFIX : <${this.#currentDocumentUri}#>
            INSERT DATA {
                ${uri} bgf:hasSource ${connection.source!.uri.toString()} .
                ${uri} bgf:hasTarget ${connection.target!.uri.toString()} .
            }
        `)
    }

    checkConnectionValid(sourceObject: CellDLObject, targetObject: CellDLObject): ConnectionStatus|undefined {
        /*
        Junctions and elements:
            JT ==> `Composite with Junction` or `Junction`
                    JT value is `One`, `Transform`, or `Zero`
         No JT ==> `Element`

        Can't have direct:
            Element <---> Element
            One <---> One
            Zero <---> Zero
            Transform <---> Transform

            Element <---> Transform ??

            Element <---> Transform <---> Element
            One <---> Transform <---> One
            Zero <---> Transform <---> Zero

        Domains:
            Allow:
                undefined <---> Any
                Same <---> Same
        */
        if (this.#domainGraph.hasEdge([sourceObject.uri.value, targetObject.uri.value])
         || this.#domainGraph.hasEdge([targetObject.uri.value, sourceObject.uri.value])
        ) {
            return { alert: 'Components are already connected' }
        }
        const sourceData = <PluginData>sourceObject.pluginData(this.id)
        const targetData = <PluginData>targetObject.pluginData(this.id)
        if (sourceData.junctionType === targetData.junctionType) {
            if (!sourceData.junctionType) {
                return { alert: 'Direct connections between Bond Elements are not allowed' }
            } else {
                return { alert: `Cannot directly connect two ${$rdf.getFragment(sourceData.junctionType)} nodes` }
            }
        }
        const sourceDomain = this.#domainGraph.getDomain(sourceObject.uri.value)
        const targetDomain = this.#domainGraph.getDomain(targetObject.uri.value)
        if (sourceDomain && targetDomain && sourceDomain !== targetDomain) {
            return { alert: `Cannot connect ${$rdf.getFragment(sourceDomain)} and ${$rdf.getFragment(targetDomain)} physical domains` }
        }
    }

    connectionDeleted(connection: CellDLConnection) {
        this.#domainGraph.deleteEdge([connection.source!.uri.value, connection.target!.uri.value])
        const uri = connection.uri.toString()
        connection.rdfStore.update(`${SPARQL_PREFIXES}
            PREFIX : <${this.#currentDocumentUri}#>
            DELETE DATA {
                ${uri} bgf:hasSource ${connection.source!.uri.toString()} .
                ${uri} bgf:hasTarget ${connection.target!.uri.toString()} .
            }
        `)
    }

    getMaxConnections(celldlObject: CellDLObject): number {
        const pluginData = (<PluginData>celldlObject.pluginData(this.id))
        return pluginData.baseComponent?.numPorts || Infinity
    }

    //==========================================================================

    loadComponentProperties(componentProperties: PropertyGroup[], panelId: PANEL_ID, celldlObject: CellDLObject) {
        alert.clear()
        if (panelId === PANEL_ID.PROPERTIES_PANEL) {
            if (!celldlObject.isConnection) {
                const pluginData = (<PluginData>celldlObject.pluginData(this.id))
                componentProperties.forEach(componentGroup => {
                    const groupTemplate = this.#elementPropertiesTemplate.get(componentGroup.groupId)
                    if (groupTemplate) {
                        if (componentGroup.groupId === BG_PROPERTY_GROUP_ID.ElementProperties) {
                            this.#loadElementProperties(celldlObject, componentGroup, groupTemplate)
                        } else if (componentGroup.groupId === BG_PROPERTY_GROUP_ID.ElementInitialValue) {
                            this.#loadElementProperties(celldlObject, componentGroup, groupTemplate)
                        } else if (pluginData.elementTemplate) {
                            if (componentGroup.groupId === BG_PROPERTY_GROUP_ID.ElementParameters) {
                                this.#setVariableItems(pluginData.elementTemplate.parameters, componentGroup)
                                this.#loadVariableItems(celldlObject, componentGroup)
                            } else if (componentGroup.groupId === BG_PROPERTY_GROUP_ID.ElementVariables) {
                                this.#setVariableItems(pluginData.elementTemplate.variables, componentGroup)
                                this.#loadVariableItems(celldlObject, componentGroup)
                            }
                        }
                    }

                })
            }
        } else if (panelId === PANEL_ID.STYLE_PANEL) {
            componentProperties.forEach(group => {
                this.#loadElementStyling(celldlObject, group, celldlObject.isConnection)
            })
        }
    }

    //==========================================================================
    //==========================================================================

    async updateObjectProperties(celldlObject: CellDLObject, panelId: PANEL_ID, itemId: string, value: ValueChange,
                                 componentProperties: PropertyGroup[]) {
        if (panelId === PANEL_ID.PROPERTIES_PANEL) {
            const itemGroupId = itemId.split('/')[0]
            if (!itemGroupId) {
                return
            }
            const groupTemplate = this.#elementPropertiesTemplate.get(itemGroupId) as IndexedPropertyGroup

            // Store the item's new value
            await this.#updateElementProperties(value, itemId, celldlObject, groupTemplate)

            // Has the CellDLObject's type changed?
            if (itemId === BG_ELEMENT_TYPE_ITEM && value.newValue !== value.oldValue) {
                const pluginData = (<PluginData>celldlObject.pluginData(this.id))
                for (const propertyGroup of componentProperties) {
                    if (propertyGroup.groupId === BG_PROPERTY_GROUP_ID.ElementProperties) {
                        // Possible element types depend on the component's domain so recalculate
                        const elementTypeItem = propertyGroup.items[ELEMENT_TYPE_INDEX]!
                        const possibleValues = this.#elementTypePossibleValues(celldlObject, pluginData.baseComponent)
                        elementTypeItem.possibleValues = possibleValues
                        break
                    }
                }
                const elementTemplate = pluginData.elementTemplate
                for (const groupTemplate of this.#elementPropertiesTemplate.values()) {
                    const componentGroup = componentProperties[groupTemplate.index] as PropertyGroup
                    if (groupTemplate.groupId === BG_PROPERTY_GROUP_ID.ElementInitialValue) {
                        // Remove any existing initial value
                        componentGroup.items.length = 0
                        this.#deleteElementValue(celldlObject)
                        // And add an item if the new element has an initial value
                        if (elementTemplate?.value) {
                            this.#setElementValue(elementTemplate.value, componentGroup, celldlObject)
                        }
                    } else if (componentGroup.groupId === BG_PROPERTY_GROUP_ID.ElementParameters) {
                        // Remove any existing parameter values
                        componentGroup.items.length = 0
                        this.#deleteVariableItems(celldlObject, componentGroup)
                        // And add items if the element has parameters
                        if (elementTemplate?.parameters) {
                            this.#setVariableItems(elementTemplate.parameters, componentGroup)
                            this.#loadVariableItems(celldlObject, componentGroup)
                        }
                    } else if (componentGroup.groupId === BG_PROPERTY_GROUP_ID.ElementVariables) {
                        // Remove any existing variable values
                        componentGroup.items.length = 0
                        this.#deleteVariableItems(celldlObject, componentGroup)
                        // And add items if the element has variables
                        if (elementTemplate?.variables) {
                            this.#setVariableItems(elementTemplate.variables, componentGroup)
                            this.#loadVariableItems(celldlObject, componentGroup)
                        }
                    }
                }
            }
        }
    }

    //==================================

    async updatedComponentStyling(celldlObject: CellDLObject, objectType: string, styling: StyleObject) {
        const pluginData = (<PluginData>celldlObject.pluginData(this.id))
        if (objectType === 'node' && 'fillColours' in styling) {
            const fillColours = styling.fillColours as string[] || []
            if (fillColours.toString() !== pluginData.fillColours!.toString()) {
                pluginData.fillColours = [...fillColours]
                await this.#updateSvgElement(celldlObject, pluginData.species, pluginData.location)
            }
        } else if (objectType === 'path' && 'pathStyle' in styling) {
            setSvgPathStyle(celldlObject.celldlSvgElement!.svgElement, styling.pathStyle as IPathStyle)
        }
    }

    styleRules(): string {
        return '.celldl-Connection.bondgraph.arrow { marker-end:url(#connection-end-arrow-bondgraph) }'
    }

    svgDefinitions(): string {
        return arrowMarkerDefinition('connection-end-arrow-bondgraph', 'bondgraph')
    }

}

//==============================================================================
//==============================================================================
