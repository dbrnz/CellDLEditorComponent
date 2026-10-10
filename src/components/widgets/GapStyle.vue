<template lang="pug">
    .card
        FloatLabel(variant="on")
            InputText(v-model.number="gap")
            Slider(
                v-model="gap"
                :min="minGap"
                :max="maxGap"
                :step="gapStep"
                @change="emitChange"
            )
            label Membrane gap (px)
</template>

<script setup lang="ts">
//==============================================================================

import * as vue from 'vue'
import Slider from 'primevue/slider'

import { STYLE_STRING_FIELD_SEPARATOR } from '#root/utils/styling'
import { useThemeCssVariables } from '#root/utils/themeCssVariables'

useThemeCssVariables('floatlabel')
useThemeCssVariables('slider')

const { gapStyle } = defineProps<{ gapStyle: string }>()

const emit = defineEmits(['change'])

const gap = vue.ref<number>(0)

function setGap(gapStyle: string) {
    gap.value = Number(gapStyle.split(STYLE_STRING_FIELD_SEPARATOR).at(0) as string)
}

setGap(gapStyle)

vue.watch(
    () => gapStyle,
    () => setGap(gapStyle)
)

const minGap = vue.ref<number>(0)
const maxGap = vue.ref<number>(8)
const gapStep = vue.ref<number>(0.5)

function emitChange() {
    emit('change', String(gap.value))
}

//==============================================================================
</script>

<style scoped>
.flexPrompt {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}
</style>
