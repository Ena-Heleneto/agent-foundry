FROM node:26.8.1-bookworm-slim AS build

ARG PNPM_VERSION=12.8.1
WORKDIR /workspace

RUN npm install --global "pnpm@${PNPM_VERSION}"

# 仓库根为构建上下文，保留 workspace、catalog 和锁定依赖。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/preset-config/package.json ./packages/preset-config/package.json
COPY packages/skills/package.json ./packages/skills/package.json

# 跳过根 postinstall 的文档站准备，所需共享预设在下方显式构建。
RUN pnpm --filter @foundry/skills... install --frozen-lockfile --ignore-scripts

COPY packages/preset-config/ ./packages/preset-config/
COPY packages/skills/ ./packages/skills/

RUN pnpm --filter @foundry/preset-config run build \
    && pnpm --filter @foundry/skills run build

# 默认只导出构建产物，服务启动和发布不属于此镜像。
FROM scratch AS artifacts
COPY --from=build /workspace/packages/skills/dist/ /
