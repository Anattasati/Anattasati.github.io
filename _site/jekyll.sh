#!/bin/bash

# Jekyll development script

export PATH="$PATH:/home/codespace/.local/share/gem/ruby/3.4.0/bin"

case "$1" in
  "serve"|"s")
    echo "Starting Jekyll development server..."
    bundle exec jekyll serve --host 0.0.0.0 --port 4000 --livereload
    ;;
  "build"|"b")
    echo "Building Jekyll site..."
    bundle exec jekyll build
    ;;
  "clean"|"c")
    echo "Cleaning Jekyll site..."
    bundle exec jekyll clean
    ;;
  "install"|"i")
    echo "Installing dependencies..."
    bundle install
    ;;
  *)
    echo "Jekyll development script"
    echo "Usage: $0 {serve|build|clean|install}"
    echo "  serve   - Start development server (aliases: s)"
    echo "  build   - Build the site (aliases: b)"
    echo "  clean   - Clean generated files (aliases: c)"
    echo "  install - Install dependencies (aliases: i)"
    ;;
esac
