
const { sql, getPool } = require('./Conexion_bd.js') 





// ══════════════════════════════════════════
//  QUERIES
// ══════════════════════════════════════════

// Formatea fecha a 'YYYYMMDD' que espera tu SQL
function formatFecha(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${dia}`;
}

// Primer y último día del mes dado
function rangoMes(anio, mes) {
  const inicio = new Date(anio, mes, 1);
  const fin    = new Date(anio, mes + 1, 0);
  const fechas = {
    desde: formatFecha(inicio),
    hasta: formatFecha(fin),
    hoy:   formatFecha(new Date())
  };
  console.log('--- RANGO DE FECHAS GENERADO ---', fechas);
  return fechas;
}

// Calcula "ayer" en formato YYYYMMDD a partir de una fecha YYYYMMDD
function fechaAyer(fechaStr) {
  const y   = parseInt(fechaStr.substring(0, 4));
  const m   = parseInt(fechaStr.substring(4, 6)) - 1;
  const d   = parseInt(fechaStr.substring(6, 8));
  const date = new Date(y, m, d);
  date.setDate(date.getDate() - 1);
  return formatFecha(date);
}

// ── 1. Reservas del mes (Pick Up Actual) ──
async function getReservasMes(anio, mes) {
  const { desde, hasta } = rangoMes(anio, mes)
  const db = await getPool()

  const result = await db.request()
    .input('desde', sql.VarChar, desde)
    .input('hasta', sql.VarChar, hasta)
    .query(`
      SELECT
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Sum(ReservasTipoHab.NumHabitaciones) AS NumHabitaciones,
          Reservas.FechaReserva,
          ReservasTipoHab.CodTipoHab
      FROM (OfiHotel001.dbo.ReservasTipoHab
          LEFT JOIN OfiHotel001.dbo.TipoHabitaciones
              ON ReservasTipoHab.CodTipoHab = TipoHabitaciones.CodTipoHab)
          LEFT JOIN OfiHotel001.dbo.Reservas
              ON ReservasTipoHab.NumReserva = Reservas.NumReserva
              AND ReservasTipoHab.NumDesglose = Reservas.NumDesglose
      WHERE Reservas.FechaEntrada <= @hasta
          AND Reservas.FechaSalida >= @desde
      GROUP BY
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Reservas.FechaReserva,
          ReservasTipoHab.CodTipoHab
    `)

  return result.recordset
}

// ── 2. Precio medio neto por día ──
async function getPrecioMedioNeto(anio, mes) {
  const { desde, hasta } = rangoMes(anio, mes)
  const db = await getPool()

  const result = await db.request()
    .input('desde', sql.VarChar, desde)
    .input('hasta', sql.VarChar, hasta)
    .query(`
      SELECT
          HabFechas.Fecha,
          Avg((HabFechas.PrecioHab - ((HabFechas.PrecioHab / 100) * HabFechas.PorcNetoHab))) AS PrecioNeto
      FROM (OfiHotel001.dbo.HabFechas
          Left Join OfiHotel001.dbo.Reservas
              On 'R' + Reservas.NumReserva + Reservas.NumDesglose = HabFechas.Origen + HabFechas.CodOrigen + HabFechas.NumDesglose)
          Left Join OfiHotel001.dbo.TipoHabitaciones
              On HabFechas.CodTipoHab = TipoHabitaciones.CodTipoHab
      WHERE HabFechas.Fecha <= @hasta
          AND HabFechas.Fecha >= @desde
          And (HabFechas.Origen = 'E'
              Or (HabFechas.Origen = 'R'
                  And (Reservas.Estado = 'P' OR Reservas.Estado = 'C')))
          And DiaDeSalida <> 'S'
          And TipoHabitaciones.HabSalon <> 'S'
      GROUP BY HabFechas.Fecha
    `)

  return result.recordset
}


// ── 3. Pick Up del día ──
async function getPickUpHoy(anio, mes, fechaCorte) {
  const { desde, hasta } = rangoMes(anio, mes)
  const db = await getPool()

  const result = await db.request()
    .input('desde', sql.VarChar, desde)
    .input('hasta', sql.VarChar, hasta)
    .input('hoy',   sql.VarChar, fechaCorte)
    .query(`
      SELECT
          HabFechas.Fecha,
          Count(HabFechas.NumeroHab) AS NumHabitaciones
      FROM (OfiHotel001.dbo.HabFechas
          Left Join OfiHotel001.dbo.Reservas
              On Reservas.NumDesglose = HabFechas.NumDesglose
              And Reservas.NumReserva = HabFechas.CodOrigen)
          Left Join OfiHotel001.dbo.TipoHabitaciones
              On HabFechas.CodTipoHab = TipoHabitaciones.CodTipoHab
      WHERE HabFechas.Fecha <= @hasta
          AND HabFechas.Fecha >= @desde
          And DiaDeSalida <> 'S'
          And TipoHabitaciones.HabSalon <> 'S'
          And FechaReserva = @hoy
          And HabFechas.Origen = 'R'
          AND (Reservas.Estado = 'E' OR Reservas.Estado = 'P' OR Reservas.Estado = 'C')
      GROUP BY HabFechas.Fecha
    `)

  return result.recordset
}

// ── 4. Pick Up de AYER (reservas hechas en fechaCorte - 1 día) ──
async function getPickUpAyer(anio, mes, fechaCorte) {
  const { desde, hasta } = rangoMes(anio, mes)
  const ayer = fechaAyer(fechaCorte)
  const db   = await getPool()

  const result = await db.request()
    .input('desde', sql.VarChar, desde)
    .input('hasta', sql.VarChar, hasta)
    .input('ayer',  sql.VarChar, ayer)
    .query(`
      SELECT
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Sum(ReservasTipoHab.NumHabitaciones) AS NumHabitaciones,
          Reservas.FechaReserva,
          ReservasTipoHab.CodTipoHab
      FROM (OfiHotel001.dbo.ReservasTipoHab
          LEFT JOIN OfiHotel001.dbo.TipoHabitaciones
              ON ReservasTipoHab.CodTipoHab = TipoHabitaciones.CodTipoHab)
          LEFT JOIN OfiHotel001.dbo.Reservas
              ON ReservasTipoHab.NumReserva = Reservas.NumReserva
              AND ReservasTipoHab.NumDesglose = Reservas.NumDesglose
      WHERE Reservas.FechaEntrada <= @hasta
          AND Reservas.FechaSalida >= @desde
          AND Reservas.FechaReserva = @ayer
      GROUP BY
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Reservas.FechaReserva,
          ReservasTipoHab.CodTipoHab
    `)

  return result.recordset
}

// ── 5. Anulaciones del día ──
async function getAnulaciones(anio, mes, fechaCorte) {
  const { desde, hasta } = rangoMes(anio, mes)
  const db = await getPool()

  const result = await db.request()
    .input('desde', sql.VarChar, desde)
    .input('hasta', sql.VarChar, hasta)
    .input('hoy',   sql.VarChar, fechaCorte)
    .query(`
      SELECT DISTINCT
          Reservas.TotalHabitaciones,
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Reservas.NumReserva,
          Reservas.NumDesglose
      FROM OfiHotel001.dbo.Reservas
          INNER JOIN OfiHotel001.dbo.ReservasCambios
              On ReservasCambios.NumReserva = Reservas.NumReserva
              And Reservas.NumDesglose = ReservasCambios.NumDesglose
      WHERE Reservas.FechaEntrada <= @hasta
          And Reservas.FechaSalida >= @desde
          And Reservas.Estado = 'A'
          And ReservasCambios.Tipo = '5'
          And ReservasCambios.Fecha = @hoy
      ORDER BY Reservas.FechaEntrada, Reservas.FechaSalida
    `)

  return result.recordset
}

// ── 6. Habitaciones ocupadas reales ──
async function getOcupacionReal(anio, mes) {
  const { desde, hasta, hoy } = rangoMes(anio, mes)
  const db = await getPool()

  const result = await db.request()
    .input('desde', sql.VarChar, desde)
    .input('hasta', sql.VarChar, hasta)
    .input('hoy',   sql.VarChar, hoy)
    .query(`
      SELECT
          HabFechas.Fecha,
          Count(HabFechas.NumeroHab) AS HabOcupadas
      FROM (OfiHotel001.dbo.HabFechas
          Left Join OfiHotel001.dbo.Reservas
              On Reservas.NumDesglose = HabFechas.NumDesglose
              And Reservas.NumReserva = HabFechas.CodOrigen)
          Left Join OfiHotel001.dbo.TipoHabitaciones
              On HabFechas.CodTipoHab = TipoHabitaciones.CodTipoHab
      WHERE HabFechas.Fecha <= @hasta
          AND HabFechas.Fecha >= @desde
          And TipoHabitaciones.HabSalon <> 'S'
          And HabFechas.Origen = 'R'
          And HabFechas.DiaDeSalida <> 'S'
          AND (Reservas.Estado = 'E' OR Reservas.Estado = 'P' OR Reservas.Estado = 'C')
      GROUP BY HabFechas.Fecha
    `)

  return result.recordset
}

// ══════════════════════════════════════════
//  FUNCIONES AÑO ANTERIOR
// ══════════════════════════════════════════

function rangoMesAnterior(anio, mes) {
  const inicio = new Date(anio - 1, mes, 1)
  const fin    = new Date(anio - 1, mes + 1, 0)
  return {
    desde: formatFecha(inicio),
    hasta: formatFecha(fin)
  }
}

async function getReservasMesAnterior(anio, mes) {
  const { desde, hasta } = rangoMesAnterior(anio, mes)
  const db = await getPool()

  const result = await db.request()
    .input('desde', sql.VarChar, desde)
    .input('hasta', sql.VarChar, hasta)
    .query(`
      SELECT
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Sum(ReservasTipoHab.NumHabitaciones) AS NumHabitaciones,
          Reservas.FechaReserva,
          ReservasTipoHab.CodTipoHab
      FROM (OfiHotel001.dbo.ReservasTipoHab
          LEFT JOIN OfiHotel001.dbo.TipoHabitaciones
              ON ReservasTipoHab.CodTipoHab = TipoHabitaciones.CodTipoHab)
          LEFT JOIN OfiHotel001.dbo.Reservas
              ON ReservasTipoHab.NumReserva = Reservas.NumReserva
              AND ReservasTipoHab.NumDesglose = Reservas.NumDesglose
      WHERE Reservas.FechaEntrada <= @hasta
          AND Reservas.FechaSalida >= @desde
      GROUP BY
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Reservas.FechaReserva,
          ReservasTipoHab.CodTipoHab
    `)

  return result.recordset
}

async function getPrecioNetoAnterior(anio, mes) {
  const { desde, hasta } = rangoMesAnterior(anio, mes)
  const db = await getPool()

  const result = await db.request()
    .input('desde', sql.VarChar, desde)
    .input('hasta', sql.VarChar, hasta)
    .query(`
      SELECT
          HabFechas.Fecha,
          Avg((HabFechas.PrecioHab - ((HabFechas.PrecioHab / 100) * HabFechas.PorcNetoHab))) AS PrecioNeto
      FROM (OfiHotel001.dbo.HabFechas
          Left Join OfiHotel001.dbo.Reservas
              On 'R' + Reservas.NumReserva + Reservas.NumDesglose = HabFechas.Origen + HabFechas.CodOrigen + HabFechas.NumDesglose)
          Left Join OfiHotel001.dbo.TipoHabitaciones
              On HabFechas.CodTipoHab = TipoHabitaciones.CodTipoHab
      WHERE HabFechas.Fecha <= @hasta
          AND HabFechas.Fecha >= @desde
          And (HabFechas.Origen = 'E'
              Or (HabFechas.Origen = 'R'
                  And (Reservas.Estado = 'P' OR Reservas.Estado = 'C')))
          And DiaDeSalida <> 'S'
          And TipoHabitaciones.HabSalon <> 'S'
      GROUP BY HabFechas.Fecha
    `)

  return result.recordset
}

async function getOcupacionAnterior(anio, mes) {
  const { desde, hasta } = rangoMesAnterior(anio, mes)
  const db = await getPool()

  const result = await db.request()
    .input('desde', sql.VarChar, desde)
    .input('hasta', sql.VarChar, hasta)
    .query(`
      SELECT
          HabFechas.Fecha,
          Count(HabFechas.NumeroHab) AS HabOcupadas
      FROM (OfiHotel001.dbo.HabFechas
          Left Join OfiHotel001.dbo.Reservas
              On Reservas.NumDesglose = HabFechas.NumDesglose
              And Reservas.NumReserva = HabFechas.CodOrigen)
          Left Join OfiHotel001.dbo.TipoHabitaciones
              On HabFechas.CodTipoHab = TipoHabitaciones.CodTipoHab
      WHERE HabFechas.Fecha <= @hasta
          AND HabFechas.Fecha >= @desde
          And TipoHabitaciones.HabSalon <> 'S'
          And HabFechas.Origen = 'R'
          And HabFechas.DiaDeSalida <> 'S'
          AND (Reservas.Estado = 'E' OR Reservas.Estado = 'P' OR Reservas.Estado = 'C')
      GROUP BY HabFechas.Fecha
    `)

  return result.recordset
}

async function getAnulacionesAnterior(anio, mes, fechaCorte) {
  const { desde, hasta } = rangoMesAnterior(anio, mes)
  const fechaCorteAnt    = String(parseInt(fechaCorte) - 10000)
  const db = await getPool()

  const result = await db.request()
    .input('desde',  sql.VarChar, desde)
    .input('hasta',  sql.VarChar, hasta)
    .input('hoyAnt', sql.VarChar, fechaCorteAnt)
    .query(`
      SELECT DISTINCT
          Reservas.TotalHabitaciones,
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Reservas.NumReserva,
          Reservas.NumDesglose
      FROM OfiHotel001.dbo.Reservas
          INNER JOIN OfiHotel001.dbo.ReservasCambios
              On ReservasCambios.NumReserva = Reservas.NumReserva
              And Reservas.NumDesglose = ReservasCambios.NumDesglose
      WHERE Reservas.FechaEntrada <= @hasta
          And Reservas.FechaSalida >= @desde
          And Reservas.Estado = 'A'
          And ReservasCambios.Tipo = '5'
          And ReservasCambios.Fecha = @hoyAnt
      ORDER BY Reservas.FechaEntrada, Reservas.FechaSalida
    `)

  return result.recordset
}

// ── Pick Up de AYER del año anterior ──
async function getPickUpAyerAnterior(anio, mes, fechaCorte) {
  const { desde, hasta } = rangoMesAnterior(anio, mes)
  // Ayer del año anterior: restamos 1 año a la fecha de corte y luego 1 día
  const fechaCorteAnt    = String(parseInt(fechaCorte) - 10000)
  const ayerAnt          = fechaAyer(fechaCorteAnt)
  const db               = await getPool()

  const result = await db.request()
    .input('desde',   sql.VarChar, desde)
    .input('hasta',   sql.VarChar, hasta)
    .input('ayerAnt', sql.VarChar, ayerAnt)
    .query(`
      SELECT
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Sum(ReservasTipoHab.NumHabitaciones) AS NumHabitaciones,
          Reservas.FechaReserva,
          ReservasTipoHab.CodTipoHab
      FROM (OfiHotel001.dbo.ReservasTipoHab
          LEFT JOIN OfiHotel001.dbo.TipoHabitaciones
              ON ReservasTipoHab.CodTipoHab = TipoHabitaciones.CodTipoHab)
          LEFT JOIN OfiHotel001.dbo.Reservas
              ON ReservasTipoHab.NumReserva = Reservas.NumReserva
              AND ReservasTipoHab.NumDesglose = Reservas.NumDesglose
      WHERE Reservas.FechaEntrada <= @hasta
          AND Reservas.FechaSalida >= @desde
          AND Reservas.FechaReserva = @ayerAnt
      GROUP BY
          Reservas.FechaEntrada,
          Reservas.FechaSalida,
          Reservas.FechaReserva,
          ReservasTipoHab.CodTipoHab
    `)

  return result.recordset
}
// ══════════════════════════════════════════
//  REVENUE 
// ══════════════════════════════════════════

async function getIngresosDepartamentos(anio, mes) {
    const { desde, hasta } = rangoMes(anio, mes)
    const db = await getPool()

    const result = await db.request()
        .input('desde', sql.VarChar, desde)
        .input('hasta', sql.VarChar, hasta)
        .query(`
            SELECT
                hfc.Fecha,
                SUM(CASE WHEN hfc.CodCargo IN ('DES','DESN','DIMS') 
                    THEN hfc.PrecioCargo * hfc.Unidades ELSE 0 END) AS Desayunos,
                SUM(CASE WHEN hfc.CodCargo IN ('MP','MPN','PC','PCN','PCIM') 
                    THEN hfc.PrecioCargo * hfc.Unidades ELSE 0 END) AS Pensiones,
                SUM(CASE WHEN hfc.CodCargo IN ('MDEG','CBAN','CGAL') 
                    THEN hfc.PrecioCargo * hfc.Unidades ELSE 0 END) AS MenusBanquetes,
                SUM(CASE WHEN hfc.CodCargo IN ('BAL','BALN','BL21','BIMS','TRBA','TR21','MASJ') 
                    THEN hfc.PrecioCargo * hfc.Unidades ELSE 0 END) AS SPA,
                SUM(CASE WHEN hfc.CodCargo IN ('GRF','GF21') 
                    THEN hfc.PrecioCargo * hfc.Unidades ELSE 0 END) AS Golf,
                SUM(CASE WHEN hfc.CodCargo IN ('EVE1','EVE2','EVE3') 
                    THEN hfc.PrecioCargo * hfc.Unidades ELSE 0 END) AS Eventos,
                SUM(CASE WHEN hfc.CodCargo IN ('BI14','BI15') 
                    THEN hfc.PrecioCargo * hfc.Unidades ELSE 0 END) AS BonosIberik,
                SUM(CASE WHEN hfc.CodCargo IN ('BROM','BREL','B+55') 
                    THEN hfc.PrecioCargo * hfc.Unidades ELSE 0 END) AS BonosOtros,
                SUM(CASE WHEN hfc.CodCargo IN ('DBIE') 
                    THEN hfc.PrecioCargo * hfc.Unidades ELSE 0 END) AS Varios
            FROM OfiHotel001.dbo.HabFechasCargos hfc
            WHERE hfc.Fecha >= @desde
              AND hfc.Fecha <= @hasta
              AND hfc.CodCargo NOT IN ('HAB','HSUP','SUPL','OVB')
            GROUP BY hfc.Fecha
            ORDER BY hfc.Fecha
        `)

    return result.recordset
}



// ══════════════════════════════════════════
//  FUNCIÓN PRINCIPAL
// ══════════════════════════════════════════

async function getDatosMes(anio, mes, fechaInforme) {
  try {
    const rango      = rangoMes(anio, mes)
    const fechaCorte = fechaInforme || rango.hoy
    console.log('Fecha de corte usada:', fechaCorte)

    const [
      reservas,
      precioNeto,
      pickUpHoy,
      anulaciones,
      ocupacion,
      reservasAnt,
      precioNetoAnt,
      ocupacionAnt,
      anulacionesAnt,
      reservasAyer,
      reservasAyerAnt,
      departamentos
    ] = await Promise.all([
      getReservasMes(anio, mes),
      getPrecioMedioNeto(anio, mes),
      getPickUpHoy(anio, mes, fechaCorte),
      getAnulaciones(anio, mes, fechaCorte),
      getOcupacionReal(anio, mes),
      getReservasMesAnterior(anio, mes),
      getPrecioNetoAnterior(anio, mes),
      getOcupacionAnterior(anio, mes),
      getAnulacionesAnterior(anio, mes, fechaCorte),
      getPickUpAyer(anio, mes, fechaCorte),
      getPickUpAyerAnterior(anio, mes, fechaCorte),
      getIngresosDepartamentos(anio, mes)
    ])

    console.log('Año actual  → Reservas:', reservas.length,    '| Ocupación:', ocupacion.length)
    console.log('Año anterior → Reservas:', reservasAnt.length, '| Ocupación:', ocupacionAnt.length)
    console.log('Pick Up ayer actual:', reservasAyer.length,    '| Pick Up ayer anterior:', reservasAyerAnt.length)

    return {
      ok: true,
      data: {
        reservas,
        precioNeto,
        pickUpHoy,
        anulaciones,
        ocupacion,
        reservasAnt,
        precioNetoAnt,
        ocupacionAnt,
        anulacionesAnt,
        reservasAyer,
        reservasAyerAnt,
        departamentos,
        hoy:            fechaCorte,
        capacidadTotal: 118
      }
    }

  } catch (err) {
    console.error('Error DB:', err.message)
    return { ok: false, error: err.message }
  }
}

module.exports = { getDatosMes }