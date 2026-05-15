// ══════════════════════════════════════════
//  TEMA CLARO / OSCURO
// ══════════════════════════════════════════
function toggleTheme() {
    const html = document.documentElement;
    const actual = html.getAttribute('data-theme');
    const nuevo = actual === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', nuevo);

    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.textContent = nuevo === 'dark' ? '☀️' : '🌙';

    localStorage.setItem('tema', nuevo);
}

function cargarTema() {
    const temaGuardado = localStorage.getItem('tema') || 'dark';
    document.documentElement.setAttribute('data-theme', temaGuardado);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.textContent = temaGuardado === 'dark' ? '☀️' : '🌙';
}
// ══════════════════════════════════════════
//  KPIs — Cálculos y Renders
// ══════════════════════════════════════════
function actualizarKPIs() {
    const mes = getMes();
    const anio = getAnio();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    let totalPickUp = 0;
    let totalRevenue = 0;
    let sumaPM = 0;
    let diasConPM = 0;

    for (let d = 1; d <= diasEnMes; d++) {
        const info = datosSQLProcesados[d];
        if (!info) continue;

        totalPickUp  += info.realTotal || 0;
        totalRevenue += info.revReal   || 0; 

        if (info.pmReal > 0) {
            sumaPM += info.pmReal;
            diasConPM++;
        }
    }

    const totalHabDisponibles = TOTAL_ROOMS * diasEnMes;
    const pctOcupacion = totalHabDisponibles > 0 ? (totalPickUp / totalHabDisponibles) * 100 : 0;
    const precioMedio = diasConPM > 0 ? sumaPM / diasConPM : 0;
    const revPAR = totalHabDisponibles > 0 ? totalRevenue / totalHabDisponibles : 0;

    // --- 1. Habitaciones Vendidas ---
    const objHab = 100; 
    const diffHab = totalPickUp - objHab;
    document.getElementById('kpi-rooms').textContent = totalPickUp;
    document.getElementById('kpi-rooms-sub').innerHTML = `
        <span class="delta ${diffHab >= 0 ? 'up' : 'down'}">
            ${diffHab >= 0 ? '↑' : '↓'} ${Math.abs(diffHab)}
        </span> vs objetivo`;

    // --- 2. Ocupación ---
    document.getElementById('kpi-occ').textContent = pctOcupacion.toFixed(2).replace('.', ',') + '%';
    document.getElementById('kpi-occ-sub').innerHTML = `
        <span class="delta ${pctOcupacion >= 70 ? 'up' : 'neutral'}">
            ${pctOcupacion >= 70 ? '✓ Buen ritmo' : '≈ En progreso'}
        </span> Sobre ${TOTAL_ROOMS} hab.`;

    // --- 3. Precio Medio ---
    const pmAnterior = 95.0; 
    const diffPM = precioMedio - pmAnterior;
    document.getElementById('kpi-pm').textContent = precioMedio.toFixed(2).replace('.', ',') + ' €';
    document.getElementById('kpi-prm-sub').innerHTML = `
        <span class="delta ${diffPM >= 0 ? 'up' : 'down'}">
            ${diffPM >= 0 ? '↑' : '↓'} ${Math.abs(diffPM).toFixed(2)}€
        </span> vs anterior`;

    // --- 4. Revenue ---
    document.getElementById('kpi-rev').textContent = totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €';
    document.getElementById('kpi-Rvn-sub').innerHTML = `
        <span class="delta up">↑</span> RevPAR: ${revPAR.toFixed(2).replace('.', ',')} €`;
}
// ══════════════════════════════════════════
//  GESTIÓN DE COLUMNAS (Reescrita completamente)
// ══════════════════════════════════════════
function toggleColumnas(tipo) {
    const btnId = 'tab' + tipo.charAt(0).toUpperCase() + tipo.slice(1);
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    btn.classList.toggle('active');
    const estaActivo = btn.classList.contains('active');

    // Mapeo de celdas de datos y sub-cabeceras
    const mappingCol = {
        'actual': '.col-actual',
        'anterior': '.col-anterior',
        'real': '.col-real',
        'presupuesto': '.col-presupuesto',
        'diferencia': '.col-diferencia'
    };

    // Mapeo de IDs de cabeceras superiores (los azules de arriba)
    const mappingHeader = {
        'actual': '#headerActual',
        'anterior': '#headerAnterior',
        'real': '#headerReal',
        'presupuesto': '#headerPresupuesto',
        'diferencia': '#headerDiferencia'
    };

    // Aplicar visibilidad a todas las columnas de datos y sub-cabeceras
    document.querySelectorAll(mappingCol[tipo]).forEach(el => {
        el.classList.toggle('col-hidden', !estaActivo);
    });

    // Aplicar visibilidad a la cabecera superior (el bloque grande)
    const header = document.querySelector(mappingHeader[tipo]);
    if (header) {
        header.classList.toggle('col-hidden', !estaActivo);
    }
}
// ══════════════════════════════════════════
//  Totales — Cálculos 
// ══════════════════════════════════════════

function actualizarBarraTotales() {
    const mes = getMes();
    const anio = getAnio();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    let habReal = 0;
    let revReal = 0;
    let sumaPM = 0;
    let diasConPM = 0;

    const habPresup = 150; 
    const occPresup = 65.0; 
    const pmPresup = 115.0; 
    const revPresup = 17000;

    for (let d = 1; d <= diasEnMes; d++) {
        const info = datosSQLProcesados[d];
        if (!info) continue;
        
        habReal += (info.realTotal || 0); 
        revReal += (info.revReal || 0); 
        
        if (info.pmReal > 0) {
            sumaPM += info.pmReal;
            diasConPM++;
        }
    }

    const totalHabDisponibles = TOTAL_ROOMS * diasEnMes;
    const occReal = totalHabDisponibles > 0 ? (habReal / totalHabDisponibles) * 100 : 0;
    const pmReal = diasConPM > 0 ? sumaPM / diasConPM : 0;

    // --- RENDERIZAR HABITACIONES ---
    const difHab = habReal - habPresup;
    document.getElementById('total-hab-real').textContent = habReal;
    document.getElementById('total-hab-presup').textContent = habPresup;
    const elHabDif = document.getElementById('total-hab-dif');
    elHabDif.textContent = (difHab >= 0 ? "+" : "") + difHab;
    elHabDif.classList.remove('up', 'down');
    elHabDif.classList.add(difHab >= 0 ? 'up' : 'down');

    // --- RENDERIZAR OCUPACIÓN ---
    const difOcc = occReal - occPresup;
    document.getElementById('total-occ-real').textContent = occReal.toFixed(2).replace('.', ',') + "%";
    document.getElementById('total-occ-presup').textContent = occPresup.toFixed(2).replace('.', ',') + "%";
    const elOccDif = document.getElementById('total-occ-dif');
    elOccDif.textContent = (difOcc >= 0 ? "+" : "") + difOcc.toFixed(2).replace('.', ',') + "%";
    elOccDif.classList.remove('up', 'down');
    elOccDif.classList.add(difOcc >= 0 ? 'up' : 'down');

    // --- RENDERIZAR PRECIO MEDIO ---
    const difPM = pmReal - pmPresup;
    document.getElementById('total-pm-real').textContent = pmReal.toFixed(2).replace('.', ',') + "€";
    document.getElementById('total-pm-presup').textContent = pmPresup.toFixed(2).replace('.', ',') + "€";
    const elPmDif = document.getElementById('total-pm-dif');
    elPmDif.textContent = (difPM >= 0 ? "+" : "") + difPM.toFixed(0) + "€";
    elPmDif.classList.remove('up', 'down');
    elPmDif.classList.add(difPM >= 0 ? 'up' : 'down');

    // --- RENDERIZAR REVENUE ---
    const difRev = revReal - revPresup;
    document.getElementById('total-rev-real').textContent = revReal.toLocaleString('es-ES', {minimumFractionDigits: 2}) + "€";
    document.getElementById('total-rev-presup').textContent = revPresup.toLocaleString('es-ES') + "€";
    const elRevDif = document.getElementById('total-rev-dif');
    elRevDif.textContent = (difRev >= 0 ? "+" : "") + difRev.toLocaleString('es-ES', {maximumFractionDigits: 0}) + "€";
    elRevDif.classList.remove('up', 'down');
    elRevDif.classList.add(difRev >= 0 ? 'up' : 'down');
}
// ══════════════════════════════════════════
//  REVENUE
// ══════════════════════════════════════════

