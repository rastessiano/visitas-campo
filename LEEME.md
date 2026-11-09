# App de visitas de campo — Estância São José

App web para el celular: mapa de potreros con GPS, ficha de cada potrero (rotación y plan
mensual), carga de visitas con fotos. Funciona sin señal y sincroniza cuando hay internet
(Starlink de la camioneta o el casco).

El proyecto (contexto, decisiones, fuentes) está en
`Claude\Proyectos\Pastos\Estancia San José Aceguá`.

## Piezas

| Archivo | Qué es |
|---|---|
| `index.html`, `estilos.css`, `app.js` | La app: mapa, potreros, rotación, visitas, ajustes |
| `gastos.js` | Gastos y tareas con su costo (USD y R$), productos, costos por potrero/zafra, CSV |
| `asistente.js` | Asistente de consultas (pregunta al servidor, que consulta a Claude) |
| `inicio.js` | Arranca la app después de cargar los módulos |
| `reglas.js` | Sugerencias de manejo por cultivo y mes. **Borrador; lo valida Roberto.** Se edita a mano |
| `sw.js`, `manifest.webmanifest`, `icono-*.png` | Para instalarla y que abra sin señal |
| `vendor/leaflet/` | Librería del mapa (1.9.4), copiada para no depender de internet |
| `servidor/Codigo.gs` | El servidor: Apps Script en el Drive de rastessiano@gmail.com |
| `datos/campo-sao-jose.json` | Potreros, rotación, plan mensual e imagen. **No se publica**: va al Drive con `subir_datos.py` |

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

1. En script.google.com (cuenta rastessiano@gmail.com) → Proyecto nuevo → pegar
   `servidor/Codigo.gs`.
2. Ejecutar la función `configurar` (▶) y aceptar permisos. En el registro aparece la
   **clave** y el enlace a la planilla.
3. Implementar → Nueva implementación → Aplicación web. Ejecutar como: **Yo**. Quién tiene
   acceso: **Cualquier usuario**. Copiar la URL que termina en `/exec`.
4. Subir los datos del campo desde la compu (también sirve para actualizarlos):
   `python -I subir_datos.py <URL> <CLAVE>` dentro de esta carpeta.
5. En cada celular: abrir la app, Ajustes → nombre, idioma, URL y clave → Guardar.
   Después «Agregar a pantalla de inicio».

Si se cambia `Codigo.gs`, hay que hacer Implementar → Gestionar implementaciones → editar →
Versión nueva, para que la URL siga siendo la misma.

La app publicada: https://rastessiano.github.io/visitas-campo/ (repo público
`rastessiano/visitas-campo`, solo código; se publica copiando estos archivos menos `datos/`).

## Gastos y contabilidad

- Cada gasto o tarea: fecha, actividad, potreros (o general), hectáreas, zafra y cultivo (centro de
  costo), producto o labor, dosis/ha, cantidad, precio, moneda (USD o R$), tipo de cambio, total en
  las dos monedas, quién pagó (João Antonio, Pastos o compartido), proveedor, cuenta contable y foto
  del comprobante. Si un gasto abarca varios potreros, el costo se reparte por hectáreas.
- Catálogo en la hoja «Productos» de la planilla (precio de referencia y cuenta contable por producto).
- Para otro sistema contable: `GET <URL>?accion=gastos&clave=<CLAVE>&desde=AAAA-MM-DD` devuelve los
  gastos en JSON, cada uno con id fijo; la columna `exportado` de la hoja queda para marcar lo que ya
  pasó a contabilidad. En la app, Registros → Costos → «Exportar CSV».

## Asistente

Usa Claude (modelo `claude-opus-5-5`, esfuerzo bajo, caché del contexto del campo) desde el Apps
Script. La clave de Claude va en Configuración del proyecto → Propiedades del script →
`ANTHROPIC_API_KEY`; nunca en la app. Arma el contexto con la rotación, las visitas y los gastos.

## Probar en la compu

`python -m http.server 8765` dentro de esta carpeta y abrir http://127.0.0.1:8765.
En la compu toma los datos de `datos/` directamente.
