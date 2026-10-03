"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function FormPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const widgetSrc = `${process.env.NEXT_PUBLIC_LEADSTOR_REST}/form-widget/composer.js?t=${Date.now()}`;

  const iframeDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          *, *:before, *:after { padding: 0; margin: 0; box-sizing: border-box; }
          body { height: 100vh; background: linear-gradient(135deg, #6f6df4, #4c46f5); }
          #ConceptNinjasFormContainer {
            min-width: 520px;
            padding: 35px 50px;
            transform: translate(-50%, -50%);
            position: absolute;
            left: 50%;
            top: 50%;
            border-radius: 10px;
            box-shadow: 20px 30px 25px rgba(0,0,0,0.15);
          }
        </style>
      </head>
      <body>
        <script type="text/javascript" data-integrity="${token}" src="${widgetSrc}"></script>
      </body>
    </html>
  `;

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <button
        onClick={() => router.back()}
        style={{ position: "absolute", top: 16, left: 16, zIndex: 10, background: "white", border: "none", borderRadius: 6, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
      >
        <ArrowLeft size={16} /> Back
      </button>
      <iframe
        srcDoc={iframeDoc}
        title="Form Preview"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}