#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="${ROOT_DIR}/dist-release"
PACKAGE_DIR="${RELEASE_DIR}/package"

version="$(node -p "JSON.parse(require('fs').readFileSync('${ROOT_DIR}/package.json', 'utf8')).version")"
tag="v${version}"
artifact_name="yggtree-${tag}.tar.gz"
artifact_path="${RELEASE_DIR}/${artifact_name}"

rm -rf "${RELEASE_DIR}"
mkdir -p "${PACKAGE_DIR}/yggtree"

cd "${ROOT_DIR}"
pnpm run build

cp -R dist bin package.json README.md LICENSE pnpm-lock.yaml "${PACKAGE_DIR}/yggtree/"

(
  cd "${PACKAGE_DIR}/yggtree"
  pnpm install --prod --frozen-lockfile --ignore-scripts --config.node-linker=hoisted
  rm -f pnpm-lock.yaml
)

tar -czf "${artifact_path}" -C "${PACKAGE_DIR}" yggtree

if command -v shasum >/dev/null 2>&1; then
  checksum="$(shasum -a 256 "${artifact_path}" | awk '{print $1}')"
else
  checksum="$(sha256sum "${artifact_path}" | awk '{print $1}')"
fi

printf '%s  %s\n' "${checksum}" "${artifact_name}" > "${artifact_path}.sha256"

echo "Created ${artifact_path}"
echo "Created ${artifact_path}.sha256"
