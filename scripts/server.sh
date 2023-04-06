#!/bin/bash

rm -f ./data/commit_history/*.json && deno run --allow-read --allow-run --allow-write  ./scripts/commit_history.ts

hugo server -w -D -F --disableFastRender
