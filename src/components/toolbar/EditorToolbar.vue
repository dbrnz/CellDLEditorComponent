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
                    v-if="type === 'popover'"
                    :is="button.panel"
                    :title="button.prompt"
                    :toolId="button.toolId"
                    @popover-event="popoverEvent"
                )
                component(
                    v-if="type === 'panel'"
                    :is="button.panel"
                    :title="button.prompt"
                    :toolId="button.toolId"
                    @panel-event="panelEvent"
                    @style-event="styleEvent"
                )
</template>

<script setup lang="ts">
import * as vue from 'vue'

import { useThemeCssVariables } from '#root/utils/themeCssVariables'

useThemeCssVariables('toolbar')

//==============================================================================

import type { EditorToolButton, StyleObject } from '#root/utils/editor-types'
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
    emit('button-event', toolId, active)
}

function panelEvent(toolId: string, itemId: string, oldValue: string, newValue: string) {
    document.dispatchEvent(
        new CustomEvent('panel-event', {
            detail: {
                type: 'value',
                source: toolId,
                itemId: itemId,
                value: {
                    oldValue,
                    newValue
                }
            }
        })
    )
}

function popoverEvent(toolId: string, data: PopoverEventData) {
    emit('popover-event', toolId, data)
}

function styleEvent(toolId: string, object: string, styling: StyleObject) {
    document.dispatchEvent(
        new CustomEvent('style-event', {
            detail: {
                type: 'value',
                source: toolId,
                object,
                styling
            }
        })
    )
}

//==============================================================================

</script>

<style scoped>
.panel-content {
    width: 250px;
    border: 2px solid var(--editor-border-color);
    border-left-width: 1px;
    right: 38px; /* This depends on panel bar width... */
    top: 1.8em;
    bottom: 1.6em;
    position: absolute;
}
</style>

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
