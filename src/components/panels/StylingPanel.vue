<template lang="pug">
    ToolPanel
        template(#title)
            div {{ title }}
        template(#content)
            div(v-if="!properties.objectId") Please select a single element or path.
            template(v-else)
                Accordion(multiple=true :value="defaultPanel")
                    .group(v-for="(group, groupIndex) in properties.groups")
                        AccordionPanel(v-if="group.styling.fillStyle" value="fill")
                            AccordionHeader(:pt="{ root: { class: 'left-icon' } }") Fill
                            AccordionContent
                                FillStyle(
                                    :fillStyle="group.styling.fillStyle"
                                    @change="(fillStyle) => updateFillStyle(fillStyle, groupIndex)"
                                )
                        AccordionPanel(v-if="group.styling.cornerStyle" value="corner")
                            AccordionHeader(:pt="{ root: { class: 'left-icon' } }") Corner
                            AccordionContent
                                CornerStyle(
                                    :cornerStyle="group.styling.cornerStyle"
                                    @change="(cornerStyle) => updateCornerStyle(cornerStyle, groupIndex)"
                                )
                        AccordionPanel(v-if="group.styling.textStyle" value="text")
                            AccordionHeader(:pt="{ root: { class: 'left-icon' } }") Text
                            AccordionContent
                                TextStyle(
                                    :textStyle="group.styling.textStyle"
                                    @change="(textStyle) => updateTextStyle(textStyle, groupIndex)"
                                )
                        AccordionPanel(v-if="group.styling.pathStyle" value="stroke")
                            AccordionHeader(:pt="{ root: { class: 'left-icon' } }") Stroke
                            AccordionContent
                                PathStyle(
                                    :pathStyle="group.styling.pathStyle"
                                    @change="(pathStyle) => updatePathStyle(pathStyle, groupIndex)"
                                )
                        AccordionPanel(v-if="group.styling.gapStyle" value="membrane")
                            AccordionHeader(:pt="{ root: { class: 'left-icon' } }") Membrane
                            AccordionContent
                                GapStyle(
                                    :gapStyle="group.styling.gapStyle"
                                    @change="(gapStyle) => updateGapStyle(gapStyle, groupIndex)"
                                )
</template>

<script setup lang="ts">
//==============================================================================

import * as vue from 'vue'

import type { ComponentProperties } from '#root/utils/editor-types'
import type { Styling } from '#root/utils/styling'

import CornerStyle from '../widgets/CornerStyle.vue'
import FillStyle from '../widgets/FillStyle.vue'
import GapStyle from '../widgets/GapStyle.vue'
import PathStyle from '../widgets/PathStyle.vue'
import TextStyle from '../widgets/TextStyle.vue'

import ToolPanel from './ToolPanel.vue'

//==============================================================================

const props = defineProps<{
    title: string
    toolId: string
}>()

const properties = vue.inject(`${props.toolId}-componentProperties`) as vue.Ref<ComponentProperties>

const emit = defineEmits(['style-event'])

//==============================================================================

const defaultPanel = vue.computed<string[]>(() => {
    let defaultPanel: string|undefined
    for (const group of properties.value.groups) {
        if (group.styling?.fillStyle) {
            if (!defaultPanel) {
                defaultPanel = 'fill'
            } else if (defaultPanel !== 'fill') {
                return []
            }
        }
        if (group.styling?.cornerStyle) {
            if (!defaultPanel) {
                defaultPanel = 'corner'
            } else if (defaultPanel !== 'corner') {
                return []
            }
        }
        if (group.styling?.textStyle) {
            if (!defaultPanel) {
                defaultPanel = 'text'
            } else if (defaultPanel !== 'text') {
                return []
            }
        }
        if (group.styling?.pathStyle) {
            if (!defaultPanel) {
                defaultPanel = 'stroke'
            } else if (defaultPanel !== 'stroke') {
                return []
            }
        }
        if (group.styling?.gapStyle) {
            if (!defaultPanel) {
                defaultPanel = 'membrane'
            } else if (defaultPanel !== 'membrane') {
                return []
            }
        }
    }
    return defaultPanel ? [defaultPanel] : []
})

//==============================================================================

type StylingFields = 'cornerStyle' | 'fillStyle' | 'gapStyle' | 'pathStyle' | 'textStyle'

function updateStyling(field: StylingFields, value: string, groupIndex: number) {
        const styling = properties.value.groups[groupIndex]?.styling
        if (styling) {
            const newStyling: Styling = {}
            newStyling[field] = value
            emit('style-event', props.toolId, newStyling)
            styling[field] = value
        }
}

function updateCornerStyle(cornerStyle: string, groupIndex: number) {
    updateStyling('cornerStyle', cornerStyle, groupIndex)
}

function updateFillStyle(fillStyle: string, groupIndex: number) {
    updateStyling('fillStyle', fillStyle, groupIndex)
}

function updateGapStyle(gapStyle: string, groupIndex: number) {
    updateStyling('gapStyle', gapStyle, groupIndex)
}

function updatePathStyle(pathStyle: string, groupIndex: number) {
    updateStyling('pathStyle', pathStyle, groupIndex)
}

function updateTextStyle(textStyle: string, groupIndex: number) {
    updateStyling('textStyle', textStyle, groupIndex)
}

//==============================================================================
</script>

<style scoped>
/* Move the toggle icon to the left */
:deep(.left-icon) {
    display: flex;
    flex-direction: row-reverse;
    justify-content: start;
    column-gap: 10px;
    padding-bottom: 10px;
}

.p-accordionheader {
    padding-left: 0;
}

.p-accordionpanel {
    border-bottom-width: 4px;
    padding-top: 0;
    padding-bottom: 10px;
}

</style>
