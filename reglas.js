/*
 * Sugerencias de manejo por tipo de cultivo y mes.
 * SON UN BORRADOR QUE VALIDA ROBERTO: dosis y momentos generales para el
 * sur de RS, no reemplazan el análisis de suelo ni el criterio del técnico en el potrero.
 * Formato: TIPO -> lista de { meses: [..], es: '...', pt: '...' }.
 * Los tipos salen de clasificarUso() en app.js.
 */
var REGLAS = {
  semente_azevem: [
    { meses: [3, 4], es: 'Siembra: P y K de base según análisis de suelo.', pt: 'Semeadura: P e K de base conforme análise de solo.' },
    { meses: [5, 6, 7], es: 'Macollaje: N en cobertura (40–50 kg N/ha) y control de hoja ancha.', pt: 'Perfilhamento: N em cobertura (40–50 kg N/ha) e controle de folhas largas.' },
    { meses: [6, 7, 8], es: 'Pastoreos con remanente de 7–10 cm; no pastorear con suelo encharcado.', pt: 'Pastejos com resíduo de 7–10 cm; não pastejar com solo encharcado.' },
    { meses: [8, 9], es: 'Cierre del pastoreo para semilla y N al cierre (40–60 kg N/ha).', pt: 'Vedação do pastejo para semente e N na vedação (40–60 kg N/ha).' },
    { meses: [9, 10], es: 'Encañazón: evaluar regulador de crecimiento contra el vuelco; monitorear pulgón, lagarta y roya.', pt: 'Alongamento: avaliar regulador de crescimento contra acamamento; monitorar pulgão, lagarta e ferrugem.' },
    { meses: [11, 12], es: 'Cosecha: seguir la madurez para no perder por desgrane (hilerar o cosechar directo).', pt: 'Colheita: acompanhar a maturação para não perder por degrana (enleirar ou colher direto).' },
    { meses: [10, 11], es: 'Antes de cosechar, recorrer y marcar manchones de malezas que contaminen la semilla.', pt: 'Antes da colheita, percorrer e marcar reboleiras de invasoras que contaminem a semente.' }
  ],
  semente_festuca: [
    { meses: [3, 4, 5], es: 'Otoño: N (30–40 kg N/ha) y limpieza de gramíneas invasoras.', pt: 'Outono: N (30–40 kg N/ha) e limpeza de gramíneas invasoras.' },
    { meses: [7, 8], es: 'Cierre para semilla y N al cierre (60–80 kg N/ha).', pt: 'Vedação para semente e N na vedação (60–80 kg N/ha).' },
    { meses: [9, 10], es: 'Monitorear roya y pulgón; evaluar regulador de crecimiento.', pt: 'Monitorar ferrugem e pulgão; avaliar regulador de crescimento.' },
    { meses: [11, 12], es: 'Cosecha temprana: la festuca desgrana fácil, seguir humedad de la semilla.', pt: 'Colheita no ponto: a festuca degrana fácil, acompanhar umidade da semente.' }
  ],
  semente_leguminosa: [
    { meses: [3, 4, 5], es: 'P y K de mantenimiento según análisis; inocular si es siembra.', pt: 'P e K de manutenção conforme análise; inocular se for semeadura.' },
    { meses: [8, 9], es: 'Cierre para semilla. Hoja ancha: solo herbicidas selectivos para leguminosas (no 2,4-D).', pt: 'Vedação para semente. Folhas largas: só herbicidas seletivos para leguminosas (não 2,4-D).' },
    { meses: [10, 11], es: 'Floración: colmenas para polinización; monitorear lagartas y trips.', pt: 'Floração: colmeias para polinização; monitorar lagartas e tripes.' },
    { meses: [11, 12, 1], es: 'Cosecha según especie (Rincón y lotus antes, trébol blanco en enero); cuidar el desgrane.', pt: 'Colheita conforme a espécie (Rincón e lotus antes, trevo branco em janeiro); cuidar a degrana.' }
  ],
  pastagem: [
    { meses: [5, 6, 7, 8, 9, 10], es: 'Azevém/verdeo: entrar con 20–25 cm y sacar con 7–10 cm.', pt: 'Azevém/verdeio: entrar com 20–25 cm e retirar com 7–10 cm.' },
    { meses: [5, 6, 7, 8, 9, 10], es: 'Festuca: entrar con 15–20 cm y sacar con 7–8 cm.', pt: 'Festuca: entrar com 15–20 cm e retirar com 7–8 cm.' },
    { meses: [6, 7, 8, 9], es: 'N después de cada pastoreo (30–50 kg N/ha) si hay humedad.', pt: 'N após cada pastejo (30–50 kg N/ha) se houver umidade.' },
    { meses: [3, 4, 5], es: 'Implantación: P y K según análisis; controlar hormigas y babosas.', pt: 'Implantação: P e K conforme análise; controlar formigas e lesmas.' }
  ],
  nativo: [
    { meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], es: 'Mantener 8–12 cm de altura; ajustar la carga a la oferta.', pt: 'Manter 8–12 cm de altura; ajustar a lotação à oferta.' },
    { meses: [11, 12, 1, 2], es: 'Revisar capim-annoni y otras invasoras; marcar focos para control.', pt: 'Revisar capim-annoni e outras invasoras; marcar focos para controle.' }
  ],
  soja: [
    { meses: [10, 11], es: 'Desecación previa y siembra; revisar stand y babosas.', pt: 'Dessecação prévia e semeadura; revisar estande e lesmas.' },
    { meses: [12, 1, 2], es: 'Monitorear lagartas y chinches (nivel de daño) y roya asiática.', pt: 'Monitorar lagartas e percevejos (nível de dano) e ferrugem asiática.' },
    { meses: [3, 4], es: 'Cosecha; planificar la siembra de invierno siguiente.', pt: 'Colheita; planejar a semeadura de inverno seguinte.' }
  ],
  arroz: [
    { meses: [10, 11], es: 'Siembra; control temprano de capim-arroz.', pt: 'Semeadura; controle precoce de capim-arroz.' },
    { meses: [11, 12, 1], es: 'N en cobertura antes de la entrada del agua.', pt: 'N em cobertura antes da entrada da água.' },
    { meses: [3, 4], es: 'Cosecha y manejo del rastrojo.', pt: 'Colheita e manejo da resteva.' }
  ],
  resteva: [
    { meses: [4, 5, 6], es: 'Rastrojo: definir si se siembra verdeo o se prepara para el próximo cultivo.', pt: 'Resteva: definir se semeia verdeio ou prepara para a próxima lavoura.' }
  ]
};
