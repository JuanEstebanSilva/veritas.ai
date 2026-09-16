# Canvas de diseño — rediseño del frontend

Propuesta visual del nuevo frontend de Plagelio. Dirección: dark premium
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

El archivo ensamblado (`rediseno-plagelio.html`, ~2.5 MB) no se versiona:
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

## Regla: la cápsula es un control

Un rectángulo redondeado con texto dentro significa **"esto se pulsa"**. Nada
más lleva cápsula.

Es la única regla dura del sistema, y existe porque el rótulo en cápsula
—icono + versalitas dentro de una píldora con borde y tinte— es la firma
visual de las landings generadas por IA. Cuando un rótulo decorativo se
disfraza de control, además de verse genérico, miente sobre lo que es.

Lo que sí lleva cápsula: botones, campos de formulario y filas pulsables.
Lo que no, y cómo se resuelve en su lugar:

| Antes                     | Ahora                                             |
| ------------------------- | ------------------------------------------------- |
| Antetítulo en píldora     | Filetes a los lados del texto en versalitas        |
| Estado "verificado"       | Punto de color con halo + versalitas               |
| Calificación en insignia  | Cifra grande en serif itálica junto a un filete    |
| Etiquetas de indicadores  | Una línea con filete de color y separadores medios |
| Caja de alerta tintada    | Filete arriba y abajo, color solo en el titular    |
| "AI" en cajita junto a VERITAS | Serif itálica en azure, parte del logotipo    |

Al pasarlo a React esto se codifica igual: `rounded-full` queda reservado a
`<button>`, `<input>` y filas interactivas.

## Cómo está construido en el frontend

El sistema del canvas vive en `frontend/src/index.css` (tokens en `rgb` por
canal, papel y tinta constantes en los dos temas, luces como degradados
radiales sin `filter`) y en `frontend/tailwind.config.js` (escala de display
fluida cuyo tracking cambia de signo con el tamaño). Las fuentes están
autoalojadas en `frontend/public/fonts`.

El movimiento está en `frontend/src/motion`:

| Primitivo | Qué hace |
| --- | --- |
| `useScrollGroup` | Escribe el progreso 0–1 del capítulo en la variable CSS `--p` (pin por ScrollTrigger); el CSS deriva de ahí umbrales y cruces con `clamp()`. El JS nunca escribe colores, así el tema cambia entero. |
| `useReveal` | Revelado por IntersectionObserver con escalonado por `--i`; oculto sólo con `html.js`. Sólo en la landing. |
| `usePointerParallax` / `useMagnetic` | Parallax de puntero y botón magnético, sólo con puntero fino. |
| `CountUp` / `Odometer` | Cifras que cuentan y rodillo de dígitos, en mono tabular. |

La landing (`frontend/src/pages/LandingPage.tsx` + `landing.css`) recorre sus
capítulos en este orden: héroe con el campo de lectura, banda de cifras,
escáner fijado, la frase de honestidad, tres lecturas, reescritura, precios y
cierre. Por debajo de 760 px o con movimiento reducido no hay pin: `--p` se
fija en 1 y los capítulos se apilan en su estado final.

La prueba visual y funcional se ejecuta con `node frontend/scripts/qa.mjs`
(Playwright, ambos temas, ambos anchos, flujos y movimiento reducido).

## Pendiente de decisión

- Las cifras del panel izquierdo del login son marcadores `[TU CIFRA]`.
- Razón social y ciudad del pie, igual.
- Los datos del informe son de muestra, elegidos para enseñar los tres estados.
- El tema claro se mantiene: es el inverso cuidado del oscuro y todo el
  movimiento es compatible con él.

## Regenerar el canvas

Requiere la skill `design` (el script y la plantilla viven en su directorio base):

```bash
cd design
node "<base>/seed-canvas.mjs" \
  --template "<base>/payload.template.html" \
  --out rediseno-plagelio.html \
  --title "Rediseño Plagelio" \
  --artboard Main.dc.html --artboard Login.dc.html \
  --artboard Register.dc.html --artboard LandingMobile.dc.html \
  --canvas canvas.json
```
