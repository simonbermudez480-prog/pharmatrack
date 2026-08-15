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
    // NO convertir a objeto plano, eso rompe el KeyStore.
    // El problema del destructuring era por Proxy; usamos Object.assign para crear un objeto plano simple
    // que mantenga la referencia a keys (que SÍ debe tener get/set).
    const safeAuthState = {
      creds: authState.creds,
      keys: authState.keys,  // Mantener el KeyStore original con get/set
    };
    console.log("[whatsapp] safeAuthState listo, keys tiene get/set:", 
      typeof safeAuthState.keys?.get === 'function' && typeof safeAuthState.keys?.set === 'function');
  } catch (err) {
    console.error("[whatsapp] Error fatal cargando auth state:", err.message);
    throw err;
  }

  sock = makeWASocket({
    authState: safeAuthState,
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
// Construye el cuerpo del recordatorio
// ------------------------------------------------------------
function buildReminderMessage(paciente, farmacia) {
  return `Hola ${paciente.nombre}, te recordamos que es momento de renovar tu tratamiento "${paciente.tratamiento}" (${paciente.posologia}).

Pásate por *${farmacia}* cuando puedas. ¡Gracias por seguir al pie de tu salud!`;
}

// ------------------------------------------------------------
// Calcula el próximo recordatorio
//   3 días antes de que se acabe, si no responde vuelve un día después,
//   luego el día del vencimiento.
//   Post-vencimiento: +3 días, después +7 días por 3 veces.
//   Acá simplificado: por defecto +7 días (el agente IA puede espaciarlos).
// ------------------------------------------------------------
function nextReminderDate(now = new Date()) {
  const next = new Date(now);
  next.setDate(next.getDate() + 7);
  return next.toISOString();
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
        tratamiento, posologia, proximo_recordatorio
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
        // Recupera nombre_farmacia del usuario
        const { data: userData } = await supabase
          .auth.admin.getUserById(p.user_id)
          .catch(() => ({ data: { user: { user_metadata: {} } } }));
        const farmaciaNombre =
          userData?.data?.user?.user_metadata?.nombre_farmacia ?? "tu farmacia";

        // Envía el mensaje
        if (p.canal_pref === "whatsapp" && p.telefono) {
          const message = buildReminderMessage(p, farmaciaNombre);
          await sendWhatsApp(p.telefono, message);
          console.log(`[whatsapp] enviado a ${p.nombre} (${p.telefono})`);

          await supabase.from("recordatorios").insert({
            paciente_id: p.id,
            user_id: p.user_id,
            canal: "whatsapp",
            estado: "enviado",
            tipo: "recordatorio",
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

        // Actualiza el paciente: último envío ahora, próximo en +7 días
        await supabase
          .from("pacientes")
          .update({
            ultimo_envio: new Date().toISOString(),
            proximo_recordatorio: nextReminderDate(now),
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
      time: new Date().toISOString(),
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