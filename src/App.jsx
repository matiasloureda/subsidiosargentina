import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronLeft,
  BadgeCheck,
  AlertTriangle,
  Info,
  RotateCcw,
  Pencil,
  HeartHandshake,
} from "lucide-react";

/* ============================================================
   ESTILOS BASE — identidad visual "ficha / expediente / sello"
   Los tres colores de jurisdicción son los mismos que ya se
   usan en los Excel de Nación, CABA y PBA, para que la app y
   las planillas se lean como una sola cosa.
============================================================ */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Archivo+Narrow:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

      .sa-root{
        --paper:#EFEDE4; --paper2:#E4E0D2; --ink:#1B1B16; --inksoft:#6B6A5D;
        --nacion:#1F3864; --nacionsoft:#DCE3EF;
        --caba:#1F4E5F; --cabasoft:#DCE9EA;
        --pba:#2E5C3E; --pbasoft:#DEE8DF;
        --sello:#A83A2C; --sellosoft:#F1DCD3;
        --line:#C9C4B3;
        background:var(--paper); color:var(--ink);
        font-family:'Archivo',sans-serif;
      }
      .sa-eyebrow{ font-family:'Archivo Narrow',sans-serif; text-transform:uppercase; letter-spacing:.13em; font-size:11px; font-weight:700; }
      .sa-mono{ font-family:'IBM Plex Mono',monospace; }
      .sa-ficha{ background:#fff; border:1px solid var(--line); border-radius:3px; position:relative; }
      .sa-ficha::before{
        content:''; position:absolute; top:-1px; left:22px; right:22px; height:1px;
        background:repeating-linear-gradient(90deg,var(--line) 0 6px, transparent 6px 12px);
      }
      .sa-stamp{
        display:inline-flex; align-items:center; gap:5px; border:2px solid var(--sello); color:var(--sello);
        border-radius:9999px; padding:4px 12px 4px 10px; transform:rotate(-6deg);
        font-family:'Archivo Narrow',sans-serif; text-transform:uppercase; letter-spacing:.07em; font-weight:700; font-size:10.5px;
        white-space:nowrap;
      }
      @keyframes saStampIn{
        0%{ opacity:0; transform:translateY(10px) rotate(-8deg) scale(.94); }
        60%{ opacity:1; transform:translateY(-2px) rotate(2deg) scale(1.015); }
        100%{ opacity:1; transform:translateY(0) rotate(0deg) scale(1); }
      }
      .sa-anim{ animation: saStampIn .45s cubic-bezier(.22,.8,.24,1) both; }
      .sa-focus:focus-visible{ outline:2px solid var(--ink); outline-offset:2px; }
      .sa-input{ border:1px solid var(--line); border-radius:6px; background:#fff; }
      .sa-input:focus{ outline:2px solid var(--ink); outline-offset:1px; }
      @media (prefers-reduced-motion: reduce){ .sa-anim{ animation:none; } }
    `}</style>
  );
}

/* ============================================================
   PARÁMETROS — todo lo que se actualiza mes a mes vive acá,
   separado de las reglas de elegibilidad (que cambian poco).
   Agosto 2026. Actualizar estos valores alcanza para que se
   recalculen solos los topes derivados.
============================================================ */
const PARAMS = { smvm: 376600, haberMinimo: 419734.71, bono: 70000 };

const tope = {
  auh: PARAMS.smvm,
  progresar: PARAMS.smvm * 3,
  vouchers: PARAMS.smvm * 7,
  suafGrupo: 6184406,
  arba: 786348.2,
  abl: 1363518.36,
  garrafa: 3771987,
  resef: 4303392,
  pamiBase: PARAMS.haberMinimo * 1.5,
  pamiConCud: PARAMS.haberMinimo * 3,
};

const puamMonto = PARAMS.haberMinimo * 0.8 + PARAMS.bono;
const pncMonto = PARAMS.haberMinimo * 0.7 + PARAMS.bono;
const pncMadre7Monto = PARAMS.haberMinimo * 1 + PARAMS.bono;

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}
function suafMonto(ingreso) {
  if (ingreso <= 1167863) return 75433;
  if (ingreso <= 1712784) return 50884;
  if (ingreso <= 1977464) return 30777;
  if (ingreso <= 6184406) return 15881;
  return 0;
}
function desempleoCuotas(meses) {
  if (meses >= 36) return 12;
  if (meses >= 24) return 8;
  if (meses >= 12) return 4;
  if (meses >= 6) return 2;
  return 0;
}
function lineaProgresar(nivel) {
  if (nivel === "primario" || nivel === "secundario") return "Progresar Obligatorio";
  if (nivel === "formacion_profesional") return "Progresar Trabajo";
  if (nivel === "terciario" || nivel === "universitario") return "Progresar Superior";
  return "Progresar";
}
const R = (kind, label, test) => ({ kind, label, test });

/* ============================================================
   CATÁLOGO — 51 programas (25 Nación, 14 CABA, 12 PBA).
   Cada uno con: requisitos (condiciones), documentos (qué
   entregar), tramite (cómo se pide) y donde (a dónde ir).
============================================================ */
const PROGRAMS = [
  // ================= NACIÓN =================
  {
    id: "n-auh", jurisdiccion: "NACION", nombre: "Asignación Universal por Hijo (AUH)",
    categoria: "Familia e infancia", organismo: "ANSES",
    monto: "$150.848 por hijo (80% mensual + 20% al presentar la libreta). Hijo con discapacidad: $491.173.",
    requisitos: ["Hijos menores de 18 (sin límite si tienen discapacidad)", "Sin trabajo formal registrado", "Ingreso familiar por debajo de 1 SMVM ($376.600)"],
    documentos: ["DNI del titular y de cada hijo/a", "Partida de nacimiento de los hijos", "CBU de una cuenta a tu nombre", "Libreta sanitaria y constancia de escolaridad (se presentan luego para no perder el 20%)"],
    tramite: "Alta en Mi ANSES o en una oficina, cargando los datos del grupo familiar.",
    donde: "ANSES — anses.gob.ar o cualquier oficina",
    rules: [
      R("OBLIGATORIA", "Tener al menos un hijo menor a cargo", (p) => p.hijosMenores > 0),
      R("OBLIGATORIA", "No tener trabajo formal registrado", (p) => p.situacionLaboral !== "formal"),
      R("OBLIGATORIA", "Ingreso familiar por debajo de 1 SMVM ($376.600)", (p) => p.ingresoFamiliar <= tope.auh),
    ],
  },
  {
    id: "n-aue", jurisdiccion: "NACION", nombre: "Asignación por Embarazo (AUE)",
    categoria: "Familia e infancia", organismo: "ANSES",
    monto: "$150.848 mensuales, mismo esquema que la AUH.",
    requisitos: ["Embarazo de 12 semanas o más", "Sin trabajo formal registrado", "Ingreso familiar por debajo de 1 SMVM"],
    documentos: ["DNI de la persona gestante", "Certificado médico de embarazo con semanas de gestación", "CBU de una cuenta a tu nombre"],
    tramite: "Se solicita en ANSES presentando el certificado médico de embarazo.",
    donde: "ANSES — anses.gob.ar",
    rules: [
      R("OBLIGATORIA", "Estar embarazada de 12 semanas o más", (p) => p.embarazoSemanas >= 12),
      R("OBLIGATORIA", "No tener trabajo formal registrado", (p) => p.situacionLaboral !== "formal"),
      R("OBLIGATORIA", "Ingreso familiar por debajo de 1 SMVM ($376.600)", (p) => p.ingresoFamiliar <= tope.auh),
    ],
  },
  {
    id: "n-suaf", jurisdiccion: "NACION", nombre: "Asignaciones Familiares (SUAF)",
    categoria: "Familia e infancia", organismo: "ANSES",
    monto: (p) => `Según tu ingreso familiar, te correspondería aprox. ${fmt(suafMonto(p.ingresoFamiliar))} por hijo.`,
    requisitos: ["Trabajo formal en relación de dependencia", "Hijos a cargo", "Ingreso del grupo familiar por debajo de $6.184.406"],
    documentos: ["DNI de todo el grupo familiar cargado en Mi ANSES", "Partida de nacimiento de los hijos", "Recibo de sueldo (lo pide el empleador, no vos)"],
    tramite: "Se liquida automáticamente junto al sueldo si tus datos familiares están cargados en Mi ANSES.",
    donde: "ANSES — anses.gob.ar",
    rules: [
      R("OBLIGATORIA", "Tener trabajo formal en relación de dependencia", (p) => p.situacionLaboral === "formal"),
      R("OBLIGATORIA", "Tener al menos un hijo a cargo", (p) => p.hijosMenores > 0),
      R("OBLIGATORIA", "Ingreso familiar por debajo de $6.184.406", (p) => p.ingresoFamiliar <= tope.suafGrupo),
    ],
  },
  {
    id: "n-alimentar", jurisdiccion: "NACION", nombre: "Tarjeta Alimentar",
    categoria: "Alimentaria", organismo: "ANSES",
    monto: (p) => (p.hijosMenores >= 3 ? "$149.425 (3 o más hijos)" : p.hijosMenores === 2 ? "$113.299 (2 hijos)" : "$72.250 (1 hijo o AUE)"),
    requisitos: ["Ser titular de AUH o de AUE", "Hijos de hasta 17 años (sin límite si tienen discapacidad)"],
    documentos: ["Ninguno adicional: se activa sola si sos titular de AUH o AUE"],
    tramite: "Automático: se acredita junto con la AUH o AUE, en la misma cuenta.",
    donde: "ANSES — anses.gob.ar",
    rules: [
      R("OBLIGATORIA", "Ser titular de AUH o de AUE", (p) =>
        (p.hijosMenores > 0 && p.situacionLaboral !== "formal" && p.ingresoFamiliar <= tope.auh) ||
        (p.embarazoSemanas >= 12 && p.situacionLaboral !== "formal" && p.ingresoFamiliar <= tope.auh)
      ),
      R("EXCLUYENTE", "Ya cobra el Plan Más Vida de la Provincia (son incompatibles)", (p) => p.prestaciones.includes("pba-mas-vida")),
    ],
  },
  {
    id: "n-ayuda-escolar", jurisdiccion: "NACION", nombre: "Ayuda Escolar Anual",
    categoria: "Educación", organismo: "ANSES",
    monto: "$55.672 por hijo (base) — hasta $85.000 con el refuerzo vigente en 2026.",
    requisitos: ["Ser titular de AUH, SUAF, PNC o Prestación por Desempleo", "Hijos de 45 días a 18 años (sin límite si tienen discapacidad)"],
    documentos: ["Certificado de inicio del ciclo lectivo o de tratamiento de rehabilitación (se presenta después)"],
    tramite: "Pago único automático al inicio de clases; luego hay que cargar el certificado escolar en Mi ANSES.",
    donde: "ANSES — anses.gob.ar",
    rules: [R("OBLIGATORIA", "Tener hijos a cargo y cobrar alguna asignación de base", (p) => p.hijosMenores > 0)],
  },
  {
    id: "n-nacimiento", jurisdiccion: "NACION", nombre: "Asignación por Nacimiento o Adopción",
    categoria: "Familia e infancia", organismo: "ANSES",
    monto: "$87.926 por nacimiento — $525.682 por adopción (pago único).",
    requisitos: ["Hijo/a nacido/a o adoptado/a hace menos de 2 años", "Titular del SUAF (trabajo formal)"],
    documentos: ["Partida de nacimiento o sentencia de adopción", "DNI del hijo/a"],
    tramite: "Se solicita en Mi ANSES o en oficina, dentro de los 2 años del nacimiento o la adopción.",
    donde: "ANSES — anses.gob.ar",
    rules: [
      R("OBLIGATORIA", "Tener trabajo formal (titular del SUAF)", (p) => p.situacionLaboral === "formal"),
      R("OBLIGATORIA", "Hijo/a de hasta 1 año a cargo", (p) => p.hijosMenores > 0 && p.edadHijoMenor <= 1),
    ],
  },
  {
    id: "n-leche-1000dias", jurisdiccion: "NACION", nombre: "Complemento Leche (Plan 1000 Días)",
    categoria: "Familia e infancia", organismo: "ANSES",
    monto: "$55.841 mensuales por hijo/a de hasta 3 años.",
    requisitos: ["Ser titular de AUH o AUE", "Hijo/a de hasta 3 años"],
    documentos: ["Ninguno adicional: se activa sola si sos titular de AUH o AUE con hijos pequeños"],
    tramite: "Automático, en la misma cuenta y calendario de la AUH o AUE.",
    donde: "ANSES — anses.gob.ar",
    rules: [
      R("OBLIGATORIA", "Ser titular de AUH o AUE", (p) => (p.hijosMenores > 0 || p.embarazoSemanas >= 12) && p.situacionLaboral !== "formal" && p.ingresoFamiliar <= tope.auh),
      R("OBLIGATORIA", "Tener un hijo/a de hasta 3 años", (p) => p.hijosMenores > 0 && p.edadHijoMenor <= 3),
    ],
  },
  {
    id: "n-puam", jurisdiccion: "NACION", nombre: "Pensión Universal para el Adulto Mayor (PUAM)",
    categoria: "Adultos mayores", organismo: "ANSES",
    monto: `Haber: ${fmt(puamMonto)} (80% de la jubilación mínima + bono).`,
    requisitos: ["65 años o más", "No cobrar ni tener derecho a otra jubilación o pensión", "Residencia acreditada en el país"],
    documentos: ["DNI", "CUIL", "Clave de la Seguridad Social (se genera en el momento si no la tenés)"],
    tramite: "Trámite gratuito por Mi ANSES o presencial.",
    donde: "ANSES — anses.gob.ar",
    rules: [
      R("OBLIGATORIA", "Tener 65 años o más", (p) => p.edad >= 65),
      R("OBLIGATORIA", "No cobrar ya una jubilación o pensión", (p) => p.situacionLaboral !== "jubilado" && p.situacionLaboral !== "pensionado"),
    ],
  },
  {
    id: "n-pnc-invalidez", jurisdiccion: "NACION", nombre: "Pensión No Contributiva por Invalidez",
    categoria: "Discapacidad", organismo: "ANSES + ANDIS",
    monto: `70% de la jubilación mínima + bono: aprox. ${fmt(pncMonto)}.`,
    requisitos: ["66% o más de incapacidad laboral (CUD/CMO)", "No tener otra jubilación o pensión", "Situación de vulnerabilidad económica"],
    documentos: ["DNI", "Certificado Médico Oficial (CMO) de un hospital público", "CUD si ya lo tenés", "Declaración jurada de ingresos y patrimonio"],
    tramite: "Se inicia por Mi ANSES o con turno presencial.",
    donde: "ANSES / ANDIS",
    rules: [
      R("OBLIGATORIA", "Tener discapacidad certificada (CUD)", (p) => p.tieneCUD),
      R("OBLIGATORIA", "No cobrar ya otra jubilación o pensión", (p) => p.situacionLaboral !== "jubilado" && p.situacionLaboral !== "pensionado"),
    ],
    notas: ["Desde el Decreto 84/2026, este beneficio se convierte de oficio al nuevo régimen de PNC por Discapacidad para Protección Social."],
  },
  {
    id: "n-pnc-vejez", jurisdiccion: "NACION", nombre: "Pensión No Contributiva por Vejez",
    categoria: "Adultos mayores", organismo: "ANSES + ANDIS",
    monto: `70% de la jubilación mínima + bono: aprox. ${fmt(pncMonto)}.`,
    requisitos: ["70 años o más", "Sin jubilación, pensión ni bienes suficientes"],
    documentos: ["DNI", "Declaración jurada de ingresos y patrimonio", "Constancia de que no tenés otra prestación"],
    tramite: "Trámite en ANSES/ANDIS con turno previo.",
    donde: "ANSES / ANDIS",
    rules: [
      R("OBLIGATORIA", "Tener 70 años o más", (p) => p.edad >= 70),
      R("OBLIGATORIA", "No cobrar ya una jubilación o pensión", (p) => p.situacionLaboral !== "jubilado" && p.situacionLaboral !== "pensionado"),
    ],
    notas: ["En la práctica, la mayoría de estos casos hoy se resuelve por la PUAM (menos exigente y con haber mayor)."],
  },
  {
    id: "n-pnc-madre7", jurisdiccion: "NACION", nombre: "Pensión No Contributiva Madre de 7 hijos",
    categoria: "Familia e infancia", organismo: "ANSES",
    monto: `100% de la jubilación mínima + bono: aprox. ${fmt(pncMadre7Monto)}.`,
    requisitos: ["Haber tenido o adoptado 7 hijos o más", "No tener empleo registrado ni otra jubilación o pensión"],
    documentos: ["DNI", "Las 7 partidas de nacimiento (o de adopción)", "Formulario PS 6.18"],
    tramite: "Presencial en ANSES con el formulario PS 6.18 y las 7 partidas de nacimiento.",
    donde: "ANSES — anses.gob.ar",
    rules: [
      R("OBLIGATORIA", "Haber tenido o adoptado 7 hijos o más", (p) => p.tuvoSieteHijos),
      R("OBLIGATORIA", "No tener trabajo formal ni otra jubilación", (p) => p.situacionLaboral !== "formal" && p.situacionLaboral !== "jubilado" && p.situacionLaboral !== "pensionado"),
    ],
  },
  {
    id: "n-pami-subsidio-social", jurisdiccion: "NACION", nombre: "PAMI — Subsidio social de medicamentos",
    categoria: "Salud", organismo: "PAMI",
    monto: "Cobertura del 100% en medicamentos esenciales; fuera del listado, entre 40% y 80% según patología.",
    requisitos: [
      `Ser jubilado/a o pensionado/a`,
      `Ingresos por debajo de 1,5 haberes mínimos (${fmt(tope.pamiBase)}), o hasta 3 (${fmt(tope.pamiConCud)}) si convivís con alguien con CUD`,
      "No estar afiliado a una prepaga",
    ],
    documentos: ["DNI", "Credencial de PAMI", "Receta electrónica del médico", "Recibo de haberes"],
    tramite: "Se tramita en pami.org.ar, en la UGL o Agencia de tu zona.",
    donde: "PAMI — pami.org.ar",
    rules: [
      R("OBLIGATORIA", "Ser jubilado/a o pensionado/a", (p) => p.situacionLaboral === "jubilado" || p.situacionLaboral === "pensionado"),
      R("OBLIGATORIA", "Ingresos dentro del tope según tengas o no un familiar con CUD", (p) => p.ingresoFamiliar <= (p.tieneCUD ? tope.pamiConCud : tope.pamiBase)),
    ],
  },
  {
    id: "n-pas", jurisdiccion: "NACION", nombre: "Programa Acompañamiento Social (ex Potenciar Trabajo)",
    categoria: "Empleo", organismo: "Min. Capital Humano / ANSES",
    monto: "$78.000 mensuales.",
    requisitos: ["Situación de vulnerabilidad social", "Estar ya incorporado al padrón del programa"],
    documentos: ["DNI", "CUIL"],
    tramite: "No tiene inscripción abierta al público: se accede por incorporación previa al padrón.",
    donde: "Consultá en Mi ANSES > Mis cobros",
    rules: [
      R("OBLIGATORIA", "Ser mayor de 18 años", (p) => p.edad >= 18),
      R("OBLIGATORIA", "Estar en situación de desempleo o informalidad", (p) => p.situacionLaboral === "informal" || p.situacionLaboral === "desocupado"),
    ],
    notas: ["No hay ventanilla de alta abierta al público general: confirmá tu situación en Mi ANSES."],
  },
  {
    id: "n-monotributo-social", jurisdiccion: "NACION", nombre: "Monotributo Social (REDLES)",
    categoria: "Empleo", organismo: "Secretaría de Trabajo",
    monto: "Permite facturar, tener obra social y aportar jubilación pagando el 50% del componente de obra social.",
    requisitos: ["Actividad económica única (emprendimiento, feria, cooperativa)", "Ingresos por debajo del tope de la categoría A del monotributo"],
    documentos: ["DNI", "CUIL", "Descripción de la actividad económica"],
    tramite: "Inscripción en el REDLES (Registro de Efectores), hoy en la Secretaría de Trabajo.",
    donde: "Secretaría de Trabajo, Empleo y Seguridad Social",
    rules: [
      R("OBLIGATORIA", "Ser mayor de 18 años", (p) => p.edad >= 18),
      R("OBLIGATORIA", "Tener una actividad económica informal", (p) => p.situacionLaboral === "informal"),
      R("EXCLUYENTE", "Ya tenés Monotributo Social", (p) => p.situacionLaboral === "monotributo_social"),
    ],
  },
  {
    id: "n-progresar", jurisdiccion: "NACION", nombre: "Becas Progresar",
    categoria: "Educación", organismo: "Min. Capital Humano",
    monto: (p) => `$35.000 mensuales (80% + 20% al certificar regularidad) — línea ${lineaProgresar(p.nivelEducativo)}.`,
    requisitos: ["Ser estudiante regular", "Ingreso familiar por debajo de 3 SMVM ($1.129.800)"],
    documentos: ["DNI", "Usuario en Mi Argentina", "Constancia de alumno regular (se presenta después)"],
    tramite: "Inscripción online por Mi Argentina o la plataforma Progresar.",
    donde: "argentina.gob.ar/progresar",
    rules: [
      R("OBLIGATORIA", "Ser alumno/a regular", (p) => p.esAlumno),
      R("OBLIGATORIA", "Ingreso familiar por debajo de 3 SMVM ($1.129.800)", (p) => p.ingresoFamiliar <= tope.progresar),
    ],
  },
  {
    id: "n-desempleo", jurisdiccion: "NACION", nombre: "Prestación por Desempleo",
    categoria: "Empleo", organismo: "ANSES",
    monto: (p) => {
      const c = desempleoCuotas(p.mesesAportes);
      return c > 0 ? `75% de tu último sueldo (tope $376.600), en ${c} cuotas.` : "No alcanzarías el mínimo de aportes exigido.";
    },
    requisitos: ["Despido sin justa causa o fin de contrato", "Al menos 6 meses de aportes en los últimos 3 años"],
    documentos: ["DNI", "Telegrama o carta documento de despido", "CBU de una cuenta a tu nombre"],
    tramite: "Trámite online por Mi ANSES dentro de los 90 días hábiles del cese laboral.",
    donde: "ANSES — anses.gob.ar",
    rules: [
      R("OBLIGATORIA", "Estar desempleado/a", (p) => p.situacionLaboral === "desocupado"),
      R("OBLIGATORIA", "Tener al menos 6 meses de aportes en los últimos 3 años", (p) => p.mesesAportes >= 6),
    ],
  },
  {
    id: "n-resef", jurisdiccion: "NACION", nombre: "Subsidios de energía (ReSEF) — luz y gas",
    categoria: "Energía", organismo: "Secretaría de Energía",
    monto: "Bonificación del 50% sobre bloques de consumo de electricidad y gas natural.",
    requisitos: ["Ingreso del hogar por debajo de 3 canastas básicas totales", "Sin patrimonio incompatible (autos nuevos, varios inmuebles)"],
    documentos: ["DNI", "Número de medidor o NIS de la factura", "CUIL de los mayores de 18 del hogar"],
    tramite: "Inscripción online en subsidios-energia.argentina.gob.ar.",
    donde: "argentina.gob.ar/subsidios",
    rules: [
      R("OBLIGATORIA", "Ingreso del hogar por debajo de la referencia de 3 CBT ($4.303.392)", (p) => p.ingresoFamiliar <= tope.resef),
      R("OBLIGATORIA", "No tener más de un inmueble", (p) => p.cantidadInmuebles <= 1),
    ],
  },
  {
    id: "n-garrafa", jurisdiccion: "NACION", nombre: "Subsidio a la garrafa (ex Programa Hogar)",
    categoria: "Energía", organismo: "Secretaría de Energía",
    monto: "Reintegro de $9.593 por garrafa de 10 kg, pagando con BNA+ o MODO.",
    requisitos: ["Sin conexión a la red de gas natural", "Ingreso del hogar por debajo de 3 CBT ($3.771.987)"],
    documentos: ["DNI", "CUIL de los mayores de 18 del hogar", "Correo electrónico", "Billetera BNA+ o MODO activa"],
    tramite: "Inscripción en el ReSEF (subsidios-energia.argentina.gob.ar).",
    donde: "argentina.gob.ar/subsidios",
    rules: [
      R("OBLIGATORIA", "No tener gas natural por red", (p) => !p.tieneGasRed),
      R("OBLIGATORIA", "Ingreso del hogar por debajo de la referencia ($3.771.987)", (p) => p.ingresoFamiliar <= tope.garrafa),
    ],
  },
  {
    id: "n-zona-fria", jurisdiccion: "NACION", nombre: "Régimen de Zona Fría (gas)",
    categoria: "Energía", organismo: "Secretaría de Energía",
    monto: "Descuento de entre 30% y 50% sobre la factura de gas natural.",
    requisitos: ["Vivir en una localidad reconocida como Zona Fría"],
    documentos: ["Ninguno: el descuento se aplica automático en la factura si tu localidad está alcanzada"],
    tramite: "Automático en la factura. Si no aparece y creés que te corresponde, reclamá ante tu distribuidora de gas.",
    donde: "Distribuidora de gas de tu zona",
    rules: [R("OBLIGATORIA", "Vivir en una localidad de Zona Fría", (p) => p.zonaFria)],
    notas: ["Hay un proyecto con media sanción en Diputados que recortaría este régimen; mientras no se apruebe en el Senado, sigue vigente."],
  },
  {
    id: "n-tarifa-social-agua", jurisdiccion: "NACION", nombre: "Tarifa Social de Agua",
    categoria: "Energía", organismo: "AySA / prestadora local",
    monto: "Cubre una parte de la factura de agua y cloacas.",
    requisitos: ["Ingreso del hogar bajo", "No se otorga automática: hay que pedirla"],
    documentos: ["DNI", "Última factura de agua", "Declaración jurada de ingresos"],
    tramite: "Se solicita ante la empresa prestadora (AySA en AMBA, o el ente provincial correspondiente). Dura 1 año en tramos bimestrales.",
    donde: "AySA o prestadora de tu zona",
    rules: [
      R("OBLIGATORIA", "Vivir en un área con esta prestadora (CABA o PBA)", (p) => p.provincia === "CABA" || p.provincia === "PBA"),
      R("OBLIGATORIA", "Ingreso del hogar por debajo de la referencia de 3 CBT ($4.303.392)", (p) => p.ingresoFamiliar <= tope.resef),
    ],
  },
  {
    id: "n-transporte-discapacidad", jurisdiccion: "NACION", nombre: "Transporte público gratuito por discapacidad",
    categoria: "Transporte", organismo: "Sec. de Transporte + ANDIS",
    monto: "Viaje sin costo en todo el transporte público, vinculado a tu SUBE.",
    requisitos: ["Certificado Único de Discapacidad (CUD) vigente", "SUBE registrada a tu nombre"],
    documentos: ["DNI", "CUD vigente", "Tarjeta SUBE"],
    tramite: "Se activa el atributo en tu SUBE, coordinado entre ANDIS y transporte.",
    donde: "argentina.gob.ar/andis",
    rules: [
      R("OBLIGATORIA", "Tener CUD vigente", (p) => p.tieneCUD),
      R("OBLIGATORIA", "Tener SUBE registrada", (p) => p.tieneSube),
    ],
  },
  {
    id: "n-tarifa-social-transporte", jurisdiccion: "NACION", nombre: "Tarifa Social Federal (SUBE)",
    categoria: "Transporte", organismo: "Sec. de Transporte + ANSES",
    monto: "55% de descuento en colectivos, trenes y subtes.",
    requisitos: ["Ser titular de AUH, AUE, PNC, PAS, Progresar, jubilación mínima o Desempleo"],
    documentos: ["DNI", "Tarjeta SUBE registrada a tu nombre"],
    tramite: "Generá el PIN en Mi ANSES, registrá la SUBE en argentina.gob.ar/sube y activala en una Terminal Automática.",
    donde: "argentina.gob.ar/sube",
    rules: [
      R("OBLIGATORIA", "Cobrar alguna prestación que da acceso a la tarifa social", (p) =>
        p.situacionLaboral === "jubilado" || p.situacionLaboral === "pensionado" || p.situacionLaboral === "casas_particulares" ||
        (p.hijosMenores > 0 && p.situacionLaboral !== "formal") || p.esAlumno || p.situacionLaboral === "desocupado" || p.tieneCUD
      ),
    ],
  },
  {
    id: "n-vouchers", jurisdiccion: "NACION", nombre: "Vouchers Educativos",
    categoria: "Educación", organismo: "Sec. de Educación",
    monto: "50% de la cuota de jornada simple, con tope por hijo.",
    requisitos: ["Hijos en escuela privada con aporte estatal", "Ingreso familiar por debajo de 7 SMVM ($2.504.600)"],
    documentos: ["DNI del titular e hijos", "Declaración jurada de ingresos"],
    tramite: "Inscripción digital por Mi Argentina.",
    donde: "Mi Argentina",
    rules: [
      R("OBLIGATORIA", "Tener hijos en escuela privada con aporte estatal", (p) => p.esAlumno && p.escuelaGestion === "privada_con_aporte"),
      R("OBLIGATORIA", "Ingreso familiar por debajo de 7 SMVM ($2.504.600)", (p) => p.ingresoFamiliar <= tope.vouchers),
    ],
  },
  {
    id: "n-casa-propia", jurisdiccion: "NACION", nombre: "Casa Propia — Construir Futuro",
    categoria: "Vivienda", organismo: "Min. Desarrollo Territorial y Hábitat",
    monto: "Adjudicación de vivienda o crédito a tasa cero para refacción/construcción en lote propio.",
    requisitos: ["Mayor de 18 años", "No tener vivienda propia", "Vulnerabilidad habitacional"],
    documentos: ["DNI", "CUIL", "Constancia de que no sos propietario/a"],
    tramite: "Inscripción a sorteos en argentina.gob.ar/habitat/casapropia (hoy sin convocatorias abiertas de forma permanente).",
    donde: "argentina.gob.ar/habitat/casapropia",
    rules: [
      R("OBLIGATORIA", "Ser mayor de 18 años", (p) => p.edad >= 18),
      R("OBLIGATORIA", "No tener vivienda propia", (p) => p.cantidadInmuebles === 0),
    ],
    notas: ["El programa no tiene convocatorias abiertas de forma permanente: hay que verificar si hay sorteo vigente en tu zona."],
  },
  {
    id: "n-credito-hipotecario-bna", jurisdiccion: "NACION", nombre: "Créditos hipotecarios de banca pública (BNA)",
    categoria: "Vivienda", organismo: "Banco Nación",
    monto: "Financiación de hasta el 80% del valor de tasación, en UVA.",
    requisitos: ["Trabajo formal, monotributo o jubilación", "Sin vivienda propia", "Ahorro previo del 20-30% del valor de la propiedad", "Cuota ≤ 25-30% del ingreso familiar"],
    documentos: ["DNI", "Últimos 3 recibos de sueldo o certificado de ingresos", "Resúmenes bancarios", "Tasación de la propiedad"],
    tramite: "Solicitud en cualquier sucursal o en bna.com.ar.",
    donde: "Banco Nación",
    rules: [
      R("OBLIGATORIA", "Tener trabajo formal, monotributo o jubilación", (p) => ["formal", "monotributista", "jubilado", "pensionado"].includes(p.situacionLaboral)),
      R("OBLIGATORIA", "No tener vivienda propia", (p) => p.cantidadInmuebles === 0),
    ],
  },

  // ================= CABA =================
  {
    id: "caba-ciudadania-portena", jurisdiccion: "CABA", nombre: "Ciudadanía Porteña Con Todo Derecho",
    categoria: "Alimentaria / ingresos", organismo: "Min. Desarrollo Humano y Hábitat (GCBA)",
    monto: "Monto variable según composición del hogar (tarjeta precargada).",
    requisitos: ["2 años de residencia ininterrumpida en CABA", "DNI del titular y de todo el grupo familiar"],
    documentos: ["DNI o Credencial de Residencia Precaria de todo el hogar", "Partida de nacimiento de menores de 18", "Certificados de escolaridad", "CUIL", "Negativa de ANSES"],
    tramite: "Online por TAD con usuario miBA, o presencial con turno en la Sede Comunal.",
    donde: "Sede Comunal / Servicio Social Zonal",
    rules: [R("OBLIGATORIA", "Vivir en CABA hace 2 años o más", (p) => p.provincia === "CABA" && p.aniosResidencia >= 2)],
  },
  {
    id: "caba-ticket-social", jurisdiccion: "CABA", nombre: "Ticket Social",
    categoria: "Alimentaria", organismo: "Min. Desarrollo Humano y Hábitat (GCBA)",
    monto: "Tarjeta precargada para alimentos, monto según evaluación social.",
    requisitos: ["Residencia en CABA", "Situación de inseguridad alimentaria"],
    documentos: ["DNI de todo el grupo familiar", "Evaluación del Servicio Social Zonal"],
    tramite: "En el Servicio Social Zonal o la Sede Comunal.",
    donde: "Sede Comunal / Servicio Social Zonal",
    rules: [R("OBLIGATORIA", "Vivir en CABA", (p) => p.provincia === "CABA")],
    notas: ["Es la línea complementaria de Ciudadanía Porteña, con criterios más flexibles."],
  },
  {
    id: "caba-estudiar-es-trabajar", jurisdiccion: "CABA", nombre: "Estudiar es Trabajar",
    categoria: "Educación", organismo: "Min. Desarrollo Humano y Hábitat (GCBA)",
    monto: "Subsidio adicional en la Tarjeta para Jóvenes (permite extraer efectivo para materiales).",
    requisitos: ["Entre 18 y 60 años", "Ser estudiante regular"],
    documentos: ["DNI", "Constancia de inscripción o alumno regular"],
    tramite: "Inscripción abierta todo el año en el Servicio Social Zonal.",
    donde: "Sede Comunal / Servicio Social Zonal",
    rules: [
      R("OBLIGATORIA", "Vivir en CABA", (p) => p.provincia === "CABA"),
      R("OBLIGATORIA", "Tener entre 18 y 60 años", (p) => p.edad >= 18 && p.edad <= 60),
      R("OBLIGATORIA", "Ser alumno/a regular", (p) => p.esAlumno),
    ],
  },
  {
    id: "caba-red-primeros-meses", jurisdiccion: "CABA", nombre: "Red Primeros Meses",
    categoria: "Familia e infancia", organismo: "Min. Desarrollo Humano y Hábitat (GCBA)",
    monto: "Subsidio adicional para el cuidado de salud de la madre y el bebé.",
    requisitos: ["Embarazo o hijo/a menor de 1 año", "2 años de residencia en CABA"],
    documentos: ["DNI", "Ficha de control de embarazo o certificado de nacimiento"],
    tramite: "Se tramita junto con Ciudadanía Porteña, en la Sede Comunal.",
    donde: "Sede Comunal / Servicio Social Zonal",
    rules: [
      R("OBLIGATORIA", "Vivir en CABA hace 2 años o más", (p) => p.provincia === "CABA" && p.aniosResidencia >= 2),
      R("OBLIGATORIA", "Estar embarazada o tener un hijo/a menor de 1 año", (p) => p.embarazoSemanas >= 1 || (p.hijosMenores > 0 && p.edadHijoMenor < 1)),
    ],
  },
  {
    id: "caba-nuestras-familias", jurisdiccion: "CABA", nombre: "Nuestras Familias",
    categoria: "Ingresos / emergencia", organismo: "DG Atención Integral Inmediata (GCBA)",
    monto: "Asistencia económica según evaluación del caso.",
    requisitos: ["No percibir AUH", "2 años de residencia en CABA", "Situación de vulnerabilidad social"],
    documentos: ["DNI de todo el grupo conviviente", "CUIL y negativa de ANSES", "Partida de nacimiento de los hijos", "Certificado de escolaridad"],
    tramite: "Inscripción en las Sedes de Atención Social.",
    donde: "Av. Entre Ríos 1492, CABA",
    rules: [
      R("OBLIGATORIA", "Vivir en CABA hace 2 años o más", (p) => p.provincia === "CABA" && p.aniosResidencia >= 2),
      R("EXCLUYENTE", "Ya cobrás AUH (son incompatibles)", (p) => p.prestaciones.includes("n-auh")),
    ],
  },
  {
    id: "caba-690", jurisdiccion: "CABA", nombre: "Subsidio 690 — Familias en Situación de Calle",
    categoria: "Vivienda / emergencia", organismo: "DG Atención Integral Inmediata (GCBA)",
    monto: "Cuotas mensuales de destino exclusivamente habitacional (monto variable).",
    requisitos: ["Situación de calle o inminente desamparo habitacional", "2 años de residencia en CABA"],
    documentos: ["Informe social firmado por un/a trabajador/a social", "DNI del grupo familiar", "Presupuesto de alquiler con datos del propietario"],
    tramite: "Av. Entre Ríos 1492, lunes a viernes de 9 a 15h.",
    donde: "atencioninmediata@buenosaires.gob.ar",
    rules: [
      R("OBLIGATORIA", "Vivir en CABA hace 2 años o más", (p) => p.provincia === "CABA" && p.aniosResidencia >= 2),
      R("OBLIGATORIA", "Estar en situación de calle o riesgo de desalojo", (p) => p.situacionHabitacional === "situacion_calle" || p.situacionHabitacional === "riesgo_desalojo"),
    ],
  },
  {
    id: "caba-vivir-en-casa", jurisdiccion: "CABA", nombre: "Vivir en Casa",
    categoria: "Vivienda / personas mayores", organismo: "Min. Desarrollo Humano y Hábitat (GCBA)",
    monto: "Asistencia mensual para alquiler, expensas u otros gastos de vivienda.",
    requisitos: ["60 años o más", "2 años de residencia en CABA", "No recibir otro subsidio habitacional"],
    documentos: ["DNI", "Recibo de haberes (jubilación/pensión)", "Comprobantes de alquiler, expensas o servicios", "Certificado de domicilio"],
    tramite: "Presencial con turno.",
    donde: "Secretaría de Personas Mayores (GCBA)",
    rules: [
      R("OBLIGATORIA", "Tener 60 años o más", (p) => p.edad >= 60),
      R("OBLIGATORIA", "Vivir en CABA hace 2 años o más", (p) => p.provincia === "CABA" && p.aniosResidencia >= 2),
      R("EXCLUYENTE", "Ya recibe otro subsidio habitacional", (p) => p.prestaciones.includes("caba-690") || p.prestaciones.includes("pba-ivba")),
    ],
  },
  {
    id: "caba-hogares-residencia", jurisdiccion: "CABA", nombre: "Hogares de Residencia Permanente",
    categoria: "Personas mayores", organismo: "Min. Desarrollo Humano y Hábitat (GCBA)",
    monto: "Alojamiento con atención integral y continua, sin costo.",
    requisitos: ["60 años o más", "Sin vivienda ni red familiar de contención", "Sin cobertura social ni ingresos suficientes"],
    documentos: ["DNI", "Evaluación social y de salud previa"],
    tramite: "Solicitud de ingreso ante la Secretaría de Personas Mayores.",
    donde: "Secretaría de Personas Mayores (GCBA)",
    rules: [
      R("OBLIGATORIA", "Tener 60 años o más", (p) => p.edad >= 60),
      R("OBLIGATORIA", "Vivir en CABA", (p) => p.provincia === "CABA"),
      R("OBLIGATORIA", "No tener vivienda propia", (p) => p.cantidadInmuebles === 0),
      R("OBLIGATORIA", "Estar en situación de calle o alta vulnerabilidad", (p) => p.situacionHabitacional === "situacion_calle"),
    ],
  },
  {
    id: "caba-cobertura-salud", jurisdiccion: "CABA", nombre: "Cobertura Porteña de Salud",
    categoria: "Salud", organismo: "Ministerio de Salud (GCBA)",
    monto: "Plan médico gratuito: consultas y medicamentos sin cargo.",
    requisitos: ["Vivir en CABA", "No tener obra social ni prepaga"],
    documentos: ["DNI con domicilio en CABA (o comprobante de trámite + boleta de servicio)"],
    tramite: "Acercate al puesto de Cobertura Porteña del hospital más cercano.",
    donde: "Hospitales y CeSAC de CABA",
    rules: [
      R("OBLIGATORIA", "Vivir en CABA", (p) => p.provincia === "CABA"),
      R("OBLIGATORIA", "No tener obra social ni prepaga", (p) => !p.tieneObraSocial),
    ],
  },
  {
    id: "caba-cpi", jurisdiccion: "CABA", nombre: "Centros de Primera Infancia (CPI)",
    categoria: "Familia e infancia", organismo: "Min. Desarrollo Humano y Hábitat (GCBA)",
    monto: "Espacio gratuito de cuidado, estimulación y alimentación.",
    requisitos: ["Hijos de 45 días a 4 años", "Situación de vulnerabilidad social"],
    documentos: ["DNI del niño/a y del adulto responsable", "Partida de nacimiento"],
    tramite: "Inscripción directa en el CPI del barrio.",
    donde: "CPI de tu barrio",
    rules: [
      R("OBLIGATORIA", "Vivir en CABA", (p) => p.provincia === "CABA"),
      R("OBLIGATORIA", "Tener un hijo/a de hasta 4 años", (p) => p.hijosMenores > 0 && p.edadHijoMenor <= 4),
    ],
  },
  {
    id: "caba-abl", jurisdiccion: "CABA", nombre: "Exención de ABL para jubilados/as",
    categoria: "Beneficio fiscal", organismo: "AGIP",
    monto: "Exención del 100% del Inmobiliario/ABL.",
    requisitos: ["Jubilado/a o pensionado/a", "Ingresos ≤ 4 jubilaciones mínimas ($1.363.518)", "Única vivienda de uso familiar"],
    documentos: ["DNI", "Recibo de haberes", "Escritura o boleto que acredite la vivienda", "Boleta del ABL"],
    tramite: "Online en agip.gob.ar o presencial con turno.",
    donde: "AGIP",
    rules: [
      R("OBLIGATORIA", "Ser jubilado/a o pensionado/a", (p) => p.situacionLaboral === "jubilado" || p.situacionLaboral === "pensionado"),
      R("OBLIGATORIA", "Ingresos por debajo de 4 jubilaciones mínimas ($1.363.518)", (p) => p.ingresoFamiliar <= tope.abl),
      R("OBLIGATORIA", "Tener una única vivienda", (p) => p.cantidadInmuebles <= 1),
    ],
  },
  {
    id: "caba-abl-discapacidad", jurisdiccion: "CABA", nombre: "Exención de ABL por discapacidad",
    categoria: "Beneficio fiscal", organismo: "AGIP",
    monto: "Exención del 100% del Inmobiliario/ABL (sin tope de ingresos).",
    requisitos: ["Certificado Único de Discapacidad (CUD)", "Única vivienda de uso familiar"],
    documentos: ["DNI", "CUD vigente", "Escritura o boleto que acredite la vivienda"],
    tramite: "Online en agip.gob.ar o presencial con turno.",
    donde: "AGIP",
    rules: [
      R("OBLIGATORIA", "Tener CUD vigente", (p) => p.tieneCUD),
      R("OBLIGATORIA", "Vivir en CABA", (p) => p.provincia === "CABA"),
      R("OBLIGATORIA", "Tener una única vivienda", (p) => p.cantidadInmuebles <= 1),
    ],
  },
  {
    id: "caba-becas-nivel-medio", jurisdiccion: "CABA", nombre: "Becas Estudiantiles de Nivel Medio",
    categoria: "Educación", organismo: "Ministerio de Educación (GCBA)",
    monto: "Beca personal e intransferible, renovable cada ciclo lectivo.",
    requisitos: ["Alumno/a regular de secundaria estatal en CABA", "Situación de vulnerabilidad socioeconómica"],
    documentos: ["DNI", "Constancia de alumno regular", "Certificación negativa de ANSES si corresponde"],
    tramite: "Online en becasciudad.bue.edu.ar con usuario miBA.",
    donde: "becasciudad.bue.edu.ar",
    rules: [R("OBLIGATORIA", "Ser alumno/a regular de secundario estatal en CABA", (p) => p.provincia === "CABA" && p.esAlumno && p.nivelEducativo === "secundario" && p.escuelaGestion === "estatal")],
  },

  // ================= PBA =================
  {
    id: "pba-mas-vida", jurisdiccion: "PBA", nombre: "Plan Más Vida (Tarjeta Verde)",
    categoria: "Alimentaria", organismo: "Min. Desarrollo de la Comunidad",
    monto: "Monto mensual en la Tarjeta Verde (Banco Provincia), variable.",
    requisitos: ["Embarazo desde el 3er mes, o hijos de hasta 6 años", "No cobrar la Tarjeta Alimentar nacional"],
    documentos: ["DNI del responsable adulto", "DNI y partida de nacimiento de los hijos", "Constancia de embarazo si corresponde"],
    tramite: "Presencial en la oficina de Desarrollo Social del municipio.",
    donde: "Municipio de residencia",
    rules: [
      R("OBLIGATORIA", "Estar embarazada (12+ semanas) o tener un hijo de hasta 6 años", (p) => p.embarazoSemanas >= 12 || (p.hijosMenores > 0 && p.edadHijoMenor <= 6)),
      R("EXCLUYENTE", "Ya cobra la Tarjeta Alimentar nacional (son incompatibles)", (p) => p.prestaciones.includes("n-alimentar")),
    ],
  },
  {
    id: "pba-envion", jurisdiccion: "PBA", nombre: "Programa Envión",
    categoria: "Juventud", organismo: "Min. Desarrollo de la Comunidad",
    monto: "Beca mensual de $39.200.",
    requisitos: ["Entre 12 y 18 años", "Municipio con sede Envión"],
    documentos: ["DNI", "Certificado de escolaridad si corresponde"],
    tramite: "En la sede Envión de tu municipio.",
    donde: "Municipio de residencia",
    rules: [R("OBLIGATORIA", "Tener entre 12 y 18 años", (p) => p.edad >= 12 && p.edad <= 18)],
  },
  {
    id: "pba-barrios-bonaerenses", jurisdiccion: "PBA", nombre: "Barrios Bonaerenses",
    categoria: "Empleo / ingresos", organismo: "Min. Desarrollo de la Comunidad",
    monto: "Transferencia mensual no remunerativa, con valores diferenciados por categoría.",
    requisitos: ["Estar incorporado a un proyecto laboral, sociocomunitario o formativo aprobado"],
    documentos: ["DNI", "CUIL"],
    tramite: "A través del municipio; el padrón es acotado y no hay inscripción abierta permanente.",
    donde: "Municipio de residencia",
    rules: [
      R("OBLIGATORIA", "Ser mayor de 18 años", (p) => p.edad >= 18),
      R("OBLIGATORIA", "Estar en situación de desempleo o informalidad", (p) => p.situacionLaboral === "informal" || p.situacionLaboral === "desocupado"),
    ],
    notas: ["El padrón es acotado: consultá en tu municipio si hay altas disponibles antes de generar expectativas."],
  },
  {
    id: "pba-udi", jurisdiccion: "PBA", nombre: "Unidades de Desarrollo Infantil (UDI)",
    categoria: "Infancia / cuidados", organismo: "Min. Desarrollo de la Comunidad",
    monto: "Espacio gratuito de cuidado y atención alimentaria (beca a la institución, no a la familia).",
    requisitos: ["Niño/a de 45 días a 14 años", "Vulnerabilidad social del grupo familiar"],
    documentos: ["DNI del niño/a y del adulto responsable"],
    tramite: "Inscripción directa en la UDI del barrio.",
    donde: "Municipio de residencia",
    rules: [R("OBLIGATORIA", "Tener un hijo/a de hasta 14 años", (p) => p.hijosMenores > 0 && p.edadHijoMenor <= 14)],
  },
  {
    id: "pba-talleres-protegidos", jurisdiccion: "PBA", nombre: "Talleres Protegidos de Producción",
    categoria: "Discapacidad", organismo: "Min. Desarrollo de la Comunidad",
    monto: "Beca mensual más el 'peculio' por la producción realizada.",
    requisitos: ["Certificado Único de Discapacidad (CUD)", "Estar en condiciones de realizar tareas en entorno protegido"],
    documentos: ["DNI", "CUD vigente"],
    tramite: "En el taller protegido de tu zona o en Desarrollo Social del municipio.",
    donde: "Municipio de residencia",
    rules: [
      R("OBLIGATORIA", "Tener CUD vigente", (p) => p.tieneCUD),
      R("OBLIGATORIA", "Vivir en la Provincia", (p) => p.provincia === "PBA"),
    ],
  },
  {
    id: "pba-boleto", jurisdiccion: "PBA", nombre: "Boleto Estudiantil Bonaerense",
    categoria: "Transporte / educación", organismo: "Ministerio de Transporte (PBA)",
    monto: "Viajes gratuitos en colectivo (hasta 50 por mes) durante el ciclo lectivo.",
    requisitos: ["Alumno/a regular", "SUBE física registrada a tu nombre"],
    documentos: ["DNI del alumno/a y del adulto responsable", "Tarjeta SUBE física"],
    tramite: "Registrá la SUBE física e inscribite en gba.gob.ar/transporte/boleto.",
    donde: "gba.gob.ar/transporte/boleto",
    rules: [
      R("OBLIGATORIA", "Ser alumno/a regular", (p) => p.esAlumno),
      R("OBLIGATORIA", "Tener SUBE física registrada", (p) => p.tieneSube),
    ],
  },
  {
    id: "pba-puentes", jurisdiccion: "PBA", nombre: "Programa Puentes — universidad en tu municipio",
    categoria: "Educación superior", organismo: "Ministerio de Gobierno (PBA)",
    monto: "Cursada gratuita en un centro universitario del municipio (no es dinero, es la carrera subsidiada).",
    requisitos: ["Vivir en un municipio adherido (81 a julio 2026)", "Cumplir los requisitos de ingreso de la carrera"],
    documentos: ["DNI", "Título secundario o constancia de estar cursando el último año"],
    tramite: "Inscripción a la carrera en el centro universitario del municipio.",
    donde: "puentes.gba.gob.ar",
    rules: [
      R("OBLIGATORIA", "Ser estudiante terciario/universitario en la Provincia", (p) => p.esAlumno && (p.nivelEducativo === "terciario" || p.nivelEducativo === "universitario")),
      R("OBLIGATORIA", "Vivir en la Provincia", (p) => p.provincia === "PBA"),
    ],
    notas: ["Verificá si tu municipio está adherido y qué carreras se dictan en puentes.gba.gob.ar."],
  },
  {
    id: "pba-arba", jurisdiccion: "PBA", nombre: "Exención del Impuesto Inmobiliario (ARBA)",
    categoria: "Beneficio fiscal", organismo: "ARBA",
    monto: "Exención total del Impuesto Inmobiliario provincial (incluye deudas de hasta 5 años).",
    requisitos: ["Jubilado/a o pensionado/a", "Ingresos ≤ 2 haberes mínimos ($786.348)", "Única vivienda en la Provincia"],
    documentos: ["CUIT/CUIL", "Clave Ciudadana de ARBA", "Recibo de haberes"],
    tramite: "Consultá por CUIT en arba.gov.ar/jubilados y hacé el alta online con Clave Ciudadana.",
    donde: "arba.gov.ar",
    rules: [
      R("OBLIGATORIA", "Ser jubilado/a o pensionado/a", (p) => p.situacionLaboral === "jubilado" || p.situacionLaboral === "pensionado"),
      R("OBLIGATORIA", "Ingresos por debajo de 2 haberes mínimos ($786.348)", (p) => p.ingresoFamiliar <= tope.arba),
      R("OBLIGATORIA", "Tener una única vivienda", (p) => p.cantidadInmuebles <= 1),
    ],
  },
  {
    id: "pba-ivba", jurisdiccion: "PBA", nombre: "Viviendas sociales del IVBA",
    categoria: "Vivienda", organismo: "IVBA",
    monto: "Adjudicación de vivienda financiada por el Estado, con cuota mensual.",
    requisitos: ["Mayor de 18 años", "No tener vivienda propia", "Capacidad de pago de la cuota"],
    documentos: ["DNI y CUIL de todo el grupo conviviente", "Declaración jurada de ingresos"],
    tramite: "Presencial en la Secretaría de Vivienda/Hábitat/Desarrollo Social del municipio.",
    donde: "Municipio de residencia",
    rules: [
      R("OBLIGATORIA", "Ser mayor de 18 años", (p) => p.edad >= 18),
      R("OBLIGATORIA", "No tener vivienda propia", (p) => p.cantidadInmuebles === 0),
    ],
    notas: ["La inscripción no garantiza adjudicación: hay sorteo y lista de espera. No existen gestores ni pagos anticipados."],
  },
  {
    id: "pba-ley-pierri", jurisdiccion: "PBA", nombre: "Regularización dominial — Ley Pierri",
    categoria: "Vivienda / tierra", organismo: "Min. Hábitat y Desarrollo Urbano",
    monto: "Acceso a la escritura, con costos muy reducidos respecto de una escrituración común.",
    requisitos: ["Posesión pacífica y continua desde antes del 1/1/2009", "Vivienda única, familiar y permanente"],
    documentos: ["DNI", "Comprobantes de pago de servicios a tu nombre que prueben la posesión", "Constancia de que no sos propietario/a de otro inmueble"],
    tramite: "En la oficina de Tierras o Hábitat de tu municipio.",
    donde: "Municipio de residencia",
    rules: [
      R("OBLIGATORIA", "Vivir en la Provincia", (p) => p.provincia === "PBA"),
      R("OBLIGATORIA", "Ocupar una vivienda sin ser propietario/a", (p) => p.situacionHabitacional === "ocupante" && p.cantidadInmuebles === 0),
    ],
  },
  {
    id: "pba-credito-bapro", jurisdiccion: "PBA", nombre: "Créditos hipotecarios del Banco Provincia (BAPRO)",
    categoria: "Vivienda / crédito", organismo: "Banco Provincia",
    monto: "Financiación de hasta 75-80% del valor de tasación, con condiciones preferenciales si cobrás en el banco.",
    requisitos: ["Trabajo formal, monotributo o jubilación", "Sin vivienda propia", "Ahorro previo del 20-30%"],
    documentos: ["DNI", "Últimos 3 recibos de sueldo", "Resúmenes bancarios", "Tasación de la propiedad"],
    tramite: "Simulador y solicitud en bancoprovincia.com.ar o en cualquier sucursal.",
    donde: "Banco Provincia",
    rules: [
      R("OBLIGATORIA", "Tener trabajo formal, monotributo o jubilación", (p) => ["formal", "monotributista", "jubilado", "pensionado"].includes(p.situacionLaboral)),
      R("OBLIGATORIA", "No tener vivienda propia", (p) => p.cantidadInmuebles === 0),
    ],
  },

  // ================= APOYO EN SITUACIONES DE VIOLENCIA =================
  {
    id: "n-linea-144", jurisdiccion: "NACION", nombre: "Línea 144 — Atención en violencia de género",
    categoria: "Apoyo y contención", organismo: "Nación",
    monto: "Contención psicológica, social y jurídica gratuita, las 24 horas.",
    requisitos: ["Ninguno: la línea es abierta y gratuita"],
    documentos: ["No hace falta nada para llamar"],
    tramite: "Llamá al 144 (gratis, desde cualquier teléfono, 24 horas) o escribí por WhatsApp al mismo número.",
    donde: "144",
    rules: [R("OBLIGATORIA", "Marcaste que estás atravesando una situación de violencia de género", (p) => p.violenciaGenero)],
  },
  {
    id: "caba-cim", jurisdiccion: "CABA", nombre: "Centros Integrales de la Mujer (CIM)",
    categoria: "Apoyo y contención", organismo: "Vicejefatura / DG de la Mujer (GCBA)",
    monto: "Atención psicológica, social y jurídica gratuita, con acompañamiento en la denuncia.",
    requisitos: ["Vivir en CABA"],
    documentos: ["No hace falta nada para la primera consulta"],
    tramite: "Te podés acercar a un CIM sin turno, o pedir orientación al 147 sobre el más cercano.",
    donde: "buenosaires.gob.ar — Centros Integrales de la Mujer",
    rules: [
      R("OBLIGATORIA", "Vivir en CABA", (p) => p.provincia === "CABA"),
      R("OBLIGATORIA", "Marcaste que estás atravesando una situación de violencia de género", (p) => p.violenciaGenero),
    ],
  },
  {
    id: "pba-comunidades-sin-violencias", jurisdiccion: "PBA", nombre: "Comunidades sin Violencias",
    categoria: "Apoyo y contención", organismo: "Ministerio de Mujeres y Diversidad (PBA)",
    monto: "Dispositivos territoriales de protección integral: hogares, casas abiertas y refugios.",
    requisitos: ["Vivir en la Provincia de Buenos Aires"],
    documentos: ["No hace falta nada para el primer contacto"],
    tramite: "Acercate al área de género de tu municipio, o llamá al 144.",
    donde: "Municipio de residencia",
    rules: [
      R("OBLIGATORIA", "Vivir en la Provincia", (p) => p.provincia === "PBA"),
      R("OBLIGATORIA", "Marcaste que estás atravesando una situación de violencia de género", (p) => p.violenciaGenero),
    ],
  },
];

const MUTUALLY_EXCLUSIVE = [["n-alimentar", "pba-mas-vida", "Son incompatibles entre sí: solo se puede cobrar una de las dos."]];

const PRESTACIONES_CONOCIDAS = [
  ["n-auh", "AUH"], ["n-aue", "AUE"], ["n-suaf", "SUAF"], ["n-alimentar", "Tarjeta Alimentar"],
  ["n-puam", "PUAM"], ["n-pas", "Acomp. Social"], ["n-progresar", "Progresar"],
  ["pba-mas-vida", "Plan Más Vida"], ["caba-690", "Subsidio 690"], ["pba-ivba", "Vivienda IVBA"],
];

function evaluate(program, profile) {
  const obligatorias = program.rules.filter((r) => r.kind === "OBLIGATORIA");
  const excluyentes = program.rules.filter((r) => r.kind === "EXCLUYENTE");
  const failed = obligatorias.filter((r) => !r.test(profile));
  const triggered = excluyentes.filter((r) => r.test(profile));
  const eligible = failed.length === 0 && triggered.length === 0;
  const nearMiss = !eligible && triggered.length === 0 && failed.length === 1;
  return { program, eligible, nearMiss, failed, triggered };
}
function montoText(program, profile) {
  return typeof program.monto === "function" ? program.monto(profile) : program.monto;
}
function colorFor(j) {
  return j === "CABA" ? "#1F4E5F" : j === "PBA" ? "#2E5C3E" : "#1F3864";
}
function labelFor(j) {
  return j === "CABA" ? "Ciudad de Buenos Aires" : j === "PBA" ? "Provincia de Buenos Aires" : "Nación";
}

/* ============================================================
   COMPONENTES DE UI
============================================================ */
function SectionLabel({ n, title, subtitle }) {
  return (
    <div>
      <div className="sa-eyebrow" style={{ color: "var(--inksoft)" }}>Paso {n} de 9</div>
      <h2 style={{ fontFamily: "Archivo", fontWeight: 800, fontSize: "1.3rem" }} className="mt-1">{title}</h2>
      {subtitle && <p className="text-sm mt-1" style={{ color: "var(--inksoft)" }}>{subtitle}</p>}
    </div>
  );
}

function OptionCard({ active, onClick, title, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sa-focus text-left w-full rounded-md px-4 py-3 transition-colors"
      style={{
        border: active ? `2px solid ${color || "#1B1B16"}` : "1px solid var(--line)",
        background: active ? (color || "#1B1B16") + "14" : "#fff",
      }}
    >
      <div style={{ fontFamily: "Archivo", fontWeight: 600 }}>{title}</div>
    </button>
  );
}

function NumberField({ label, value, onChange, suffix }) {
  return (
    <label className="block">
      <div className="sa-eyebrow mb-1" style={{ color: "var(--inksoft)" }}>{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sa-focus sa-input sa-mono w-full px-3 py-2 text-lg"
        />
        {suffix && <span className="sa-mono text-sm" style={{ color: "var(--inksoft)" }}>{suffix}</span>}
      </div>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <div className="sa-eyebrow mb-1" style={{ color: "var(--inksoft)" }}>{label}</div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="sa-focus sa-input w-full px-3 py-2"
      />
    </label>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sa-focus rounded-full px-3 py-1.5 text-sm mr-2 mb-2"
      style={{ border: active ? "1px solid #1B1B16" : "1px solid var(--line)", background: active ? "#1B1B16" : "#fff", color: active ? "#fff" : "#1B1B16" }}
    >
      {children}
    </button>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

function ResultCard({ r, idx, color, profile }) {
  const [open, setOpen] = useState(false);
  const p = r.program;
  return (
    <div className="sa-ficha sa-anim p-5" style={{ animationDelay: `${idx * 70}ms`, borderLeft: `4px solid ${color}` }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="sa-mono text-xs" style={{ color: "var(--inksoft)" }}>Exp. N.° {p.id.toUpperCase()}</div>
          <h3 style={{ fontFamily: "Archivo", fontWeight: 700, fontSize: "1.05rem" }} className="mt-0.5">{p.nombre}</h3>
          <div className="sa-eyebrow mt-1" style={{ color }}>{p.categoria}</div>
        </div>
        <div className="sa-stamp shrink-0"><BadgeCheck size={14} /> Corresponde</div>
      </div>
      <div className="sa-mono text-sm mt-3 rounded px-3 py-2" style={{ background: "#F5F4EE" }}>{montoText(p, profile)}</div>
      <button onClick={() => setOpen((o) => !o)} className="sa-focus text-sm font-semibold mt-3 underline">
        {open ? "Ocultar detalle" : "Ver requisitos, qué llevar y dónde ir"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <div className="sa-eyebrow" style={{ color: "var(--inksoft)" }}>Requisitos para pedirlo</div>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {p.requisitos.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
          {p.documentos && (
            <div>
              <div className="sa-eyebrow" style={{ color: "var(--inksoft)" }}>Qué tenés que llevar o entregar</div>
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                {p.documentos.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
          <div>
            <div className="sa-eyebrow" style={{ color: "var(--inksoft)" }}>Cómo se tramita</div>
            <p className="mt-0.5">{p.tramite}</p>
          </div>
          <div>
            <div className="sa-eyebrow" style={{ color: "var(--inksoft)" }}>A dónde dirigirte</div>
            <p className="mt-0.5 font-semibold">{p.donde}</p>
          </div>
          {p.notas && p.notas.map((n, i) => (
            <div key={i} className="flex items-start gap-1.5 mt-2" style={{ color: "var(--sello)" }}>
              <Info size={14} className="mt-0.5 shrink-0" /><span>{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   APP
============================================================ */
const initialProfile = {
  provincia: "", municipio: "", aniosResidencia: 0,
  edad: 30, situacionLaboral: "",
  hijosMenores: 0, edadHijoMenor: 0, embarazoSemanas: 0, tuvoSieteHijos: false,
  ingresoFamiliar: 0, integrantesHogar: 1, mesesAportes: 0,
  esAlumno: false, nivelEducativo: "", escuelaGestion: "", tieneSube: false,
  situacionHabitacional: "", cantidadInmuebles: 0, tieneGasRed: true, zonaFria: false,
  tieneCUD: false, tieneObraSocial: false, violenciaGenero: false, prestaciones: [],
};

const STEP_TITLES = ["Dónde vivís", "Quién sos", "Familia", "Ingresos", "Estudios", "Vivienda", "Salud", "Beneficios actuales"];

export default function SubsidiosArgentina() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initialProfile);
  const set = (k, v) => setProfile((p) => ({ ...p, [k]: v }));
  const toggle = (k, id) => setProfile((p) => ({ ...p, [k]: p[k].includes(id) ? p[k].filter((x) => x !== id) : [...p[k], id] }));

  const results = useMemo(() => PROGRAMS.map((pr) => evaluate(pr, profile)), [profile]);

  const relevant = results.filter((r) => r.program.jurisdiccion === "NACION" || r.program.jurisdiccion === profile.provincia);
  const eligibles = relevant.filter((r) => r.eligible);
  const nearMisses = relevant.filter((r) => r.nearMiss && r.program.categoria !== "Apoyo y contención").slice(0, 6);
  const eligibleIds = eligibles.map((r) => r.program.id);
  const warnings = MUTUALLY_EXCLUSIVE.filter(([a, b]) => eligibleIds.includes(a) && eligibleIds.includes(b));

  const grouped = eligibles.reduce((acc, r) => {
    const k = r.program.jurisdiccion;
    (acc[k] = acc[k] || []).push(r);
    return acc;
  }, {});

  function restart() {
    setProfile(initialProfile);
    setStep(0);
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <SectionLabel n={1} title="¿Dónde vivís?" />
            <div className="grid sm:grid-cols-3 gap-3">
              <OptionCard active={profile.provincia === "CABA"} onClick={() => set("provincia", "CABA")} title="Ciudad de Buenos Aires" color="#1F4E5F" />
              <OptionCard active={profile.provincia === "PBA"} onClick={() => set("provincia", "PBA")} title="Provincia de Buenos Aires" color="#2E5C3E" />
              <OptionCard active={profile.provincia === "OTRA"} onClick={() => set("provincia", "OTRA")} title="Otra provincia" color="#1F3864" />
            </div>
            {(profile.provincia === "CABA" || profile.provincia === "PBA") && (
              <>
                <NumberField label="¿Hace cuántos años vivís ahí?" value={profile.aniosResidencia} onChange={(v) => set("aniosResidencia", v)} suffix="años" />
                <TextField label={profile.provincia === "CABA" ? "Comuna (opcional)" : "Municipio (opcional)"} value={profile.municipio} onChange={(v) => set("municipio", v)} placeholder="Ej: Comuna 4 / La Matanza" />
              </>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-5">
            <SectionLabel n={2} title="¿Quién sos?" />
            <NumberField label="Edad" value={profile.edad} onChange={(v) => set("edad", v)} suffix="años" />
            <div>
              <div className="sa-eyebrow mb-2" style={{ color: "var(--inksoft)" }}>Situación laboral</div>
              <div className="flex flex-wrap">
                {[["informal", "Trabajo informal"], ["formal", "Trabajo formal"], ["desocupado", "Desocupado/a"], ["monotributista", "Monotributista"], ["monotributo_social", "Ya tengo Monotributo Social"], ["casas_particulares", "Casas particulares"], ["jubilado", "Jubilado/a"], ["pensionado", "Pensionado/a"]].map(([v, l]) => (
                  <Chip key={v} active={profile.situacionLaboral === v} onClick={() => set("situacionLaboral", v)}>{l}</Chip>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <SectionLabel n={3} title="Familia" />
            <NumberField label="Hijos menores a cargo" value={profile.hijosMenores} onChange={(v) => set("hijosMenores", v)} />
            {profile.hijosMenores > 0 && <NumberField label="Edad del hijo/a más chico/a" value={profile.edadHijoMenor} onChange={(v) => set("edadHijoMenor", v)} suffix="años" />}
            <NumberField label="Semanas de embarazo (0 si no corresponde)" value={profile.embarazoSemanas} onChange={(v) => set("embarazoSemanas", v)} suffix="semanas" />
            <Check checked={profile.tuvoSieteHijos} onChange={(v) => set("tuvoSieteHijos", v)}>Tuve o adopté 7 hijos o más</Check>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <SectionLabel n={4} title="Trabajo e ingresos" />
            <NumberField label="Ingreso mensual de todo el hogar" value={profile.ingresoFamiliar} onChange={(v) => set("ingresoFamiliar", v)} suffix="$" />
            <NumberField label="Personas que viven en el hogar" value={profile.integrantesHogar} onChange={(v) => set("integrantesHogar", v)} />
            {profile.situacionLaboral === "desocupado" && (
              <NumberField label="Meses de aportes en los últimos 3 años" value={profile.mesesAportes} onChange={(v) => set("mesesAportes", v)} suffix="meses" />
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <SectionLabel n={5} title="Estudios" />
            <Check checked={profile.esAlumno} onChange={(v) => set("esAlumno", v)}>Soy estudiante regular</Check>
            {profile.esAlumno && (
              <>
                <div>
                  <div className="sa-eyebrow mb-2" style={{ color: "var(--inksoft)" }}>Nivel</div>
                  <div className="flex flex-wrap">
                    {[["primario", "Primario"], ["secundario", "Secundario"], ["terciario", "Terciario"], ["universitario", "Universitario"], ["formacion_profesional", "Formación profesional"]].map(([v, l]) => (
                      <Chip key={v} active={profile.nivelEducativo === v} onClick={() => set("nivelEducativo", v)}>{l}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="sa-eyebrow mb-2" style={{ color: "var(--inksoft)" }}>Gestión de la escuela</div>
                  <div className="flex flex-wrap">
                    {[["estatal", "Estatal"], ["privada_con_aporte", "Privada con aporte estatal"], ["privada_sin_aporte", "Privada sin aporte"]].map(([v, l]) => (
                      <Chip key={v} active={profile.escuelaGestion === v} onClick={() => set("escuelaGestion", v)}>{l}</Chip>
                    ))}
                  </div>
                </div>
              </>
            )}
            <Check checked={profile.tieneSube} onChange={(v) => set("tieneSube", v)}>Tengo tarjeta SUBE física a mi nombre</Check>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5">
            <SectionLabel n={6} title="Vivienda y servicios" />
            <div>
              <div className="sa-eyebrow mb-2" style={{ color: "var(--inksoft)" }}>Situación habitacional</div>
              <div className="flex flex-wrap">
                {[["propietario", "Propietario/a"], ["inquilino", "Inquilino/a"], ["ocupante", "Ocupante"], ["riesgo_desalojo", "Riesgo de desalojo"], ["situacion_calle", "Situación de calle"]].map(([v, l]) => (
                  <Chip key={v} active={profile.situacionHabitacional === v} onClick={() => set("situacionHabitacional", v)}>{l}</Chip>
                ))}
              </div>
            </div>
            <NumberField label="Inmuebles a tu nombre" value={profile.cantidadInmuebles} onChange={(v) => set("cantidadInmuebles", v)} />
            <Check checked={profile.tieneGasRed} onChange={(v) => set("tieneGasRed", v)}>Tengo gas natural por red</Check>
            <Check checked={profile.zonaFria} onChange={(v) => set("zonaFria", v)}>Vivo en una localidad de Zona Fría (Patagonia, Puna, o zonas frías de Buenos Aires, Córdoba, Santa Fe, Mendoza, etc.)</Check>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5">
            <SectionLabel n={7} title="Salud y bienestar" />
            <Check checked={profile.tieneCUD} onChange={(v) => set("tieneCUD", v)}>Tengo Certificado Único de Discapacidad (CUD)</Check>
            <Check checked={profile.tieneObraSocial} onChange={(v) => set("tieneObraSocial", v)}>Tengo obra social o prepaga</Check>
            <div className="rounded-md p-4" style={{ background: "#F5F4EE" }}>
              <Check checked={profile.violenciaGenero} onChange={(v) => set("violenciaGenero", v)}>
                Estoy atravesando una situación de violencia por motivos de género y quiero que me acerquen recursos y contactos (opcional)
              </Check>
              <p className="text-xs mt-2" style={{ color: "var(--inksoft)" }}>Si marcás esta opción, te vamos a mostrar contactos de acompañamiento junto con el resto de los resultados. No hace falta contar nada más.</p>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-5">
            <SectionLabel n={8} title="¿Qué cobrás hoy?" subtitle="Marcá lo que ya cobrás, para detectar incompatibilidades" />
            <div className="flex flex-wrap">
              {PRESTACIONES_CONOCIDAS.map(([id, label]) => (
                <Chip key={id} active={profile.prestaciones.includes(id)} onClick={() => toggle("prestaciones", id)}>{label}</Chip>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="sa-root min-h-screen w-full px-4 py-8 sm:px-8">
      <GlobalStyle />
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="sa-eyebrow" style={{ color: "var(--inksoft)" }}>Guía de subsidios · Argentina · Agosto 2026</div>
          <h1 style={{ fontFamily: "Archivo", fontWeight: 900, fontSize: "1.9rem", letterSpacing: "-0.01em" }} className="mt-1">
            ¿Qué subsidio te corresponde?
          </h1>
          <p className="text-sm mt-2 max-w-xl" style={{ color: "var(--inksoft)" }}>
            Respondé un cuestionario corto y te mostramos los {PROGRAMS.length} programas nacionales, porteños y bonaerenses que podrías tramitar, qué piden, qué hay que llevar y dónde ir.
          </p>
          <div className="flex items-center gap-4 mt-4">
            {[["Nación", "#1F3864"], ["CABA", "#1F4E5F"], ["PBA", "#2E5C3E"]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: c, display: "inline-block" }} />
                <span className="sa-eyebrow" style={{ color: "var(--inksoft)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {step < 8 ? (
          <div>
            <div className="flex gap-1 mb-5">
              {STEP_TITLES.map((_, i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= step ? "var(--ink)" : "#DEDACB" }} />
              ))}
            </div>
            <div className="sa-ficha p-6">{renderStep()}</div>
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="sa-focus flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold"
                style={{ opacity: step === 0 ? 0.35 : 1, border: "1px solid var(--line)", background: "#fff" }}
              >
                <ChevronLeft size={16} /> Atrás
              </button>
              <button
                onClick={() => setStep((s) => Math.min(8, s + 1))}
                className="sa-focus flex items-center gap-1 px-5 py-2 rounded-md text-sm font-semibold text-white"
                style={{ background: "var(--ink)" }}
              >
                {step < 7 ? "Siguiente" : "Ver resultados"} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="sa-ficha p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="sa-eyebrow" style={{ color: "var(--inksoft)" }}>Resultado</div>
                <div className="sa-mono" style={{ fontSize: "2.2rem", fontWeight: 600, lineHeight: 1 }}>{eligibles.length}</div>
                <div className="text-sm" style={{ color: "var(--inksoft)" }}>programa{eligibles.length !== 1 ? "s" : ""} para tu situación</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="sa-focus flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold" style={{ border: "1px solid var(--line)", background: "#fff" }}>
                  <Pencil size={14} /> Editar respuestas
                </button>
                <button onClick={restart} className="sa-focus flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold" style={{ border: "1px solid var(--line)", background: "#fff" }}>
                  <RotateCcw size={14} /> Empezar de nuevo
                </button>
              </div>
            </div>

            {profile.violenciaGenero && (
              <div className="flex items-start gap-2 rounded-md p-4" style={{ background: "var(--sellosoft)", border: "1px solid var(--sello)" }}>
                <HeartHandshake size={18} className="mt-0.5 shrink-0" style={{ color: "var(--sello)" }} />
                <div className="text-sm" style={{ color: "var(--ink)" }}>
                  Abajo, en la sección "Apoyo y contención", vas a encontrar contactos gratuitos y confidenciales. No estás sola/o: podés llamar al 144 en cualquier momento.
                </div>
              </div>
            )}

            {warnings.map(([a, b, msg], i) => (
              <div key={i} className="flex items-start gap-2 rounded-md p-4" style={{ background: "var(--sellosoft)", border: "1px solid var(--sello)" }}>
                <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--sello)" }} />
                <div className="text-sm" style={{ color: "var(--ink)" }}>{msg}</div>
              </div>
            ))}

            {profile.provincia === "OTRA" || profile.provincia === "" ? (
              <div className="flex items-start gap-2 rounded-md p-4 text-sm" style={{ background: "#fff", border: "1px solid var(--line)", color: "var(--inksoft)" }}>
                <Info size={16} className="mt-0.5 shrink-0" />
                Este prototipo cubre en detalle CABA y la Provincia de Buenos Aires. Los programas nacionales sí aplican en cualquier provincia del país.
              </div>
            ) : null}

            {eligibles.length === 0 && (
              <div className="sa-ficha p-6 text-sm" style={{ color: "var(--inksoft)" }}>
                No encontramos programas con estos datos. Revisá tus respuestas — puede que falte marcar algo — o mirá abajo lo que te quedó cerca.
              </div>
            )}

            {["NACION", "CABA", "PBA"].map((j) => {
              if (j !== "NACION" && j !== profile.provincia) return null;
              const list = grouped[j] || [];
              if (list.length === 0) return null;
              const color = colorFor(j);
              return (
                <section key={j}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ width: 9, height: 9, borderRadius: 9999, background: color, display: "inline-block" }} />
                    <h2 style={{ fontFamily: "Archivo", fontWeight: 800, fontSize: "1.05rem" }}>{labelFor(j)}</h2>
                    <span className="sa-mono text-xs" style={{ color: "var(--inksoft)" }}>{list.length} programa{list.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="grid gap-4">
                    {list.map((r, idx) => (
                      <ResultCard key={r.program.id} r={r} idx={idx} color={color} profile={profile} />
                    ))}
                  </div>
                </section>
              );
            })}

            {(profile.provincia === "CABA" || profile.provincia === "PBA") && (
              <div className="text-xs sa-mono" style={{ color: "var(--inksoft)" }}>
                Recordá confirmar cupo y trámite exacto en {profile.municipio ? `"${profile.municipio}"` : (profile.provincia === "CABA" ? "tu comuna" : "tu municipio")}: la Provincia y la Ciudad diseñan los programas, pero el trámite se hace ahí.
              </div>
            )}

            {nearMisses.length > 0 && (
              <section>
                <h3 className="sa-eyebrow mb-3" style={{ color: "var(--inksoft)" }}>Por poco no llegás</h3>
                <div className="grid gap-3">
                  {nearMisses.map((r) => (
                    <div key={r.program.id} className="sa-ficha p-4" style={{ opacity: 0.75, borderStyle: "dashed" }}>
                      <div className="font-semibold text-sm">{r.program.nombre}</div>
                      <div className="text-sm sa-mono mt-1" style={{ color: "var(--sello)" }}>Te falta: {r.failed[0]?.label}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