function cambiarModulo(modulo) {
    // 1. Ocultamos las dos vistas grandes
    const modPickUp = document.getElementById('modulo-pickup');
    const modRevenue = document.getElementById('modulo-revenue');
    
    if(modPickUp) modPickUp.style.display = 'none';
    if(modRevenue) modRevenue.style.display = 'none';

    // 2. Quitamos la clase 'active' de las pestañas
    document.getElementById('btnNavPickUp').classList.remove('active');
    document.getElementById('btnNavRevenue').classList.remove('active');

    // 3. Mostramos la que toca y la pintamos
    if (modulo === 'pickup') {
        if(modPickUp) modPickUp.style.display = 'block';
        document.getElementById('btnNavPickUp').classList.add('active');
        
    } else if (modulo === 'revenue') {
        if(modRevenue) modRevenue.style.display = 'block';
        document.getElementById('btnNavRevenue').classList.add('active');
        
        // Llamamos a tu función que dibuja la tabla
        renderPantallaRevenue(); 
    }
}
//  REVENUE — Control de sub-vistas
let vistaRevenueActual = 'financiero';

function cambiarVistaRevenue(vista) {
    vistaRevenueActual = vista;

    // Ocultar todas las sub-vistas
    document.getElementById('vistaRevFinanciero').style.display   = 'none';
    document.getElementById('vistaRevDepartamentos').style.display = 'none';
    document.getElementById('vistaRevTotal').style.display         = 'none';

    // Desactivar todos los tabs
    document.getElementById('tabRevFinanciero').classList.remove('active');
    document.getElementById('tabRevDepartamentos').classList.remove('active');
    document.getElementById('tabRevTotal').classList.remove('active');

    // Activar la vista seleccionada
    if (vista === 'financiero') {
        document.getElementById('vistaRevFinanciero').style.display = 'block';
        document.getElementById('tabRevFinanciero').classList.add('active');
        renderRevFinanciero();
    } else if (vista === 'departamentos') {
        document.getElementById('vistaRevDepartamentos').style.display = 'block';
        document.getElementById('tabRevDepartamentos').classList.add('active');
        renderRevDepartamentos();
    } else if (vista === 'total') {
        document.getElementById('vistaRevTotal').style.display = 'block';
        document.getElementById('tabRevTotal').classList.add('active');
        renderRevTotal();
    }
}

function renderPantallaRevenue() {
    // Renderiza la sub-vista activa
    cambiarVistaRevenue(vistaRevenueActual);
}

//  REVENUE — Vista Financiero
function renderRevFinanciero() {
    const tbody = document.getElementById('bodyRevFinanciero');
    if (!tbody) return;

    const mes = getMes();
    const anio = getAnio();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    tbody.innerHTML = '';

    const fmt = (v) => {
        if (v === null || v === undefined) return '<span style="color:var(--text3)">—</span>';
        return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
    };

    const fmtDif = (v) => {
        if (v === null || v === undefined || Math.abs(v) < 0.01)
            return '<span style="color:var(--text3)">—</span>';

        const cls = v > 0 ? 'color:var(--green)' : 'color:var(--red)';
        const signo = v > 0 ? '+' : '';
        return `<span style="${cls}">${signo}${v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</span>`;
    };

    for (let d = 1; d <= diasEnMes; d++) {

        const info = datosSQLProcesados[d] || {};
        const fecha = new Date(anio, mes, d);

        // =========================
        // 📊 DATOS REALES (BD)
        // =========================
        const habs = info.realTotal ?? null;
        const occ  = info.occ ?? null;
        const rev  = info.revReal ?? null;

        const adr = (habs && rev) ? rev / habs : null;
        const revpar = (rev && TOTAL_ROOMS) ? rev / TOTAL_ROOMS : null;

        const prodTotal = info.prodTotal ?? null;
        const trevpar = (prodTotal && TOTAL_ROOMS)
            ? prodTotal / TOTAL_ROOMS
            : null;

        // =========================
        //  PRESUPUESTOS (BD)
        // =========================
        const pptoAdr     = info.pptoAdr ?? null;
        const pptoRevpar  = info.pptoRevpar ?? null;
        const pptoAloj    = info.pptoAloj ?? null;
        const pptoTrevpar = info.pptoTrevpar ?? null;
        const pptoProd    = info.pptoProd ?? null;

        const tr = document.createElement('tr');
        if (fecha.getDay() === 0 || fecha.getDay() === 6) tr.classList.add('weekend');

        tr.innerHTML = `
            <td style="text-align:left; padding:6px 8px;">
                ${String(d).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}
            </td>

            <td class="td-num">${habs ?? '—'}</td>

            <td class="td-center">
                <span class="badge ${occ > 70 ? 'badge-amber' : occ > 0 ? 'badge-green' : 'badge-gray'}">
                    ${occ ? occ.toFixed(1) + '%' : '—'}
                </span>
            </td>

            <td class="td-num">${fmt(adr)}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoAdr)}</td>
            <td class="td-num">${fmtDif((adr ?? 0) - (pptoAdr ?? 0))}</td>

            <td class="td-num">${fmt(revpar)}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoRevpar)}</td>
            <td class="td-num">${fmtDif((revpar ?? 0) - (pptoRevpar ?? 0))}</td>

            <td class="td-num">${fmt(rev)}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoAloj)}</td>
            <td class="td-num">${fmtDif((rev ?? 0) - (pptoAloj ?? 0))}</td>

            <td class="td-num">${fmt(trevpar)}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoTrevpar)}</td>
            <td class="td-num">${fmtDif((trevpar ?? 0) - (pptoTrevpar ?? 0))}</td>

            <td class="td-num">${fmt(prodTotal)}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoProd)}</td>
            <td class="td-num">${fmtDif((prodTotal ?? 0) - (pptoProd ?? 0))}</td>
        `;

        tbody.appendChild(tr);
    }

    // =========================
    // 📊 TOTALES
    // =========================
    let totHab = 0, totRev = 0, totPptoAloj = 0;

    for (let d = 1; d <= diasEnMes; d++) {
        const info = datosSQLProcesados[d] || {};
        totHab += info.realTotal || 0;
        totRev += info.revReal || 0;
        totPptoAloj += info.pptoAloj || 0;
    }

    const totAdr = totHab ? totRev / totHab : null;
    const totRevpar = totRev ? totRev / TOTAL_ROOMS : null;
    const totProd = totRev ? totRev * 1.25 : null;
    const totTrevpar = totProd ? totProd / TOTAL_ROOMS : null;

    const pptoAdr = 120;
    const pptoRevpar = 85;
    const pptoProd = TOTAL_ROOMS * 95;
    const pptoTrevpar = 95;

    const fmtT = (v) =>
        v === null || v === undefined ? '—'
        : v.toLocaleString('es-ES', { minimumFractionDigits:2, maximumFractionDigits:2 }) + '€';

    const fmtD = (v) => {
        if (v === null || Math.abs(v) < 0.01) return '—';
        const cls = v > 0 ? 'color:var(--green)' : 'color:var(--red)';
        return `<span style="${cls}">${v > 0 ? '+' : ''}${v.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})}€</span>`;
    };

    document.getElementById('tfoot-fin-adr-real').textContent = fmtT(totAdr);
    document.getElementById('tfoot-fin-adr-ppto').textContent = fmtT(pptoAdr);
    document.getElementById('tfoot-fin-adr-dif').innerHTML = fmtD((totAdr ?? 0) - pptoAdr);

    document.getElementById('tfoot-fin-revpar-real').textContent = fmtT(totRevpar);
    document.getElementById('tfoot-fin-revpar-ppto').textContent = fmtT(pptoRevpar);
    document.getElementById('tfoot-fin-revpar-dif').innerHTML = fmtD((totRevpar ?? 0) - pptoRevpar);

    document.getElementById('tfoot-fin-aloj-real').textContent = fmtT(totRev);
    document.getElementById('tfoot-fin-aloj-ppto').textContent = fmtT(totPptoAloj);
    document.getElementById('tfoot-fin-aloj-dif').innerHTML = fmtD(totRev - totPptoAloj);

    document.getElementById('tfoot-fin-trevpar-real').textContent = fmtT(totTrevpar);
    document.getElementById('tfoot-fin-trevpar-ppto').textContent = fmtT(pptoTrevpar);
    document.getElementById('tfoot-fin-trevpar-dif').innerHTML = fmtD((totTrevpar ?? 0) - pptoTrevpar);

    document.getElementById('tfoot-fin-prod-real').textContent = fmtT(totProd);
    document.getElementById('tfoot-fin-prod-ppto').textContent = fmtT(pptoProd);
    document.getElementById('tfoot-fin-prod-dif').innerHTML = fmtD((totProd ?? 0) - pptoProd);
}

