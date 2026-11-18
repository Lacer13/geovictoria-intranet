import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Share2 } from "lucide-react";
import toast from "react-hot-toast";

export default function QRCodeSection() {
  const ref = useRef(null);
  const url = window.location.origin;
  const download = () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "GeoVictoria-Intranet-QR.svg";
    link.href = objectUrl;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error(
        "No pudimos copiar el enlace. Cópialo desde la barra de direcciones.",
      );
    }
  };
  return (
    <section className="panel qr-panel">
      <div>
        <span className="quick-icon blue">
          <Share2 size={22} />
        </span>
        <h2>Lleva la intranet contigo</h2>
        <p>Escanea el QR para abrir esta intranet en tu teléfono.</p>
        <div className="qr-actions">
          <button onClick={download} className="btn btn-secondary">
            <Download size={16} /> Descargar QR
          </button>
          <button onClick={copy} className="text-link">
            <Copy size={15} /> Copiar enlace
          </button>
        </div>
      </div>
      <div ref={ref} className="qr-code">
        <QRCodeSVG
          value={url}
          size={152}
          marginSize={3}
          fgColor="#244c3e"
          level="M"
          title="Código QR de esta intranet"
        />
      </div>
    </section>
  );
}
