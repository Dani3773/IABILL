import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "../components/brand/Logo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import "./landing.css";

const CONTACT_EMAIL = "danielfelisberto3@gmail.com";

interface DemoQuestion {
  q: string;
  kind: "answer" | "refuse";
  a: string;
  source?: string;
}

// Índice do registro que sustenta cada pergunta; -1 quando nada aprovado sustenta.
const QUESTION_RECORD = [-1, 0, 1, -1];

interface HowStep {
  lead: string;
  callLabel: string;
  call: string;
  response: string;
}

interface LawItem {
  mark: string;
  text: string;
}

interface FaqItem {
  q: string;
  a: string;
}

// A demonstração é o argumento da página: a mesma interface responde com fonte
// aprovada ou recusa, como o gerador real faz quando falta contexto.
function AskDemo() {
  const { t } = useTranslation();
  const questions = t("demo.questions", { returnObjects: true }) as DemoQuestion[];
  const [selected, setSelected] = useState(0);
  const records = t("demo.records", { returnObjects: true }) as string[];
  const current = questions[selected];
  const refused = current.kind === "refuse";
  const activeRecord = QUESTION_RECORD[selected] ?? -1;

  return (
    <section className="demo" data-ui aria-label={t("demo.title")}>
      <header className="demo__head">
        <strong>{t("demo.title")}</strong>
        <span>{t("demo.note")}</span>
      </header>
      <div className="demo__questions" role="group" aria-labelledby="demo-choose">
        <p id="demo-choose">{t("demo.choose")}</p>
        {questions.map((question, index) => (
          <button
            key={question.q}
            type="button"
            className="demo__question"
            aria-pressed={index === selected}
            onClick={() => setSelected(index)}
          >
            {question.q}
          </button>
        ))}
      </div>
      <div className="drawer" aria-hidden="true">
        {records.map((record, index) => (
          <div
            key={record}
            className={index === activeRecord ? "drawer__card drawer__card--active" : "drawer__card"}
            style={{ "--i": index } as CSSProperties}
          >
            <span>{record}</span>
          </div>
        ))}
        {refused && (
          <strong className="drawer__stamp" key={selected}>
            {t("demo.stamp")}
          </strong>
        )}
      </div>
      <div className="demo__result" aria-live="polite" key={selected}>
        <span className={refused ? "demo__status demo__status--refused" : "demo__status"}>
          {t(refused ? "demo.refused" : "demo.answered")}
        </span>
        <p>{current.a}</p>
        <small>{refused ? t("demo.noSource") : `${t("demo.source")}: ${current.source}`}</small>
      </div>
    </section>
  );
}

function FaqIndex() {
  const { t } = useTranslation();
  const items = t("faq.items", { returnObjects: true }) as FaqItem[];
  const [selected, setSelected] = useState(0);

  return (
    <div className="faq__grid">
      <ul className="faq__list">
        {items.map((item, index) => (
          <li key={item.q}>
            <button
              type="button"
              className="faq__question"
              aria-expanded={index === selected}
              onClick={() => setSelected(index)}
            >
              {item.q}
            </button>
            {index === selected && <p className="faq__inline">{item.a}</p>}
          </li>
        ))}
      </ul>
      <p className="faq__answer" aria-live="polite" key={selected}>
        {items[selected].a}
      </p>
    </div>
  );
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window)) return;

    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    root.classList.add("lp--animate");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px 12% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return ref;
}

// Abre a foto do arquivo com a rolagem: progresso de 0 a 1 enquanto a cena está presa.
function useArchiveScene() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = ref.current;
    if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = scene.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 1;
      scene.style.setProperty("--p", progress.toFixed(3));
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

