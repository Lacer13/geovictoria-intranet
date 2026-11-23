export default function SantaMailLimits() {
  return (
    <details className="santa-mail-limits">
      <summary>¿Cuántos correos puedo enviar?</summary>
      <p>
        El plan gratuito de EmailJS ofrece{" "}
        <strong>200 solicitudes al mes</strong>. Cada envío, prueba o reenvío
        utiliza cuota. El límite y el saldo de tu cuenta pueden ser distintos
        según tu plan y tu proveedor de correo.
      </p>
      <p>
        La intranet no puede consultar tu saldo. Revísalo en{" "}
        <a
          href="https://dashboard.emailjs.com/"
          target="_blank"
          rel="noreferrer"
        >
          tu panel de EmailJS
        </a>{" "}
        antes de enviar. Puedes compartir los enlaces sin usar esa cuota.
      </p>
      <a
        href="https://www.emailjs.com/pricing/"
        target="_blank"
        rel="noreferrer"
      >
        Consultar planes y límites vigentes
      </a>
    </details>
  );
}
