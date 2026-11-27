<script setup lang="ts">
/**
 * 页面切换重新收起移动目录，不通过watcher维护同步状态。
 */
const route = useRoute()
</script>

<template>
  <div min-h="screen" bg="slate-50" text="slate-900">
    <a href="#main-content" position="absolute" left="4" top="-20 focus:4" z="50" bg="white" p="3" text="brand">跳到正文</a>
    <header position="sticky" top="0" z="20" border="b slate-200" bg="white">
      <div max-w="360" mx="auto" px="5 sm:8" h="18" flex="~" items="center" justify="between" gap="4">
        <NuxtLink to="/" flex="~" items="center" gap="3" un-text="slate-950" decoration="none">
          <span bg="slate-950" text="white xs" font="mono" p="2" rounded="lg" aria-hidden="true">AF</span>
          <span font="semibold" text="lg" tracking="tight">Agent Foundry</span>
        </NuxtLink>
        <span text="xs slate-500" tracking="wide">使用文档 <span mx="2" aria-hidden="true">/</span> ISC</span>
      </div>
    </header>
    <div max-w="360" mx="auto" px="5 sm:8" grid="~ cols-1 lg:cols-[15rem_minmax(0,1fr)]" gap="10 lg:16">
      <aside un-hidden="~" lg:block="~" py="10">
        <div position="sticky" top="28">
          <DocsSidebar />
        </div>
      </aside>
      <div min-w="0">
        <details :key="route.path" block="~" un-hidden="lg:~" my="5" border="~ slate-200" rounded="lg" bg="white">
          <summary p="4" cursor="pointer" text="sm" font="medium">
            浏览文档
          </summary>
          <div p="4" border="t slate-100">
            <DocsSidebar />
          </div>
        </details>
        <main id="main-content" py="6 lg:12" tabindex="-1">
          <slot />
        </main>
        <footer py="8" border="t slate-200" text="xs slate-500" leading="7">
          Agent Foundry · 开源技能与协作工作流<br>
          以当前源码和实际验证为准，历史记录见仓库 specs。
        </footer>
      </div>
    </div>
  </div>
</template>
