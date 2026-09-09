<template lang="pug">
    Toolbar.vertical
        template(#start)
            ToolButton(
                v-for="button in buttons"
                :toolId="button.toolId"
                :active="button?.active"
                :prompt="button.prompt"
                :icon="button.icon"
                :image="button.image"
                :modal="!!button?.panel"
                :type="type"
                :panel="button.panel"
                @button-event="buttonEvent"
            )
                component(
                    v-if="type === 'popover' && button.panel"
                    :is="button.panel"
                    :toolId="button.toolId"
                    @popover-event="popoverEvent"
                )
</template>

<script setup lang="ts">
import type * as vue from 'vue'
import { useThemeCssVariables } from '#root/utils/themeCssVariables'

useThemeCssVariables('toolbar')

//==============================================================================

import type { EditorToolButton } from '#root/utils/editor-types'
import type { PopoverEventData } from '#root/components/popovers/types'

import ToolButton from './ToolButton.vue'

//==============================================================================

const props = defineProps<{
    type?: string
    buttons: EditorToolButton[]
}>()

const emit = defineEmits<{
    'button-event': [
        toolId: string,
        active: boolean,
        panel: vue.Raw<vue.Component> | null
    ],
    'popover-event': [
        toolId: string,
        data: PopoverEventData
    ]
}>()

function buttonEvent(toolId: string, active: boolean, panel: vue.Raw<vue.Component> | null) {
    for (const button of props.buttons) {
        if (active && toolId === button.toolId) {
            button.active = true
        } else {
            button.active = false
        }
    }
    emit('button-event', toolId, active, props.type === 'panel' ? panel : null)
}

function popoverEvent(id: string, data: PopoverEventData) {
    emit('popover-event', id, data)
}

//==============================================================================

</script>

<style>
.p-toolbar.vertical,
.p-toolbar.vertical > .p-toolbar-start {
    flex-direction: column !important;
    width: 38px !important;
    padding: 0 !important;
    border-top: 1px solid grey;
    flex-wrap: nowrap !important;
    border-radius: 0 !important;
}
</style>
