export type Database = {
  public: {
    Tables: {
      pacientes: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          telefono: string | null;
          email: string | null;
          canal_pref: "whatsapp" | "email";
          tratamiento: string;
          posologia: string;
          duracion_dias: number;
          fecha_inicio: string;
          proximo_recordatorio: string | null;
          ultimo_envio: string | null;
          recordatorios_enviados: number;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          telefono?: string | null;
          email?: string | null;
          canal_pref?: "whatsapp" | "email";
          tratamiento: string;
          posologia: string;
          duracion_dias: number;
          fecha_inicio?: string;
          proximo_recordatorio?: string | null;
          ultimo_envio?: string | null;
          recordatorios_enviados?: number;
          activo?: boolean;
        };
        Update: Partial<PacientesInsert>;
      };
      recordatorios: {
        Row: {
          id: string;
          paciente_id: string;
          user_id: string;
          canal: "whatsapp" | "email";
          estado: "programado" | "enviado" | "fallido" | "respondido";
          programado_para: string;
          enviado_en: string | null;
          tipo: "recordatorio" | "seguimiento_ia" | "alerta";
          contenido: string | null;
          respuesta: string | null;
          created_at: string;
        };
      };
      suscripciones: {
        Row: {
          id: string;
          user_id: string;
          plan: "trial" | "basic" | "pro" | "business";
          estado: "trial" | "activa" | "vencida" | "cancelada";
          inicio_trial: string;
          fin_trial: string | null;
          inicio_suscripcion: string | null;
          fin_periodo: string | null;
          paypal_subscription_id: string | null;
          paypal_plan_id: string | null;
          paypal_email: string | null;
          ultimo_evento_paypal: string | null;
          ultimo_evento_en: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: "trial" | "basic" | "pro" | "business";
          estado?: "trial" | "activa" | "vencida" | "cancelada";
          inicio_trial?: string;
          fin_trial?: string | null;
          inicio_suscripcion?: string | null;
          fin_periodo?: string | null;
          paypal_subscription_id?: string | null;
          paypal_plan_id?: string | null;
          paypal_email?: string | null;
          ultimo_evento_paypal?: string | null;
          ultimo_evento_en?: string | null;
        };
        Update: Partial<SuscripcionesInsert>;
      };
    };
  };
};

type PacientesInsert = Database["public"]["Tables"]["pacientes"]["Insert"];
type SuscripcionesInsert =
  Database["public"]["Tables"]["suscripciones"]["Insert"];
