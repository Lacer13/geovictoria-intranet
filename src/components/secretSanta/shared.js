import toast from "react-hot-toast";
export const emptySettings = {
  enabled: false,
  serviceId: "",
  templateId: "",
  publicKey: "",
};
export const statusNames = {
  draft: "Borrador",
  drawn: "Sorteado",
  archived: "Archivado",
};
export const messageFor = (error, fallback) =>
  error.code ? fallback : error.message || fallback;
export const copyText = async (value, notice = "Enlace privado copiado") => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(notice);
  } catch {
    toast.error("No pudimos copiarlo. Revisa los permisos del portapapeles.");
  }
};
