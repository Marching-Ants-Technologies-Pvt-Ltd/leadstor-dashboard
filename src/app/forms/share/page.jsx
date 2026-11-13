"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SharedForm() {
  const token = useSearchParams().get("token") || "";

  // Tokens are base64, so anything else is rejected before it goes into the page
  if (!/^[A-Za-z0-9+/=]+$/.test(token)) {
    return <div style={{ padding: 40, textAlign: "center" }}>This form link is invalid.</div>;
  }

  const widgetSrc = `${process.env.NEXT_PUBLIC_LEADSTOR_REST}/form-widget/composer.js?t=${Date.now()}`;

  const iframeDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          *, *:before, *:after { padding: 0; margin: 0; box-sizing: border-box; }
          body { min-height: 100vh; background: linear-gradient(135deg, #6f6df4, #4c46f5); }
          #ConceptNinjasFormContainer {
            width: min(560px, 92%);
            padding: 35px 50px;
            transform: translate(-50%, -50%);
            position: absolute;
            left: 50%;
            top: 50%;
            border-radius: 10px;
            box-shadow: 20px 30px 25px rgba(0,0,0,0.15);
          }
          @media (max-width: 550px) { #ConceptNinjasFormContainer { padding: 25px 20px; } }
        </style>
      </head>
      <body>
        <script type="text/javascript" data-integrity="${token}" src="${widgetSrc}"></script>
      </body>
    </html>
  `;

  return <iframe srcDoc={iframeDoc} title="Form" style={{ width: "100%", height: "100vh", border: "none" }} />;
}

export default function PublicFormPage() {
  return (
    <Suspense fallback={null}>
      <SharedForm />
    </Suspense>
  );
}