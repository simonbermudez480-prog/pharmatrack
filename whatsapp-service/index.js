// ============================================================
// PHARMATRACK — Microservicio de WhatsApp (Baileys)
// Corre 24/7 en Render. Mantiene una sesión de WhatsApp Web
// autenticada por QR, y expone un endpoint POST /api/send-reminders
// que es llamado por el cron de Supabase cada hora.
// ============================================================

import express from "express";
import qrcode from "qrcode-terminal";
import {
  makeWASocket,
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// ------------------------------------------------------------
// Configuración (env vars requeridas)
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Faltan variables de entorno obligatorias: CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ------------------------------------------------------------
// ESQUEMA DE RECORDATORIOS INTELIGENTES
// ------------------------------------------------------------
const REMINDER_SCHEDULE = [
  // Pre-vencimiento (negativo = días antes del vencimiento)
  { type: 'pre_3d',        offsetDays: -3,  label: '3 días antes' },
  { type: 'pre_1d',        offsetDays: -1,  label: '1 día antes' },
  { type: 'vencimiento',   offsetDays: 0,   label: 'Día de vencimiento' },
  // Post-vencimiento (positivo = días después del vencimiento)
  { type: 'post_3d',       offsetDays: 3,   label: '3 días después' },
  { type: 'post_7d_1',     offsetDays: 7,   label: '7 días después (1)' },
  { type: 'post_7d_2',     offsetDays: 14,  label: '7 días después (2)' },
  { type: 'post_7d_3',     offsetDays: 21,  label: '7 días después (3)' },
];

function getCurrentReminderType(paciente) {
  const enviados = paciente.recordatorios_enviados ?? 0;
  if (enviados >= REMINDER_SCHEDULE.length) return 'completado';
  return REMINDER_SCHEDULE[enviados].type;
}

function calculateNextReminderDate(paciente, now = new Date()) {
  const enviados = paciente.recordatorios_enviados ?? 0;
  if (enviados >= REMINDER_SCHEDULE.length) return null;
  
  const vencimiento = new Date(paciente.fecha_vencimiento);
  if (isNaN(vencimiento.getTime())) {
    // Fallback: si no hay fecha_vencimiento, usar +7 días desde ahora
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    return next.toISOString();
  }
  
  const next = REMINDER_SCHEDULE[enviados];
  const fecha = new Date(vencimiento);
  fecha.setDate(fecha.getDate() + next.offsetDays);
  
  // Si la fecha calculada ya pasó, mandar ahora
  if (fecha < now) return now.toISOString();
  return fecha.toISOString();
}

function buildReminderMessage(paciente, farmaciaNombre, reminderType) {
  const mensajes = {
    pre_3d:        `Faltan 3 días para que venza tu tratamiento`,
    pre_1d:        `Mañana vence tu tratamiento`,
    vencimiento:   `Hoy vence tu tratamiento`,
    post_3d:       `Han pasado 3 días desde el vencimiento de tu tratamiento`,
    post_7d_1:     `Ha pasado 1 semana desde el vencimiento de tu tratamiento`,
    post_7d_2:     `Han pasado 2 semanas desde el vencimiento de tu tratamiento`,
    post_7d_3:     `Han pasado 3 semanas desde el vencimiento de tu tratamiento`,
  };
  
  const intro = mensajes[reminderType] || 'Es momento de renovar tu tratamiento';
  
  return `Hola ${paciente.nombre}, ${intro.toLowerCase()} "${paciente.tratamiento}" (${paciente.posologia}).

Pásate por *${farmaciaNombre}* cuando puedas. ¡Gracias por seguir al pie de tu salud!`;
}

// ------------------------------------------------------------
// Cliente WhatsApp (Baileys) — singleton, reconexión automática
// ------------------------------------------------------------
let sock = null;
let connectionStatus = "idle"; // idle | connecting | open | closed | qr

async function startWhatsApp() {
  connectionStatus = "connecting";

  // Asegurar que el directorio de auth exista y sea escribible
  const authDir = path.resolve("./auth_baileys");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`[whatsapp] Directorio de auth creado: ${authDir}`);
  }

  let authState;
  let saveCreds;
  let safeAuthState;
  try {
    const result = await useMultiFileAuthState(authDir);
    authState = result.state;
    saveCreds = result.saveCreds;
    console.log("[whatsapp] Auth state cargado:", Object.keys(authState || {}));
    console.log("[whatsapp] Creds existe:", !!authState?.creds);
    console.log("[whatsapp] Keys existe:", !!authState?.keys);
    console.log("[whatsapp] Tipo de creds:", typeof authState?.creds);
    if (authState?.creds) {
      console.log("[whatsapp] Creds keys:", Object.keys(authState.creds));
    }
    
    // Si no hay creds, forzar inicialización
    if (!authState || !authState.creds) {
      console.warn("[whatsapp] Creds no encontrado, forzando reinicio de auth...");
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
      fs.mkdirSync(authDir, { recursive: true });
      const freshResult = await useMultiFileAuthState(authDir);
      authState = freshResult.state;
      saveCreds = freshResult.saveCreds;
      console.log("[whatsapp] Nuevo auth state:", Object.keys(authState || {}));
      console.log("[whatsapp] Nuevo creds existe:", !!authState?.creds);
    }
    
    if (!authState || !authState.creds) {
      throw new Error("No se pudo inicializar auth state con creds válidos");
    }

    // El authState original YA tiene la estructura correcta:
    // - creds: objeto con las credenciales
    // - keys: KeyStore con métodos get(key) y set(key, value)
    // Pasar el authState ORIGINAL directamente (lo que Baileys espera)
    safeAuthState = authState;
    console.log("[whatsapp] Pasando authState original a makeWASocket");
    console.log("[whatsapp] safeAuthState.creds existe:", !!safeAuthState.creds);
    console.log("[whatsapp] safeAuthState.keys tiene get/set:", 
      typeof safeAuthState.keys?.get === 'function' && typeof safeAuthState.keys?.set === 'function');
    console.log("[whatsapp] safeAuthState keys own props:", Object.getOwnPropertyNames(safeAuthState));
  } catch (err) {
    console.error("[whatsapp] Error fatal cargando auth state:", err.message);
    throw err;
  }

  sock = makeWASocket({
    auth: safeAuthState,
    browser: Browsers.macOS("PharmaTrack"),
    logger: pino({ level: "warn" }),
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      connectionStatus = "qr";
      console.log("\n\n=========== ESCANEA ESTE QR EN TU WHATSAPP ===========");
      qrcode.generate(qr, { small: true });
      console.log("====================================================\n\n");
    }

    if (connection === "open") {
      connectionStatus = "open";
      console.log("[whatsapp] Conexión abierta. Listo para enviar.");
    }

    if (connection === "close") {
      connectionStatus = "closed";
      const code = lastDisconnect?.error?.output?.statusCode;
      console.warn(`[whatsapp] Conexión cerrada (código ${code}). Reconectando en 5s…`);
      if (code === DisconnectReason.loggedOut) {
        console.error("[whatsapp] Sesión cerrada desde el teléfono. Borrá ./auth_baileys para re-escanear QR.");
      } else {
        setTimeout(startWhatsApp, 5000);
      }
    }
  });

  // Capturar errores de init queries y forzar reconexión
  sock.ws.on("error", (err) => {
    console.error("[whatsapp] WebSocket error:", err.message);
  });

  sock.ev.on("connection.update", (update) => {
    if (update.connection === "close") return; // ya manejado arriba
    
    // Detectar error de timeout en init queries
    if (update.lastDisconnect?.error?.output?.statusCode === 408) {
      console.warn("[whatsapp] Timeout en init queries (408), forzando reconexión...");
      sock.end(undefined, { description: "init queries timeout", isLoggedOut: false });
    }
  });
}

