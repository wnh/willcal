{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Node.js and npm for building the app
    nodejs_22

    # NW.js runtime for running the desktop app
    nwjs

    # Build tools that better-sqlite3 needs
    python3
    gcc
    gnumake

    # Libraries needed for NW.js on Linux
    pkg-config

    # Additional libraries that NW.js might need
    alsa-lib
    cups
    libpulseaudio
    libdrm
    mesa
    nspr
    nss
    pango
    systemd
    libxkbcommon
    dbus
    at-spi2-atk
    at-spi2-core
    libxshmfence
  ];

  shellHook = ''
    echo "WillCal Development Environment"
    echo "================================"
    echo "Node version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo "NW.js version: $(nw --version 2>/dev/null || echo 'nw command available')"
    echo ""
    echo "Available commands:"
    echo "  npm install      - Install dependencies"
    echo "  npm run build    - Build the application"
    echo "  npm run nw       - Run with NW.js"
    echo "  npm run nw-dev   - Build and run"
    echo ""

    # Set up npm to use local node_modules/.bin
    export PATH="$PWD/node_modules/.bin:$PATH"
  '';

  # Environment variables for better-sqlite3 compilation
  # This ensures it compiles against the correct Node.js version
  PYTHON = "${pkgs.python3}/bin/python";
}
