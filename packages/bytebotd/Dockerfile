# -----------------------------------------------------------------------------
# Bytebot Dockerfile - Virtual Desktop Environment
# -----------------------------------------------------------------------------

# Base image
FROM ubuntu:22.04

# -----------------------------------------------------------------------------
# 1. Environment setup
# -----------------------------------------------------------------------------
# Set non-interactive installation
ARG DEBIAN_FRONTEND=noninteractive
# Configure display for X11 applications
ENV DISPLAY=:0

# -----------------------------------------------------------------------------
# 2. System dependencies installation
# -----------------------------------------------------------------------------
RUN apt-get update && apt-get install -y \
    # X11 / VNC
    xvfb x11vnc xauth x11-xserver-utils \
    x11-apps sudo software-properties-common \
    # Desktop environment 
    xfce4 xfce4-goodies dbus wmctrl \
    # Display manager with autologin capability
    lightdm \
    # Development tools
    python3 python3-pip curl wget git vim \
    # Utilities & automation tools
    supervisor netcat-openbsd xdotool xclip scrot \
    # Standard desktop applications
    mousepad gnome-calculator evince eog kolourpaint file-roller libreoffice-calc \
    # Libraries
    libxtst-dev \
    # Remove unneeded dependencies
    && apt-get remove -y light-locker xfce4-screensaver xfce4-power-manager || true \
    # Clean up to reduce image size
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /run/dbus && \
    # Generate a machine-id so dbus-daemon doesn't complain
    dbus-uuidgen --ensure=/etc/machine-id

# -----------------------------------------------------------------------------
# 3. Additional software installation
# -----------------------------------------------------------------------------
# Install Firefox
RUN apt-get update && apt-get install -y \
    # Install necessary for adding PPA
    software-properties-common apt-transport-https wget gnupg \
    # Install Additional Graphics Libraries
    mesa-utils \
    libgl1-mesa-dri \
    libgl1-mesa-glx \
    # Install Sandbox Capabilities
    libcap2-bin \
    # Install Fonts
    fontconfig \
    fonts-dejavu \
    fonts-liberation \
    fonts-freefont-ttf \
    && add-apt-repository -y ppa:mozillateam/ppa \
    && apt-get update \
    && apt-get install -y firefox-esr \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    # Set Firefox as default browser system-wide
    && update-alternatives --install /usr/bin/x-www-browser x-www-browser /usr/bin/firefox-esr 200 \
    && update-alternatives --set x-www-browser /usr/bin/firefox-esr \
    && fc-cache -f -v

