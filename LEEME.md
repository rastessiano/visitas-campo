# App de visitas de campo — Estância São José

App web para el celular: mapa de potreros con GPS, ficha de cada potrero (rotación y plan
mensual), carga de visitas con fotos. Funciona sin señal y sincroniza cuando hay internet
(Starlink de la camioneta o el casco).

El proyecto (contexto, decisiones, fuentes) está en
`Claude\Proyectos\Pastos\Estancia San José Aceguá`.

## Piezas

| Archivo | Qué es |
|---|---|
| `index.html`, `estilos.css`, `app.js` | La app |
| `reglas.js` | Sugerencias de manejo por cultivo y mes. **Borrador a validar.** Se edita a mano |
| `sw.js`, `manifest.webmanifest`, `icono-*.png` | Para instalarla y que abra sin señal |
| `vendor/leaflet/` | Librería del mapa (1.9.4), copiada para no depender de internet |
| `servidor/Codigo.gs` | El servidor: Apps Script en el Drive de rastessiano@pastos.com.uy |
| `datos/campo-sao-jose.json` | Potreros, rotación, plan mensual e imagen. **No se publica**: va al Drive |

Los datos se regeneran con
`python -I "Proyectos\Pastos\Estancia San José Aceguá\2 Borradores\armar_datos_campo.py" <salida.json>`.

## Cómo viajan los datos

1. Cada visita se guarda en el teléfono (IndexedDB), con las fotos achicadas a 1600 px.
2. Con conexión, la app manda las visitas pendientes al Apps Script, que guarda las fotos
   en la carpeta del Drive y anota la visita en la planilla. Si una visita llega dos veces,
   no se duplica.
3. Después baja todas las visitas para que cada uno vea las de los demás.
4. La foto grande se borra del teléfono una vez que está en el Drive; queda la miniatura.

## Puesta en marcha (una sola vez)

1. Subir `datos/campo-sao-jose.json` al Drive de rastessiano@pastos.com.uy.
2. En script.google.com → Proyecto nuevo → pegar `servidor/Codigo.gs`.
3. Ejecutar la función `configurar` (▶) y aceptar permisos. En el registro aparece la
   **clave** y el enlace a la planilla.
4. Implementar → Nueva implementación → Aplicación web. Ejecutar como: **Yo**. Quién tiene
   acceso: **Cualquier usuario**. Copiar la URL que termina en `/exec`.
5. En cada celular: abrir la app, Ajustes → nombre, idioma, URL y clave → Guardar.
   Después «Agregar a pantalla de inicio».

Si se cambia `Codigo.gs`, hay que hacer Implementar → Gestionar implementaciones → editar →
Versión nueva, para que la URL siga siendo la misma.

## Probar en la compu

`python -m http.server 8765` dentro de esta carpeta y abrir http://127.0.0.1:8765.
En la compu toma los datos de `datos/` directamente.
