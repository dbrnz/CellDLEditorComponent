<template lang="pug">
    ToolPopover(ref="popover")
        template(#title)
            .font-bold Drawing tools
        template(#content)
            div(v-for="toolGroup in toolGroups")
                .title.text-xl {{ toolGroup.name }}
                .icons
                    component.icon(
                        v-for="tool in toolGroup.tools"
                        :class="{ selected: tool.selected }"
                        :is="LucideIcons[tool.icon]"
                        :id="tool.id"
                        :aria-label="tool.name"
                        stroke-width="1.5"
                        v-tippy="{ content: tool.name, placement: 'right' }"
                        @mousedown="selectionEvent"
                    )
</template>

<script setup lang="ts">
import * as vue from 'vue'
import { type MaybeComputedElementRef, useElementVisibility } from '@vueuse/core'
import * as LucideIcons from '@lucide/vue'

//==============================================================================

import ToolPopover from '#root/components/toolbar/ToolPopover.vue'

import { PLUGIN_ID } from '.'

//==============================================================================

const props = defineProps<{
    toolId: string
}>()

//==============================================================================

// Helper utilities

function toolId(componentId: string): string {
    return `${PLUGIN_ID}/${componentId}`
}

function componentId(toolId: string): string {
    const prefix = `${PLUGIN_ID}/`
    if (toolId.startsWith(prefix)) {
        return toolId.slice(prefix.length)
    }
    return toolId
}

//==============================================================================

// What we show in the Vue component

type DrawingTool = {
    id: string
    name: string
    icon?: string
    selected?: boolean
}

type ToolGroup = {
    name: string
    tools: DrawingTool[]
}

const idToToolDefinition: Map<string, DrawingTool> = new Map()
let activeId: string | undefined

const toolGroups = vue.ref<ToolGroup[]>([
    {
        name: 'Membrane',
        tools: [
            {
                name: 'Closed compartment',
                id: toolId('draw-closed-compartment'),
                icon: 'SquircleDashed'
            },
// TEMP -- until implemented...
//            {
//                name: 'Membrane segment',
//                id: toolId('draw-membrane-segment'),
//                icon: 'Tally2'
//            }
        ]
    },
    {
        name: 'Background',
        tools: [
            {
                name: 'Background region',
                id: toolId('draw-background-region'),
                icon: 'SquareDashedKanban'
            }
        ]
    }
])

for (const toolGroup of toolGroups.value) {
    for (const tool of toolGroup.tools) {
        idToToolDefinition.set(tool.id, tool)
    }
}

//==============================================================================

function emitDrawingToolEvent(id: string) {
    // Tell the editor that a drawing tool has been selected
    document.dispatchEvent(
        new CustomEvent('celldl-drawing', {
            detail: {
                tool: componentId(id)
            }
        })
    )
}

//==============================================================================

const popover = vue.useTemplateRef('popover') as MaybeComputedElementRef
const isVisible = useElementVisibility(popover)

vue.watch(isVisible, (nowVisible) => {
  if (nowVisible && activeId) {
        emitDrawingToolEvent(activeId)
    }
})

function selectionEvent(e: MouseEvent) {
    let target: HTMLElement|null = e.target as HTMLElement
    while (!target.classList.contains('icon')) {
        target = target.parentElement
        if (!target) return
    }
    const tool = idToToolDefinition.get(target.id)
    if (target.id && tool) {
        if (activeId && idToToolDefinition.has(activeId)) {
            // biome-ignore lint/style/noNonNullAssertion: idToComponent.has(activeId)
            idToToolDefinition.get(activeId)!.selected = false
        }
        tool.selected = true
        activeId = target.id
        emitDrawingToolEvent(activeId)
    }
}

//==============================================================================
</script>

<style scoped>
.title {
    padding: 2px;
    padding-top: 6px;
}
.icons
{
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    justify-content: space-between;
    gap: 3px;
    overflow-y: auto;
    margin: 1px;
    width: 160px;
}
.icons.packed {
    justify-content: flex-start;
}
.icon
{
    width: 45px;
    height: 45px;
    border: 1px solid lightgrey;
    background-color: var(--p-content-background);
    margin: 0;
    padding: 2px;
}
.icon:hover {
    background-color: lightgrey;
}
.icon.selected
{
    background-color: #66aaff;
    border: 4px solid blue;
}
</style>
