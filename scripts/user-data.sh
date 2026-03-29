#!/bin/bash
set -euo pipefail

# --- Package installation ---
apt-get update
apt-get install -y \
  tmux \
  neovim \
  nodejs \
  npm \
  zsh \
  zsh-autosuggestions \
  fzf

npm i -g @openai/codex

# --- Shell config ---
chsh -s /usr/bin/zsh ubuntu

cat > /home/ubuntu/.tmux.conf << 'CONFEOF'
{{TMUX_CONF}}
CONFEOF

cat > /home/ubuntu/.zshrc << 'ZSHEOF'
{{ZSHRC}}
ZSHEOF

chown ubuntu:ubuntu /home/ubuntu/.tmux.conf /home/ubuntu/.zshrc
