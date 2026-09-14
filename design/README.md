# Canvas de diseño — rediseño del frontend

Propuesta visual del nuevo frontend de Veritas AI. Dirección: dark premium
cinematográfico. Sin emojis; toda la iconografía es SVG de trazo sobre rejilla
de 24px.

## Archivos

| Archivo                 | Qué es                                   |
| ----------------------- | ---------------------------------------- |
| `Main.dc.html`          | Landing completa, escritorio (1440px)    |
| `Login.dc.html`         | Inicio de sesión (1440×900)              |
| `Register.dc.html`      | Crear cuenta (1440×900)                  |
| `LandingMobile.dc.html` | Landing a 390px, verificación responsive |
| `canvas.json`           | Posición de cada artboard y notas        |

El archivo ensamblado (`rediseno-veritas-ai.html`, ~2.5 MB) no se versiona:
se regenera a partir de los anteriores.

## Sistema de diseño

Paleta calculada en oklch y verificada dentro del gamut sRGB. Los dos acentos
de marca comparten luminosidad y croma, y solo varía el tono; los tres colores
de veredicto hacen lo mismo entre ellos.

Fondos (tono 265, croma casi nulo)
: `--void #06070a` · `--base #0d0f13` · `--surface #17191f` · `--surface-2 #22252b`

Texto
: alto `#f4f5f8` · medio `#afb2b8` · bajo `#898c93`

Acentos de marca — L 0.76 / C 0.140
: azure `#40befd` · gold `#dda733`

Veredicto — L 0.74 / C 0.149
: humano `#4cc680` · mixto `#db9e16` · IA `#fb827a`

Tipografía
: Display `Instrument Serif` itálica (segunda línea de cada titular) ·
  Interfaz `Manrope` 300/500/600/800 · Datos `JetBrains Mono` con `tabular-nums`.
  Deliberadamente **no** Inter.

Movimiento
: Curva única `cubic-bezier(.16, 1, .3, 1)`. Entrada escalonada con opacidad +
  `translateY` + desenfoque, haz de escaneo en bucle sobre el informe, barras de
  métrica creciendo desde la izquierda, resplandor que respira en el plan de pago.
  Todo bajo `prefers-reduced-motion`.

## Pendiente de decisión

- Las cifras del panel izquierdo del login son marcadores `[TU CIFRA]`.
- Razón social y ciudad del pie, igual.
- Los datos del informe son de muestra, elegidos para enseñar los tres estados.
- Falta decidir si se mantiene el tema claro; ahora mismo esto es sólo oscuro.

## Regenerar el canvas

Requiere la skill `design` (el script y la plantilla viven en su directorio base):

```bash
cd design
node "<base>/seed-canvas.mjs" \
  --template "<base>/payload.template.html" \
  --out rediseno-veritas-ai.html \
  --title "Rediseño Veritas AI" \
  --artboard Main.dc.html --artboard Login.dc.html \
  --artboard Register.dc.html --artboard LandingMobile.dc.html \
  --canvas canvas.json
```
