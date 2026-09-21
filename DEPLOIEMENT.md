# Déployer CanCham Connect sur Railway

Ce guide part d'un compte Railway vide et va jusqu'à une plateforme en
service, avec son premier administrateur. Comptez une heure, dont l'essentiel
à attendre la vérification du domaine d'e-mail.

La configuration de Railway est versionnée dans le dépôt :

| Fichier | Rôle |
|---|---|
| [`Dockerfile`](./Dockerfile) | L'image : Node 24, LibreOffice et poppler pour convertir les ressources, fuseau d'Antananarivo |
| [`railway.json`](./railway.json) | Construction par le Dockerfile, migrations avant chaque déploiement, contrôle de santé |
| [`.env.example`](./.env.example) | Toutes les variables, commentées |

---

## 1. Le projet Railway

1. **Nouveau projet** → *Deploy from GitHub repo* → le dépôt de CanCham
   Connect. Railway trouve `railway.json` et construit avec le Dockerfile.
2. Dans le même projet : **+ New → Database → PostgreSQL**.
3. Sur le service de l'application : **clic droit → Attach volume**, point de
   montage **`/data`**. C'est là que vont les images, les ressources et les
   pièces jointes ; le disque du conteneur, lui, est effacé à chaque
   déploiement.

> **Une seule instance.** Un volume Railway ne se partage pas entre
> plusieurs répliques, et la limitation des tentatives de connexion vit en
> mémoire. Laissez le nombre de répliques à 1.

## 2. Les variables

Sur le service de l'application, onglet **Variables** :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (référence au service PostgreSQL) |
| `AUTH_SECRET` | Une clé longue et aléatoire, voir ci-dessous. **Sans elle, personne ne peut se connecter.** |
| `STOCKAGE_RACINE` | `/data` |
| `APP_URL` | L'adresse publique, sans barre finale : `https://connect.cancham.mg` |
| `RESEND_API_KEY` | La clé Resend (étape 3) |
| `COURRIEL_EXPEDITEUR` | `CanCham Connect <connect@cancham.mg>` — sur le domaine vérifié |
| `COURRIEL_EQUIPE` | L'adresse qui reçoit les alertes d'inscription et les réponses aux e-mails |

