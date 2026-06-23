name: Deploy Macro Fund Assistant

on:
  push:
    branches:
      - main
  schedule:
    # 08:30 Asia/Shanghai every day.
    - cron: "30 0 * * *"
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: github-pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Verify static site files
        shell: bash
        run: |
          test -f github-pages-upload/index.html
          test -f github-pages-upload/app.js
          test -f github-pages-upload/styles.css
          test -f github-pages-upload/data/site-data.js

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: github-pages-upload

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
