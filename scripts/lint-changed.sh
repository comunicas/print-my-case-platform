#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${GITHUB_BASE_REF:-main}"
BASE_BRANCH=""

if git show-ref --verify --quiet "refs/remotes/origin/${BASE_REF}"; then
  BASE_BRANCH="origin/${BASE_REF}"
else
  echo "Base branch origin/${BASE_REF} not found; trying to fetch it..."
  git fetch --no-tags --depth=1 origin "${BASE_REF}" >/dev/null 2>&1 || true

  if git show-ref --verify --quiet "refs/remotes/origin/${BASE_REF}"; then
    BASE_BRANCH="origin/${BASE_REF}"
  elif git rev-parse --verify --quiet "${BASE_REF}" >/dev/null; then
    BASE_BRANCH="${BASE_REF}"
  fi
fi

if [ -n "${BASE_BRANCH}" ]; then
  DIFF_RANGE="$(git merge-base HEAD "${BASE_BRANCH}")...HEAD"
else
  echo "Could not resolve base branch '${BASE_REF}'. Falling back to HEAD~1...HEAD."
  DIFF_RANGE="HEAD~1...HEAD"
fi

mapfile -t DIFF_FILES < <(
  git diff --name-only --diff-filter=ACMR "${DIFF_RANGE}"
)

CHANGED_FILES=()
for file in "${DIFF_FILES[@]}"; do
  if [[ "${file}" =~ \.(js|jsx|ts|tsx|mjs|cjs)$ ]]; then
    CHANGED_FILES+=("${file}")
  fi
done

if [ "${#CHANGED_FILES[@]}" -eq 0 ]; then
  echo "No changed JS/TS files to lint."
  exit 0
fi

echo "Linting changed files:"
printf ' - %s\n' "${CHANGED_FILES[@]}"

npx eslint "${CHANGED_FILES[@]}"
