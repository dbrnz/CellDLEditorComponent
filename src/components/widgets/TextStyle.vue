<template lang="pug">
    .card
        InputWidget(
            v-model="vAlignValue"
            itemId="vAlign"
            name="Text vertical alignment"
            :value="vAlignValue"
            :possibleValues="vAlignmentItems"
            @change="emitChange"
        )
        InputWidget(
            v-model="hAlignValue"
            itemId="hAlign"
            name="Text horizontal alignment"
            :value="hAlignValue"
            :possibleValues="hAlignmentItems"
            @change="emitChange"
        )
</template>

<script setup lang="ts">
import * as vue from 'vue'

import { STYLE_STRING_FIELD_SEPARATOR } from '#root/utils/styling'
import InputWidget from './InputWidget.vue'

const { textStyle } = defineProps<{ textStyle: string }>()

const emit = defineEmits(['change'])

const vAlign = vue.ref('1')
const hAlign = vue.ref()

const hAlignmentItems = vue.ref([
    { name: 'Left', value: '-1' },
    { name: 'Centre', value: '0' },
    { name: 'Right', value: '1' }
])
const hAlignValue = vue.ref()
let hAlignmemt = '0'

const vAlignmentItems = vue.ref([
    { name: 'Top', value: '-1' },
    { name: 'Centre', value: '0' },
    { name: 'Bottom', value: '1' }
])
const vAlignValue = vue.ref()
let vAlignmemt = '0'

function setAlign(textStyle: string) {
    const fields = textStyle.split(STYLE_STRING_FIELD_SEPARATOR)
    hAlignmemt = fields.at(0) || '0'
    for (const field of hAlignmentItems.value) {
        if (field.value === hAlignmemt) {
            hAlignValue.value = field
            break
        }
    }
    vAlignmemt = fields.at(1) || '0'
    for (const field of vAlignmentItems.value) {
        if (field.value === vAlignmemt) {
            vAlignValue.value = field
            break
        }
    }
}

setAlign(textStyle)

vue.watch(
    () => textStyle,
    () => setAlign(textStyle)
)

function emitChange(itemId: string, oldValue: string, newValue: string) {
    if (itemId === 'hAlign') {
        hAlignmemt = newValue
    } else if (itemId === 'vAlign') {
        vAlignmemt = newValue
    }
    emit('change', [
        hAlignmemt,
        vAlignmemt
    ].join(STYLE_STRING_FIELD_SEPARATOR))
}

</script>

<style scoped>
.card {
    /* add bottom/top borders? */
}
.flexPrompt {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}
</style>

