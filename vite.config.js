import { defineConfig } from 'vite'

export default defineConfig({
  /* rutas relativas en el build.

     por defecto Vite escribe /assets/..., con barra inicial. eso sirve
     cuando la app se sirve desde la raiz de un dominio, pero dentro de
     un WebView de Android la pagina se carga con file://, y esa barra
     apunta a la raiz del sistema de archivos del telefono en vez de a
     la carpeta de la app: la pantalla sale en blanco.

     con './' los assets se buscan junto al index.html, que funciona
     tanto en el WebView como servido por http. */
  base: './'
})
