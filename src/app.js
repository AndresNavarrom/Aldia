/* ============================================================
   Aldia - navegacion y estado de la aplicacion

   Sigue el diagrama de flujo de la entrega: el tablero es el centro,
   toda escritura pasa por localStorage y ninguna rama sale del
   dispositivo. No hay cuenta ni login.
   ============================================================ */

const CLAVE = 'aldia';

/* --- los cinco servicios de la plantilla de intervalos ---
   la vista 4 es una sola plantilla: lo que cambia es este dato */
const SERVICIOS = {
  aceite: {
    nombre: 'Cambio de aceite',
    intervalo: 'Cada 5.000 km o 6 meses',
    estado: 'pronto',
    diferencia: '650 km',
    objetivo: '85.000 km',
    ultimo: {
      fecha: '14 de marzo de 2026',
      costo: '$185.000',
      lugar: '80.010 km · Taller El Poblado',
      detalle: 'Aceite sintético 5W-30 + filtro'
    },
    historico: [
      { fecha: '28 sep 2025', km: '75.120 km', costo: '$172.000' },
      { fecha: '11 abr 2025', km: '70.050 km', costo: '$168.000' }
    ],
    nota: 'Intervalo editable en ajustes del servicio.'
  },
  pastillas: {
    nombre: 'Pastillas de freno',
    intervalo: 'Cada 35.000 km o al oír chillido',
    estado: 'vencido',
    diferencia: '1.200 km',
    objetivo: '83.150 km',
    ultimo: {
      fecha: '18 de nov. de 2023',
      costo: '$215.000',
      lugar: '48.150 km · Frenos del Sur',
      detalle: 'Pastillas delanteras y traseras'
    },
    historico: [
      { fecha: '2 may 2021', km: '31.400 km', costo: '$186.000' },
      { fecha: '9 ago 2019', km: '12.900 km', costo: '$164.000' }
    ],
    nota: 'Único servicio vencido: encabeza el tablero.'
  },
  filtro: {
    nombre: 'Filtro de aire',
    intervalo: 'Cada 10.000 km o 1 año',
    estado: 'aldia',
    diferencia: '4.300 km',
    objetivo: '88.650 km',
    ultimo: {
      fecha: '17 de mayo de 2026',
      costo: '$85.000',
      lugar: '78.650 km · Taller El Poblado',
      detalle: 'Filtro de aire de motor'
    },
    historico: [
      { fecha: '3 jul 2025', km: '68.400 km', costo: '$78.000' },
      { fecha: '21 ago 2024', km: '58.220 km', costo: '$72.000' }
    ],
    nota: 'En vías destapadas conviene acortar el intervalo.'
  },
  llantas: {
    nombre: 'Rotación de llantas',
    intervalo: 'Cada 10.000 km',
    estado: 'aldia',
    diferencia: '5.650 km',
    objetivo: '90.000 km',
    ultimo: {
      fecha: '5 de junio de 2026',
      costo: '$60.000',
      lugar: '80.000 km · Llantas y Servicio',
      detalle: 'Rotación en cruz + balanceo'
    },
    historico: [
      { fecha: '28 mar 2026', km: '70.000 km', costo: '$58.000' },
      { fecha: '2 feb 2025', km: '60.100 km', costo: '$54.000' }
    ],
    nota: 'Se hizo en la misma visita del cambio de aceite.'
  },
  liquido: {
    nombre: 'Líquido de frenos',
    intervalo: 'Cada 40.000 km o 2 años',
    estado: 'aldia',
    diferencia: '12.000 km',
    objetivo: '96.350 km',
    ultimo: {
      fecha: '12 de sept. de 2024',
      costo: '$120.000',
      lugar: '56.350 km · Taller El Poblado',
      detalle: 'Purga y cambio de DOT 4'
    },
    historico: [
      { fecha: '4 mar 2022', km: '36.900 km', costo: '$104.000' },
      { fecha: '9 ene 2020', km: '18.400 km', costo: '$96.000' }
    ],
    nota: 'Manda lo que se cumpla primero: km o tiempo.'
  }
};

/* ============================================================
   Persistencia - todo vive en localStorage del dispositivo
   ============================================================ */

