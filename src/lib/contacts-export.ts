import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ContactDto } from "@/lib/types";

export type ExportableContact = ContactDto & {
  waIdentity?: string | null;
  stageId?: string | null;
  tagsList?: string;
  leadValue?: number | string | null;
  lastMessageAt?: string | null;
  lastMessageFormatted?: string;
};

const HEADERS = [
  "Nombre",
  "Teléfono / Identidad",
  "Canal",
  "Etapa",
  "Etiquetas",
  "Origen",
  "Valor",
  "Último mensaje",
];

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportContactsToExcel(
  contacts: ExportableContact[],
  _businessName = "Wachato CRM"
) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `contactos-${dateStr}.xlsx`;

  const rows = contacts.map((c) => {
    const sourceStr = typeof c.source === "string" ? c.source : c.source?.value ?? "";
    return [
      c.name,
      c.phone || c.waIdentity || "",
      c.channel || "whatsapp",
      c.stageName || c.stageId || "",
      Array.isArray(c.tags) ? c.tags.join(", ") : "",
      sourceStr,
      c.leadValue ? `RD$ ${Number(c.leadValue).toLocaleString("es-DO")}` : "RD$ 0",
      c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString("es-DO") : "",
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws["!cols"] = [25, 20, 14, 16, 20, 30, 16, 22].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contactos");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(filename, blob);
}

export function exportContactsToPdf(
  contacts: ExportableContact[],
  businessName = "Wachato CRM"
) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `contactos-${dateStr}.pdf`;

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.setTextColor(13, 25, 32);
  doc.text(`Contactos · ${businessName}`, 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(110, 120, 130);
  doc.text(
    `Exportado desde Wachato el ${new Date().toLocaleDateString("es-DO")} · ${contacts.length} contactos`,
    14,
    22
  );

  const rows = contacts.map((c) => {
    const sourceStr = typeof c.source === "string" ? c.source : c.source?.value ?? "";
    return [
      c.name,
      c.phone || c.waIdentity || "",
      c.channel || "whatsapp",
      c.stageName || c.stageId || "",
      Array.isArray(c.tags) ? c.tags.join(", ") : "",
      sourceStr,
      c.leadValue ? `RD$ ${Number(c.leadValue).toLocaleString("es-DO")}` : "RD$ 0",
      c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString("es-DO") : "",
    ];
  });

  autoTable(doc, {
    head: [HEADERS],
    body: rows,
    startY: 27,
    styles: { fontSize: 8, font: "helvetica" },
    headStyles: { fillColor: [0, 196, 192], textColor: [3, 32, 31], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [243, 248, 249] },
  });

  doc.save(filename);
}
