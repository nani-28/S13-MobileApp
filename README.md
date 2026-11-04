# Salón Lila

App para agendar un servicio de belleza y para que la profesional vea su calendario. Ana reserva. Lila ve las citas que le llegan.

La interfaz es React Native con Expo. La misma pantalla corre en el teléfono y en el navegador. Maestro prueba la versión web de extremo a extremo: un YAML por escenario Gherkin.

```text
Gherkin  →  maestro/*.yaml  →  Chromium
                ↓
           Expo web (:8081)
                ↓
           API Hono (:3001)
                ↓
           SQLite
```

## Versiones

| Pieza | Versión |
| --- | --- |
| Node.js | 22 o superior |
| Expo | 57 |
| React Native | 0.86 |
| Hono | 4 |
| Maestro | 2.11 (plataforma Web / Chromium) |
| Java | 17 |

## Preparación

```bash
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
export PATH="$JAVA_HOME/bin:$HOME/.maestro/bin:$PATH"

pnpm --filter api install
cd mobile && npm install
```

Dos personas de laboratorio:

| Persona | Rol | Id |
| --- | --- | --- |
| Ana | Clienta | `user-ana` |
| Lila | Profesional | `pro-lila` |

Al arrancar, o con reset, quedan tres servicios (corte, coloración, manicure), el horario 10:00 ocupado por María y el resto libre.

```bash
curl -X POST http://127.0.0.1:3001/api/test/reset
```

## Arrancar

Terminal 1:

```bash
pnpm --filter api start
```

Terminal 2:

```bash
cd mobile && CI=1 BROWSER=none npx expo start --web --port 8081
```

La app queda en http://127.0.0.1:8081. En un simulador, `npx expo start` y el `appId` `com.salonlila.app`.

## Probar

Con API y Expo web ya levantados:

```bash
pnpm maestro
```

Deben pasar los cinco flows de `maestro/`. El reporte queda en `artifacts/maestro-report/`.

Cómo está escrito cada escenario y qué selector toca: [`docs/QA-MAESTRO.md`](docs/QA-MAESTRO.md). El texto Gherkin: [`docs/reservas.feature`](docs/reservas.feature).

## Artefactos

- [`artifacts/escenarios.html`](artifacts/escenarios.html) — cada escenario con su screenshot.
- [`artifacts/tecnico.html`](artifacts/tecnico.html) — ficha técnica, lectura de unos minutos.
