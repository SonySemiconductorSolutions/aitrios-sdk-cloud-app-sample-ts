# choice https://github.com/devcontainers/images/tree/main/src/typescript-node
ARG VARIANT=18-bullseye
FROM mcr.microsoft.com/devcontainers/typescript-node:${VARIANT}
RUN apt-get update && apt-get install -y \
    linux-libc-dev \
    libncurses-dev \
    ncurses-base \
    ncurses-bin \
    libsystemd0 \
    libudev1 \
    libpq-dev \
    libx11-6 \
    libx11-data \
    libwebp-dev \
    libc-bin \
    libc-l10n \
    libc6 \
    locales \
    curl \
    libcurl3-gnutls \
    libkrb5-dev \
    libkdb5-10 \
    libmariadb-dev \
    libssl-dev \
    mariadb-common \
    openssh-client \
    openssl \
    bsdextrautils \
    bsdutils \
    libblkid-dev \
    libmount-dev \
    libsmartcols1 \
    uuid-dev \
    util-linux \
    mount \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*
RUN npm uninstall -g pnpm
