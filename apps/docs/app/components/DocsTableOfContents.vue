<script setup lang="ts">
/**
 * 文档标题索引；由Nuxt Content生成，嵌套子项保留稳定锚点。
 */
interface TocEntry {
  id: string
  text: string
  children?: TocEntry[]
}
/**
 * 页面仅传入当前文档的标题，不额外请求正文。
 */
defineProps<{ links: TocEntry[] }>()
</script>

<template>
  <nav v-if="links.length" aria-label="本页目录" text="sm">
    <p font="medium" mb="4">
      本页内容
    </p>
    <ul list="none" p="0" m="0" space-y="3" border="l slate-200">
      <li v-for="link in links" :key="link.id" pl="4">
        <a :href="`#${link.id}`" text="slate-500 hover:brand" decoration="none" leading="6">{{ link.text }}</a>
        <ul v-if="link.children?.length" list="none" pl="3" mt="3" space-y="2">
          <li v-for="child in link.children" :key="child.id">
            <a :href="`#${child.id}`" text="slate-500 hover:brand" decoration="none">{{ child.text }}</a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>