export function LandingPage() {
  const { isAuthenticated, tenantId } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageRef = useReveal();
  const archiveRef = useArchiveScene();
  const [email, setEmail] = useState("");

  if (isAuthenticated) {
    return <Navigate to={tenantId ? "/dashboard" : "/platform"} replace />;
  }

  function handleStart(event: FormEvent) {
    event.preventDefault();
    navigate("/signup", { state: { email } });
  }

  const steps = t("how.steps", { returnObjects: true }) as HowStep[];
  const laws = t("law.items", { returnObjects: true }) as LawItem[];

  return (
    <div className="lp" ref={pageRef}>
      <header className="lp-nav">
        <Link to="/" aria-label="IABill">
          <Logo />
        </Link>
        <nav className="lp-nav__links">
          <a href="#como-funciona">{t("nav.how")}</a>
          <a href="#aprovacao">{t("nav.states")}</a>
          <a href="#lei">{t("nav.law")}</a>
          <a href="#perguntas">{t("nav.faq")}</a>
        </nav>
        <div className="lp-nav__actions">
          <LanguageSwitcher className="lp-language" />
          <Link to="/login">{t("nav.login")}</Link>
          <Link to="/signup" className="lp-button">
            {t("nav.signup")}
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <h1 className="hero__title">
              <span className="hero__line">
                <span>{t("hero.line1")}</span>
              </span>
              <span className="hero__line">
                <span>{t("hero.line2")}</span>
              </span>
            </h1>
            <p className="hero__lead">{t("hero.lead")}</p>
            <div className="hero__actions">
              <Link to="/signup" className="lp-button">
                {t("hero.cta")}
              </Link>
              <Link to="/login" className="hero__secondary">
                {t("hero.secondary")}
              </Link>
            </div>
          </div>
          <AskDemo />
        </section>

        <section className="archive" aria-labelledby="archive-title">
          <h2 id="archive-title" className="lp-heading" data-reveal>
            {t("how.archive")}
          </h2>
          <div className="archive__track" ref={archiveRef}>
            <div className="archive__stage">
              <img src="/landing/arquivo.webp" alt={t("images.archive")} width="1920" height="1241" />
            </div>
          </div>
        </section>

        <section className="how" id="como-funciona">
          <h2 className="lp-heading" data-reveal>
            {t("how.title")}
          </h2>
          <ol className="how__list">
            {steps.map((step) => (
              <li key={step.lead} data-reveal>
                <p className="how__lead">{step.lead}</p>
                <div className="how__call">
                  <span>{step.callLabel}</span>
                  <p>{step.call}</p>
                </div>
                <p className="how__response">{step.response}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="states" id="aprovacao">
          <div className="states__intro" data-reveal>
            <h2 className="lp-heading">{t("states.title")}</h2>
            <p>{t("states.lead")}</p>
            <img
              src="/landing/livro-registro.webp"
              alt={t("images.ledger")}
              width="1120"
              height="615"
              loading="lazy"
            />
          </div>
          <div className="states__rows">
            <figure data-reveal>
              <div className="doc-row" data-ui>
                <div>
                  <strong>{t("states.docTitle")}</strong>
                  <span>
                    {t("states.doc")} · {t("states.s1Meta")}
                  </span>
                </div>
                <em className="doc-row__status">{t("states.s1")}</em>
              </div>
              <figcaption>{t("states.s1Note")}</figcaption>
            </figure>
            <figure data-reveal>
              <div className="doc-row doc-row--active" data-ui>
                <div>
                  <strong>{t("states.docTitle")}</strong>
                  <span>
                    {t("states.doc")} · {t("states.s2Meta")}
                  </span>
                </div>
                <div className="doc-row__actions">
                  <span className="doc-row__ghost">{t("states.reject")}</span>
                  <span className="doc-row__primary">{t("states.approve")}</span>
                </div>
              </div>
              <figcaption>{t("states.s2Note")}</figcaption>
            </figure>
            <figure data-reveal>
              <div className="doc-row doc-row--done" data-ui>
                <div>
                  <strong>{t("states.docTitle")}</strong>
                  <span>
                    {t("states.doc")} · {t("states.s3Meta")}
                  </span>
                </div>
                <strong className="doc-row__stamp">{t("states.s3")}</strong>
              </div>
              <figcaption>{t("states.s3Note")}</figcaption>
            </figure>
          </div>
        </section>

        <section className="law" id="lei">
          <div className="law__board">
            <h2 className="law__title" data-reveal>
              {t("law.title")}
            </h2>
            {laws.map((law) => (
              <article key={law.mark} className="law__tile" data-reveal>
                <h3>{law.mark}</h3>
                <p>{law.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="proof" aria-labelledby="proof-title">
          <p className="proof__value" data-reveal>
            {t("proof.value")}
          </p>
          <div data-reveal>
            <h2 id="proof-title" className="proof__title">
              {t("proof.title")}
            </h2>
            <p>{t("proof.text")}</p>
          </div>
        </section>

        <section className="faq" id="perguntas">
          <h2 className="lp-heading" data-reveal>
            {t("faq.title")}
          </h2>
          <FaqIndex />
        </section>

        <section className="cta">
          <div className="cta__content">
            <h2 className="cta__title" data-reveal>
              {t("cta.title")}
            </h2>
            <form className="cta__form" onSubmit={handleStart} data-reveal>
              <p>{t("cta.lead")}</p>
              <div>
                <label htmlFor="cta-email">{t("cta.emailLabel")}</label>
                <input
                  id="cta-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("cta.placeholder")}
                  autoComplete="email"
                />
                <button type="submit" className="lp-button">
                  {t("cta.button")}
                </button>
              </div>
            </form>
          </div>
          <img
            src="/landing/fichario.webp"
            alt={t("images.cabinet")}
            width="1200"
            height="900"
            loading="lazy"
            data-reveal
          />
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer__main">
          <Logo />
          <span>{t("footer.about")}</span>
        </div>
        <nav className="lp-footer__links">
          <Link to="/login">{t("nav.login")}</Link>
          <Link to="/signup">{t("nav.signup")}</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>{t("footer.contact")}</a>
          <LanguageSwitcher className="lp-language lp-language--footer" />
        </nav>
        <div className="lp-footer__maker">
          <span>{t("footer.madeBy")}</span>
          <img src="/brand/zagtxo-creme.webp" alt="Zágtxo" width="200" height="56" loading="lazy" />
        </div>
        <p className="lp-footer__note">
          © {new Date().getFullYear()} IABill. {t("footer.academic")}{" "}
          <span>
            {t("footer.photos")}: The National Archives (UK), CC BY 3.0; RaphaelQS, CC0; Watty62, CC BY-SA 4.0, via{" "}
            <a href="https://commons.wikimedia.org/">Wikimedia Commons</a>.
          </span>
        </p>
      </footer>
    </div>
  );
}
