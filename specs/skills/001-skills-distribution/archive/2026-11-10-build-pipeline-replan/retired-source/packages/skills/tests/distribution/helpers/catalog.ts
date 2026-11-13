/**
 * MVU-A 沿用已验证的目录骨架；生产导出在同一实现上增量完善。
 */
export { type CatalogSkill, readCatalog } from '../../../build/distribution/export.js'

/**
 * 保留原实验的完整附件读取入口，不维护第二套路径和字节规则。
 */
export { readFiles } from '../../../build/distribution/verify.js'
