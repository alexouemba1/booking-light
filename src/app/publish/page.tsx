"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const MAX_FILES = 10;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const BUCKET = "listing-images";
const STORAGE_PREFIX = "listings"; // chemin: listings/<listingId>/<n>-<filename>

// ✅ AJOUT: month
type BillingUnit = "night" | "day" | "week" | "month";

type CreateListingResponse = {
  listing?: { id?: string | number | null } | null;
  email?: { attempted?: boolean; warning?: string | null } | null;
  error?: string | null;
};

function toCents(input: string) {
  const normalized = input.trim().replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function sanitizeFilename(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

function extFromFile(file: File) {
  const part = file.name.split(".").pop();
  if (!part) return "jpg";
  const ext = part.toLowerCase();
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return ext;
  return "jpg";
}

function validateFiles(arr: File[]) {
  if (arr.length === 0) return "Choisis au moins une image.";
  if (arr.length > MAX_FILES) return `Max ${MAX_FILES} images. Tu en as ${arr.length}.`;

  for (const f of arr) {
    if (f.size > MAX_SIZE_BYTES) return `"${f.name}" dépasse 5 Mo.`;
    const ext = extFromFile(f);
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      return `"${f.name}" n’est pas un format autorisé (JPG/PNG/WEBP).`;
    }
  }
  return null;
}

function unitLabel(unit: BillingUnit) {
  if (unit === "night") return "nuit";
  if (unit === "day") return "jour";
  if (unit === "week") return "semaine";
  return "mois"; // ✅ AJOUT
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Erreur";
}

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export default function PublishPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1 (✅ vides par défaut)
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [kind, setKind] = useState("Appartement");

  // ✅ tu peux garder "week" par défaut, ou mettre "month" si tu veux
  const [billingUnit, setBillingUnit] = useState<BillingUnit>("week");

  const [priceEuros, setPriceEuros] = useState("");

  // Created listing
  const [listingId, setListingId] = useState<string | null>(null);

  // Step 2 files
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState(0);

  // UI
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // NEW: createListing state
  const [creating, setCreating] = useState(false);

  const canCreate = useMemo(() => {
    if (!title.trim()) return false;
    if (!city.trim()) return false;
    if (!kind.trim()) return false;
    const cents = toCents(priceEuros);
    if (cents === null) return false;
    return true;
  }, [title, city, kind, priceEuros]);

  const canUpload = useMemo(() => {
    if (!listingId) return false;
    if (uploading) return false;
    if (files.length === 0) return false;
    return true;
  }, [listingId, uploading, files.length]);

  const step1Done = !!listingId;

  // Auth check
  useEffect(() => {
    async function init() {
      setChecking(true);
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      setChecking(false);

      if (!uid) {
        router.replace("/auth");
        return;
      }
    }
    init();
  }, [router]);

  // Restore listingId from localStorage (✅ on ne restaure QUE l’ID, pas les champs)
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("publish:lastListingId") : null;
    if (saved) setListingId(saved);
  }, []);

  // Persist listingId
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (listingId) window.localStorage.setItem("publish:lastListingId", listingId);
  }, [listingId]);

  async function createListing() {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (creating) return;

    if (!userId) {
      setErrorMsg("Tu dois être connecté.");
      return;
    }
    if (!canCreate) {
      setErrorMsg("Champs invalides. Vérifie le titre, la ville et le prix.");
      return;
    }

    const cents = toCents(priceEuros);
    if (cents === null) {
      setErrorMsg("Prix invalide.");
      return;
    }

    setCreating(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? null;
      if (!token) {
        setErrorMsg("Session expirée. Reconnecte-toi.");
        router.replace("/auth");
        return;
      }

      const payload = {
        title: title.trim(),
        city: city.trim(),
        kind: kind.trim(),
        price_cents: cents,
        billing_unit: billingUnit, // ✅ month possible
      };

      const res = await fetch("/api/host/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      const parsed = parseJsonSafe(raw);

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Réponse API invalide (pas du JSON). Regarde la console serveur.");
      }

      const json = parsed as CreateListingResponse;

      if (!res.ok) {
        throw new Error(json?.error ?? `Erreur serveur (${res.status})`);
      }

      const newIdRaw = json?.listing?.id;
      const newId = newIdRaw === null || typeof newIdRaw === "undefined" ? "" : String(newIdRaw).trim();

      if (!newId) {
        throw new Error("Impossible de récupérer l’ID de l’annonce (listing.id manquant).");
      }

      setListingId(newId);

      // ✅ Nettoyage champs étape 1 après création
      setTitle("");
      setCity("");
      setKind("Appartement");
      setBillingUnit("week"); // ✅ tu peux mettre "month" si tu veux par défaut
      setPriceEuros("");

      const emailAttempted = !!json?.email?.attempted;
      const emailWarning = json?.email?.warning ? String(json.email.warning) : null;

      if (emailAttempted && !emailWarning) {
        setSuccessMsg("Annonce créée. Email de confirmation envoyé. Étape 2 : ajoute tes images.");
      } else if (emailAttempted && emailWarning) {
        setSuccessMsg(`Annonce créée. Étape 2 : ajoute tes images. (Email non envoyé: ${emailWarning})`);
      } else {
        setSuccessMsg("Annonce créée. Étape 2 : ajoute tes images.");
      }
    } catch (e: unknown) {
      setErrorMsg(getErrorMessage(e) || "Erreur création annonce.");
    } finally {
      setCreating(false);
    }
  }

  function addFiles(next: File[]) {
    setErrorMsg(null);
    setSuccessMsg(null);

    const combined = [...files, ...next].slice(0, MAX_FILES);
    const err = validateFiles(combined);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setFiles(combined);
  }

  function onPickFiles(list: FileList | null) {
    if (!list) return;
    addFiles(Array.from(list));
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(idx: number) {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function clearAllFiles() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function uploadImages() {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!listingId) {
      setErrorMsg("Annonce introuvable. Crée une annonce (Étape 1).");
      return;
    }

    const err = validateFiles(files);
    if (err) {
      setErrorMsg(err);
      return;
    }

    setUploading(true);
    setUploadIndex(0);

    try {
      for (let i = 0; i < files.length; i++) {
        setUploadIndex(i);

        const file = files[i];
        const ext = extFromFile(file);
        const safeName = sanitizeFilename(file.name) || `image-${i + 1}.${ext}`;
        const path = `${STORAGE_PREFIX}/${listingId}/${String(i + 1).padStart(2, "0")}-${safeName}`;

        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          upsert: true,
          contentType: file.type || undefined,
        });
        if (upErr) throw upErr;

        const { error: insErr } = await supabase.from("listing_images").insert({
          listing_id: listingId,
          path,
          position: i + 1,
        });
        if (insErr) throw insErr;

        setUploadIndex(i + 1);
      }

      setSuccessMsg("Upload terminé. Direction Mes annonces.");
      setFiles([]);

      setListingId(null);
      if (typeof window !== "undefined") window.localStorage.removeItem("publish:lastListingId");

      router.push("/my-listings");
    } catch (e: unknown) {
      setErrorMsg(getErrorMessage(e) ?? "Erreur upload.");
    } finally {
      setUploading(false);
    }
  }

  async function resetPublishFlow() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFiles([]);
    setListingId(null);

    setTitle("");
    setCity("");
    setKind("Appartement");
    setBillingUnit("week"); // ✅ reset
    setPriceEuros("");

    if (typeof window !== "undefined") window.localStorage.removeItem("publish:lastListingId");
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!listingId || uploading) return;
    const dropped = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    addFiles(dropped);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // ----- Styles -----
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

  const stepWrap: React.CSSProperties = {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  };

  const panel: React.CSSProperties = {
    border: "1px solid #ececec",
    borderRadius: 16,
    background: "white",
    boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
    overflow: "hidden",
  };

  const panelHead: React.CSSProperties = {
    padding: 14,
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
  };

  const panelBody: React.CSSProperties = { padding: 14 };

  const label: React.CSSProperties = { fontWeight: 900, fontSize: 13, opacity: 0.9 };

  const input: React.CSSProperties = {
    width: "100%",
    marginTop: 6,
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 12,
    outline: "none",
  };

  const select: React.CSSProperties = {
    ...input,
    background: "white",
  };

  const primaryBtn = (disabled: boolean): React.CSSProperties => ({
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
    padding: "8px 10px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
  });

  const badge: React.CSSProperties = {
    border: "1px solid #e8e8e8",
    background: "white",
    borderRadius: 999,
    padding: "6px 10px",
    fontWeight: 900,
    fontSize: 12,
    opacity: 0.9,
  };

  const dropzone = (enabled: boolean): React.CSSProperties => ({
    marginTop: 12,
    border: `2px dashed ${enabled ? "#d7d7d7" : "#e6e6e6"}`,
    borderRadius: 16,
    padding: 16,
    background: enabled ? "white" : "#fafafa",
    opacity: enabled ? 1 : 0.65,
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  });

  if (checking) {
    return (
      <main style={{ maxWidth: 920, margin: "0 auto", padding: 24 }}>
        <p>Vérification…</p>
      </main>
    );
  }

  const approxPriceCents = toCents(priceEuros);
  const approxPriceLabel =
    approxPriceCents === null || priceEuros.trim() === ""
      ? null
      : `${(approxPriceCents / 100).toFixed(2).replace(".", ",")} € / ${unitLabel(billingUnit)}`;

  const progressPct = uploading && files.length > 0 ? Math.round((uploadIndex / files.length) * 100) : 0;

  return (
    <main style={shell}>
      {/* TOPBAR */}
      <header style={topbar}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.2 }}>Publier une annonce</h1>
          <div style={{ marginTop: 6, opacity: 0.75, fontWeight: 800, fontSize: 13 }}>
            Étape 1 : infos · Étape 2 : images (max {MAX_FILES})
          </div>
        </div>

        <nav style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/" style={navBtn}>
            Accueil
          </Link>
          <Link href="/my-listings" style={navBtn}>
            Mes annonces
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section style={hero}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: -0.2 }}>Mets ton logement en ligne en 2 étapes.</div>
            <div style={{ marginTop: 6, opacity: 0.78, lineHeight: 1.35 }}>
              Crée l’annonce, puis ajoute les images. La première image devient la couverture (modifiable sur la page détail).
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={badge}>{step1Done ? "Étape 1 : OK" : "Étape 1 : à faire"}</span>
            <span style={badge}>{files.length > 0 ? `Images : ${files.length}/${MAX_FILES}` : "Images : 0"}</span>
            {approxPriceLabel && <span style={badge}>{approxPriceLabel}</span>}
          </div>
        </div>
      </section>

      {successMsg && <div style={alertOk}>{successMsg}</div>}

      {errorMsg && (
        <div style={alertErr}>
          <strong>Erreur :</strong> {errorMsg}
        </div>
      )}

      {/* Steps */}
      <section style={stepWrap}>
        {/* STEP 1 */}
        <div style={panel}>
          <div style={panelHead}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: -0.1 }}>1) Infos</div>
              <div style={{ marginTop: 4, opacity: 0.75, fontSize: 13 }}>Titre, ville, type, unité, prix.</div>
            </div>

            <button onClick={resetPublishFlow} style={ghostBtn(false)} title="Repartir à zéro (nouvelle annonce)">
              Recommencer
            </button>
          </div>

          <div style={{ ...panelBody, opacity: listingId ? 0.68 : 1 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={label}>Titre</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!!listingId || creating}
                  placeholder="Ex: Studio cosy"
                  style={input}
                  autoComplete="off"
                />
              </div>

              <div>
                <div style={label}>Ville</div>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!!listingId || creating}
                  placeholder="Ex: Paris"
                  style={input}
                  autoComplete="off"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={label}>Type</div>
                  <select value={kind} onChange={(e) => setKind(e.target.value)} disabled={!!listingId || creating} style={select}>
                    <option>Maison</option>
                    <option>Appartement</option>
                    <option>Chambre</option>
                    <option>Canapé</option>
                  </select>
                </div>

                <div>
                  <div style={label}>Unité</div>
                  <select
                    value={billingUnit}
                    onChange={(e) => setBillingUnit(e.target.value as BillingUnit)}
                    disabled={!!listingId || creating}
                    style={select}
                  >
                    <option value="night">Nuit</option>
                    <option value="day">Jour</option>
                    <option value="week">Semaine</option>
                    <option value="month">Mois</option> {/* ✅ AJOUT */}
                  </select>
                </div>
              </div>

              <div>
                <div style={label}>Prix (en euros)</div>
                <input
                  value={priceEuros}
                  onChange={(e) => setPriceEuros(e.target.value)}
                  disabled={!!listingId || creating}
                  placeholder="Ex: 12,5"
                  inputMode="decimal"
                  style={input}
                  autoComplete="off"
                />
                <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>Astuce : 12,5 ou 12.5</div>
              </div>

              <button onClick={createListing} disabled={!canCreate || !!listingId || creating} style={primaryBtn(!canCreate || !!listingId || creating)}>
                {listingId ? "Annonce créée" : creating ? "Création…" : "Créer l’annonce"}
              </button>

              {listingId && (
                <div style={{ opacity: 0.75, fontSize: 13 }}>
                  ID annonce : <code>{listingId}</code>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STEP 2 */}
        <div style={panel}>
          <div style={panelHead}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: -0.1 }}>2) Images</div>
              <div style={{ marginTop: 4, opacity: 0.75, fontSize: 13 }}>
                JPG/PNG/WEBP — {MAX_FILES} max — 5 Mo max par image.
              </div>
            </div>

            {uploading ? <span style={badge}>Upload : {progressPct}%</span> : <span style={badge}>{step1Done ? "Prêt" : "Bloqué (étape 1)"}</span>}
          </div>

          <div style={panelBody}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={!listingId || uploading}
                onChange={(e) => onPickFiles(e.target.files)}
                style={{ display: "none" }}
              />

              <button onClick={() => inputRef.current?.click()} disabled={!listingId || uploading} style={primaryBtn(!listingId || uploading)}>
                Choisir des images
              </button>

              <button onClick={clearAllFiles} disabled={files.length === 0 || uploading} style={ghostBtn(files.length === 0 || uploading)}>
                Vider
              </button>

              <div style={{ marginLeft: "auto", opacity: 0.8, fontWeight: 900, fontSize: 13 }}>
                {files.length > 0 ? `${files.length}/${MAX_FILES} sélectionnée(s)` : "Aucune sélection"}
              </div>
            </div>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              style={dropzone(!!listingId && !uploading)}
              title={!listingId ? "Crée d’abord l’annonce" : "Glisse-dépose tes images ici"}
              onMouseEnter={(e) => {
                if (!listingId || uploading) return;
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 14px 30px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {!listingId ? (
                <div style={{ opacity: 0.8 }}>Crée d’abord l’annonce (Étape 1) pour activer l’upload.</div>
              ) : (
                <div style={{ opacity: 0.85, lineHeight: 1.35 }}>
                  Glisse tes images ici (drag & drop). Sinon, clique sur <strong>“Choisir des images”</strong>.
                  <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                    Conseil : une belle première photo = une annonce qui se vend toute seule.
                  </div>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <>
                <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
                  La <strong>première</strong> image sera la couverture.
                </div>

                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
                  {files.map((f, idx) => {
                    const url = URL.createObjectURL(f);
                    const isCover = idx === 0;

                    return (
                      <div
                        key={`${f.name}-${idx}`}
                        style={{
                          border: "1px solid #ececec",
                          borderRadius: 16,
                          background: "white",
                          boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
                          overflow: "hidden",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 16px 38px rgba(0,0,0,0.07)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.04)";
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />

                        <div style={{ padding: 10, display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ fontWeight: 950, fontSize: 12 }}>{isCover ? "Couverture" : `Image ${idx + 1}`}</div>

                          <button
                            onClick={() => removeAt(idx)}
                            disabled={uploading}
                            style={{
                              marginLeft: "auto",
                              border: "1px solid #e5e5e5",
                              background: uploading ? "#f3f3f3" : "white",
                              borderRadius: 12,
                              padding: "6px 8px",
                              cursor: uploading ? "not-allowed" : "pointer",
                              fontWeight: 900,
                              fontSize: 12,
                            }}
                            title="Retirer cette image"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={uploadImages} disabled={!canUpload} style={primaryBtn(!canUpload)}>
                {uploading ? "Upload en cours…" : "Uploader les images"}
              </button>

              {uploading && files.length > 0 && (
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.85, fontWeight: 900 }}>
                    <span>Progression</span>
                    <span>
                      {uploadIndex}/{files.length} ({progressPct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      height: 10,
                      borderRadius: 999,
                      background: "#f1f1f1",
                      border: "1px solid #e8e8e8",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ height: "100%", width: `${progressPct}%`, background: "#111", opacity: 0.12 }} />
                  </div>
                </div>
              )}

              {!listingId && <div style={{ opacity: 0.75, fontSize: 13 }}>(Crée l’annonce d’abord pour activer l’upload.)</div>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
