//==============================================================================

import { initialise as initialiseRdf } from '@celldl/rdf'
import { defineAsyncComponent } from 'vue'

// Initialise the RDF store backend before the editor is imported

const EditorComponent = defineAsyncComponent(async () => {
    await initialiseRdf()
    return import('./WrappedEditor.vue')
})

export default EditorComponent

//==============================================================================