function leerEstado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || {};
  } catch (e) {
    /* si el dato quedo corrupto se empieza de cero, no se rompe la app */
    return {};
  }
}

function guardarEstado(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch (e) {
    /* modo privado o almacenamiento lleno: la app sigue funcionando
       en memoria durante la sesion */
  }
}

let estado = leerEstado();

/* ============================================================
   Navegacion entre vistas
   ============================================================ */

const vistas = document.querySelectorAll('body > section');
let servicioActivo = 'aceite';
let vistaPrevia = 'Tablero';

function mostrarVista(id) {
  vistas.forEach(function (s) {
    s.classList.toggle('vista-activa', s.id === id);
  });
  /* los dias que faltan cambian con el calendario: se recalculan cada
     vez que se entra a la lista, no solo al abrir la app */
  if (id === 'Documentos') pintarDocumentos();
  window.scrollTo(0, 0);
  ajustarAltura();
}

/* --- encaje de la vista en la pantalla ---
   cada wireframe debe verse entero, sin scroll, en cualquier telefono.
   el CSS ya encoge por su cuenta con el alto del viewport, pero no
   puede saber cuanto ocupa el texto una vez partido en lineas: eso
   depende de la fuente, del idioma y del ancho del aparato.

   por eso se mide lo que de verdad ocupa la vista y se corrige el
   factor --ajuste. se repite porque al encoger cambian los saltos de
   linea, y el alto resultante no es proporcional al factor. */
const AJUSTE_MINIMO = 0.62;

function ajustarAltura() {
  const vista = document.querySelector('section.vista-activa');
  if (!vista) return;

  const raiz = document.documentElement;
  let factor = 1;
  raiz.style.setProperty('--ajuste', factor);

  for (let i = 0; i < 12; i++) {
    const sobra = vista.scrollHeight - window.innerHeight;
    if (sobra <= 0) break;

    /* se apunta al factor que cabria si el alto fuese proporcional, con
       un pellizco de mas para compensar que no lo es del todo */
    factor = factor * (window.innerHeight / vista.scrollHeight) - 0.004;

    if (factor <= AJUSTE_MINIMO) {
      /* por debajo de este punto el texto deja de leerse: mas vale un
         poco de scroll que una pantalla ilegible */
      factor = AJUSTE_MINIMO;
      raiz.style.setProperty('--ajuste', factor);
      break;
    }
    raiz.style.setProperty('--ajuste', factor);
  }
}

/* al girar el telefono o cambiar el tamano de la ventana hay que
   recalcular; se espera a que el navegador termine de redimensionar */
let temporizadorAjuste;
window.addEventListener('resize', function () {
  clearTimeout(temporizadorAjuste);
  temporizadorAjuste = setTimeout(ajustarAltura, 120);
});

/* ============================================================
   Utilidades
   ============================================================ */