Générer `AUTH_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Changer `AUTH_SECRET` plus tard déconnecte tout le monde : c'est aussi le
moyen de fermer toutes les sessions d'un coup en cas d'incident.

**À ne jamais définir en production** : `CANCHAM_TODAY`, qui fige la date du
jour pour les démonstrations, et `MOT_DE_PASSE_DEMO`. Le fuseau horaire est
fixé dans l'image (`TZ=Indian/Antananarivo`) : rien à régler.

Au démarrage, la plateforme écrit dans ses journaux une ligne
`[configuration]` pour chaque variable manquante. Un déploiement sans aucune
de ces lignes est complet.

## 3. Les e-mails (Resend)

1. Créez un compte sur [resend.com](https://resend.com).
2. **Domains → Add domain** : `cancham.mg` (ou un sous-domaine, par exemple
   `mail.cancham.mg`, pour ne pas toucher au courrier existant).
3. Resend affiche des enregistrements DNS (SPF, DKIM, et un MX pour les
   retours). Ajoutez-les tels quels chez le gestionnaire du domaine, puis
   attendez le statut **Verified**, de quelques minutes à quelques heures.
4. **API Keys → Create** avec la permission *Sending access*. Copiez la clé
   dans `RESEND_API_KEY`.

Tant que le domaine n'est pas vérifié, Resend n'accepte d'écrire qu'à
l'adresse du propriétaire du compte : les membres ne reçoivent rien.

Ce qui part par e-mail :

- le lien de réinitialisation du mot de passe, valable une heure ;
- l'invitation d'un contact ajouté par l'équipe ou par un collègue, valable
  sept jours ;
- la bienvenue après une inscription, et l'alerte correspondante à l'équipe ;
- l'annonce d'une demande d'adhésion approuvée ;
- la relance de cotisation, envoyée depuis la fiche d'un membre.

## 4. Premier déploiement

Railway construit l'image à chaque envoi sur la branche suivie. Puis, dans
l'ordre :

1. **Avant le déploiement** : `prisma migrate deploy` crée ou met à jour les
   tables. Si une migration échoue, le déploiement s'arrête et l'ancienne
   version continue de tourner.
2. **Contrôle de santé** : Railway attend que `/api/sante` réponde 200 — la
   base répond, le volume est accessible en écriture — avant d'y envoyer le
   trafic.

### Le premier administrateur

La base de production part **vide** : pas de données de démonstration, donc
personne pour ouvrir le back-office. Depuis un terminal, avec la
[CLI Railway](https://docs.railway.com/guides/cli) :

```bash
railway link          # choisir le projet et le service de l'application
railway ssh           # ouvre un terminal dans le conteneur
npm run admin:creer -- --email prenom@cancham.mg --nom "Prénom Nom"
```

Le mot de passe est demandé au clavier, sans s'afficher. Connectez-vous
ensuite sur `/public`. Vos collègues créent leur compte par l'inscription,
puis vous les promouvez depuis **Équipe & accès**.

Le même script remplace le mot de passe d'un administrateur existant et
ferme ses sessions : c'est le recours si l'accès est perdu.

> **Jamais en production** : `npm run db:seed`, `db:reset` ni aucun script
> `*:demo`. Ils chargent des entreprises fictives, ou effacent la base.

## 5. Le domaine

**Settings → Networking → Custom domain** sur le service de l'application :
Railway indique un enregistrement CNAME à créer. Le certificat HTTPS suit
tout seul. Mettez ensuite `APP_URL` à jour : c'est elle qui fait les liens
des e-mails.

## 6. Vérifier que tout fonctionne

- [ ] `https://…/api/sante` affiche `{"etat":"ok","base":"ok","stockage":"ok"}`.
- [ ] Aucune ligne `[configuration]` dans les journaux du démarrage.
- [ ] Connexion avec le compte administrateur.
- [ ] « Mot de passe oublié ? » depuis la page de connexion : l'e-mail arrive,
      le lien fonctionne.
- [ ] Une image envoyée (logo d'un membre, par exemple) est toujours là
      **après un redéploiement** : le volume est bien monté.
- [ ] Une ressource DOCX ajoutée dans le back-office s'affiche page par page :
      LibreOffice fonctionne dans l'image.

## 7. Sauvegardes

Deux choses à sauvegarder : la base, et le volume `/data`.

- Sur **chacun des deux services** (PostgreSQL et l'application) :
  **Backups → Edit schedule**, sauvegarde quotidienne. Railway les garde
  selon le plan choisi.
- Avant une opération délicate, une copie de la base à la main :

  ```bash
  pg_dump "$DATABASE_PUBLIC_URL" --format=custom --file=cancham-$(date +%F).dump
  ```

  `DATABASE_PUBLIC_URL` se trouve dans les variables du service PostgreSQL.
  Pour restaurer : `pg_restore --clean --dbname="$DATABASE_PUBLIC_URL" fichier.dump`.

Une sauvegarde qui n'a jamais été restaurée n'est qu'un espoir : essayez une
restauration sur une base de test au moins une fois.

## 8. Surveiller

- **Les erreurs** : chaque erreur serveur est une ligne JSON dans les journaux
  Railway, avec `"niveau":"erreur"`. Filtrez sur ce mot.
- **Un membre signale un incident** : la page d'incident lui montre une
  *référence* (par exemple `1912825474`). Cherchez-la dans les journaux : c'est
  le champ `digest` de la ligne d'erreur, avec la page, le message et la pile.
- **La santé** : `/api/sante` répond 503 si la base ou le volume décroche.
  Un service de surveillance externe (UptimeRobot, Better Stack…) peut
  l'interroger toutes les cinq minutes et prévenir par e-mail.

## 9. Mettre à jour

Un envoi sur la branche suivie suffit : construction, migrations, contrôle de
santé, bascule. La version précédente reste en service jusqu'à ce que la
nouvelle réponde. En cas de problème : **Deployments → la version
précédente → Redeploy**. Une migration déjà appliquée ne se défait pas ainsi :
restaurez la sauvegarde de la base si elle est en cause.