# Install Google Chrome & PinchTab for headed agent browser automation
RUN curl -fsSL https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -o /tmp/chrome.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends /tmp/chrome.deb \
    && rm -f /tmp/chrome.deb \
    && curl -fsSL https://github.com/pinchtab/pinchtab/releases/latest/download/pinchtab-linux-amd64 -o /usr/local/bin/pinchtab \
    && chmod +x /usr/local/bin/pinchtab \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Visual Studio Code
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
        apt-get update && apt-get install -y wget gpg apt-transport-https software-properties-common && \
        wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/ms_vscode.gpg && \
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/ms_vscode.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list && \
        apt-get update && apt-get install -y code && \
        apt-get clean && rm -rf /var/lib/apt/lists/* ; \
    elif [ "$ARCH" = "arm64" ]; then \
        apt-get update && apt-get install -y wget gpg && \
        wget -qO /tmp/code_arm64.deb https://update.code.visualstudio.com/latest/linux-deb-arm64/stable && \
        apt-get install -y /tmp/code_arm64.deb && \
        rm -f /tmp/code_arm64.deb && \
        apt-get clean && rm -rf /var/lib/apt/lists/* ; \
    else \
        echo "VSCode is not available for $ARCH architecture."; \
    fi

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Upgrade pip & install Python automation libraries (spreadsheet & email handling)
RUN pip3 install --upgrade pip \
    && pip3 install --no-cache-dir pandas openpyxl requests

# -----------------------------------------------------------------------------
# 4. VNC and remote access setup
# -----------------------------------------------------------------------------
# Install noVNC and websockify
RUN git clone https://github.com/novnc/noVNC.git /opt/noVNC \
    && git clone https://github.com/novnc/websockify.git /opt/websockify \
    && cd /opt/websockify \
    && pip3 install --break-system-packages .

# -----------------------------------------------------------------------------
# 5. Application setup (bytebotd)
# -----------------------------------------------------------------------------
# Copy package files first to leverage Docker cache

# Install dependencies required to build libnut-core and uiohook-napi
RUN apt-get update && \
    apt-get install -y \
        cmake \
        libx11-dev \
        libxtst-dev \
        libxinerama-dev \
        libxi-dev \
        libxt-dev \
        libxrandr-dev \
        libxkbcommon-dev \
        libxkbcommon-x11-dev \
        xclip \
        git build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY ./shared/ /bytebot/shared/
COPY ./bytebotd/ /bytebot/bytebotd/
WORKDIR /bytebot/bytebotd
RUN npm install --build-from-source
RUN npm rebuild uiohook-napi --build-from-source

RUN npm run build

WORKDIR /compile

RUN git clone https://github.com/ZachJW34/libnut-core.git && \
    cd libnut-core && \
    npm install && \
    npm run build:release

# replace /bytebotd/node_modules/@nut-tree-fork/libnut-linux/build/Release/libnut.node with /compile/libnut-core/build/Release/libnut.node
RUN rm -f /bytebot/bytebotd/node_modules/@nut-tree-fork/libnut-linux/build/Release/libnut.node && \
    cp /compile/libnut-core/build/Release/libnut.node /bytebot/bytebotd/node_modules/@nut-tree-fork/libnut-linux/build/Release/libnut.node

RUN rm -rf /compile

WORKDIR /bytebot/bytebotd

# -----------------------------------------------------------------------------
# 7. User setup and autologin configuration
# -----------------------------------------------------------------------------
# Create non-root user
RUN useradd -ms /bin/bash user && echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

RUN mkdir -p /var/run/dbus && \
    chmod 755 /var/run/dbus && \
    chown user:user /var/run/dbus

RUN mkdir -p /tmp/bytebot-screenshots && \
    chown -R user:user /tmp/bytebot-screenshots

# -----------------------------------------------------------------------------
#  Copy staged system files and keep sane permissions
# -----------------------------------------------------------------------------
# 1. Ensure everything under /bytebotd/root is owned by root (files + dirs)
# 2. Set *files* to 0644 and *directories* to 0755 so that applications can
#    traverse directories (execute bit!) while keeping the contents read-only.
# 3. Copy the tree to /
RUN chown -R root:root /bytebot/bytebotd/root && \
    find /bytebot/bytebotd/root -type f -exec chmod 644 {} + && \
    find /bytebot/bytebotd/root -type d -exec chmod 755 {} + && \
    find /bytebot/bytebotd/root -type f -executable -exec chmod +x {} + && \
    cp -a /bytebot/bytebotd/root/. /

RUN chown -R user:user /home/user
RUN chmod -R 755 /home/user

RUN mkdir -p /home/user/Desktop && \
    cp -f /usr/share/applications/firefox.desktop /home/user/Desktop/ 2>/dev/null || true; \
    cp -f /usr/share/applications/code.desktop /home/user/Desktop/ 2>/dev/null || true; \
    cp -f /usr/share/applications/terminal.desktop /home/user/Desktop/ 2>/dev/null || true; \
    cp -f /usr/share/applications/mousepad.desktop /home/user/Desktop/ 2>/dev/null || true; \
    cp -f /usr/share/applications/org.gnome.Calculator.desktop /home/user/Desktop/ 2>/dev/null || true; \
    cp -f /usr/share/applications/libreoffice-calc.desktop /home/user/Desktop/ 2>/dev/null || true; \
    cp -f /usr/share/applications/org.kde.kolourpaint.desktop /home/user/Desktop/ 2>/dev/null || true; \
    chmod +x /home/user/Desktop/*.desktop 2>/dev/null || true; \
    chown user:user /home/user/Desktop/*.desktop 2>/dev/null || true

RUN mkdir -p /home/user/.config /home/user/.local/share /home/user/.cache \
    && chown -R user:user /home/user/.config /home/user/.local /home/user/.cache

WORKDIR /home/user

# -----------------------------------------------------------------------------
# 8. Port configuration and runtime
# -----------------------------------------------------------------------------
# - Port 9990: bytebotd and external noVNC websocket
EXPOSE 9990

# Start supervisor to manage all services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf", "-n"]