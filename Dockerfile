FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gperf \
    openssl \
    libssl-dev \
    zlib1g-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Clone and build Telegram Bot API
WORKDIR /tmp
RUN git clone --recursive https://github.com/tdlib/telegram-bot-api.git
WORKDIR /tmp/telegram-bot-api
RUN mkdir build && cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    cmake --build . --target install && \
    cd / && rm -rf /tmp/telegram-bot-api

# Create app directory
WORKDIR /app
RUN mkdir -p /var/lib/telegram-bot-api

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 8081

# Run entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]
