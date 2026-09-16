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
