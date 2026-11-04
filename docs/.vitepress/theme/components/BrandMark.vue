<script setup lang="ts">
import { withBase } from 'vitepress'

withDefaults(defineProps<{ variant?: 'pill' | 'card' }>(), { variant: 'pill' })
</script>

<template>
  <div :class="['mp-brand', `mp-brand--${variant}`]">
    <img
      :src="withBase('/grid-fish.svg')"
      alt="鱼心快跑：戴圆眼镜、拿直尺在方格纸上画最短路径的青色小鱼"
      width="1024"
      height="1024"
    />
    <div class="mp-brand-copy">
      <strong>鱼心快跑</strong>
      <span>鱼心快跑，也算得清</span>
    </div>
  </div>
</template>