//  REVENUE — Vista Departamentos
function renderRevDepartamentos() {
    const tbody = document.getElementById('bodyRevDepartamentos');
    if (!tbody) return;

    const mes = getMes();
    const anio = getAnio();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    tbody.innerHTML = '';

    const fmt = (v) => {
        if (!v || v === 0) return '<span style="color:var(--text3)">—</span>';
        return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
    };

    // Acumuladores para totales
    let totDesayunos = 0, totPensiones = 0, totMenus = 0;
    let totSpa = 0, totGolf = 0, totEventos = 0;
    let totBonosIberik = 0, totBonosOtros = 0, totVarios = 0;

    for (let d = 1; d <= diasEnMes; d++) {
        const info = datosSQLProcesados[d] || {};
        const fecha = new Date(anio, mes, d);

        const desayunos      = info.desayunos      || 0;
        const pensiones      = info.pensiones      || 0;
        const menusBanquetes = info.menusBanquetes || 0;
        const spa            = info.spa            || 0;
        const golf           = info.golf           || 0;
        const eventos        = info.eventos        || 0;
        const bonosIberik    = info.bonosIberik    || 0;
        const bonosOtros     = info.bonosOtros     || 0;
        const varios         = info.varios         || 0;

        // Acumular totales
        totDesayunos   += desayunos;
        totPensiones   += pensiones;
        totMenus       += menusBanquetes;
        totSpa         += spa;
        totGolf        += golf;
        totEventos     += eventos;
        totBonosIberik += bonosIberik;
        totBonosOtros  += bonosOtros;
        totVarios      += varios;

        const tr = document.createElement('tr');
        if (fecha.getDay() === 0 || fecha.getDay() === 6) tr.classList.add('weekend');

        tr.innerHTML = `
            <td style="text-align:left; padding:6px 8px;">${String(d).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}</td>
            <td class="td-num">—</td>
            <td class="td-num">${fmt(desayunos)}</td>
            <td class="td-num">${fmt(menusBanquetes)}</td>
            <td class="td-num">${fmt(pensiones)}</td>
            <td class="td-num">—</td>
            <td class="td-num">—</td>
            <td class="td-num">${fmt(spa)}</td>
            <td class="td-num">${fmt(golf)}</td>
            <td class="td-num">—</td>
            <td class="td-num">—</td>
            <td class="td-num">—</td>
            <td class="td-num">${fmt(eventos)}</td>
            <td class="td-num">—</td>
            <td class="td-num">${fmt(bonosIberik)}</td>
            <td class="td-num">—</td>
            <td class="td-num">${fmt(bonosOtros)}</td>
        `;
        tbody.appendChild(tr);
    }

    // Actualizar tfoot con totales reales
    const fmtT = (v) => v > 0
        ? v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€'
        : '—';

    document.getElementById('tfoot-dpto-restaurante').textContent       = '—';
    document.getElementById('tfoot-dpto-desayunos').textContent         = fmtT(totDesayunos);
    document.getElementById('tfoot-dpto-menus').textContent             = fmtT(totMenus);
    document.getElementById('tfoot-dpto-pensiones').textContent         = fmtT(totPensiones);
    document.getElementById('tfoot-dpto-roomservice').textContent       = '—';
    document.getElementById('tfoot-dpto-minibar').textContent           = '—';
    document.getElementById('tfoot-dpto-spa').textContent               = fmtT(totSpa);
    document.getElementById('tfoot-dpto-golf').textContent              = fmtT(totGolf);
    document.getElementById('tfoot-dpto-salones').textContent           = '—';
    document.getElementById('tfoot-dpto-lavanderia').textContent        = '—';
    document.getElementById('tfoot-dpto-tienda').textContent            = '—';
    document.getElementById('tfoot-dpto-eventos').textContent           = fmtT(totEventos);
    document.getElementById('tfoot-dpto-comunicaciones').textContent    = '—';
    document.getElementById('tfoot-dpto-bonosiberik').textContent       = fmtT(totBonosIberik);
    document.getElementById('tfoot-dpto-bonosoca').textContent          = '—';
    document.getElementById('tfoot-dpto-varios').textContent            = fmtT(totVarios);
}

