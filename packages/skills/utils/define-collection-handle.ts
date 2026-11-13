export interface CollectionOption { packageName: string, mcp: boolean, skill: Record<string, { enabled: boolean }> }

export function defineCollectionHandle<const T extends CollectionOption>(options: T): T {
  return options
}
