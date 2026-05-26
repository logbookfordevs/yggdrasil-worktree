#!/usr/bin/env sh
set -eu

REPO="logbookfordevs/yggdrasil-worktree"
VERSION="latest"
INSTALL_DIR="${YGGTREE_INSTALL_DIR:-$HOME/.local/share/yggtree}"
BIN_DIR="${YGGTREE_BIN_DIR:-$HOME/.local/bin}"

usage() {
  cat <<'USAGE'
Usage: install.sh [--version <tag>] [--install-dir <path>] [--bin-dir <path>] [--help]
       install.sh <tag>

Options:
  --version <tag>     Install a specific GitHub release tag, such as v1.4.2.
                      Defaults to the latest release.
  --install-dir <path>
                      Install release payloads under this directory.
                      Defaults to ~/.local/share/yggtree.
  --bin-dir <path>    Write the yggtree launcher here.
                      Defaults to ~/.local/bin.
  -h, --help          Show this help and exit.

Examples:
  curl -fsSL https://yggtree.logbookfordevs.com/install.sh | sh
  curl -fsSL https://yggtree.logbookfordevs.com/install.sh | sh -s -- --version v1.4.2
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --version)
      if [ -z "${2:-}" ]; then
        echo "--version requires a tag" >&2
        exit 1
      fi
      VERSION="$2"
      shift 2
      ;;
    --version=*)
      VERSION="${1#--version=}"
      if [ -z "$VERSION" ]; then
        echo "--version requires a tag" >&2
        exit 1
      fi
      shift
      ;;
    --install-dir)
      if [ -z "${2:-}" ]; then
        echo "--install-dir requires a path" >&2
        exit 1
      fi
      INSTALL_DIR="$2"
      shift 2
      ;;
    --install-dir=*)
      INSTALL_DIR="${1#--install-dir=}"
      if [ -z "$INSTALL_DIR" ]; then
        echo "--install-dir requires a path" >&2
        exit 1
      fi
      shift
      ;;
    --bin-dir)
      if [ -z "${2:-}" ]; then
        echo "--bin-dir requires a path" >&2
        exit 1
      fi
      BIN_DIR="$2"
      shift 2
      ;;
    --bin-dir=*)
      BIN_DIR="${1#--bin-dir=}"
      if [ -z "$BIN_DIR" ]; then
        echo "--bin-dir requires a path" >&2
        exit 1
      fi
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [ "$VERSION" != "latest" ]; then
        echo "Unexpected positional argument: $1" >&2
        usage >&2
        exit 1
      fi
      VERSION="$1"
      shift
      ;;
  esac
done

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command curl
require_command tar
require_command node

case "$VERSION" in
  latest)
    echo "Fetching latest yggtree release..."
    tag="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"
    if [ -z "$tag" ]; then
      echo "Could not resolve the latest release tag" >&2
      exit 1
    fi
    ;;
  v*) tag="$VERSION" ;;
  *) tag="v${VERSION}" ;;
esac

artifact_name="yggtree-${tag}.tar.gz"
base_url="https://github.com/${REPO}/releases/download/${tag}"
artifact_url="${base_url}/${artifact_name}"
checksum_url="${artifact_url}.sha256"

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT INT TERM

echo "Downloading yggtree ${tag}..."
curl -fsSL -o "${tmp_dir}/${artifact_name}" "$artifact_url"
curl -fsSL -o "${tmp_dir}/${artifact_name}.sha256" "$checksum_url"

expected_checksum="$(awk '{print $1}' "${tmp_dir}/${artifact_name}.sha256")"
if command -v shasum >/dev/null 2>&1; then
  actual_checksum="$(shasum -a 256 "${tmp_dir}/${artifact_name}" | awk '{print $1}')"
else
  require_command sha256sum
  actual_checksum="$(sha256sum "${tmp_dir}/${artifact_name}" | awk '{print $1}')"
fi

if [ "$actual_checksum" != "$expected_checksum" ]; then
  echo "Checksum verification failed" >&2
  exit 1
fi

release_dir="${INSTALL_DIR}/releases/${tag}"
mkdir -p "$release_dir" "$BIN_DIR"
rm -rf "${release_dir:?}/"*
tar -xzf "${tmp_dir}/${artifact_name}" -C "$release_dir" --strip-components 1

ln -sfn "$release_dir" "${INSTALL_DIR}/current"

cat > "${BIN_DIR}/yggtree" <<EOF
#!/usr/bin/env sh
exec "${INSTALL_DIR}/current/bin/yggtree" "\$@"
EOF
chmod +x "${BIN_DIR}/yggtree"

echo "Installed yggtree ${tag} to ${release_dir}"
echo "Launcher written to ${BIN_DIR}/yggtree"

case ":$PATH:" in
  *":${BIN_DIR}:"*) ;;
  *)
    echo ""
    echo "${BIN_DIR} is not in your PATH. Add it with:"
    echo "  export PATH=\"${BIN_DIR}:\$PATH\""
    ;;
esac