//  REVENUE — Vista Total
function renderRevTotal() {
    const tbody = document.getElementById('bodyRevTotal');
    if (!tbody) return;

    const mes = getMes();
    const anio = getAnio();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    tbody.innerHTML = '';

    const fmt = (v, sufijo = '€') => {
        if (!v || v === 0) return '<span style="color:var(--text3)">—</span>';
        return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + sufijo;
    };

    const fmtDif = (v) => {
        if (v === 0) return '<span style="color:var(--text3)">—</span>';
        const cls = v > 0 ? 'color:var(--green)' : 'color:var(--red)';
        return `<span style="${cls}">${v > 0 ? '+' : ''}${v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</span>`;
    };

    for (let d = 1; d <= diasEnMes; d++) {
        const info = datosSQLProcesados[d] || {};
        const fecha = new Date(anio, mes, d);

        // Datos reales de alojamiento
        const aloj = info.revReal || 0;

        // 🔧 MOCK — sustituir cuando estén en DB
        const fnb    = aloj > 0 ? +(aloj * 0.18 + Math.random() * 200).toFixed(2) : 0;
        const otros  = aloj > 0 ? +(aloj * 0.10 + Math.random() * 150).toFixed(2) : 0;
        const abonos = Math.random() > 0.8 ? +(Math.random() * 500).toFixed(2) : 0;
        const prodTotal = aloj + fnb + otros - abonos;
        const trevpar   = prodTotal / TOTAL_ROOMS;

        // Presupuestos mock
        const pptoAloj     = (info.realTotal || 0) * 120;
        const pptoFnb      = pptoAloj * 0.18;
        const pptoOtros    = pptoAloj * 0.10;
        const pptoAbonos   = 0;
        const pptoProdTotal = pptoAloj + pptoFnb + pptoOtros;
        const pptoTrevpar   = pptoProdTotal / TOTAL_ROOMS;

        const tr = document.createElement('tr');
        if (fecha.getDay() === 0 || fecha.getDay() === 6) tr.classList.add('weekend');

        tr.innerHTML = `
            <td style="text-align:left; padding:6px 8px;">${String(d).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}</td>

            <td class="td-num">${fmt(aloj)}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoAloj)}</td>
            <td class="td-num">${fmtDif(aloj - pptoAloj)}</td>

            <td class="td-num">${fmt(fnb)}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoFnb)}</td>
            <td class="td-num">${fmtDif(fnb - pptoFnb)}</td>

            <td class="td-num">${fmt(otros)}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoOtros)}</td>
            <td class="td-num">${fmtDif(otros - pptoOtros)}</td>

            <td class="td-num" style="color:var(--red)">${abonos > 0 ? '-' + fmt(abonos) : '—'}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoAbonos)}</td>
            <td class="td-num">—</td>

            <td class="td-num"><strong>${fmt(prodTotal)}</strong></td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoProdTotal)}</td>
            <td class="td-num">${fmtDif(prodTotal - pptoProdTotal)}</td>

            <td class="td-num">${fmt(trevpar)}</td>
            <td class="td-num" style="color:var(--text3)">${fmt(pptoTrevpar)}</td>
            <td class="td-num">${fmtDif(trevpar - pptoTrevpar)}</td>
        `;
        tbody.appendChild(tr);
    }
    // ── TOTALES TOTAL ──
    let totAloj = 0, totFnb = 0, totOtros = 0, totAbonos = 0;
    let totPptoAloj = 0, totPptoFnb = 0, totPptoOtros = 0;

    for (let d = 1; d <= diasEnMes; d++) {
        const info = datosSQLProcesados[d] || {};
        const aloj = info.revReal || 0;
        totAloj    += aloj;
        totFnb     += aloj > 0 ? aloj * 0.18 : 0;
        totOtros   += aloj > 0 ? aloj * 0.10 : 0;
        totPptoAloj  += (info.realTotal || 0) * 120;
    }

    totPptoFnb   = totPptoAloj * 0.18;
    totPptoOtros = totPptoAloj * 0.10;

    const totProd     = totAloj + totFnb + totOtros - totAbonos;
    const totTrev     = totProd / TOTAL_ROOMS;
    const pptoProd2   = totPptoAloj + totPptoFnb + totPptoOtros;
    const pptoTrev2   = pptoProd2 / TOTAL_ROOMS;

    const fmtTt = (v) => v > 0 ? v.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2}) + '€' : '—';
    const fmtDt = (v) => {
        if (Math.abs(v) < 0.01) return '—';
        const cls = v > 0 ? 'color:var(--green)' : 'color:var(--red)';
        return `<span style="${cls}">${v > 0 ? '+' : ''}${v.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}€</span>`;
    };

    document.getElementById('tfoot-tot-aloj-real').textContent  = fmtTt(totAloj);
    document.getElementById('tfoot-tot-aloj-ppto').textContent  = fmtTt(totPptoAloj);
    document.getElementById('tfoot-tot-aloj-dif').innerHTML     = fmtDt(totAloj - totPptoAloj);
    document.getElementById('tfoot-tot-fnb-real').textContent   = fmtTt(totFnb);
    document.getElementById('tfoot-tot-fnb-ppto').textContent   = fmtTt(totPptoFnb);
    document.getElementById('tfoot-tot-fnb-dif').innerHTML      = fmtDt(totFnb - totPptoFnb);
    document.getElementById('tfoot-tot-otros-real').textContent = fmtTt(totOtros);
    document.getElementById('tfoot-tot-otros-ppto').textContent = fmtTt(totPptoOtros);
    document.getElementById('tfoot-tot-otros-dif').innerHTML    = fmtDt(totOtros - totPptoOtros);
    document.getElementById('tfoot-tot-abonos-real').textContent = '—';
    document.getElementById('tfoot-tot-abonos-ppto').textContent = '—';
    document.getElementById('tfoot-tot-abonos-dif').textContent  = '—';
    document.getElementById('tfoot-tot-prod-real').innerHTML    = `<strong>${fmtTt(totProd)}</strong>`;
    document.getElementById('tfoot-tot-prod-ppto').textContent  = fmtTt(pptoProd2);
    document.getElementById('tfoot-tot-prod-dif').innerHTML     = fmtDt(totProd - pptoProd2);
    document.getElementById('tfoot-tot-trevpar-real').textContent = fmtTt(totTrev);
    document.getElementById('tfoot-tot-trevpar-ppto').textContent = fmtTt(pptoTrev2);
    document.getElementById('tfoot-tot-trevpar-dif').innerHTML   = fmtDt(totTrev - pptoTrev2);
}

// ══════════════════════════════════════════
//  GRÁFICOS D3
// ══════════════════════════════════════════
let graficosVisibles = false

function toggleGraficos() {
    graficosVisibles = !graficosVisibles;

    const vistaTabla = document.getElementById('vistaTabla');
    const vistaGraficos = document.getElementById('vistaGraficos');
    const btnGraf = document.getElementById('btnGraficos');
    const panelTitle = document.getElementById('panelTitle');
    const tabsPickUp = document.getElementById('tabsPickUp');
    
    const mes = getMes();
    const anio = getAnio();
    const nombreMes = nombresMeses[mes];

    // Cambiamos el texto del botón
    if (btnGraf) {
        btnGraf.textContent = graficosVisibles ? '📋 Tabla' : '📈 Gráficos';
    }

    if (graficosVisibles) {
        // MODO GRÁFICOS
        if (panelTitle) panelTitle.innerText = `Dashboard Gráficos — ${nombreMes} ${anio}`;
        if (tabsPickUp) tabsPickUp.style.display = 'none'; // Ocultamos los botones de filtros (Actual, Anterior...)
        
        if (vistaTabla) vistaTabla.style.display = 'none';
        if (vistaGraficos) vistaGraficos.style.display = 'block'; 
        
        dibujarGraficos();
    } else {
        // MODO TABLA
        if (panelTitle) panelTitle.innerText = `Gestión Pick Up — ${nombreMes} ${anio}`;
        if (tabsPickUp) tabsPickUp.style.display = 'flex'; // Volvemos a mostrar los botones de filtros
        
        if (vistaTabla) vistaTabla.style.display = 'flex';
        if (vistaGraficos) vistaGraficos.style.display = 'none';
    }
}

function dibujarGraficos() {
  const mes       = getMes()
  const anio      = getAnio()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()

  const datos = []
  for (let d = 1; d <= diasEnMes; d++) {
    const info = datosSQLProcesados[d] || { pickUp: 0, realTotal: 0, occ: 0, pmReal: 0 }
    const fecha = new Date(anio, mes, d)
    datos.push({
      dia:          `${String(d).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}`,
      diaSemana:    ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][fecha.getDay()],
      pickUp:       info.pickUp  || 0,
      ocup:         info.occ     || 0,
      pm:           info.pmReal  || 0,
      revenue:      (info.realTotal || 0) * (info.pmReal || 0),
      realTotal:    info.realTotal || 0
    })
  }

  // Limpia todo
  d3.select('#grafico-ocupacion').selectAll('*').remove()
  d3.select('#grafico-revenue').selectAll('*').remove()
  d3.select('#grafico-pickUp').selectAll('*').remove()
  d3.select('#grafico-donut').selectAll('*').remove()
  d3.select('#grafico-heatmap').selectAll('*').remove()
  d3.select('#grafico-doblelinea').selectAll('*').remove()

  graficoBarras('#grafico-ocupacion',  datos, 'ocup',    '% Ocupación por día',         '#1D9E75')
  graficoBarras('#grafico-revenue',    datos, 'revenue', 'Revenue por día (€)',          '#378ADD')
  graficoArea(  '#grafico-pickUp',     datos, 'pickUp',  'Pick Up acumulado por día',    '#EF9F27')
  graficoDonut( '#grafico-donut',      datos)
  graficoDobleLinea('#grafico-doblelinea', datos)
  graficoHeatmap('#grafico-heatmap',   datos)
}

// ── Tooltip compartido ──
const tooltip = d3.select('body')
  .append('div')
  .style('position',      'fixed')
  .style('background',    'var(--bg3)')
  .style('border',        '1px solid var(--border2)')
  .style('padding',       '8px 12px')
  .style('border-radius', '6px')
  .style('font-size',     '12px')
  .style('color',         'var(--text)')
  .style('pointer-events','none')
  .style('opacity',       0)
  .style('z-index',       100)