// ------------------------------------------------------------
// Envío de un mensaje WhatsApp
// ------------------------------------------------------------
async function sendWhatsApp(phone, message) {
  if (!sock || connectionStatus !== "open") {
    throw new Error("WhatsApp no está conectado todavía");
  }
  // Normaliza telefono: "57 300 123 4567" -> "573001234567@s.whatsapp.net"
  const normalized = phone.replace(/[^\d]/g, "");
  const jid = `${normalized}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: message });
  return jid;
}

// ------------------------------------------------------------
// Express app
// ------------------------------------------------------------
const app = express();
app.use(express.json());

// Health check para Render
app.get("/health", (_req, res) => {
  res.json({ ok: true, whatsapp: connectionStatus, time: new Date().toISOString() });
});

// Estado (para debuggear desde el panel)
app.get("/status", (req, res) => {
  if (req.headers["x-cron-secret"] !== CRON_SECRET) {
    return res.status(401).json({ error: "No autorizado" });
  }
  res.json({ whatsapp: connectionStatus });
});

// ============================================================
// ENDPOINT CLAVE — lo llama Supabase Cron cada hora
// ============================================================
app.post("/api/send-reminders", async (req, res) => {
  // 1) Autenticación
  if (req.headers["x-cron-secret"] !== CRON_SECRET) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    // 2) Verifica que WhatsApp esté conectado
    if (connectionStatus !== "open") {
      return res.status(503).json({
        ok: false,
        error: `WhatsApp no connected (status: ${connectionStatus})`,
        reminder: "Escaneá el QR primero (logs de Render)",
      });
    }

    // 3) Lee pacientes con proximo_recordatorio <= now() y activos
    const now = new Date().toISOString();
    const { data: pacientes, error } = await supabase
      .from("pacientes")
      .select(`
        id, user_id, nombre, telefono, email, canal_pref,
        tratamiento, posologia, proximo_recordatorio,
        recordatorios_enviados, fecha_vencimiento
      `)
      .eq("activo", true)
      .lte("proximo_recordatorio", now);

    if (error) {
      console.error("[db] error leyendo pacientes:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!pacientes || pacientes.length === 0) {
      console.log(`[cron ${now}] No hay pacientes por recordar.`);
      return res.json({ ok: true, sent: 0, message: "Sin pacientes pendientes" });
    }

    console.log(`[cron ${now}] ${pacientes.length} paciente(s) por recordar.`);

    // 4) Para cada paciente: envía mensaje + inserta en recordatorios
    let sent = 0;
    let failed = 0;

    for (const p of pacientes) {
      try {
        // Recupera nombre_farmacia del usuario desde auth.users (service role puede leer auth.users)
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("raw_user_meta_data")
          .eq("id", p.user_id)
          .single();
        
        let farmaciaNombre = "tu farmacia";
        if (!userError && userData?.raw_user_meta_data) {
          farmaciaNombre = userData.raw_user_meta_data.nombre_farmacia ?? "tu farmacia";
        } else if (userError) {
          console.warn(`[warn] No se pudo leer metadata para user_id ${p.user_id}:`, userError.message);
        }

        // Determinar tipo de recordatorio actual
        const reminderType = getCurrentReminderType(p);
        if (reminderType === 'completado') {
          console.log(`[skip] ${p.nombre} ya completó la secuencia de recordatorios`);
          continue;
        }

        // Envía el mensaje
        if (p.canal_pref === "whatsapp" && p.telefono) {
          const message = buildReminderMessage(p, farmaciaNombre, reminderType);
          await sendWhatsApp(p.telefono, message);
          console.log(`[whatsapp] ${reminderType} enviado a ${p.nombre} (${p.telefono})`);

          await supabase.from("recordatorios").insert({
            paciente_id: p.id,
            user_id: p.user_id,
            canal: "whatsapp",
            estado: "enviado",
            tipo: reminderType,
            programado_para: p.proximo_recordatorio,
            enviado_en: new Date().toISOString(),
            contenido: message,
          });
        } else if (p.canal_pref === "email" && p.email) {
          // TODO: integrar envío de email (Resend/SendGrid)
          console.log(`[email] pendiente de integrar para ${p.nombre} (${p.email})`);
        } else {
          console.warn(`[skip] ${p.nombre} no tiene canal + contacto válidos`);
          failed++;
          continue;
        }

        // Calcular PRÓXIMO recordatorio
        const nextDate = calculateNextReminderDate(p, new Date());
        
        await supabase
          .from("pacientes")
          .update({
            ultimo_envio: new Date().toISOString(),
            proximo_recordatorio: nextDate,
            recordatorios_enviados: (p.recordatorios_enviados ?? 0) + 1,
          })
          .eq("id", p.id);

        sent++;
      } catch (err) {
        console.error(`[error] paciente ${p.id}:`, err.message);
        failed++;
      }
    }

    return res.json({
      ok: true,
      processed: pacientes.length,
      sent,
      failed,
      whatsappStatus: connectionStatus,
      time: now,
    });
  } catch (err) {
    console.error("[send-reminders] error fatal:", err);
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log(`[pharmatrack-wa] Microservicio escuchando en puerto ${PORT}`);
  console.log(`[pharmatrack-wa] Iniciando sesión de WhatsApp…`);
  startWhatsApp().catch((err) => {
    console.error("[whatsapp] error iniciando:", err);
    setTimeout(() => process.exit(1), 3000);
  });
});