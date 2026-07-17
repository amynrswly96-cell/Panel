#!/bin/bash
# One-command installer for a self-hosted fork of 3x-ui.
# Usage on the server (as root):
#   bash <(curl -Ls https://raw.githubusercontent.com/<YOUR_USER>/<YOUR_REPO>/main/install-custom.sh)
#
# Unlike the upstream install.sh, this script does NOT download a pre-built
# release binary — it clones your repo and builds the frontend + Go binary
# directly on the server. That means you don't need GitHub Actions/releases
# set up; any push to your repo is deployable with one command.

set -e

red='\033[0;31m'
green='\033[0;32m'
plain='\033[0m'

[[ $EUID -ne 0 ]] && echo -e "${red}Please run this script as root (sudo).${plain}" && exit 1

# ====== EDIT THESE TWO LINES ======
REPO_URL="https://github.com/amynrswly96-cell/Panel.git"
BRANCH="main"
# ===================================

INSTALL_DIR="/usr/local/x-ui"
SERVICE_FILE="/etc/systemd/system/x-ui.service"
BUILD_DIR="/tmp/x-ui-build-$$"

echo -e "${green}[1/6] Installing build dependencies...${plain}"
if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y git curl unzip build-essential
elif command -v yum >/dev/null 2>&1; then
    yum install -y git curl unzip gcc make
else
    echo -e "${red}Unsupported package manager. Install git, curl and a C compiler manually, then re-run.${plain}"
    exit 1
fi

# ---- Go ----
if ! command -v go >/dev/null 2>&1; then
    echo -e "${green}[2/6] Installing Go...${plain}"
    GO_VERSION="1.23.4"
    ARCH=$(uname -m)
    case "$ARCH" in
        x86_64) GOARCH="amd64" ;;
        aarch64|arm64) GOARCH="arm64" ;;
        *) echo -e "${red}Unsupported arch: $ARCH${plain}"; exit 1 ;;
    esac
    curl -Ls "https://go.dev/dl/go${GO_VERSION}.linux-${GOARCH}.tar.gz" -o /tmp/go.tar.gz
    rm -rf /usr/local/go
    tar -C /usr/local -xzf /tmp/go.tar.gz
    ln -sf /usr/local/go/bin/go /usr/local/bin/go
    ln -sf /usr/local/go/bin/gofmt /usr/local/bin/gofmt
else
    echo -e "${green}[2/6] Go already installed: $(go version)${plain}"
fi

# ---- Node.js (needed to build the React frontend) ----
if ! command -v node >/dev/null 2>&1 || [[ $(node -v | sed 's/v//;s/\..*//') -lt 24 ]]; then
    echo -e "${green}[3/6] Installing Node.js 24...${plain}"
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - >/dev/null 2>&1 || true
    if command -v apt-get >/dev/null 2>&1; then
        apt-get install -y nodejs
    else
        echo -e "${red}Install Node.js >=24 manually for this distro, then re-run.${plain}"
        exit 1
    fi
else
    echo -e "${green}[3/6] Node already installed: $(node -v)${plain}"
fi

echo -e "${green}[4/6] Cloning your repo...${plain}"
rm -rf "$BUILD_DIR"
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$BUILD_DIR"
cd "$BUILD_DIR"

echo -e "${green}[5/6] Building frontend + Go binary (this takes a few minutes)...${plain}"
cd frontend
npm install --no-audit --no-fund
npm run build
cd ..
go build -o x-ui main.go

echo -e "${green}[5b/6] Downloading Xray-core + geo data into bin/...${plain}"
XRAY_VERSION="v26.7.11"
ARCH=$(uname -m)
case "$ARCH" in
    x86_64) XRAY_ASSET="Xray-linux-64.zip"; XRAY_ARCH_SUFFIX="amd64" ;;
    aarch64|arm64) XRAY_ASSET="Xray-linux-arm64-v8a.zip"; XRAY_ARCH_SUFFIX="arm64" ;;
    *) echo -e "${red}Unsupported arch for Xray-core: $ARCH${plain}"; exit 1 ;;
esac

mkdir -p bin
XRAY_TMP="/tmp/xray-dl-$$"
mkdir -p "$XRAY_TMP"
curl -Ls -o "$XRAY_TMP/xray.zip" "https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/${XRAY_ASSET}"
unzip -q -o "$XRAY_TMP/xray.zip" -d "$XRAY_TMP"
mv "$XRAY_TMP/xray" "bin/xray-linux-${XRAY_ARCH_SUFFIX}"
chmod +x "bin/xray-linux-${XRAY_ARCH_SUFFIX}"

curl -Ls -o bin/geoip.dat https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat
curl -Ls -o bin/geosite.dat https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat
curl -Ls -o bin/geoip_IR.dat https://github.com/chocolate4u/Iran-v2ray-rules/releases/latest/download/geoip.dat
curl -Ls -o bin/geosite_IR.dat https://github.com/chocolate4u/Iran-v2ray-rules/releases/latest/download/geosite.dat
curl -Ls -o bin/geoip_RU.dat https://github.com/runetfreedom/russia-v2ray-rules-dat/releases/latest/download/geoip.dat
curl -Ls -o bin/geosite_RU.dat https://github.com/runetfreedom/russia-v2ray-rules-dat/releases/latest/download/geosite.dat
rm -rf "$XRAY_TMP"

echo -e "${green}[6/6] Installing to $INSTALL_DIR and setting up the service...${plain}"
systemctl stop x-ui 2>/dev/null || true
mkdir -p "$INSTALL_DIR"
cp x-ui "$INSTALL_DIR/x-ui"
cp -r bin "$INSTALL_DIR/bin"
cp -r internal/web/dist "$INSTALL_DIR/dist" 2>/dev/null || true
[[ -f x-ui.sh ]] && cp x-ui.sh /usr/bin/x-ui && chmod +x /usr/bin/x-ui
chmod +x "$INSTALL_DIR/x-ui"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=x-ui Service (custom build)
After=network.target
Wants=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/x-ui
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable x-ui
systemctl restart x-ui

rm -rf "$BUILD_DIR"

echo -e "${green}Done. Panel installed and running.${plain}"
echo "Check status: systemctl status x-ui"
echo "Check logs:   journalctl -u x-ui -f"
