import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { COORDONNEES } from "@/lib/coordonnees";
import { LIENS, retard } from "@/lib/traversee";

const QUESTIONS = [
  {
    q: "À quoi donne accès le pass ?",
    r: "À toute la Traversée : les expositions, la formation Doing Business in Canada, le 5 à 7 d’affaires et le Gala des 10 ans, avec le cocktail, le dîner, le spectacle et la remise des prix. Il ouvre aussi les trois défis et l’application.",
  },
  {
    q: "Faut-il être présent toute la journée ?",
    r: "Non. Votre pass est valable pour chaque temps de la journée. Venez aux moments qui vous intéressent, le Gala restant l’événement phare.",
  },
  {
    q: "Comment payer ?",
    r: "Par MVola, Orange Money, Airtel Money, carte bancaire, pratique depuis le Canada, ou virement pour les entreprises. Votre pass QR arrive dès la confirmation, par e-mail et WhatsApp.",
  },
  {
    q: "Mon entreprise peut-elle réserver pour plusieurs personnes ?",
    r: "Oui. Chaque collaborateur reçoit son billet nominatif et son propre accès à l’application. La facture est établie au nom de l’entreprise.",
  },
  {
    q: "Comment exposer ou devenir partenaire ?",
    r: "Prenez rendez-vous avec notre équipe par le bouton « Réserver un stand », ou écrivez-nous à l’adresse indiquée ci-contre.",
  },
  {
    q: "J’ai déjà un pass, comment accéder à l’application ?",
    r: "Cliquez sur « Mon espace » dans l’application de la Traversée et saisissez l’e-mail utilisé lors de la réservation. Un lien de connexion vous est envoyé.",
  },
];

export function Questions() {
  return (
    <section
      className="section clair papier scene"
      id="questions"
      aria-labelledby="titre-faq"
    >
      <div className="conteneur">
        <div className="tete">
          <h2
            id="titre-faq"
            className="titre-section reveler"
            style={retard(80)}
          >
            Tout ce qu’il faut <span className="saillant">savoir</span>
          </h2>
        </div>
        <div className="faq-grille">
          <div className="faq reveler" style={retard(120)}>
            {QUESTIONS.map((x, i) => (
              <details key={x.q} open={i === 0}>
                <summary>{x.q}</summary>
                <p>{x.r}</p>
              </details>
            ))}
          </div>
          <aside
            className="contact-carte reveler"
            style={retard(200)}
            aria-label="Contact"
          >
            <figure className="contact-photo">
              <Image
                src="/traversee/equipe.jpg"
                alt="L’équipe CanCham à l’accueil d’une rencontre"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                style={{ objectFit: "cover", objectPosition: "50% 35%" }}
              />
              <figcaption>L’équipe CanCham</figcaption>
            </figure>
            <div className="contact-corps">
              <h3>Une autre question ?</h3>
              <p>
                Notre équipe vous répond pour la billetterie, les stands et les
                partenariats.
              </p>
              <ul className="contact-lignes">
                <li>
                  <Mail size={18} aria-hidden="true" />
                  <span>
                    <small>Courriel</small>
                    <b className="sel">{COORDONNEES.email}</b>
                  </span>
                </li>
                <li>
                  <Phone size={18} aria-hidden="true" />
                  <span>
                    <small>Téléphone</small>
                    <b className="sel">{COORDONNEES.telephone}</b>
                  </span>
                </li>
              </ul>
              <a
                className="btn-action"
                href={LIENS.rendezVous}
                target="_blank"
                rel="noopener"
              >
                Prendre rendez-vous
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