// ── 1. Gráfico de barras ──
function graficoBarras(contenedor, datos, campo, titulo, color) {
  const margin = { top: 30, right: 20, bottom: 50, left: 60 }
  const width  = 860 - margin.left - margin.right
  const height = 200 - margin.top  - margin.bottom

  const svg = d3.select(contenedor)
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .style('margin-bottom', '24px')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  svg.append('text')
    .attr('x', width / 2).attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text2)').style('font-size', '12px')
    .text(titulo)

  const x = d3.scaleBand().domain(datos.map(d => d.dia)).range([0, width]).padding(0.2)
  const y = d3.scaleLinear().domain([0, d3.max(datos, d => d[campo]) * 1.1 || 1]).range([height, 0])

  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 3 === 0)))
    .selectAll('text').style('fill', 'var(--text3)').style('font-size', '10px')
    .attr('transform', 'rotate(-35)').attr('text-anchor', 'end')

  svg.append('g').call(d3.axisLeft(y).ticks(4))
    .selectAll('text').style('fill', 'var(--text3)').style('font-size', '10px')

  svg.append('g').call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(''))
    .selectAll('line').style('stroke', 'var(--border)').style('stroke-dasharray', '3,3')

  svg.selectAll('.bar').data(datos).enter().append('rect')
    .attr('x',      d => x(d.dia))
    .attr('width',  x.bandwidth())
    .attr('y',      d => y(d[campo]))
    .attr('height', d => height - y(d[campo]))
    .attr('fill',   d => d[campo] > 0 ? color : 'var(--bg4)')
    .attr('rx', 3)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('fill', 'var(--amber)')
      tooltip.style('opacity', 1)
        .html(`<strong>${d.dia}</strong><br>${titulo}: ${d[campo].toFixed(1)}`)
        .style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 20) + 'px')
    })
    .on('mouseout', function(event, d) {
      d3.select(this).attr('fill', d[campo] > 0 ? color : 'var(--bg4)')
      tooltip.style('opacity', 0)
    })
}

// ── 2. Gráfico de área ──
function graficoArea(contenedor, datos, campo, titulo, color) {
  const margin = { top: 30, right: 20, bottom: 50, left: 60 }
  const width  = 860 - margin.left - margin.right
  const height = 200 - margin.top  - margin.bottom

  const svg = d3.select(contenedor)
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .style('margin-bottom', '24px')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  svg.append('text')
    .attr('x', width / 2).attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text2)').style('font-size', '12px')
    .text(titulo)

  const x = d3.scaleBand().domain(datos.map(d => d.dia)).range([0, width]).padding(0.1)
  const y = d3.scaleLinear().domain([0, d3.max(datos, d => d[campo]) * 1.1 || 1]).range([height, 0])

  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 3 === 0)))
    .selectAll('text').style('fill', 'var(--text3)').style('font-size', '10px')
    .attr('transform', 'rotate(-35)').attr('text-anchor', 'end')

  svg.append('g').call(d3.axisLeft(y).ticks(4))
    .selectAll('text').style('fill', 'var(--text3)').style('font-size', '10px')

  svg.append('g').call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(''))
    .selectAll('line').style('stroke', 'var(--border)').style('stroke-dasharray', '3,3')

  const cx = d => x(d.dia) + x.bandwidth() / 2

  svg.append('path').datum(datos)
    .attr('fill', color).attr('fill-opacity', 0.15)
    .attr('d', d3.area().x(cx).y0(height).y1(d => y(d[campo])).curve(d3.curveMonotoneX))

  svg.append('path').datum(datos)
    .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2)
    .attr('d', d3.line().x(cx).y(d => y(d[campo])).curve(d3.curveMonotoneX))

  svg.selectAll('.dot').data(datos).enter().append('circle')
    .attr('cx', cx).attr('cy', d => y(d[campo])).attr('r', 3).attr('fill', color)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 6)
      tooltip.style('opacity', 1)
        .html(`<strong>${d.dia}</strong><br>${titulo}: ${d[campo].toFixed(1)}`)
        .style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 20) + 'px')
    })
    .on('mouseout', function() { d3.select(this).attr('r', 3); tooltip.style('opacity', 0) })
}

// ── 3. Donut — ocupado vs libre ──
function graficoDonut(contenedor, datos) {
  const totalOcup  = d3.sum(datos, d => d.realTotal)
  const totalLibre = datos.length * 118 - totalOcup  // TOTAL_ROOMS × días
  const total      = totalOcup + totalLibre || 1

  const size   = 200
  const radius = size / 2 - 10

  const svg = d3.select(contenedor)
    .append('svg')
    .attr('width', size).attr('height', size)
    .style('margin-bottom', '24px')
    .append('g')
    .attr('transform', `translate(${size/2},${size/2})`)

  // Título encima
  d3.select(contenedor).insert('div', 'svg')
    .style('font-size', '12px').style('color', 'var(--text2)')
    .style('text-align', 'center').style('margin-bottom', '8px')
    .text('Ocupado vs Disponible')

  const pie = d3.pie().sort(null).value(d => d.valor)
  const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius)

  const segmentos = [
    { label: 'Ocupado',    valor: totalOcup,  color: '#1D9E75' },
    { label: 'Disponible', valor: totalLibre, color: 'var(--bg4)' }
  ]

  svg.selectAll('path').data(pie(segmentos)).enter().append('path')
    .attr('d', arc)
    .attr('fill', d => d.data.color)
    .attr('stroke', 'var(--bg2)').attr('stroke-width', 2)
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.data.label}</strong><br>${d.data.valor} hab-día<br>${((d.data.valor/total)*100).toFixed(1)}%`)
        .style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 20) + 'px')
    })
    .on('mouseout', () => tooltip.style('opacity', 0))

  // Texto central
  svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.2em')
    .style('font-size', '18px').style('font-weight', '600').style('fill', 'var(--text)')
    .text(((totalOcup / total) * 100).toFixed(1) + '%')

  svg.append('text').attr('text-anchor', 'middle').attr('dy', '1.2em')
    .style('font-size', '10px').style('fill', 'var(--text3)')
    .text('ocupación')
}

// ── 4. Línea doble — P.M. vs Revenue ──
function graficoDobleLinea(contenedor, datos) {
  const margin = { top: 30, right: 60, bottom: 50, left: 60 }
  const width  = 860 - margin.left - margin.right
  const height = 200 - margin.top  - margin.bottom

  const svg = d3.select(contenedor)
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .style('margin-bottom', '24px')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  svg.append('text')
    .attr('x', width / 2).attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text2)').style('font-size', '12px')
    .text('Precio Medio vs Revenue por día')

  const x  = d3.scaleBand().domain(datos.map(d => d.dia)).range([0, width]).padding(0.1)
  const yL = d3.scaleLinear().domain([0, d3.max(datos, d => d.pm) * 1.2 || 1]).range([height, 0])
  const yR = d3.scaleLinear().domain([0, d3.max(datos, d => d.revenue) * 1.2 || 1]).range([height, 0])

  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 3 === 0)))
    .selectAll('text').style('fill', 'var(--text3)').style('font-size', '10px')
    .attr('transform', 'rotate(-35)').attr('text-anchor', 'end')

  svg.append('g').call(d3.axisLeft(yL).ticks(4))
    .selectAll('text').style('fill', '#EF9F27').style('font-size', '10px')

  svg.append('g').attr('transform', `translate(${width},0)`)
    .call(d3.axisRight(yR).ticks(4))
    .selectAll('text').style('fill', '#378ADD').style('font-size', '10px')

  const cx = d => x(d.dia) + x.bandwidth() / 2

  // Línea P.M.
  svg.append('path').datum(datos)
    .attr('fill', 'none').attr('stroke', '#EF9F27').attr('stroke-width', 2)
    .attr('d', d3.line().x(cx).y(d => yL(d.pm)).curve(d3.curveMonotoneX))

  // Línea Revenue
  svg.append('path').datum(datos)
    .attr('fill', 'none').attr('stroke', '#378ADD').attr('stroke-width', 2)
    .attr('d', d3.line().x(cx).y(d => yR(d.revenue)).curve(d3.curveMonotoneX))

  // Leyenda
  const leyenda = svg.append('g').attr('transform', `translate(${width - 160}, -20)`)
  leyenda.append('rect').attr('width', 10).attr('height', 10).attr('fill', '#EF9F27')
  leyenda.append('text').attr('x', 14).attr('y', 9).style('fill', 'var(--text2)').style('font-size', '10px').text('P. Medio (€)')
  leyenda.append('rect').attr('x', 90).attr('width', 10).attr('height', 10).attr('fill', '#378ADD')
  leyenda.append('text').attr('x', 104).attr('y', 9).style('fill', 'var(--text2)').style('font-size', '10px').text('Revenue (€)')
}

// ── 5. Heatmap — ocupación por día de la semana ──
function graficoHeatmap(contenedor, datos) {
  const diasSemana = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

  // Agrupa por día de la semana y calcula media de ocupación
  const porDia = diasSemana.map(ds => {
    const filtro = datos.filter(d => d.diaSemana === ds)
    const media  = filtro.length > 0 ? d3.mean(filtro, d => d.ocup) : 0
    return { dia: ds, media }
  })

  const margin = { top: 30, right: 20, bottom: 30, left: 50 }
  const width  = 400 - margin.left - margin.right
  const height = 80  - margin.top  - margin.bottom

  const svg = d3.select(contenedor)
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .style('margin-bottom', '24px')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  svg.append('text')
    .attr('x', width / 2).attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text2)').style('font-size', '12px')
    .text('Ocupación media por día de la semana')

  const color = d3.scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolateRgb('var(--bg4)', '#1D9E75'))

  const x = d3.scaleBand().domain(diasSemana).range([0, width]).padding(0.1)

  svg.selectAll('rect').data(porDia).enter().append('rect')
    .attr('x',      d => x(d.dia))
    .attr('width',  x.bandwidth())
    .attr('y',      0)
    .attr('height', height)
    .attr('fill',   d => d.media > 0 ? color(d.media) : 'var(--bg4)')
    .attr('rx', 4)
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.dia}</strong><br>Media ocup.: ${d.media.toFixed(1)}%`)
        .style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 20) + 'px')
    })
    .on('mouseout', () => tooltip.style('opacity', 0))

  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .selectAll('text').style('fill', 'var(--text2)').style('font-size', '11px')

  svg.select('.domain').remove()

  // Etiquetas de % dentro de cada celda
  svg.selectAll('.label').data(porDia).enter().append('text')
    .attr('x', d => x(d.dia) + x.bandwidth() / 2)
    .attr('y', height / 2 + 4)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px').style('font-weight', '600')
    .style('fill', d => d.media > 50 ? '#fff' : 'var(--text2)')
    .text(d => d.media > 0 ? d.media.toFixed(0) + '%' : '')
}


