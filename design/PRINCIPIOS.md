# Principios adaptados de Apple para Veritas

## Fuentes de este análisis

Esta vez sí se pudo entrar en apple.com. El análisis se apoya en tres cosas,
todas hechas en esta sesión y verificables:

1. **HTML y CSS reales** de cuatro páginas de producto (MacBook Pro, AirPods
   Pro, iPhone 17 Pro, Apple Watch Ultra 3): `overview.built.css` (~1 MB por
   página) y `main.built.js`, descargados y grepeados.
2. **Chromium** cargando MacBook Pro a 1440×900: alturas de sección, colores
   de fondo computados, escala tipográfica computada y capturas a distintos
   puntos del scroll.
3. Resúmenes de estructura de las páginas de iPhone y MacBook Pro.

Lo que no se pudo medir: el motor de scroll de Apple no llegó a activarse en
el navegador remoto (la página quedó en `html.no-js`), así que las mecánicas
de pin y de scrub se leen del CSS y del JS, no de una grabación.

## Qué hace Apple, medido

### Estructura: capítulos, no secciones

Cada `<section>` lleva `data-anim-scroll-group="Welcome | Highlights |
Performance | Battery | …"` y un `data-theme-changer`. La página es una
secuencia de capítulos con un solo pensamiento cada uno. Alturas medidas en
MacBook Pro (en pantallas de 900 px): héroe 1.0 · highlights 3.6 · visor 0.8 ·
rendimiento 5.1 · batería 2.1 · IA 2.7 · macOS 4.1 · conectividad 1.3 ·
compra 4.4 · comparativa 1.8 · entorno 1.0 · valores 1.3. Total: 49 pantallas.

El fondo cambia por capítulo y el cambio es un paso, no un degradado:
`#000` → `#1d1d1f` (highlights y visor) → `#000` → `#f5f5f7` (a partir de la
sección de compra). El tema de la página se invierte a mitad de scroll.

### Mecánica de scroll

- Un motor propio calcula el progreso 0–1 de cada grupo a partir de los
  límites del elemento y lo escribe en una **variable CSS** (`--progress`) o
  en `video.currentTime`. El código: `this.el.style.setProperty("--progress",
  e)` y `this.videoEl.currentTime = this.floorDecimal(this.duration * e)`.
  Las secuencias ya no son imágenes: son vídeos mudos (`muted playsinline`,
  sin autoplay) que se scrubean. 13 vídeos, 0 canvas en MacBook Pro.
- **Pin por sticky**, no por JavaScript: `html.enhanced .sticky-container
  {position:sticky; top:var(--r-localnav-height); height:100vh;
  overflow:hidden}` dentro de una sección de varias pantallas.
- **Estado previo oculto** y revelado por lotes: `.pre-animation
  {visibility:hidden; opacity:0}` y un componente `StaggeredFadeIn` en 14 de
  las secciones. La transición del revelado: `transform .414s
  cubic-bezier(.66,0,.1,1) .344s, opacity .344s cubic-bezier(.66,0,.1,1)`.
- Curvas encontradas en el CSS: `cubic-bezier(.66,0,.1,1)` (entrada/salida
  fuerte, la más usada), `cubic-bezier(0,0,.5,1)` (salida suave para UI
  pequeña), `cubic-bezier(.3,2,.5,1)` y `(.34,2.16,.64,1)` (muelles, sólo en
  iconos). Duraciones: 0.2 s, 0.3 s, 0.344 s, 0.414 s, 0.5 s.

### Tipografía (computada)

Todo titular pesa 600. La escala real de MacBook Pro:

| Uso | Tamaño / interlínea | Tracking |
| --- | --- | --- |
| Display de capítulo | 80 / 84 | −1.2 px (−0.015 em) |
| Titular grande | 64 / 68 | −0.58 px |
| Titular | 56 / 60 | −0.28 px |
| Titular de sección | 48 / 52 | −0.14 px |
| Subtitular | 28 / 32 | **+0.20 px** |
| Destacado | 21 / 25 | +0.23 px |
| Cuerpo | 17 / 25 · 19 / 27 | −0.37 px · +0.23 px |

El dato importante: el tracking **cambia de signo con el tamaño**. Negativo
por encima de 40 px, positivo por debajo de 28 px. Y el cuerpo usa el patrón
de **arranque en negrita**: "AI apps on Mac. Born to run." en 600 seguido del
resto en 400, mismo tamaño.

Un solo gesto de color en la letra: el titular de capítulo con degradado
blanco → azul pálido ("Fast runs in the family."). Nunca en cuerpo.

