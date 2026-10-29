<template lang="pug">
    ToolPanel
        template(#title)
            div {{ title }}
        template(#content)
            div#panel-content
                div(
                    v-if="!properties.objectId"
                ) Please select a single element or path.
                template(v-else)
                    .group(v-for="(group, groupIndex) in properties.groups")
                        InputWidget(
                            v-for="(item, itemIndex) in group.items"
                            v-model="item.value"
                            :itemId="item.itemId"
                            :name="item.name"
                            :value="item.value"
                            :units="item.units"
                            :numeric="item.numeric"
                            :maximumValue="item.maximumValue"
                            :minimumValue="item.minimumValue"
                            :possibleValues="item.possibleValues"
                            :stepValue="item.stepValue"
                            @change="(itemId, oldValue, newValue) => updateProperties(itemId, oldValue, newValue, groupIndex, itemIndex)"
                        )
</template>
<script setup lang="ts">
import * as vue from 'vue'
import { useThemeCssVariables } from '#root/utils/themeCssVariables'

useThemeCssVariables('accordion')
useThemeCssVariables('accordioncontent')
useThemeCssVariables('accordioncontent')
useThemeCssVariables('accordionpanel')

import type { ComponentProperties } from '#root/utils/editor-types'

import InputWidget from '../widgets/InputWidget.vue'

import ToolPanel from './ToolPanel.vue'

//==============================================================================

const props = defineProps<{
    title: string
    toolId: string
}>()

const properties = vue.inject(`${props.toolId}-componentProperties`) as vue.Ref<ComponentProperties>

const emit = defineEmits(['panel-event'])

//==============================================================================

function updateProperties(itemId: string, oldValue: number|string, newValue: number|string, groupIndex: number, itemIndex: number) {
    const item = properties.value.groups[groupIndex]?.items[itemIndex]
    if (item) {
        if (item.possibleValues === undefined) {
            item.value = newValue
        } else {
            const index = item.possibleValues.findIndex(v => String(newValue) === String(v.value))
            if (index >= 0) {
                item.value = item.possibleValues[index]
            }
        }
        emit('panel-event', props.toolId, itemId, oldValue, newValue)
    }
}

//==============================================================================
</script>

<style scoped>
#panel-content {
    margin-top: 20px;
}
</style>

<style>
/* Allow for FloatLabel text of InputWidget */
.p-accordioncontent-content {
    padding-top: 8px !important;
}
</style>