// ══════════════════════════════════════════
//  RENDERER.JS — Lógica de la aplicación
// ══════════════════════════════════════════
function parseFechaOfi(fechaStr) {
    if (!fechaStr) return null;
    const f = fechaStr.toString();
    // Extrae YYYY, MM (0-indexado), DD
    return new Date(f.substring(0, 4), parseInt(f.substring(4, 6)) - 1, f.substring(6, 8));
}
// ── CONFIGURACIÓN ──
const TOTAL_ROOMS = 118// Ajusta esto a la capacidad real de tu hotel
const nombresMeses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

// Aquí guardaremos los datos procesados de la DB
let datosSQLProcesados = {}

// ── INICIALIZACIÓN ──
window.addEventListener('DOMContentLoaded', () => {
  console.log('Renderer cargado ✓');


  const inputFecha = document.getElementById('fechaInforme');
  if (inputFecha) {
    const hoyReal = new Date().toISOString().split('T')[0];
    inputFecha.value = hoyReal; // Pone la fecha de hoy por defecto
    inputFecha.onchange = () => actualizarTabla(); // Si la cambias, se actualiza la tabla
  }

  // 1. CARGAR TEMA GUARDADO
  // Esto aplica el color (oscuro/claro) nada más abrir la app
  if (typeof cargarTema === 'function') cargarTema();

  // 2. FUNCIÓN DE AYUDA PARA VINCULAR EVENTOS
  const vincularClick = (id, funcion) => {
    const el = document.getElementById(id);
    if (el) {
      el.onclick = funcion;
    } else {
      console.warn(`No se encontró el elemento con ID: ${id}`);
    }
  };

  // 3. VINCULAR BOTONES DE ACCIÓN
  vincularClick('btnUpdate', actualizarTabla);
  vincularClick('btnPrint', () => window.print());
  vincularClick('btnPrices', () => alert("Módulo de precios en desarrollo"));
  
  // VINCULAR TOGGLE DE TEMA
  vincularClick('themeToggle', toggleTheme);

  // 4. VINCULAR DESPLEGABLES (Detección de cambios)
  // Cada vez que cambies el mes o el año, la tabla se actualizará sola
  const selMes = document.getElementById('selMes');
  const selAnio = document.getElementById('selAnio');

  if (selMes) {
    selMes.onchange = () => {
      console.log("Cambio de mes detectado...");
      actualizarTabla();
    };
  }
  
  if (selAnio) {
    selAnio.onchange = () => {
      console.log("Cambio de año detectado...");
      actualizarTabla();
    };
  }

  // 5. DIBUJAR TABLA INICIAL (Vacía o con datos previos)
  buildTable();
  actualizarTabla();
  cambiarModulo('pickup'); // Asegura que inicia en la vista de Pick Up

});

// ── FUNCIONES DE APOYO ──
function getMes() { return parseInt(document.getElementById('selMes').value) }
function getAnio() { return parseInt(document.getElementById('selAnio').value) }


async function actualizarTabla() {
    const mes = getMes();
    const anio = getAnio();
    
    // 1. Actualizar el título del panel (Gestión Pick Up — Mes Año)
    const nombreMes = nombresMeses[mes];
    const elTitle = document.getElementById('panelTitle');
    if (elTitle) {
        elTitle.innerText = `Gestión Pick Up — ${nombreMes} ${anio}`;
    }

    // 2. Capturamos la fecha del selector y la formateamos
    const inputFecha = document.getElementById('fechaInforme');
    const fechaInformeRaw = inputFecha ? inputFecha.value : ""; // "2026-04-28"
    const fechaInformeSQL = fechaInformeRaw.replace(/-/g, ''); // "20260428"

    // 3. Actualizar la cabecera de la tabla con la fecha de informe (DD/MM)
    if (fechaInformeRaw) {
        const [y, m, d] = fechaInformeRaw.split('-');
        const thPickUp = document.querySelector('th[colspan="5"]');
        if (thPickUp) {
            thPickUp.innerText = `PICK UP ACTUAL (${d}/${m})`;
        }
    }

    const btn = document.getElementById('btnUpdate');
    if (btn) {
        btn.innerText = 'Cargando...';
        btn.disabled = true;
    }

    try {
        // 4. Llamada a la base de datos con los 3 parámetros
        const respuesta = await window.electronAPI.getDatosSQL(anio, mes, fechaInformeSQL);
        
        if (respuesta.ok) {
            // 5. Pasamos los datos al procesador
            procesarDatosSQL(respuesta.data, anio, mes, fechaInformeSQL); 
            
            // 6. Renderizamos todos los componentes
            buildTable();
            actualizarKPIs();
            actualizarBarraTotales();
            renderPantallaRevenue();
            if (graficosVisibles) dibujarGraficos()
            
            console.log(`✓ Tabla actualizada para ${nombreMes} ${anio} con corte al ${fechaInformeRaw}`);
        } else {
            alert("Error en la base de datos: " + respuesta.error);
        }
    } catch (error) {
        console.error("Error crítico en el renderer:", error);
    } finally {
        if (btn) {
            btn.innerText = 'Actualizar';
            btn.disabled = false;
        }
    }
    console.log('Fecha informe enviada:', fechaInformeSQL);
    console.log('Fecha de corte usada:', fechaCorte)
}

/**
 * Procesa los datos y los organiza por día del mes
 * fechaInformeSeleccionada: es el valor YYYYMMDD que viene del calendario
 */
