"use client";

import { Check } from "lucide-react";
import { ChampPhoto, Field, INPUT, SubmitButton } from "@/components/form-bits";
import { Card } from "@/components/ui";
import { modifierProfilEquipe } from "@/lib/actions/equipe";
import type { User } from "@/lib/types";

/** Profil de la personne de l'équipe : photo, identité, coordonnées. */
export function FormulaireProfilEquipe({ user }: { user: User }) {
  return (
    <Card className="p-6">
      <form action={modifierProfilEquipe} className="flex flex-col gap-4">
        <ChampPhoto
          name="photo"
          retirer="retirerPhoto"
          apercu={user.photo}
          libelle="Photo de profil"
          aide="Un portrait cadré sur le visage. JPEG, PNG ou WebP, 8 Mo au plus."
          rond
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet">
            <input
              name="nom"
              required
              defaultValue={user.nom}
              autoComplete="name"
              className={INPUT}
            />
          </Field>
          <Field label="Fonction">
            <input
              name="fonction"
              required
              defaultValue={user.fonction}
              autoComplete="organization-title"
              placeholder="Ex. Chargée des adhésions"
              className={INPUT}
            />
          </Field>
          <Field label="E-mail">
            <input
              type="email"
              name="email"
              required
              defaultValue={user.email}
              autoComplete="email"
              className={INPUT}
            />
          </Field>
          <Field label="Téléphone">
            <input
              type="tel"
              name="tel"
              defaultValue={user.tel ?? ""}
              autoComplete="tel"
              placeholder="+261 34 00 000 00"
              className={INPUT}
            />
          </Field>
        </div>
        <div className="flex justify-end pt-1">
          <SubmitButton pendingLabel="Enregistrement…">
            <Check size={15} /> Enregistrer le profil
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}
