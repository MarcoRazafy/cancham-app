"use client";

import { useEffect } from "react";
import { decompte, EVENEMENT } from "@/lib/traversee";

const PHOTO = (nom: string) => `/traversee/${nom}.jpg`;

const deux = (n: number) => String(n).padStart(2, "0");

function qr(): string {
  let s = "";
  for (let q = 0; q < 81; q++) {
    const l = Math.floor(q / 9);
    const c = q % 9;
    const coin = (l < 3 && c < 3) || (l < 3 && c > 5) || (l > 5 && c < 3);
    s += `<i${coin || (q * 7 + l * 3) % 5 < 2 ? "" : ' class="v"'}></i>`;
  }
  return s;
}

function mini(photo: string, titre: string, lot: string, action: string) {
  return `<div class="mini"><div class="v"><img src="${PHOTO(photo)}" alt="" style="position:absolute;inset:0"></div><div><strong>${titre}</strong><b>${lot}</b><span>${action}</span></div></div>`;
}

const LOT = EVENEMENT.lotTombola.toLocaleString("fr-FR") + " Ar";

const VUES: Record<string, string> = {
  Défis: `<h3>Vos deux défis</h3><p class="etape-m">Étape 2 sur 3 · Remplissez votre profil pour être éligible</p>${mini("oratrice", "Pitch MECC 2027", "1 mois au Canada", "Suivre le guide")}${mini("equipe", "Tombola « J’y serai »", LOT, "Suivre le guide")}`,
  Réseau:
    '<h3>Qui sera là ?</h3><div class="rang"><i></i><div><strong>Dirigeants et entrepreneurs</strong><small>Voir les profils</small></div></div><div class="rang"><i></i><div><strong>Banques et financement</strong><small>Prendre rendez-vous</small></div></div><div class="rang"><i></i><div><strong>Experts du marché canadien</strong><small>Poser une question</small></div></div>',
  Infos:
    '<h3>Le programme</h3><div class="ligne-p"><em>Journée</em>Expositions des membres</div><div class="ligne-p"><em>Journée</em>Panels d’experts</div><div class="ligne-p"><em>17 h 00</em>Réseautage 5 à 7</div><div class="ligne-p"><em>19 h 00</em>Gala des 10 ans</div>',
  Billet: `<h3>Votre billet</h3><div class="qr">${qr()}</div><p class="billet-m">${EVENEMENT.nom} · 18 décembre 2026<small>${EVENEMENT.lieu}</small></p>`,
};