/* separador de miles a la colombiana: 84350 -> 84.350 */
function formatearKm(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function soloDigitos(texto) {
  return parseInt(String(texto).replace(/\D/g, ''), 10) || 0;
}

/* pone el punto de miles mientras se escribe: 84350 -> 84.350.
   al reescribir el valor el navegador manda el cursor al final, asi que
   se cuenta cuantos digitos habia antes del cursor y se devuelve detras
   de ese mismo digito; si no, corregir un numero a mitad es imposible */
function formatearMientrasEscribe(campo) {
  campo.addEventListener('input', function () {
    const cursor = campo.selectionStart;
    const digitosAntes = campo.value.slice(0, cursor).replace(/\D/g, '').length;

    /* 7 digitos dan de sobra para el odometro de cualquier vehiculo */
    const digitos = campo.value.replace(/\D/g, '').slice(0, 7);
    campo.value = digitos ? formatearKm(parseInt(digitos, 10)) : '';

    let vistos = 0;
    let posicion = 0;
    while (posicion < campo.value.length && vistos < digitosAntes) {
      if (/\d/.test(campo.value[posicion])) vistos++;
      posicion++;
    }
    campo.setSelectionRange(posicion, posicion);
  });
}

/* ============================================================
   Vista 1 - Registro del vehiculo
   ============================================================ */

const home = document.querySelector('#Home');

home.querySelectorAll('.botones-tipo-vehiculo button').forEach(function (b) {
  b.addEventListener('click', function () {
    home.querySelectorAll('.botones-tipo-vehiculo button')
      .forEach(function (o) { o.classList.remove('tipo-elegido'); });
    b.classList.add('tipo-elegido');
  });
});

formatearMientrasEscribe(home.querySelector('#Kilometraje'));

home.querySelector('.btn-crear').addEventListener('click', function () {
  const marca = home.querySelector('#MarcaLinea').value.trim();
  const anio = home.querySelector('#Modelo').value.trim();
  const placa = home.querySelector('#Placa').value.trim();
  const km = soloDigitos(home.querySelector('#Kilometraje').value);
  const tipo = home.querySelector('.tipo-elegido');

  /* el diagrama exige vehiculo y kilometraje para poder calcular nada */
  if (!marca || !placa || !km) {
    avisar(home, 'Falta la marca, la placa o el kilometraje.');
    return;
  }

  estado.vehiculo = {
    marca: marca,
    anio: anio,
    placa: placa,
    tipo: tipo ? tipo.textContent : 'Carro'
  };
  /* la plantilla de intervalos que la vista anuncia al crear la bitacora */
  estado.plantilla = estado.plantilla || {
    aceite: 5000,
    filtro: 10000,
    llantas: 10000
  };
  estado.km = km;
  estado.registros = estado.registros || [];
  guardarEstado(estado);

  pintarTablero();
  mostrarVista('Tablero');
});

/* ============================================================
   Vista 2 - Tablero, centro de la aplicacion
   ============================================================ */

const tablero = document.querySelector('#Tablero');

function pintarTablero() {
  if (!estado.vehiculo) return;
  const v = estado.vehiculo;
  tablero.querySelector('.tablero-header h1').textContent =
    v.marca + (v.anio ? ' · ' + v.anio : '');
  tablero.querySelector('.tablero-placa').textContent = v.placa;
  if (estado.km) {
    tablero.querySelector('.grafico-texto strong').textContent = formatearKm(estado.km);
  }
}

/* vuelta a la vista 1: se precargan los datos guardados para que sea
   una edicion y no haya que teclearlo todo otra vez */
tablero.querySelector('.btn-registro').addEventListener('click', function () {
  const v = estado.vehiculo || {};
  home.querySelector('#MarcaLinea').value = v.marca || '';
  home.querySelector('#Modelo').value = v.anio || '';
  home.querySelector('#Placa').value = v.placa || '';
  home.querySelector('#Kilometraje').value = estado.km ? formatearKm(estado.km) : '';

  home.querySelectorAll('.botones-tipo-vehiculo button').forEach(function (b) {
    b.classList.toggle('tipo-elegido', b.textContent === v.tipo);
  });

  mostrarVista('Home');
});

tablero.querySelector('.btn-actualizar').addEventListener('click', function () {
  prepararKilometraje();
  mostrarVista('ActualizarKilometraje');
});

/* cada servicio del tablero abre la misma vista 4 con su propio dato */
tablero.querySelectorAll('.item-mant').forEach(function (item) {
  function abrir() {
    servicioActivo = item.dataset.servicio;
    pintarDetalle(servicioActivo);
    vistaPrevia = 'Tablero';
    mostrarVista('InformacionMantenimiento');
  }
  item.addEventListener('click', abrir);
  item.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });
});

/* ============================================================
   Vista 3 - Actualizar kilometraje
   ============================================================ */

const vistaKm = document.querySelector('#ActualizarKilometraje');
const pantallaKm = vistaKm.querySelector('.km-value');
let capturaKm = '';

function prepararKilometraje() {
  capturaKm = '';
  pantallaKm.textContent = formatearKm(estado.km || 0);
}

vistaKm.querySelectorAll('.km-numpad button').forEach(function (b) {
  if (b.classList.contains('km-empty')) return;

  b.addEventListener('click', function () {
    if (b.classList.contains('km-backspace')) {
      capturaKm = capturaKm.slice(0, -1);
    } else {
      /* 7 digitos dan de sobra para el odometro de cualquier vehiculo */
      if (capturaKm.length >= 7) return;
      capturaKm += b.textContent.trim();
    }
    pantallaKm.textContent = capturaKm
      ? formatearKm(parseInt(capturaKm, 10))
      : formatearKm(estado.km || 0);
  });
});

