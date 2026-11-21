#!/bin/sh
# 배포 직전 검사와 zip. 사용: scripts/package.sh <버전>
# 버전 형식, src/manifest.json의 version, 태그 v<버전>이 지금 커밋을 가리키는지 확인한 뒤
# src/를 저장소 루트의 boj-performance-v<버전>.zip으로 묶는다(최상위에 manifest.json, '.' 파일 제외).
set -eu

version="${1:-}"
fail() { echo "$1" >&2; exit 1; }

echo "$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' || fail "버전 형식이 아님: '$version'"

root="$(git rev-parse --show-toplevel)"
manifest_version="$(node -p "require('$root/src/manifest.json').version")"
[ "$manifest_version" = "$version" ] || fail "manifest version $manifest_version != $version"

tag_commit="$(git rev-list -n 1 "v$version" 2>/dev/null)" || fail "태그 없음: v$version"
head_commit="$(git rev-parse HEAD)"
[ "$tag_commit" = "$head_commit" ] || fail "v${version}은 ${tag_commit}을 가리키는데 지금 커밋은 ${head_commit}"

package="$root/boj-performance-v$version.zip"
rm -f "$package"
(cd "$root/src" && zip -qr "$package" . -x '.*')
echo "$package"
