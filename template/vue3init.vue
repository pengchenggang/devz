<template>
  <VueWrapper>init</VueWrapper>
</template>
<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import VueWrapper from "./vueWrapper.vue"
const props = defineProps(["deep"])
const emit = defineEmits(["closeAll", "openSub"])
emit("closeAll", props.deep + 1)
const loadFile = () => {}
defineExpose({ loadFile })

onMounted(() => {})
// watch(() => route.params.file, func) 深度属性
// watch(html, func) 单值
nextTick(() => {})
// await nextTick() 函数外面要加sync
</script>
<style scoped></style>