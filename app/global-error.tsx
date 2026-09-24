"use client";

import { useEffect } from "react";

/**
 * Dernier filet : la coquille elle-même n'a pas pu se construire.
 *
 * Cette page remplace le document entier — ni styles, ni polices, ni
 * composants de l'application ne sont garantis. Elle se suffit donc à
 * elle-même, en styles en ligne.
 */
export default function ErreurGlobale({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          background: "#f3f5f8",
          color: "#0f1d2c",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
        }}
      >
        <title>Incident — CanCham Connect</title>
        <main style={{ maxWidth: 480, textAlign: "center" }}>
          {/*
            Une balise `img` ordinaire : à ce stade, rien de l'application
            n'est garanti, mais un fichier du dossier public reste servi.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/marque/illustration-incident.png"
            alt=""
            width={240}
            style={{
              width: "min(240px, 62vw)",
              height: "auto",
              margin: "0 auto 18px",
            }}
          />
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8a97a6",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            CanCham Connect
          </div>
          <h1 style={{ fontSize: 26, margin: "0 0 12px" }}>
            La plateforme est momentanément indisponible
          </h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#4a5a6b" }}>
            Un problème est survenu de notre côté. Réessayez dans un instant ;
            s’il persiste, écrivez à l’équipe CanCham.
          </p>
          {error.digest ? (
            <p style={{ fontSize: 12, color: "#8a97a6" }}>
              Référence à communiquer : <code>{error.digest}</code>
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 18,
              background: "#ad0707",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "12px 22px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
