# ============================================
# Base stage: install common tools (required for all services)
# ============================================
FROM denoland/deno:latest AS base

# Switch to root for apt-get (Deno image default user is non-root)
USER root

# Install common tools: curl for health checks, coreutils for tee
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl coreutils ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Working dir (compose mounts project via volumes)
# Deno cache: run deno cache on host before first start, or mount runtime/deno-cache
WORKDIR /app
