"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (!password.trim()) return false;
    return true;
  }, [email, password]);

  useEffect(() => {
    async function init() {
      // ✅ garde-fou LOCAL (TypeScript ne discutera plus)
      if (!supabase) return;

      const { data } = await supabase.auth.getSession();
      const em = data.session?.user?.email ?? null;
      setUserEmail(em);
    }

    init();

    // ✅ si supabase est null, on ne s'abonne pas
    if (!supabase) return;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const em = session?.user?.email ?? null;
      setUserEmail(em);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      if (!supabase) {
        throw new Error(
          "Supabase non initialisé. Vérifie NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("Connecté.");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Compte créé. Selon la config Supabase, tu peux recevoir un email de confirmation.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      if (!supabase) {
        throw new Error(
          "Supabase non initialisé. Vérifie NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }

      const { error } = await supabase.auth.signOut();
      if (error) setErrorMsg(error.message);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  // Styles cohérents
  const shell: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: 24 };

  const topbar: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  };

  const navBtn: React.CSSProperties = {
    border: "1px solid #e5e5e5",
    background: "white",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 900,
    textDecoration: "none",
    color: "inherit",
    display: "inline-block",
  };

  const hero: React.CSSProperties = {
    marginTop: 16,
    borderRadius: 18,
    border: "1px solid #eeeeee",
    background: "linear-gradient(135deg, rgba(250,250,250,1) 0%, rgba(245,245,245,1) 100%)",
    padding: 18,
  };

  const card: React.CSSProperties = {
    marginTop: 14,
    border: "1px solid #ececec",
    borderRadius: 16,
    background: "white",
    boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
    overflow: "hidden",
    maxWidth: 560,
  };

  const cardHead: React.CSSProperties = {
    padding: 14,
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
    flexWrap: "wrap",
  };

  const cardBody: React.CSSProperties = { padding: 14 };

  const pill: React.CSSProperties = {
    border: "1px solid #e8e8e8",
    background: "white",
    borderRadius: 999,
    padding: "6px 10px",
    fontWeight: 900,
    fontSize: 12,
    opacity: 0.9,
  };

  const tab = (active: boolean): React.CSSProperties => ({
    border: "1px solid #e5e5e5",
    background: active ? "#f3f3f3" : "white",
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 13,
  });

  const label: React.CSSProperties = { fontWeight: 900, fontSize: 13, opacity: 0.9 };

  const input: React.CSSProperties = {
    width: "100%",
    marginTop: 6,
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 12,
    outline: "none",
  };

  const primaryBtn = (disabled: boolean): React.CSSProperties => ({
    marginTop: 14,
    width: "100%",
    border: "1px solid #ddd",
    background: disabled ? "#f3f3f3" : "white",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 950,
  });

  const ghostBtn = (disabled: boolean): React.CSSProperties => ({
    border: "1px solid #e5e5e5",
    background: disabled ? "#f3f3f3" : "white",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 950,
  });

  const alertOk: React.CSSProperties = {
    marginTop: 12,
    padding: 12,
    border: "1px solid #b7ebc6",
    borderRadius: 12,
    background: "#f0fff4",
  };

  const alertErr: React.CSSProperties = {
    marginTop: 12,
    padding: 12,
    border: "1px solid #ffb3b3",
    borderRadius: 12,
    background: "#fff5f5",
  };

  return (
    <main style={shell}>
      {/* TOPBAR */}
      <header style={topbar}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.2 }}>Connexion</h1>
          <div style={{ marginTop: 6, opacity: 0.75, fontWeight: 800, fontSize: 13 }}>
            Pour publier une annonce, il faut être connecté.
          </div>
        </div>

        <nav style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/" style={navBtn}>
            Accueil
          </Link>
          <Link href="/publish" style={navBtn}>
            Publier
          </Link>
          <Link href="/my-listings" style={navBtn}>
            Mes annonces
          </Link>
          <Link href="/my-bookings" style={navBtn}>
            Mes réservations
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section style={hero}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: -0.2 }}>Accède à ton espace.</div>
            <div style={{ marginTop: 6, opacity: 0.78, lineHeight: 1.35 }}>
              Connexion pour publier, gérer tes annonces et suivre tes réservations.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={pill}>{userEmail ? "Session active" : "Session inactive"}</span>
            <span style={pill}>{mode === "login" ? "Mode : connexion" : "Mode : inscription"}</span>
          </div>
        </div>
      </section>

      {/* CARD */}
      <div style={card}>
        <div style={cardHead}>
          <div style={{ fontWeight: 950, letterSpacing: -0.1 }}>
            {userEmail ? "Tu es connecté" : mode === "login" ? "Se connecter" : "Créer un compte"}
          </div>

          {!userEmail && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                  setErrorMsg(null);
                }}
                style={tab(mode === "login")}
              >
                Connexion
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setMessage(null);
                  setErrorMsg(null);
                }}
                style={tab(mode === "signup")}
              >
                Inscription
              </button>
            </div>
          )}
        </div>

        <div style={cardBody}>
          {/* État connecté */}
          {userEmail ? (
            <>
              <div style={{ opacity: 0.85, lineHeight: 1.35 }}>
                Connecté en tant que <strong>{userEmail}</strong>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button type="button" onClick={logout} disabled={loading} style={ghostBtn(loading)}>
                  {loading ? "Déconnexion…" : "Se déconnecter"}
                </button>

                <Link href="/publish" style={{ ...navBtn, padding: "10px 14px" }}>
                  Aller publier une annonce →
                </Link>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={onSubmit} style={{ marginTop: 6 }}>
                <div>
                  <div style={label}>Email</div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ex: nom@email.com"
                    style={input}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={label}>Mot de passe</div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Minimum 6 caractères"
                    style={input}
                  />
                  <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
                    Conseil : utilise un mot de passe unique.
                  </div>
                </div>

                <button type="submit" disabled={loading || !canSubmit} style={primaryBtn(loading || !canSubmit)}>
                  {loading
                    ? mode === "login"
                      ? "Connexion…"
                      : "Création…"
                    : mode === "login"
                    ? "Se connecter"
                    : "Créer le compte"}
                </button>
              </form>

              {message && <div style={alertOk}>{message}</div>}

              {errorMsg && (
                <div style={alertErr}>
                  <strong>Erreur :</strong> {errorMsg}
                </div>
              )}

              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8, lineHeight: 1.35 }}>
                Si l’inscription ne marche pas, vérifie dans Supabase → Authentication → Providers que “Email” est activé.
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, opacity: 0.75, fontSize: 13 }}>
        <Link href="/">← Retour accueil</Link>
      </div>
    </main>
  );
}
