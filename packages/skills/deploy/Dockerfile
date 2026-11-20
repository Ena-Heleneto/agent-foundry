FROM ghcr.io/jdx/mise:2026.10.25-debian AS build

WORKDIR /workspace
COPY . .

RUN mise install
RUN mise exec -- pnpm install

RUN mise exec -- pnpm run build:packages

RUN tar -czf packages/skills/dist/skills.tar.gz -C packages/skills/dist engine skill

FROM scratch AS artifacts
COPY --from=build /workspace/packages/skills/dist/ /