export function Interactions() {
  useEffect(() => {
    const racine = document.querySelector<HTMLElement>(".la-traversee");
    if (!racine) return;
    const $ = <T extends Element = HTMLElement>(
      s: string,
      r: Element = racine,
    ) => r.querySelector<T>(s);
    const $$ = <T extends Element = HTMLElement>(
      s: string,
      r: Element = racine,
    ) => Array.from(r.querySelectorAll<T>(s));
    const calme = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const nettoyage: (() => void)[] = [];
    const ecoute = <K extends keyof HTMLElementEventMap>(
      el: Element | Window | Document,
      type: K | string,
      fn: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions,
    ) => {
      el.addEventListener(type, fn, options);
      nettoyage.push(() => el.removeEventListener(type, fn, options));
    };

    const maj = () => {
      const d = decompte();
      const v: Record<string, string> = {
        j: String(d.j),
        h: deux(d.h),
        m: deux(d.m),
        s: deux(d.s),
      };
      $$("[data-cd]").forEach((el) => {
        const t = v[el.dataset.cd ?? "s"];
        if (el.textContent !== t) el.textContent = t;
      });
      const m = $("[data-cd-mini]");
      if (m) m.textContent = `${d.j} j ${v.h} h ${v.m} min`;
    };
    maj();
    const horloge = window.setInterval(maj, 1000);
    nettoyage.push(() => window.clearInterval(horloge));

    const progres = $(".progres");
    const fond = $("[data-fonds]");
    let attente = false;
    const defil = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const y = window.scrollY;
      if (progres) progres.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      if (!calme && y < 1200 && fond)
        fond.style.transform = `translateY(${y * 0.18}px) scale(1.06)`;
      attente = false;
    };
    ecoute(
      window,
      "scroll",
      () => {
        if (!attente) {
          attente = true;
          requestAnimationFrame(defil);
        }
      },
      { passive: true },
    );
    defil();

    const hero = $("#hero");
    const onglets = $$(".onglet", hero ?? racine);
    const fonds = $$(".fonds img", hero ?? racine);
    const moment = $("[data-moment]");
    let pauseH = false;
    const va = (i: number) => {
      onglets.forEach((o, k) => {
        o.classList.remove("actif");
        if (k === i) {
          void o.offsetWidth;
          o.classList.add("actif");
        }
      });
      fonds.forEach((f, k) => f.classList.toggle("actif", k === i));
      if (moment) moment.innerHTML = onglets[i].dataset.t ?? "";
    };
    onglets.forEach((o, i) => {
      ecoute(o, "click", () => va(i));
      ecoute(o, "mouseenter", () => {
        if (!o.classList.contains("actif")) va(i);
      });
      const barre = o.querySelector("i");
      if (barre)
        ecoute(barre, "animationend", () => {
          if (!pauseH) va((i + 1) % onglets.length);
        });
    });
    const zoneOnglets = $("[data-onglets]");
    if (zoneOnglets && hero) {
      ecoute(zoneOnglets, "mouseenter", () => {
        pauseH = true;
        hero.classList.add("pause");
      });
      ecoute(zoneOnglets, "mouseleave", () => {
        pauseH = false;
        hero.classList.remove("pause");
      });
    }

    $$(".atouts div").forEach((c) => {
      ecoute(c, "pointermove", (e) => {
        const ev = e as PointerEvent;
        const b = c.getBoundingClientRect();
        c.style.setProperty("--x", `${ev.clientX - b.left}px`);
        c.style.setProperty("--y", `${ev.clientY - b.top}px`);
      });
    });

    const flottante = $("[data-flottante]");
    const billet = $("#billet");
    if (flottante && hero && billet && "IntersectionObserver" in window) {
      let heroVu = true;
      let billetVu = false;
      const montrer = () => {
        const v = !heroVu && !billetVu;
        flottante.classList.toggle("visible", v);
        flottante.setAttribute("aria-hidden", String(!v));
        flottante
          .querySelectorAll("a")
          .forEach((a) => (a.tabIndex = v ? 0 : -1));
      };
      const ioF = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.target === hero) heroVu = e.isIntersecting;
            if (e.target === billet) billetVu = e.isIntersecting;
          });
          montrer();
        },
        { threshold: 0.15 },
      );
      ioF.observe(hero);
      ioF.observe(billet);
      nettoyage.push(() => ioF.disconnect());
    }

    if (!calme && "IntersectionObserver" in window) {
      const pass = $("[data-pass]");
      if (pass) {
        ecoute(pass, "pointermove", (e) => {
          const ev = e as PointerEvent;
          if (ev.pointerType === "touch") return;
          const b = pass.getBoundingClientRect();
          const x = (ev.clientX - b.left) / b.width - 0.5;
          const y = (ev.clientY - b.top) / b.height - 0.5;
          pass.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-4px)`;
        });
        ecoute(pass, "pointerleave", () => {
          pass.style.transform = "";
        });
      }
      racine.classList.add("js");
      const io = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("vu");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 },
      );
      $$("[data-r],[data-s],[data-vu]").forEach((n) => io.observe(n));
      nettoyage.push(() => io.disconnect());
    }

    if (!calme) {
      if (hero) {
        const lent = document.createElement("div");
        lent.className = "lent";
        fonds.forEach((f) => {
          const i = new Image();
          i.alt = "";
          i.src =
            (f as HTMLImageElement).currentSrc || f.getAttribute("src") || "";
          lent.appendChild(i);
        });
        const wrap = $(".wrap", hero);
        hero.insertBefore(lent, wrap);
        nettoyage.push(() => lent.remove());
        const syncLent = () =>
          fonds.forEach((f, k) =>
            lent.children[k]?.classList.toggle(
              "actif",
              f.classList.contains("actif"),
            ),
          );
        syncLent();
        const mo = new MutationObserver(syncLent);
        if (fond)
          mo.observe(fond, {
            attributes: true,
            subtree: true,
            attributeFilter: ["class"],
          });
        nettoyage.push(() => mo.disconnect());
        ecoute(hero, "pointermove", (e) => {
          const ev = e as PointerEvent;
          if (ev.pointerType === "touch") return;
          const r = hero.getBoundingClientRect();
          lent.style.setProperty("--lx", `${ev.clientX - r.left}px`);
          lent.style.setProperty("--ly", `${ev.clientY - r.top}px`);
        });
      }

      const cartes = $("#programme .cartes");
      const fr = $("#programme .frise-h");
      if (cartes && fr) {
        const cs = $$(".carte", cartes);
        const mk = document.createElement("b");
        mk.className = "mk";
        fr.appendChild(mk);
        nettoyage.push(() => mk.remove());
        ecoute(cartes, "pointermove", (e) => {
          const ev = e as PointerEvent;
          if (ev.pointerType === "touch") return;
          const r = fr.getBoundingClientRect();
          fr.style.setProperty(
            "--mx",
            `${Math.max(0, Math.min(r.width, ev.clientX - r.left))}px`,
          );
          fr.classList.add("suivi");
          const c = (ev.target as Element).closest(".carte");
          cs.forEach((x) => x.classList.toggle("foc", x === c));
          cartes.classList.toggle("a-foc", Boolean(c));
        });
        ecoute(cartes, "pointerleave", () => {
          fr.classList.remove("suivi");
          cartes.classList.remove("a-foc");
          cs.forEach((x) => x.classList.remove("foc"));
        });
      }

      $$(".lotc").forEach((c) => {
        let occupe = false;
        const tourne = () => {
          if (occupe) return;
          occupe = true;
          c.style.transition = "transform .26s ease-in";
          c.style.transform = "perspective(1200px) rotateY(90deg)";
          window.setTimeout(() => {
            c.classList.toggle("verso");
            c.style.transition = "none";
            c.style.transform = "perspective(1200px) rotateY(-90deg)";
            void c.offsetWidth;
            c.style.transition = "transform .55s cubic-bezier(.16,1,.3,1)";
            c.style.transform = "perspective(1200px) rotateY(0deg)";
            window.setTimeout(() => {
              c.style.transform = "";
              c.style.transition = "";
              occupe = false;
            }, 560);
          }, 260);
        };
        ecoute(c, "click", tourne);
        ecoute(c, "keydown", (e) => {
          const k = (e as KeyboardEvent).key;
          if (k === "Enter" || k === " ") {
            e.preventDefault();
            tourne();
          }
        });
      });

      const gros = $("[data-gros]");
      if (gros && "IntersectionObserver" in window) {
        const total = Number(gros.dataset.gros);
        const ioL = new IntersectionObserver(
          (es) => {
            es.forEach((e) => {
              if (!e.isIntersecting) return;
              ioL.unobserve(e.target);
              let t0: number | null = null;
              const pas = (t: number) => {
                if (t0 === null) t0 = t;
                const p = Math.min(1, (t - t0) / 1800);
                const v = Math.round(total * (1 - Math.pow(1 - p, 4)));
                gros.textContent = `${v.toLocaleString("fr-FR")} Ar`;
                if (p < 1) requestAnimationFrame(pas);
              };
              requestAnimationFrame(pas);
            });
          },
          { threshold: 0.6 },
        );
        ioL.observe(gros);
        nettoyage.push(() => ioL.disconnect());
      }

      const plat = $(".plateforme");
      const tel = $(".tel");
      const ecr = $("[data-dedans]");
      if (plat && tel && ecr) {
        const tabs = $$(".onglets > *");
        const atouts = $$(".atouts div");
        const vues: Record<string, string> = {
          Accueil: ecr.innerHTML,
          ...VUES,
        };
        let vueC = "Accueil";
        const vue = (n: string) => {
          if (vueC === n) return;
          vueC = n;
          ecr.classList.remove("entre");
          ecr.innerHTML = vues[n];
          void ecr.offsetWidth;
          ecr.classList.add("entre");
          tabs.forEach((t) => t.classList.toggle("ici", t.textContent === n));
        };
        tabs.forEach((t) => {
          if (t.textContent === "Accueil") t.classList.add("ici");
          ecoute(t, "click", () => vue(t.textContent ?? "Accueil"));
        });
        const carteVue = ["Réseau", "Défis", "Infos", "Billet"];
        atouts.forEach((a, i) => {
          const montrer = () => {
            if (!ecr.style.minHeight && ecr.offsetHeight)
              ecr.style.minHeight = `${ecr.offsetHeight}px`;
            atouts.forEach((x) => x.classList.toggle("on", x === a));
            vue(carteVue[i]);
          };
          ecoute(a, "pointerenter", montrer);
          ecoute(a, "click", montrer);
        });
        ecoute(plat, "pointermove", (e) => {
          const ev = e as PointerEvent;
          if (ev.pointerType === "touch") return;
          const r = plat.getBoundingClientRect();
          const x = (ev.clientX - r.left) / r.width - 0.5;
          const y = (ev.clientY - r.top) / r.height - 0.5;
          tel.style.transform = `perspective(1000px) rotateY(${x * 18}deg) rotateX(${-y * 10}deg)`;
        });
        ecoute(plat, "pointerleave", () => {
          tel.style.transform = "";
          atouts.forEach((x) => x.classList.remove("on"));
          vue("Accueil");
        });
      }

      ["lentille", "frise", "flip", "tel"].forEach((k) =>
        racine.classList.add(`fx-${k}`),
      );
      nettoyage.push(() =>
        racine.classList.remove(
          "js",
          "fx-lentille",
          "fx-frise",
          "fx-flip",
          "fx-tel",
        ),
      );
    }

    return () => nettoyage.forEach((f) => f());
  }, []);

  return <div className="progres" aria-hidden="true" />;
}