### Composición

- Contenedor de 980–1108 px con márgenes de 90 px a 1440.
- Tarjetas de 28 px de radio, fondo `#1d1d1f`, padding 36 px, texto arriba a
  la izquierda y medio debajo. Rejilla de dos columnas con 20 px de canal.
- Cifras enormes con marco comparativo: "Up to 8x faster AI performance than
  the M1 family". El número solo no vale; el "hasta" y el "frente a" sí.
- Nav local de 52 px, `backdrop-filter`, botón cápsula "Buy".
- Galerías horizontales con paleta y puntos (`scroll-gallery-paddlenav`,
  `dotnav`), botones "+" que se abren en texto, modales con scrim
  `rgba(0,0,0,.48)` + `blur(20px)`.

## Qué tomamos y qué no

**Tomamos** el oficio: capítulos con un pensamiento, el progreso como
variable CSS (más barato y compatible con el tema que animar colores desde
JS), pin por sticky/scrub, revelado por lotes desde estado previo, el tracking
que cambia de signo, el arranque en negrita, la cifra con marco comparativo,
la nav translúcida, y la disciplina de una sola curva fuerte de entrada.

**No tomamos** el blanco, SF Pro, la neutralidad ni los vídeos. Veritas no
tiene producto físico: el producto es el análisis, y todo movimiento nace de
un documento que se lee, se mide y se tiñe según el veredicto. La serif
itálica sigue siendo el remate de marca, y el aviso probabilístico es la frase
más importante de la página, no letra pequeña.

## Cómo se traduce a Veritas

### El sistema

- **Progreso como variable.** Cada capítulo con scroll escribe `--p` (0–1)
  en su raíz; el CSS deriva de ahí transformaciones, opacidades y umbrales
  (`clamp(0, (var(--p) - var(--at)) * k, 1)`). El JS sólo toca texto (cifras)
  y nunca colores: los colores siempre vienen de los tokens del tema, así el
  cambio claro/oscuro es instantáneo y completo.
- **Fondo por capítulo** con `data-chapter` en la raíz y transición CSS.
- **Revelado** por IntersectionObserver desde un estado previo oculto sólo
  cuando hay JS (`html.js`), con escalonado por `--i`. Sin JS, todo visible.
- **Luces** como degradados radiales, no `filter: blur()`; nada infinito sobre
  capas grandes. Sólo `transform` y `opacity` en movimiento continuo.
- **Curvas**: `cubic-bezier(.16,1,.3,1)` para entradas; `cubic-bezier(.66,0,.1,1)`
  para cambios de estado en pantalla; `cubic-bezier(.32,.72,0,1)` para paneles.
- **Reduced motion**: sin pin, sin parallax, `--p: 1`, revelado inmediato.
- **Por debajo de 760 px**: sin pin; los capítulos se apilan en estado final.

### Los momentos, en orden de scroll

1. **Campo de lectura.** El héroe es un instrumento: un lienzo dibuja una
   página en perspectiva cuyas líneas son recorridas por un haz. Las líneas
   se tiñen del color del veredicto a su paso. Responde al puntero (parallax
   de tres capas) y se aleja al bajar.
2. **Cifras que importan.** Cinco al día, dos dólares una vez, cero
   documentos almacenados. Cuenta al entrar.
3. **El escáner.** Capítulo fijado. Una hoja de papel real (es papel en los
   dos temas) se endereza desde la perspectiva, un haz la recorre y cada
   párrafo recibe su color y su cifra; a la derecha, el informe se llena por
   fases. La atmósfera vira a rojo cuando el haz cruza los párrafos de IA.
4. **Una estimación, no un veredicto.** La frase más grande de la página,
   en serif itálica, palabra a palabra, entre filetes de oro.
5. **Tres lecturas.** Titular fijado a la izquierda; a la derecha pasan
   estilometría, similitud y reescritura, cada una con su instrumento
   dibujado en SVG (forma de onda de cadencia, columnas cotejadas, líneas
   que se reescriben) y su acento tiñe la luz.
6. **Misma idea, otra voz.** Capítulo fijado: el párrafo cambia palabra a
   palabra y la cifra cae de 87 a 9 en un contador de rodillo.
7. **Precios**, con el plan vitalicio bajo un filete de luz que gira.
8. **Cierre** con el titular más grande y un botón magnético.

### Identidad propia, resumida

Apple es producto y certeza, blanco y sans. Veritas es documento y duda
calibrada, oscuro y serif-itálica. Compartimos el oficio (capítulos, ritmo,
profundidad, contención) y nada más.
