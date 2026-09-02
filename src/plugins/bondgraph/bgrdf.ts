/******************************************************************************

CellDL Editor

Copyright (c) 2022 - 2026 David Brooks

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

import { initialised, RdfStore, type Statement } from '@celldl/rdf'

//==============================================================================

// URIs for the BG-RDF framework

export const BGF_ONTOLOGY_URI = 'https://bg-rdf.org/ontologies/bondgraph-framework'

const BG_RDF_TEMPLATE_BASE_URI = 'https://bg-rdf.org/'

const BG_RDF_TEMPLATE_URIS = [
    `${BG_RDF_TEMPLATE_BASE_URI}templates/chemical.ttl`,
    `${BG_RDF_TEMPLATE_BASE_URI}templates/electrical.ttl`,
    `${BG_RDF_TEMPLATE_BASE_URI}templates/hydraulic.ttl`,
    `${BG_RDF_TEMPLATE_BASE_URI}templates/mechanical.ttl`
]

//==============================================================================

// Map from BG-RDF source URIs to local Turtle files

const BG_RDF_SOURCES: Map<string, string> = new Map()

const BG_RDF_ASSET_BASE = '/src/assets/bg-rdf/'

const BG_RDF_ONTOLOGY_ASSET_PATH = `${BG_RDF_ASSET_BASE}ontology.ttl`

// See https://vite.dev/guide/features#custom-queries

// N.B. The path to `glob()` must be a literal, not a computed constant

const BG_RDF_ONTOLOGY_SOURCE: Record<string, string> = import.meta.glob('#root/assets/bg-rdf/ontology.ttl', {
    eager: true,
    import: 'default',
    query: '?raw'
})

for (const [path, data] of Object.entries(BG_RDF_ONTOLOGY_SOURCE)) {
    if (path.endsWith(BG_RDF_ONTOLOGY_ASSET_PATH)) {
        BG_RDF_SOURCES.set(BGF_ONTOLOGY_URI, data)
        break
    }
}

// N.B. The path to `glob()` must be a literal, not a computed constant

const BG_RDF_TEMPLATE_SOURCES: Record<string, string> = import.meta.glob('#root/assets/bg-rdf/templates/*.ttl', {
    eager: true,
    import: 'default',
    query: '?raw'
})

for (const [path, data] of Object.entries(BG_RDF_TEMPLATE_SOURCES)) {
    for (const templateUri of BG_RDF_TEMPLATE_URIS) {
        const templatePath = templateUri.substring(BG_RDF_TEMPLATE_BASE_URI.length)
        const templateKey = `${BG_RDF_ASSET_BASE}${templatePath}`
        if (path.endsWith(templateKey)) {
            BG_RDF_SOURCES.set(templateUri, data)
            break
        }
    }
}

//==============================================================================

let bgRdfStore: RdfStore|undefined

export function bgRdfStatements(): Statement[] {
    if (!initialised()) {
        return []
    } else if (bgRdfStore === undefined) {
        bgRdfStore = new RdfStore()
        for (const [uri, source] of BG_RDF_SOURCES.entries()) {
            bgRdfStore.load(uri, source)
        }
    }
    return bgRdfStore.statements()
}

//==============================================================================
//==============================================================================