function procesarDatosSQL(data, anio, mes, fechaInformeSeleccionada) {
    datosSQLProcesados = {};
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    // ── INICIALIZAR ──
    for (let i = 1; i <= diasEnMes; i++) {
        datosSQLProcesados[i] = {
            libres:         TOTAL_ROOMS,
            pickUpHoy:      0,
            pickUpAyer:     0,
            pickUpAnt:      0,
            pickUpAyerAnt:  0,
            anul:           0,
            anulAnt:        0,
            realTotal:      0,
            occ:            0,
            pmReal:         0,
            revReal:        0,
            pmAnt:          0,
            realTotalAnt:   0,
            libresAnt:      TOTAL_ROOMS,
            occAnt:         0,
            revAnt:         0,
            sumaEstancia:   0,
            sumaAntelacion: 0,
            habsParaMedias: 0,
            desayunos:      0,
            pensiones:      0,
            menusBanquetes: 0,
            spa:            0,
            golf:           0,
            eventos:        0,
            bonosIberik:    0,
            bonosOtros:     0,
            varios:         0
        };
    }

    // ── A. PICK UP HOY (viene ya calculado por día desde la BD) ──
    // data.pickUpHoy tiene { Fecha, PrecioMedio } — reservas hechas HOY
    if (data.pickUpHoy) {
        data.pickUpHoy.forEach(row => {
            const f = parseFechaOfi(row.Fecha);
            if (!f || f.getMonth() !== mes || f.getFullYear() !== anio) return;
            const dia = f.getDate();
            if (datosSQLProcesados[dia]) {
                datosSQLProcesados[dia].pickUpHoy = row.NumHabitaciones || 0;
            }
        });
    }

    // ── B. PICK UP AYER (reservas hechas ayer) ──
    if (data.reservasAyer) {
        data.reservasAyer.forEach(row => {
            const fEntrada = parseFechaOfi(row.FechaEntrada);
            const fSalida  = parseFechaOfi(row.FechaSalida);
            const numHab   = row.NumHabitaciones || 0;
            if (!fEntrada || !fSalida) return;

            let current = new Date(fEntrada);
            while (current < fSalida) {
                if (current.getMonth() === mes && current.getFullYear() === anio) {
                    const dia = current.getDate();
                    if (datosSQLProcesados[dia]) {
                        datosSQLProcesados[dia].pickUpAyer += numHab;
                    }
                }
                current.setDate(current.getDate() + 1);
            }
        });
    }

    // ── C. ALOS Y LEAD TIME (sobre todas las reservas del mes) ──
    if (data.reservas) {
        data.reservas.forEach(row => {
            const fEntrada = parseFechaOfi(row.FechaEntrada);
            const fSalida  = parseFechaOfi(row.FechaSalida);
            const fReserva = parseFechaOfi(row.FechaReserva);
            const numHab   = row.NumHabitaciones || 0;
            if (!fEntrada || !fSalida) return;

            const diasEstancia  = Math.max(1, Math.round((fSalida - fEntrada) / 86400000));
            const diasAntelacion = fReserva ? Math.max(0, Math.round((fEntrada - fReserva) / 86400000)) : 0;

            let current = new Date(fEntrada);
            while (current < fSalida) {
                if (current.getMonth() === mes && current.getFullYear() === anio) {
                    const dia = current.getDate();
                    if (datosSQLProcesados[dia]) {
                        datosSQLProcesados[dia].sumaEstancia   += diasEstancia * numHab;
                        datosSQLProcesados[dia].sumaAntelacion += diasAntelacion * numHab;
                        datosSQLProcesados[dia].habsParaMedias += numHab;
                    }
                }
                current.setDate(current.getDate() + 1);
            }
        });
    }

    // ── D. OCUPACIÓN REAL ──
    if (data.ocupacion) {
        data.ocupacion.forEach(row => {
            const f = parseFechaOfi(row.Fecha);
            if (!f || f.getMonth() !== mes || f.getFullYear() !== anio) return;
            const dia = f.getDate();
            if (datosSQLProcesados[dia]) {
                const ocupadas = row.HabOcupadas || 0;
                datosSQLProcesados[dia].realTotal = ocupadas;
                datosSQLProcesados[dia].libres    = TOTAL_ROOMS - ocupadas;
                datosSQLProcesados[dia].occ       = (ocupadas / TOTAL_ROOMS) * 100;
            }
        });
    }

    // ── E. PRECIO MEDIO Y REVENUE REAL ──
    if (data.precioNeto) {
        data.precioNeto.forEach(row => {
            const f = parseFechaOfi(row.Fecha);
            if (!f || f.getMonth() !== mes || f.getFullYear() !== anio) return;
            const dia = f.getDate();
            if (datosSQLProcesados[dia]) {
                const pm = row.PrecioNeto || 0;
                datosSQLProcesados[dia].pmReal  = pm;
                datosSQLProcesados[dia].revReal = datosSQLProcesados[dia].realTotal * pm;
            }
        });
    }

    // ── F. ANULACIONES ACTUALES ──
    if (data.anulaciones) {
        data.anulaciones.forEach(row => {
            const f = parseFechaOfi(row.FechaEntrada);
            if (!f || f.getMonth() !== mes || f.getFullYear() !== anio) return;
            const dia = f.getDate();
            if (datosSQLProcesados[dia]) {
                datosSQLProcesados[dia].anul += (row.TotalHabitaciones || 0);
            }
        });
    }

    // ── G. AÑO ANTERIOR — PICK UP ──
    if (data.reservasAnt) {
        data.reservasAnt.forEach(row => {
            const fEntrada = parseFechaOfi(row.FechaEntrada);
            const fSalida  = parseFechaOfi(row.FechaSalida);
            const numHab   = row.NumHabitaciones || 0;
            if (!fEntrada || !fSalida) return;

            // Ajustamos al año actual para mapear al día correcto
            let current = new Date(fEntrada);
            current.setFullYear(current.getFullYear() + 1);
            let end = new Date(fSalida);
            end.setFullYear(end.getFullYear() + 1);

            while (current < end) {
                if (current.getMonth() === mes && current.getFullYear() === anio) {
                    const dia = current.getDate();
                    if (datosSQLProcesados[dia]) {
                        datosSQLProcesados[dia].pickUpAnt += numHab;
                    }
                }
                current.setDate(current.getDate() + 1);
            }
        });
    }

    // ── H. AÑO ANTERIOR — PICK UP AYER ──
    if (data.reservasAyerAnt) {
        data.reservasAyerAnt.forEach(row => {
            const fEntrada = parseFechaOfi(row.FechaEntrada);
            const fSalida  = parseFechaOfi(row.FechaSalida);
            const numHab   = row.NumHabitaciones || 0;
            if (!fEntrada || !fSalida) return;

            let current = new Date(fEntrada);
            current.setFullYear(current.getFullYear() + 1);
            let end = new Date(fSalida);
            end.setFullYear(end.getFullYear() + 1);

            while (current < end) {
                if (current.getMonth() === mes && current.getFullYear() === anio) {
                    const dia = current.getDate();
                    if (datosSQLProcesados[dia]) {
                        datosSQLProcesados[dia].pickUpAyerAnt += numHab;
                    }
                }
                current.setDate(current.getDate() + 1);
            }
        });
    }

    // ── I. AÑO ANTERIOR — PRECIO MEDIO ──
    // OJO: las fechas vienen del año anterior (ej: 20250501)
    // Solo cogemos el día y lo mapeamos al mes actual
    if (data.precioNetoAnt) {
        data.precioNetoAnt.forEach(row => {
            const f = parseFechaOfi(row.Fecha);
            if (!f) return;
            // Solo el mismo mes del año anterior
            if (f.getMonth() !== mes) return;
            const dia = f.getDate();
            if (datosSQLProcesados[dia]) {
                datosSQLProcesados[dia].pmAnt = row.PrecioNeto || 0;
            }
        });
    }

    // ── J. AÑO ANTERIOR — OCUPACIÓN ──
    if (data.ocupacionAnt) {
        data.ocupacionAnt.forEach(row => {
            const f = parseFechaOfi(row.Fecha);
            if (!f) return;
            if (f.getMonth() !== mes) return;
            const dia = f.getDate();
            if (datosSQLProcesados[dia]) {
                const ocupadas = row.HabOcupadas || 0;
                datosSQLProcesados[dia].realTotalAnt = ocupadas;
                datosSQLProcesados[dia].libresAnt    = TOTAL_ROOMS - ocupadas;
                datosSQLProcesados[dia].occAnt       = (ocupadas / TOTAL_ROOMS) * 100;
            }
        });
    }

    // Recalcular revAnt después de tener pmAnt y realTotalAnt
    for (let d = 1; d <= diasEnMes; d++) {
        const info = datosSQLProcesados[d];
        if (!info) continue;
        info.revAnt = (info.realTotalAnt || 0) * (info.pmAnt || 0);
    }

    // ── K. ANULACIONES AÑO ANTERIOR ──
    if (data.anulacionesAnt) {
        data.anulacionesAnt.forEach(row => {
            const f = parseFechaOfi(row.FechaEntrada);
            if (!f) return;
            if (f.getMonth() !== mes) return;
            const dia = f.getDate();
            if (datosSQLProcesados[dia]) {
                datosSQLProcesados[dia].anulAnt += (row.TotalHabitaciones || 0);
            }
        });
    }

    // ── L. DEPARTAMENTOS ──
    if (data.departamentos) {
        data.departamentos.forEach(row => {
            const f = parseFechaOfi(row.Fecha);
            if (!f || f.getMonth() !== mes || f.getFullYear() !== anio) return;
            const dia = f.getDate();
            if (datosSQLProcesados[dia]) {
                datosSQLProcesados[dia].desayunos      = row.Desayunos      || 0;
                datosSQLProcesados[dia].pensiones      = row.Pensiones      || 0;
                datosSQLProcesados[dia].menusBanquetes = row.MenusBanquetes || 0;
                datosSQLProcesados[dia].spa            = row.SPA            || 0;
                datosSQLProcesados[dia].golf           = row.Golf           || 0;
                datosSQLProcesados[dia].eventos        = row.Eventos        || 0;
                datosSQLProcesados[dia].bonosIberik    = row.BonosIberik    || 0;
                datosSQLProcesados[dia].bonosOtros     = row.BonosOtros     || 0;
                datosSQLProcesados[dia].varios         = row.Varios         || 0;
            }
        });
    }

    // ── DEBUG ──
    console.log('=== VERIFICACIÓN DÍA 1-5 ===');
    for (let d = 1; d <= 5; d++) {
        const info = datosSQLProcesados[d];
        if (!info) continue;
        console.log(`Día ${d}: pickUpHoy=${info.pickUpHoy} | occ=${info.occ.toFixed(1)}% | pm=${info.pmReal.toFixed(2)} | rev=${info.revReal.toFixed(2)} | pmAnt=${info.pmAnt.toFixed(2)} | occAnt=${info.occAnt.toFixed(1)}%`);
    }
}