vistaKm.querySelector('.km-volver').addEventListener('click', function () {
  mostrarVista('Tablero');
});

vistaKm.querySelector('.km-guardar').addEventListener('click', function () {
  const nuevo = parseInt(capturaKm, 10);

  if (!nuevo) {
    avisar(vistaKm, 'Escriba el kilometraje del odómetro.');
    return;
  }

  /* la decision del diagrama: el odometro nunca retrocede */
  if (estado.km && nuevo <= estado.km) {
    avisar(vistaKm, 'Debe ser mayor que ' + formatearKm(estado.km) + ' km.');
    return;
  }

  estado.km = nuevo;
  guardarEstado(estado);
  pintarTablero();
  mostrarVista('Tablero');
});

/* ============================================================
   Vista 4 - Detalle del servicio
   ============================================================ */

const detalle = document.querySelector('#InformacionMantenimiento');

function pintarDetalle(id) {
  const s = SERVICIOS[id];
  if (!s) return;

  detalle.querySelector('.mant-cabecera h1').textContent = s.nombre;
  detalle.querySelector('.mant-cabecera p').textContent = s.intervalo;

  const testigo = detalle.querySelector('.mant-testigo');
  testigo.className = 'mant-testigo estado-' + s.estado;

  /* cuando el servicio esta vencido cambian los dos rotulos */
  const vencido = s.estado === 'vencido';
  const cifras = detalle.querySelectorAll('.mant-cifra');
  cifras[0].querySelector('.mant-cifra-rotulo').textContent =
    vencido ? 'Vencido hace' : 'Faltan';
  cifras[0].querySelector('.mant-cifra-valor').textContent = s.diferencia;
  cifras[1].querySelector('.mant-cifra-rotulo').textContent =
    vencido ? 'Tocaba a los' : 'Se hace a los';
  cifras[1].querySelector('.mant-cifra-valor').textContent = s.objetivo;

  /* el ultimo registro guardado por el usuario manda sobre el de la
     plantilla, para que la vista 5 se note al volver */
  const propio = (estado.registros || [])
    .filter(function (r) { return r.servicio === id; })
    .slice(-1)[0];
  const ultimo = propio
    ? {
        fecha: propio.fecha,
        costo: propio.costo,
        lugar: propio.km + ' · ' + propio.taller,
        detalle: propio.notas
      }
    : s.ultimo;

  const titular = detalle.querySelectorAll('.mant-registro-titular strong');
  titular[0].textContent = ultimo.fecha;
  titular[1].textContent = ultimo.costo;
  const lineas = detalle.querySelectorAll('.mant-registro-datos p');
  lineas[0].textContent = ultimo.lugar;
  lineas[1].textContent = ultimo.detalle;

  const lista = detalle.querySelector('.mant-historico');
  lista.innerHTML = '';
  s.historico.forEach(function (r) {
    const li = document.createElement('li');
    const f = document.createElement('strong');
    f.textContent = r.fecha;
    const k = document.createElement('span');
    k.className = 'mant-historico-km';
    k.textContent = r.km;
    const c = document.createElement('span');
    c.className = 'mant-historico-costo';
    c.textContent = r.costo;
    li.append(f, k, c);
    lista.appendChild(li);
  });

  detalle.querySelector('.mant-nota').textContent = s.nota;
}

detalle.querySelector('.mant-volver').addEventListener('click', function () {
  mostrarVista(vistaPrevia);
});

detalle.querySelector('.mant-registrar').addEventListener('click', function () {
  prepararRegistro(servicioActivo);
  mostrarVista('ActualizarServicioMantenimiento');
});

/* ============================================================
   Vista 5 - Registrar servicio
   ============================================================ */

const registro = document.querySelector('#ActualizarServicioMantenimiento');

formatearMientrasEscribe(registro.querySelector('#KilometrajeActual'));

