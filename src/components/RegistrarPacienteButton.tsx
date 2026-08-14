"use client";

import Link from "next/link";

export function RegistrarPacienteButton() {
  return (
    <Link
      href="/dashboard/registrar"
      className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-btn bg-forest text-white font-semibold text-sm hover:bg-forest-dark transition-colors"
    >
      + Registrar paciente crónico
    </Link>
  );
}

export default RegistrarPacienteButton;
