# Cómo se escriben y cómo se corren las pruebas

Gherkin es la especificación. Cada escenario de [`reservas.feature`](reservas.feature) tiene un solo YAML en `maestro/`. Maestro ejecuta ese YAML contra la misma app Expo publicada en el navegador.

## Qué necesitas

1. Java 17 (`/usr/libexec/java_home -v 17`).
2. CLI de Maestro en `~/.maestro/bin`.
3. API en `http://127.0.0.1:3001`.
4. Expo web en `http://127.0.0.1:8081`.

```bash
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
export PATH="$JAVA_HOME/bin:$HOME/.maestro/bin:$PATH"

pnpm --filter api start
cd mobile && CI=1 BROWSER=none npx expo start --web --port 8081
```

En otra terminal, desde la raíz del proyecto:

```bash
pnpm maestro
```

Eso corre:

```bash
maestro test maestro/ --headless --screen-size 390x844 \
  --format HTML \
  --test-output-dir artifacts/maestro-report \
  --flatten-debug-output
```

Un solo escenario:

```bash
maestro test maestro/02-reserva-exitosa.yaml --headless --screen-size 390x844
```

Maestro abre Chromium, entra a la URL del flow y recorre la UI. No hace falta simulador: `maestro list-devices` muestra la plataforma `Web / chromium`.

En un teléfono o simulador el mismo flujo cambia la primera línea a `appId: com.salonlila.app` y se lanza el development build. Los `id` no cambian.

## Datos limpios

Cada flow toca `reset-data` y espera el texto `Datos listos`. Ese botón llama `POST /api/test/reset` y deja:

- Servicios: Corte, Coloración, Manicure.
- 10:00 ocupado (cita semilla de María, corte).
- 11:00, 14:00 y 16:00 libres.
- Clienta Ana y profesional Lila.

A mano:

```bash
curl -X POST http://127.0.0.1:3001/api/test/reset
```

## Selectores

Maestro usa `tapOn: { id }` y `assertVisible`. En React Native Web el `testID` llega como `data-testid`, y el driver web de Maestro lo trata como id. No hay esperas fijas.

| testID | Pantalla | Uso |
| --- | --- | --- |
| `reset-data` | Rol | Reinicia SQLite |
| `role-user` | Rol | Entra como Ana |
| `role-professional` | Rol | Entra como Lila |
| `service-corte` | Catálogo | Elige corte |
| `service-color` | Catálogo | Elige coloración |
| `service-manicure` | Catálogo | Elige manicure |
| `continue-services` | Catálogo | Pasa a horarios |
| `slot-1000` | Horarios | 10:00, ocupado al reset |
| `slot-1100` | Horarios | 11:00 |
| `slot-1400` | Horarios | 14:00 |
| `slot-1600` | Horarios | 16:00 |
| `confirm-booking` | Horarios | Confirma la cita |
| `error` | Varias | Texto de error |
| `success` | Varias | Confirmación |
| `go-appointments` | Catálogo / horarios | Mis citas |
| `change-role` | Varias | Vuelve a elegir rol |
| `appointments-list` | Mis citas | Lista de Ana |
| `agenda-list` | Agenda | Calendario de Lila |

## Escenario → YAML

| Escenario | Flow | Qué queda en pantalla |
| --- | --- | --- |
| Catálogo de servicios | `maestro/01-catalogo.yaml` | Corte, coloración y manicure |
| Reserva exitosa | `maestro/02-reserva-exitosa.yaml` | Mis citas: Corte a las 11:00 |
| Horario ya ocupado | `maestro/03-horario-ocupado.yaml` | Error de horario ocupado |
| Validación sin servicio | `maestro/04-validacion.yaml` | Error “Elige un servicio” |
| Agenda de la profesional | `maestro/05-agenda-profesional.yaml` | Ana · Manicure · 14:00 |

`pnpm maestro` corre `scripts/run-maestro.sh`. Ese script deja el reporte en `artifacts/maestro-report.html` y copia cada PNG a `artifacts/screenshots/`.