function prepararRegistro(id) {
  const s = SERVICIOS[id];
  registro.querySelector('#TipoServicio').value = s.nombre;
  registro.querySelector('#KilometrajeActual').value = formatearKm(estado.km || 0);
  registro.querySelector('#FechaActual').value = fechaDeHoy();
}

function fechaDeHoy() {
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const d = new Date();
  return d.getDate() + ' ' + meses[d.getMonth()] + ' ' + d.getFullYear();
}

registro.querySelector('.reg-cancelar').addEventListener('click', function () {
  mostrarVista('InformacionMantenimiento');
});

registro.querySelector('.reg-agregar').addEventListener('click', function () {
  /* declarada sin implementar en el alcance de la entrega */
  avisar(registro, 'Subir foto no está implementado en esta entrega.');
});

registro.querySelector('.reg-guardar').addEventListener('click', function () {
  const costo = registro.querySelector('#Costo').value.trim();
  const taller = registro.querySelector('#Taller').value.trim();

  if (!costo || !taller) {
    avisar(registro, 'Falta el taller o el costo.');
    return;
  }

  estado.registros = estado.registros || [];
  estado.registros.push({
    servicio: servicioActivo,
    fecha: registro.querySelector('#FechaActual').value.trim(),
    km: registro.querySelector('#KilometrajeActual').value.trim(),
    taller: taller,
    costo: costo,
    notas: registro.querySelector('#Notas').value.trim()
  });
  guardarEstado(estado);

  /* el diagrama vuelve al tablero despues de guardar */
  pintarDetalle(servicioActivo);
  mostrarVista('Tablero');
});

/* ============================================================
   Vistas 6, 7 y 8 - barra de pestanas, siempre accesible
   ============================================================ */

const DESTINOS = {
  'Tablero': 'Tablero',
  'Bitácora': 'Bitacora',
  'Gastos': 'Gastos',
  'Documentos': 'Documentos'
};

document.querySelectorAll('.bottom-nav .nav-item').forEach(function (b) {
  b.addEventListener('click', function () {
    const destino = DESTINOS[b.querySelector('span').textContent.trim()];
    if (destino) mostrarVista(destino);
  });
});

/* filtros de bitacora y gastos: solo marcan cual esta aplicado, las dos
   vistas son de solo lectura segun el diagrama */
document.querySelectorAll('.filtros').forEach(function (grupo) {
  grupo.querySelectorAll('.filtro').forEach(function (f) {
    f.addEventListener('click', function () {
      grupo.querySelectorAll('.filtro').forEach(function (o) {
        o.classList.remove('active');
      });
      f.classList.add('active');
    });
  });
});

/* ============================================================
   Vista 8 - Documentos y su detalle
   ============================================================ */

/* diasEjemplo solo se usa la primera vez, para sembrar fechas relativas
   a hoy: asi la lista de ejemplo conserva los estados del wireframe sin
   importar el dia en que se abra la app. despues cada fecha es real y
   se guarda tal cual */
const DOCUMENTOS = {
  soat: {
    nombre: 'SOAT',
    descripcion: 'Seguro obligatorio de accidentes de tránsito',
    diasEjemplo: 28
  },
  tecnomecanica: {
    nombre: 'Revisión tecnomecánica',
    descripcion: 'Revisión técnico-mecánica y de emisiones',
    diasEjemplo: 204
  },
  impuesto: {
    nombre: 'Impuesto vehicular',
    descripcion: 'Impuesto anual sobre el vehículo',
    diasEjemplo: 247,
    /* el wireframe lo muestra como pagado y no como pendiente */
    pagoAnual: true
  },
  seguro: {
    nombre: 'Seguro todo riesgo',
    descripcion: 'Póliza voluntaria del vehículo',
    diasEjemplo: -10
  }
};

/* leyenda del wireframe: pronto = faltan menos de 30 dias */
const DIAS_PRONTO = 30;
const DIAS_PERIODO = 365;