/**
 * Dibuja la tabla rellenando los campos
 */
function buildTable() {
    const mes = getMes();
    const anio = getAnio();
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    // Verificamos estado de botones para que las filas nuevas respeten la visibilidad
    const s = {
        act: document.getElementById('tabActual').classList.contains('active'),
        ant: document.getElementById('tabAnterior').classList.contains('active'),
        real: document.getElementById('tabReal').classList.contains('active'),
        pre: document.getElementById('tabPresupuesto').classList.contains('active'),
        dif: document.getElementById('tabDiferencia').classList.contains('active')
    };

    for (let d = 1; d <= diasEnMes; d++) {
        const info = datosSQLProcesados[d] || {
            libres: TOTAL_ROOMS, pickUpHoy: 0, pickUpAnt: 0,
            realTotal: 0, occ: 0, pmReal: 0, revReal: 0, anul: 0
        };

        const tr = document.createElement('tr');
        const fecha = new Date(anio, mes, d);
        if (fecha.getDay() === 0 || fecha.getDay() === 6) tr.classList.add('weekend');

         tr.innerHTML = `
            <td>${String(d).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}</td>
            <td></td>

            <!-- PICK UP ACTUAL -->
            <td class="td-num col-actual ${s.act ? '' : 'col-hidden'}">${info.libres}</td>
            <td class="td-num col-actual ${s.act ? '' : 'col-hidden'}"><strong>${info.pickUpHoy || 0}</strong></td>
            <td class="td-num col-actual ${s.act ? '' : 'col-hidden'}" style="color:var(--text3)">${info.pickUpAyer || 0}</td>
            <td class="td-num col-actual ${s.act ? '' : 'col-hidden'}">${info.pmReal > 0 ? info.pmReal.toFixed(2) + '€' : '0.00€'}</td>
            <td class="td-num col-actual ${s.act ? '' : 'col-hidden'}" style="color:var(--red)">${info.anul > 0 ? '-' + info.anul : ''}</td>

            <!-- PICK UP AÑO ANTERIOR -->
            <td class="td-num col-anterior ${s.ant ? '' : 'col-hidden'}">${info.libresAnt ?? TOTAL_ROOMS}</td>
            <td class="td-num col-anterior ${s.ant ? '' : 'col-hidden'}">${info.pickUpAnt || 0}</td>
            <td class="td-num col-anterior ${s.ant ? '' : 'col-hidden'}" style="color:var(--text3)">${info.pickUpAyerAnt || 0}</td>
            <td class="td-num col-anterior ${s.ant ? '' : 'col-hidden'}">${info.pmAnt > 0 ? info.pmAnt.toFixed(2) + '€' : '0.00€'}</td>
            <td class="td-num col-anterior ${s.ant ? '' : 'col-hidden'}" style="color:var(--red)">${info.anulAnt > 0 ? '-' + info.anulAnt : ''}</td>

            <!-- TARIFA -->
            <td class="td-num"></td>
            <td class="td-num">${info.pmReal > 0 ? info.pmReal.toFixed(2) + '€' : '0.00€'}</td>

            <!-- SITUACIÓN REAL -->
            <td class="td-num col-real ${s.real ? '' : 'col-hidden'}">${info.realTotal || 0}</td>
            <td class="td-center col-real ${s.real ? '' : 'col-hidden'}">
                <span class="badge ${info.occ > 70 ? 'badge-amber' : info.occ > 0 ? 'badge-green' : 'badge-gray'}">
                    ${info.occ > 0 ? info.occ.toFixed(1) + '%' : '0%'}
                </span>
            </td>
            <td class="td-num col-real ${s.real ? '' : 'col-hidden'}">${info.pmReal > 0 ? info.pmReal.toFixed(2) + '€' : '0.00€'}</td>
            <td class="td-num col-real ${s.real ? '' : 'col-hidden'}"><strong>${info.revReal > 0 ? info.revReal.toFixed(2) + '€' : '0.00€'}</strong></td>

            <!-- PRESUPUESTO -->
            <td class="td-num col-presupuesto ${s.pre ? '' : 'col-hidden'}">0</td>
            <td class="td-center col-presupuesto ${s.pre ? '' : 'col-hidden'}"><span class="badge badge-gray">0%</span></td>
            <td class="td-num col-presupuesto ${s.pre ? '' : 'col-hidden'}">0€</td>
            <td class="td-num col-presupuesto ${s.pre ? '' : 'col-hidden'}"><strong>0€</strong></td>

            <!-- DIFERENCIA -->
            <td class="td-num col-diferencia ${s.dif ? '' : 'col-hidden'}">0</td>
            <td class="td-center col-diferencia ${s.dif ? '' : 'col-hidden'}"><span class="badge badge-gray">0%</span></td>
            <td class="td-num col-diferencia ${s.dif ? '' : 'col-hidden'}">0€</td>
            <td class="td-num col-diferencia ${s.dif ? '' : 'col-hidden'}"><strong>0€</strong></td>
        `;
        tbody.appendChild(tr);
    }
    const tabla = document.getElementById('mainTable');
    if (tabla) {
        tabla.style.width = 'max-content'; 
        tabla.style.minWidth = '100%';
    }
}






// ── OTROS EVENTOS ──

async function importarArchivo() {
  const ruta = await window.electronAPI.abrirArchivo()
  if (ruta) {
    alert('Archivo seleccionado: ' + ruta + '\n(Lógica de lectura pendiente)')
  }
}

function exportarCSV() {
  const mes  = getMes()
  const anio = getAnio()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()

  let csv = 'Día,Libres,P.M. Hoy,Anulaciones,Ocupación,Revenue\n'

  for (let d = 1; d <= diasEnMes; d++) {
    const sp = datosSQLProcesados[d] || {}
    const dia = `${d}/${mes+1}/${anio}`
    csv += `${dia},${TOTAL_ROOMS - (sp.realTotal||0)},${sp.pm||0},${sp.anul||0},${sp.occ||0}%,${(sp.realTotal||0)*(sp.pmReal||0)}\n`
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pickup_${nombresMeses[mes]}_${anio}.csv`
  a.click()
}