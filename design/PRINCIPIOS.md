# Principios adaptados de Apple para Veritas

## Sobre las fuentes

Esta sesión no puede abrir apple.com ni ninguna página externa: la política de
red bloquea el navegador, el fetch de documentos, el Internet Archive y los
artículos técnicos. Se probaron las cinco vías. Lo que sigue se apoya en dos
cosas, y conviene leerlo con esa etiqueta:

1. Los resúmenes técnicos que sí devolvió la búsqueda (CSS-Tricks, GSAP Vault,
   el análisis de la página de AirPods Pro): canvas alimentado por una
   secuencia de 100–150 fotogramas pre-renderizados y precargados, índice de
   fotograma ligado al progreso del scroll, contenedor fijado, `scrub` suave,
   sin decodificador de vídeo en el bucle; y los tres primitivos —pin, scrub,
   parallax— como base de casi toda experiencia de scroll.
2. Conocimiento previo y documentado de las páginas de producto de Apple.

## Qué hace Apple, técnicamente

| Técnica | Cómo lo hacen | Para qué |
| --- | --- | --- |
| Capítulo fijado + secuencia | Sección de 300–500vh, contenedor `sticky`, canvas que dibuja el fotograma `floor(progreso × N)` | Que el producto gire, se abra o se transforme al ritmo de la mano |
| Titular fijado, contenido que cambia | El texto queda clavado; debajo van pasando tres o cuatro estados | Explicar varias ideas sin que el lector pierda el hilo |
| Un solo pensamiento por pantalla | Titular de menos de seis palabras, dos líneas de cuerpo, una cifra enorme | Ritmo. La densidad va al final, en la tabla de especificaciones |
| Profundidad por capas | Luces radiales enormes y muy tenues, desenfoques, sombras del producto, parallax a dos o tres velocidades | Sensación de espacio sin degradados agresivos |
| El fondo cambia de capítulo | Negro → grafito → negro, animado con el scroll | Marcar transiciones sin cortes |
| Tipografía como escenografía | 80–96px, tracking −0.02 a −0.04em, peso 600; cuerpo 17–21px; las cifras como display | La letra es la imagen cuando no hay producto |
| Microinteracciones contenidas | Hover por color y no por escala; subrayados que se dibujan; botones "+" que se abren en texto | Que nada compita con el capítulo |
| Encuadres comparativos | "hasta 24 horas", "frente a la generación anterior" | Convertir la cifra en argumento |

## Qué NO copiamos

- La secuencia de fotogramas. No tenemos producto físico ni renders, y una
  secuencia sin assets buenos se nota más que su ausencia.
- El blanco luminoso de sus páginas de producto. La dirección de Veritas es
  oscura y ya está fijada.
- SF Pro y la neutralidad. Veritas tiene voz editorial: la serif itálica como
  remate de cada titular es el gesto que Apple nunca haría y por eso es nuestro.
- La certeza. Apple vende seguridad; Veritas vende duda calibrada. El aviso
  probabilístico es marca, no letra pequeña.

## Cómo se traduce a Veritas

**El producto es el análisis.** Donde Apple gira un iPhone, Veritas lee un
documento. Todo el movimiento nace de esa metáfora: una página que se recorre,
se mide y se tiñe según el veredicto.

### Momentos memorables (en orden de scroll)

1. **Héroe que se aleja.** Titular enorme con remate serif. Al bajar, se
   desvanece, encoge un 7% y se desenfoca ligado al scroll. Detrás, muy tenue,
   la silueta de un documento con sus líneas.

2. **El escáner** — nuestro capítulo fijado. Sustituye a la secuencia de
   fotogramas por algo que sólo Veritas puede tener: un documento dibujado
   proceduralmente (SVG, sin imágenes) cuyos párrafos van siendo recorridos por
   un haz de luz al ritmo del scroll. Cada párrafo, al pasar el haz, recibe su
   color de veredicto y su cifra; a la derecha, el panel de métricas se va
   llenando por fases. Tres estados —humano, mixto, IA— en un solo documento.
   ~320vh, `pin` + `scrub`.

3. **Tres lecturas** — titular fijado a la izquierda; a la derecha van pasando
   estilometría, similitud y reescritura, cada una con su acento (azure, gold,
   human). El fondo del capítulo se tiñe sutilmente con cada acento.

4. **Antes y después** — el momento del producto de reescritura. Un párrafo con
   voz de IA (87%) se transforma en su versión reescrita (9%) mientras la cifra
   cae en pantalla. Crossfade de texto y contador, sin imágenes.

5. **Una estimación, no un veredicto** — banda de honestidad entre filetes de
   oro. Se revela sola, sin adornos: es la frase más importante de la página.

6. **Precios** con revelado contenido; el plan vitalicio con un halo que
   respira.

7. **Cierre** con el titular más grande de la página.

### Sistema

- Fondo de capítulo animado con el scroll: `#06070a` → `#0d0f13` → `#06070a`.
- Parallax de tres velocidades en los focos de luz, nunca en el contenido.
- Revelado escalonado por lotes (ScrollTrigger.batch), desde estado visible.
- Contadores en JetBrains Mono con `tabular-nums` para que no bailen.
- Una sola curva: `cubic-bezier(.16, 1, .3, 1)` / `power4.out` en GSAP.
- Todo bajo `prefers-reduced-motion`: sin pin, sin parallax, cifras finales.
- Por debajo de 760px el pin se desactiva; el escáner se muestra apilado.
- Regla de cápsula: sólo lo que se pulsa. Estados por punto de color + texto.
- Iconografía: Lucide (trazo 1.5), nunca emoji.

### Identidad propia, resumida

Apple es producto y certeza, blanco y sans. Veritas es documento y duda
calibrada, oscuro y serif-itálica. Compartimos el oficio —pin, ritmo,
profundidad, restricción— y nada más.