/* --- fechas: siempre a medianoche local, para contar dias enteros --- */
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function hoy() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function desdeISO(iso) {
  const p = iso.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

function aISO(d) {
  const dos = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
}

function sumarDias(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/* redondeo y no division exacta: un cambio de horario deja el dia en
   23 o 25 horas y truncar daria un dia de menos */
function diasHasta(iso) {
  return Math.round((desdeISO(iso) - hoy()) / 86400000);
}

function fechaLarga(d) {
  return d.getDate() + ' de ' + MESES_LARGOS[d.getMonth()] + ' de ' + d.getFullYear();
}

function fechaCorta(d) {
  return d.getDate() + ' ' + MESES_CORTOS[d.getMonth()] + ' ' + d.getFullYear();
}

function plural(n, palabra) {
  return n + ' ' + palabra + (n === 1 ? '' : 's');
}

function asegurarDocumentos() {
  if (estado.documentos) return;
  estado.documentos = {};
  Object.keys(DOCUMENTOS).forEach(function (id) {
    estado.documentos[id] = {
      vence: aISO(sumarDias(hoy(), DOCUMENTOS[id].diasEjemplo))
    };
  });
  guardarEstado(estado);
}

/* toda la presentacion de un documento sale de su fecha de vencimiento */
function situacion(id, iso) {
  const dias = diasHasta(iso);
  const vence = desdeISO(iso);
  const info = DOCUMENTOS[id];

  const estadoDoc = dias < 0 ? 'vencido' : dias <= DIAS_PRONTO ? 'pronto' : 'aldia';
  const transcurrido = Math.min(Math.max(DIAS_PERIODO - dias, 0), DIAS_PERIODO);

  let subtitulo, etiqueta;
  if (estadoDoc === 'vencido') {
    subtitulo = 'Venció el ' + fechaLarga(vence);
    etiqueta = 'Vencido hace ' + plural(-dias, 'día');
  } else if (dias === 0) {
    subtitulo = 'Vence hoy';
    etiqueta = 'Vence hoy';
  } else if (estadoDoc === 'aldia' && info.pagoAnual) {
    subtitulo = 'Pagado el ' + fechaLarga(sumarDias(vence, -DIAS_PERIODO));
    etiqueta = 'Al día';
  } else {
    subtitulo = 'Vence el ' + fechaLarga(vence);
    etiqueta = 'Faltan ' + plural(dias, 'día');
  }

  return {
    dias: dias,
    vence: vence,
    estado: estadoDoc,
    subtitulo: subtitulo,
    etiqueta: etiqueta,
    progreso: estadoDoc === 'vencido' ? 100 : Math.round(transcurrido / DIAS_PERIODO * 100)
  };
}

/* --- lista --- */
const vistaDocumentos = document.querySelector('#Documentos');

function pintarDocumentos() {
  asegurarDocumentos();
  vistaDocumentos.querySelectorAll('.documento').forEach(function (tarjeta) {
    const id = tarjeta.dataset.documento;
    const s = situacion(id, estado.documentos[id].vence);

    tarjeta.querySelector('.mant-icono').className = 'mant-icono icon-' + s.estado;
    tarjeta.querySelector('.documento-info h3').textContent = DOCUMENTOS[id].nombre;
    tarjeta.querySelector('.documento-info p').textContent = s.subtitulo;

    const relleno = tarjeta.querySelector('.barra-progreso-relleno');
    relleno.style.width = s.progreso + '%';
    relleno.classList.toggle('lleno', s.estado === 'vencido');

    const etiqueta = tarjeta.querySelector('.badge');
    etiqueta.className = 'badge badge-' + s.estado;
    etiqueta.textContent = s.etiqueta;
  });
}

vistaDocumentos.querySelectorAll('.documento').forEach(function (tarjeta) {
  function abrir() { abrirDocumento(tarjeta.dataset.documento); }
  tarjeta.addEventListener('click', abrir);
  tarjeta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });
});

/* --- archivos ---
   cada adjunto va en su propia clave de localStorage y no dentro del
   estado general: asi una foto pesada no obliga a reescribir todo lo
   demas cada vez que se guarda un kilometraje */
const LADO_MAXIMO_FOTO = 1600;
const CALIDAD_FOTO = 0.8;
const PESO_MAXIMO_PDF = 1.5 * 1024 * 1024;

function claveArchivo(id) {
  return CLAVE + ':documento:' + id;
}

