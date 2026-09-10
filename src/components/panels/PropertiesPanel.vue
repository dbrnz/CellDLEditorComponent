<template lang="pug">
    ToolPanel(:id=toolId)
        template(#content)
            div(
                v-if="!properties.objectId"
            ) Please select a single element or path.
            .group(
                v-for="group in expandedGroups"
                v-if="!disabled"
            )
               InputWidget(
                    v-if="group.objectType === 'items'"
                    v-for="item in group.items"
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
                    @change="updateProperties"
                )
                FillStyle(
                    v-if="group.objectType === 'node'"
                    :fillStyle="group.objectStyle"
                    @change="updateNodeStyle"
                )
                PathStyle(
                    v-if="group.objectType === 'path'"
                    :pathStyle="group.objectStyle"
                    @change="updatePathStyle"
                )

</template>
<script setup lang="ts">
import * as vue from 'vue'
import { useThemeCssVariables } from '#root/utils/themeCssVariables'

useThemeCssVariables('accordion')
useThemeCssVariables('accordioncontent')
useThemeCssVariables('accordioncontent')
useThemeCssVariables('accordionpanel')

import type { ComponentProperties, PropertyGroup } from '#root/utils/editor-types'

import ToolPanel from '../toolbar/ToolPanel.vue'
import InputWidget from '../widgets/InputWidget.vue'

import FillStyle from './FillStyle.vue'
import PathStyle from './PathStyle.vue'

import type {
    INodeStyle,
    IPathStyle
} from '#root/utils/svgUtils'

type ExpandedPropertyGroup = PropertyGroup & {
    objectType: string
    objectStyle?: INodeStyle|IPathStyle
}

const props = defineProps<{
    toolId: string
}>()

const properties = vue.inject<vue.Ref<ComponentProperties>>(`${props.toolId}-componentProperties`)

const disabled = vue.ref<boolean>(properties?.value ? !properties.value.objectId : true)
const expandedGroups = vue.ref<ExpandedPropertyGroup[]>([])
vue.watch(
    () => properties?.value,
    (newValue) => {
        const visible = !!newValue?.objectId
        if (visible) {
            setExpandededGroups(newValue.groups)
        }
        disabled.value = !visible
    },
    { deep: true }
)

function setExpandededGroups(groups: PropertyGroup[]) {
    const exGroups: ExpandedPropertyGroup[] = []
    for (const group of groups) {
        const styling = group.styling || {}
        const objectType = 'fillColours' in styling ? 'node'
                         : 'pathStyle' in styling ? 'path'
                         : group.items.length > 0 ? 'items'
                         : 'none'
        let objectStyle: INodeStyle|IPathStyle|undefined
        if ('fillColours' in styling) {
            const fillColours: string[] = [...(styling.fillColours || [])]
            let direction = 'H'
            const colours: string[] = []
            // biome-ignore lint/style/noNonNullAssertion: fillColours is at least 1 long
            if (fillColours.length && ['H', 'V'].includes(fillColours[0]!)) {
                // @ts-expect-error
                direction = fillColours.shift()
            }
            if (fillColours.length === 1) {
                // biome-ignore lint/style/noNonNullAssertion: fillColours is 1 long
                colours.push(fillColours[0]!.trim())
            } else if (fillColours.length) {
                fillColours.forEach(colour => {
                    colours.push(colour.trim())
                })
            }
            objectStyle = {
                gradientFill: colours.length > 1,
                colours,
                direction
            } as INodeStyle
        } else if ('pathStyle' in styling) {
            objectStyle = styling.pathStyle
        }
        exGroups.push({
            ...group,
            objectType,
            objectStyle
        })
    }
    expandedGroups.value = exGroups
}

const emit = defineEmits(['panel-event', 'style-event'])

function updateProperties(itemId: string, oldValue: number | string, newValue: number | string) {
    vue.nextTick().then(() => {
        emit('panel-event', props.toolId, itemId, oldValue, newValue)
    })
}

function updateNodeStyle(fillStyle: INodeStyle) {
    void vue.nextTick().then(() => {
        const fillColours: string[] = []
        if (fillStyle.gradientFill) {
            fillColours.push(fillStyle.direction || 'H')
        }
        fillColours.push(...fillStyle.colours)
        emit('style-event', props.toolId, 'node', { fillColours })
    })
}

function updatePathStyle(pathStyle: IPathStyle) {
    void vue.nextTick().then(() => {
        emit('style-event', props.toolId, 'path', { pathStyle })
    })
}
</script>

<style>
/* Allow for FloatLabel text of InputWidget */
.p-accordioncontent-content {
    padding-top: 8px !important;
}
</style>
