import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { lireEtat, referencePaiement, signatureValide } from "@/lib/vanillapay";

/**
 * La notification du prestataire est ce qui règle une facture : si sa
 * signature se vérifiait mal, n'importe qui pourrait nous annoncer un
 * paiement. Ces épreuves n'ont besoin ni de réseau ni de base.
 */

const CLE = "cle-secrete-de-test";
const CORPS = JSON.stringify({
  reference: "CC-2026-0001-AB12CD",
  status: "success",
  montant: 500000,
});

/** La signature telle que Vanilla Pay la calcule : HMAC-SHA256, hexadécimal. */
const signer = (corps: string, cle = CLE) =>
  createHmac("sha256", cle).update(corps, "utf8").digest("hex");

beforeAll(() => {
  process.env.VANILLAPAY_BASE = "https://exemple.test";
  process.env.VANILLAPAY_CLIENT_ID = "identifiant-de-test";
  process.env.VANILLAPAY_CLIENT_SECRET = "secret-de-test";
  process.env.VANILLAPAY_KEY_SECRET = CLE;
});

describe("signature des notifications", () => {
  it("accepte la signature du corps exact, en majuscules", () => {
    expect(signatureValide(CORPS, signer(CORPS).toUpperCase())).toBe(true);
  });

  it("accepte la même signature écrite en minuscules", () => {
    expect(signatureValide(CORPS, signer(CORPS))).toBe(true);
  });

  it("refuse un corps modifié, même d’un seul caractère", () => {
    const signature = signer(CORPS);
    const trafique = CORPS.replace("500000", "500001");
    expect(signatureValide(trafique, signature)).toBe(false);
  });

  it("refuse une signature calculée avec une autre clé", () => {
    expect(signatureValide(CORPS, signer(CORPS, "autre-cle"))).toBe(false);
  });

  it("refuse une signature absente, vide ou tronquée", () => {
    expect(signatureValide(CORPS, null)).toBe(false);
    expect(signatureValide(CORPS, "")).toBe(false);
    expect(signatureValide(CORPS, signer(CORPS).slice(0, 40))).toBe(false);
  });

  it("refuse tout quand la clé n’est pas configurée", () => {
    const cle = process.env.VANILLAPAY_KEY_SECRET;
    const signature = signer(CORPS);
    delete process.env.VANILLAPAY_KEY_SECRET;
    expect(signatureValide(CORPS, signature)).toBe(false);
    process.env.VANILLAPAY_KEY_SECRET = cle;
  });
});

describe("lecture de l’état d’un paiement", () => {
  it("lit un encaissement, quelle que soit la forme de leur réponse", () => {
    expect(
      lireEtat({
        reference: "CC-2026-0001-AB12CD",
        status: "success",
        montant: 500000,
        devise: "MGA",
      }),
    ).toMatchObject({
      reference: "CC-2026-0001-AB12CD",
      reussi: true,
      echoue: false,
      montant: 500000,
    });

    expect(
      lireEtat({
        data: {
          reference: "CC-2026-0001-AB12CD",
          statut: "PAID",
          amount: 250000,
          currency: "mga",
        },
      }),
    ).toMatchObject({ reussi: true, montant: 250000 });
  });

  it("lit leur notification : etat, reference et reference_VPI", () => {
    expect(
      lireEtat({
        reference_VPI: "VPI26100112345678",
        panier: "CC-2026-0452",
        reference: "CC-2026-AB12CD",
        remarque: "",
        etat: "SUCCESS",
      }),
    ).toEqual({
      reference: "CC-2026-AB12CD",
      reussi: true,
      echoue: false,
      montant: null,
      transaction: "VPI26100112345678",
    });
  });

  it("lit la réponse du statut, dans son enveloppe", () => {
    expect(
      lireEtat({
        CodeRetour: 200,
        DescRetour: "Statut de la transaction",
        DetailRetour: "",
        Data: { reference: "R1", etat: "FAILED", referenceVPI: "VPI-1" },
      }),
    ).toMatchObject({ reference: "R1", reussi: false, echoue: true });
    expect(
      lireEtat({ CodeRetour: 200, Data: { reference: "R1", etat: "PENDING" } }),
    ).toMatchObject({ reussi: false, echoue: false });
  });

  it("lit leur statut réel : un paiement ouvert, montants en euros", () => {
    // Relevé sur leur API de production, le 1er octobre 2026.
    const etat = lireEtat({
      CodeRetour: 200,
      DescRetour: "Transaction status.",
      DetailRetour: "",
      Data: {
        reference_VPI: "VPI26100109190423",
        panier: "CC-2026-10007",
        reference: "CC-2026-XZLM6L",
        montant: "1.01",
        montantRecu: "0.95",
        etat: "INITIATED",
        remarque: "",
      },
    });
    expect(etat).toEqual({
      reference: "CC-2026-XZLM6L",
      reussi: false,
      echoue: false,
      // 1,01 € ne se compare pas à 5 000 Ar : le montant n'est pas retenu.
      montant: null,
      transaction: "VPI26100109190423",
    });
  });

  it("lit un échec sans le prendre pour une réussite", () => {
    expect(lireEtat({ reference: "R1", status: "failed" })).toMatchObject({
      reussi: false,
      echoue: true,
    });
    expect(lireEtat({ reference: "R1", status: "canceled" })).toMatchObject({
      echoue: true,
    });
  });

  it("ne conclut rien sur un état qu’il ne comprend pas", () => {
    const etat = lireEtat({ reference: "R1", status: "quelque_chose_de_neuf" });
    expect(etat).toMatchObject({ reussi: false, echoue: false });
  });

  it("refuse une charge sans référence : elle ne mène à aucune tentative", () => {
    expect(lireEtat({ status: "success" })).toBeNull();
    expect(lireEtat(null)).toBeNull();
    expect(lireEtat("success")).toBeNull();
  });

  it("garde l’identifiant de transaction quand il est donné", () => {
    expect(
      lireEtat({ reference: "R1", status: "success", transaction_id: "VP-99" }),
    ).toMatchObject({ transaction: "VP-99" });
  });
});

describe("référence d’une tentative", () => {
  it("porte le numéro de la facture et un suffixe lisible", () => {
    const r = referencePaiement("CC-2026-0008");
    expect(r).toMatch(/^CC-2026-0008-[A-Z2-9]{6}$/);
    // Ni O ni 0, ni I ni 1 : la référence se relit au téléphone.
    expect(r.slice(13)).not.toMatch(/[O0I1]/);
  });

  it("donne une référence différente à chaque tentative", () => {
    const vues = new Set(
      Array.from({ length: 200 }, () => referencePaiement("CC-2026-0008")),
    );
    expect(vues.size).toBe(200);
  });
});