function leerArchivo(id) {
  try {
    return JSON.parse(localStorage.getItem(claveArchivo(id)));
  } catch (e) {
    return null;
  }
}

function leerComoDataURL(archivo) {
  return new Promise(function (ok, falla) {
    const lector = new FileReader();
    lector.onload = function () { ok(lector.result); };
    lector.onerror = function () { falla(new Error('No se pudo leer el archivo.')); };
    lector.readAsDataURL(archivo);
  });
}

/* una foto de celular pesa varios megas y localStorage apenas da unos
   pocos para toda la app: se reduce a 1600 px y se recomprime en JPEG,
   que para leer un SOAT sobra */
function reducirFoto(archivo) {
  return new Promise(function (ok, falla) {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = function () {
      const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(img.width, img.height));
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(img.width * escala);
      lienzo.height = Math.round(img.height * escala);
      lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
      URL.revokeObjectURL(url);
      ok(lienzo.toDataURL('image/jpeg', CALIDAD_FOTO));
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      falla(new Error('No se pudo abrir la foto. Pruebe con JPG o PNG.'));
    };
    img.src = url;
  });
}

function prepararArchivo(archivo) {
  const esPdf = archivo.type === 'application/pdf';
  const esFoto = archivo.type.indexOf('image/') === 0;

  if (!esPdf && !esFoto) {
    return Promise.reject(new Error('Solo se admiten fotos o PDF.'));
  }
  if (esPdf && archivo.size > PESO_MAXIMO_PDF) {
    return Promise.reject(new Error('El PDF pesa más de 1,5 MB.'));
  }

  const lectura = esPdf ? leerComoDataURL(archivo) : reducirFoto(archivo);
  return lectura.then(function (datos) {
    return {
      nombre: archivo.name,
      tipo: esPdf ? 'pdf' : 'foto',
      datos: datos,
      /* el base64 ocupa 4 caracteres por cada 3 bytes */
      bytes: Math.round((datos.length - datos.indexOf(',') - 1) * 3 / 4),
      fecha: aISO(hoy())
    };
  });
}

