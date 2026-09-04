# Extend the pre-built bytebot-desktop image
FROM ghcr.io/bytebot-ai/bytebot-desktop:edge

# Add additional packages, applications, or customizations here
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl \
      ca-certificates \
      wget && \
    curl -fsSL https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -o /tmp/chrome.deb && \
    apt-get install -y --no-install-recommends /tmp/chrome.deb && \
    rm /tmp/chrome.deb && \
    curl -fsSL https://github.com/pinchtab/pinchtab/releases/latest/download/pinchtab-linux-amd64 -o /usr/local/bin/pinchtab && \
    chmod +x /usr/local/bin/pinchtab && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Expose the bytebotd service port and pinchtab port
EXPOSE 9990 9876

# Start the bytebotd service
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf", "-n"]
