import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  chargeDepuisCorps,
  lireEtat,
  referenceDuLien,
  referencePaiement,
  signatureValide,
} from "@/lib/vanillapay";

const CLE = "cle-secrete-de-test";
const CORPS = JSON.stringify({
  reference: "CC-2026-0001-AB12CD",
  status: "success",
  montant: 500000,
});

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

  it("lit la notification d'une carte : l'Ariary est dans montant_mga", () => {
    expect(
      lireEtat({
        reference_VPI: "VPI23120101010101",
        reference: "ABC-1234",
        panier: "panier123",
        montant: 58.5,
        montant_mga: 292500,
        etat: "SUCCESS",
      }),
    ).toEqual({
      reference: "ABC-1234",
      reussi: true,
      echoue: false,
      montant: 292500,
      transaction: "VPI23120101010101",
    });
  });

  it("lit la notification d'un portefeuille, sans se fier à son montant", () => {
    expect(
      lireEtat({
        reference_VPI: "MM23120101010101",
        reference: "ABC-1234",
        panier: "panier123",
        montant: 58.5,
        etat: "SUCCESS",
        initiateur: "0345678909",
        referenceMM: "9049234",
      }),
    ).toEqual({
      reference: "ABC-1234",
      reussi: true,
      echoue: false,
      montant: null,
      transaction: "MM23120101010101",
    });
  });

  it("lit un corps de notification en JSON comme en formulaire", () => {
    expect(chargeDepuisCorps('{"reference":"R1","etat":"SUCCESS"}')).toEqual({
      reference: "R1",
      etat: "SUCCESS",
    });
    expect(
      lireEtat(
        chargeDepuisCorps("reference=R1&etat=FAILED&reference_VPI=VPI9"),
      ),
    ).toMatchObject({ reference: "R1", echoue: true, transaction: "VPI9" });
    expect(chargeDepuisCorps("")).toBeNull();
  });

  it("lit leur statut réel : un paiement ouvert, montants en euros", () => {
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

describe("référence de la transaction, lue sur le lien de paiement", () => {
  it("décode la référence que porte l'identifiant du lien", () => {
    expect(
      referenceDuLien(
        "https://bo.vanilla-pay.net/webpayment?id=eyJhbGciOiJIUzI1NiJ9.VlBJMjMxMjIxMTA1MjUzOTQ.signature",
      ),
    ).toBe("VPI23122110525394");
    expect(
      referenceDuLien(
        "https://bo.vanilla-pay.net/api/mobileMoney/selectChoice?id=eyJhbGciOiJIUzI1NiJ9.TU0yNTExMDUxNzAyMjQ1Ng.signature",
      ),
    ).toBe("MM25110517022456");
  });

  it("garde l'identifiant tel quel quand il ne se décode pas", () => {
    expect(
      referenceDuLien(
        "http://localhost:3000/bac-a-sable/paiement?id=CC-2026-AB12CD",
      ),
    ).toBe("CC-2026-AB12CD");
    expect(referenceDuLien("pas une adresse")).toBeNull();
  });
});

describe("référence d’une tentative", () => {
  it("porte le numéro de la facture et un suffixe lisible", () => {
    const r = referencePaiement("CC-2026-0008");
    expect(r).toMatch(/^CC-2026-0008-[A-Z2-9]{6}$/);
    expect(r.slice(13)).not.toMatch(/[O0I1]/);
  });

  it("donne une référence différente à chaque tentative", () => {
    const vues = new Set(
      Array.from({ length: 200 }, () => referencePaiement("CC-2026-0008")),
    );
    expect(vues.size).toBe(200);
  });
});