function formatearPeso(bytes) {
  return bytes < 1024 * 1024
    ? Math.max(1, Math.round(bytes / 1024)) + ' KB'
    : (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
}

/* --- detalle ---
   los cambios quedan en borrador hasta pulsar Guardar; volver atras los
   descarta. archivoPendiente: undefined = sin cambios, null = quitar,
   objeto = archivo nuevo */
const detalleDoc = document.querySelector('#DetalleDocumento');
const campoVence = detalleDoc.querySelector('#DocVence');
const campoArchivo = detalleDoc.querySelector('#DocArchivo');
const visor = detalleDoc.querySelector('.visor');
let documentoActivo = 'soat';
let archivoPendiente;

function abrirDocumento(id) {
  asegurarDocumentos();
  documentoActivo = id;
  archivoPendiente = undefined;
  campoArchivo.value = '';

  detalleDoc.querySelector('.doc-nombre').textContent = DOCUMENTOS[id].nombre;
  detalleDoc.querySelector('.doc-descripcion').textContent = DOCUMENTOS[id].descripcion;
  campoVence.value = estado.documentos[id].vence;

  pintarCifrasDocumento();
  pintarAdjunto();
  mostrarVista('DetalleDocumento');
}

/* se repinta al cambiar la fecha, antes de guardar, para que se vea
   como quedaria el documento */
function pintarCifrasDocumento() {
  if (!campoVence.value) return;
  const s = situacion(documentoActivo, campoVence.value);

  detalleDoc.querySelector('.mant-testigo').className = 'mant-testigo estado-' + s.estado;
  detalleDoc.querySelector('.doc-rotulo-dias').textContent =
    s.estado === 'vencido' ? 'Vencido hace' : 'Faltan';
  detalleDoc.querySelector('.doc-dias').textContent =
    s.dias === 0 ? 'Hoy' : plural(Math.abs(s.dias), 'día');
  detalleDoc.querySelector('.doc-rotulo-fecha').textContent =
    s.estado === 'vencido' ? 'Venció el' : 'Vence el';
  detalleDoc.querySelector('.doc-fecha').textContent = fechaCorta(s.vence);
}

function archivoVisible() {
  return archivoPendiente !== undefined ? archivoPendiente : leerArchivo(documentoActivo);
}

function pintarAdjunto() {
  const a = archivoVisible();
  detalleDoc.querySelector('.doc-subir').hidden = !!a;
  detalleDoc.querySelector('.doc-adjunto').hidden = !a;
  if (!a) {
    ajustarAltura();
    return;
  }

  const miniatura = detalleDoc.querySelector('.doc-miniatura');
  const pdf = detalleDoc.querySelector('.doc-pdf');
  miniatura.hidden = a.tipo !== 'foto';
  pdf.hidden = a.tipo !== 'pdf';
  if (a.tipo === 'foto') miniatura.src = a.datos;

  detalleDoc.querySelector('.doc-adjunto-nombre').textContent = a.nombre;
  detalleDoc.querySelector('.doc-adjunto-detalle').textContent =
    formatearPeso(a.bytes) + ' · ' + fechaCorta(desdeISO(a.fecha));
  ajustarAltura();
}

campoVence.addEventListener('change', pintarCifrasDocumento);

campoArchivo.addEventListener('change', function () {
  const archivo = campoArchivo.files[0];
  if (!archivo) return;
  prepararArchivo(archivo)
    .then(function (a) {
      archivoPendiente = a;
      pintarAdjunto();
    })
    .catch(function (e) {
      avisar(detalleDoc, e.message);
    })
    .then(function () {
      /* sin esto, elegir otra vez el mismo archivo no dispara change */
      campoArchivo.value = '';
    });
});

detalleDoc.querySelector('.doc-quitar').addEventListener('click', function () {
  archivoPendiente = null;
  pintarAdjunto();
});

/* una foto se puede ver en grande; un PDF no, porque el WebView de
   Android no trae visor de PDF integrado */
detalleDoc.querySelector('.doc-vista-previa').addEventListener('click', function () {
  const a = archivoVisible();
  if (!a) return;
  if (a.tipo !== 'foto') {
    avisar(detalleDoc, 'El PDF está guardado, pero no se puede previsualizar aquí.');
    return;
  }
  visor.querySelector('img').src = a.datos;
  visor.hidden = false;
});

visor.addEventListener('click', function () {
  visor.hidden = true;
});

detalleDoc.querySelector('.doc-volver').addEventListener('click', function () {
  visor.hidden = true;
  mostrarVista('Documentos');
});

detalleDoc.querySelector('.doc-guardar').addEventListener('click', function () {
  if (!campoVence.value) {
    avisar(detalleDoc, 'Indique la fecha de vencimiento.');
    return;
  }

  /* el archivo va primero: es lo que puede no caber. si falla, no se
     toca nada y el usuario conserva su borrador */
  if (archivoPendiente !== undefined) {
    try {
      if (archivoPendiente === null) {
        localStorage.removeItem(claveArchivo(documentoActivo));
      } else {
        localStorage.setItem(claveArchivo(documentoActivo), JSON.stringify(archivoPendiente));
      }
    } catch (e) {
      avisar(detalleDoc, 'No queda espacio para guardar el archivo. Pruebe con uno más liviano.');
      return;
    }
  }

  estado.documentos[documentoActivo].vence = campoVence.value;
  guardarEstado(estado);
  visor.hidden = true;
  mostrarVista('Documentos');
});

/* ============================================================
   Aviso reutilizable - sustituye al alert del navegador
   ============================================================ */

let temporizadorAviso;

function avisar(seccion, texto) {
  let caja = seccion.querySelector('.aviso');
  if (!caja) {
    caja = document.createElement('p');
    caja.className = 'aviso';
    caja.setAttribute('role', 'status');
    seccion.appendChild(caja);
  }
  caja.textContent = texto;
  caja.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    caja.classList.remove('visible');
  }, 3500);
}

/* ============================================================
   Arranque - la decision inicial del diagrama
   ============================================================ */

if (estado.vehiculo) {
  /* ya hay vehiculo: se entra directo al tablero */
  pintarTablero();
  mostrarVista('Tablero');
} else {
  mostrarVista('Home');
}

pintarDetalle(servicioActivo);
