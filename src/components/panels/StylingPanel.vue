<template lang="pug">
    ToolPanel
        template(#title)
            div {{ title }}
        template(#content)
            div(v-if="!properties.objectId") Please select a single element or path.
            template(v-else)
                .group(v-for="(group, groupIndex) in properties.groups")
                    FillStyle(
                        v-if="group.styling.fillStyle"
                        :fillStyle="group.styling.fillStyle"
                        @change="(fillStyle) => updateFillStyle(fillStyle, groupIndex)"
                    )
                    CornerStyle(
                        v-if="group.styling.cornerStyle"
                        :cornerStyle="group.styling.cornerStyle"
                        @change="(cornerStyle) => updateCornerStyle(cornerStyle, groupIndex)"
                    )
                    TextStyle(
                        v-if="group.styling.textStyle"
                        :textStyle="group.styling.textStyle"
                        @change="(textStyle) => updateTextStyle(textStyle, groupIndex)"
                    )
                    PathStyle(
                        v-if="group.styling.pathStyle"
                        :pathStyle="group.styling.pathStyle"
                        @change="(pathStyle) => updatePathStyle(pathStyle, groupIndex)"
                    )
                    GapStyle(
                        v-if="group.styling.gapStyle"
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
