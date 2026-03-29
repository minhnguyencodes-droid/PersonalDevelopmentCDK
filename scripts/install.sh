#!/bin/bash
set -euo pipefail

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

chsh -s /usr/bin/zsh ubuntu
