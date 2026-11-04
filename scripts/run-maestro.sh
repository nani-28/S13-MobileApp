#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

if [ -z "${JAVA_HOME:-}" ]; then
  JAVA_HOME="$(/usr/libexec/java_home -v 17)"
  export JAVA_HOME
fi
export PATH="$JAVA_HOME/bin:${HOME}/.maestro/bin:${PATH}"

out="${PWD}/artifacts/maestro-run"
rm -rf "$out"
mkdir -p "$out" "${PWD}/artifacts/screenshots"

maestro test maestro/ \
  --headless \
  --screen-size 390x844 \
  --format HTML \
  --output "${PWD}/artifacts/maestro-report.html" \
  --test-output-dir "$out" \
  --flatten-debug-output

find "$out" -name '*.png' -exec cp {} "${PWD}/artifacts/screenshots/" \;
for name in 01-catalogo 02-reserva-exitosa 03-horario-ocupado 04-validacion 05-agenda-profesional; do
  src="${HOME}/${name}/takeScreenshot/${name}.png"
  if [ -f "$src" ]; then
    cp "$src" "${PWD}/artifacts/screenshots/${name}.png"
    rm -rf "${HOME:?}/${name}"
  fi
done
echo "Screenshots en artifacts/screenshots/"
echo "Reporte en artifacts/maestro-report.html"
