import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";

export const runtime = "nodejs";

type EmailActionType =
  | "signup"
  | "recovery"
  | "email_change"
  | "magiclink"
  | "invite"
  | "email_change_current"
  | "email_change_new";

type SupabaseEmailPayload = {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: EmailActionType;
    site_url?: string;
  };
};

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "zderz.pl <noreply@zderz.pl>";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://zderz.pl").replace(/\/$/, "");

// Podmienia origin (np. http://localhost:3000) na produkcyjny SITE_URL, zachowując ścieżkę.
function normalizeRedirect(redirectTo: string): string {
  if (!redirectTo) return SITE_URL;
  try {
    const url = new URL(redirectTo);
    return `${SITE_URL}${url.pathname}${url.search}${url.hash}`.replace(/\/$/, "") || SITE_URL;
  } catch {
    return SITE_URL;
  }
}

type Template = { subject: string; heading: string; intro: string; button: string; note?: string };

const TEMPLATES: Record<string, Template> = {
  signup: {
    subject: "Potwierdź rejestrację w zderz.pl",
    heading: "Witaj w zderz.pl!",
    intro: "Dziękujemy za rejestrację. Kliknij przycisk poniżej, aby potwierdzić swój adres e-mail i aktywować konto.",
    button: "Potwierdź e-mail",
  },
  recovery: {
    subject: "Reset hasła w zderz.pl",
    heading: "Reset hasła",
    intro:
      "Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta. Kliknij przycisk poniżej, aby ustawić nowe hasło.",
    button: "Zresetuj hasło",
    note: "Jeśli to nie Ty prosiłeś o zmianę hasła, po prostu zignoruj tę wiadomość.",
  },
  email_change: {
    subject: "Potwierdź zmianę adresu e-mail",
    heading: "Zmiana adresu e-mail",
    intro: "Kliknij przycisk poniżej, aby potwierdzić zmianę adresu e-mail przypisanego do Twojego konta zderz.pl.",
    button: "Potwierdź zmianę",
  },
  magiclink: {
    subject: "Twój link logowania do zderz.pl",
    heading: "Logowanie do zderz.pl",
    intro: "Kliknij przycisk poniżej, aby zalogować się na swoje konto.",
    button: "Zaloguj się",
  },
};

function templateFor(type: EmailActionType): Template {
  return TEMPLATES[type] ?? TEMPLATES.magiclink;
}

function buildConfirmationUrl(payload: SupabaseEmailPayload["email_data"]): string {
  const params = new URLSearchParams({
    token: payload.token_hash,
    type: payload.email_action_type,
    redirect_to: normalizeRedirect(payload.redirect_to),
  });
  return `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`;
}

function renderHtml(tpl: Template, confirmUrl: string, token: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#1a5c38;padding:28px 32px;text-align:center;">
            <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">zderz<span style="color:#a7e3c0;">.pl</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:22px;color:#1a5c38;">${tpl.heading}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333333;">${tpl.intro}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td style="border-radius:8px;background-color:#1a5c38;">
                <a href="${confirmUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${tpl.button}</a>
              </td></tr>
            </table>
            ${tpl.note ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">${tpl.note}</p>` : ""}
            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
              Jeśli przycisk nie działa, skopiuj poniższy link do przeglądarki:<br/>
              <a href="${confirmUrl}" target="_blank" style="color:#1a5c38;word-break:break-all;">${confirmUrl}</a>
            </p>
            <p style="margin:16px 0 0;font-size:13px;color:#64748b;">Kod weryfikacyjny: <strong style="color:#333333;letter-spacing:2px;">${token}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#1a5c38;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a7e3c0;">© 2025–2026 zderz.pl – Wszelkie prawa zastrzeżone.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Weryfikacja podpisu Standard Webhooks (Supabase "Send Email Hook").
function verifySignature(rawBody: string, headers: Headers, secret: string): boolean {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const key = Buffer.from(secret.replace(/^v1,?/, "").replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", key).update(signedContent).digest("base64");

  return signatureHeader
    .split(" ")
    .map((part) => part.split(",")[1] ?? part)
    .some((sig) => {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  // TODO: TYMCZASOWO WYŁĄCZONE (test) — przywróć weryfikację podpisu przed wdrożeniem.
  // const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  // if (secret && !verifySignature(rawBody, request.headers, secret)) {
  //   return Response.json({ error: { http_code: 401, message: "Nieprawidłowy podpis webhooka" } }, { status: 401 });
  // }

  let payload: SupabaseEmailPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: { http_code: 400, message: "Nieprawidłowy JSON" } }, { status: 400 });
  }

  const email = payload.user?.email;
  const data = payload.email_data;
  if (!email || !data?.token_hash || !data?.email_action_type) {
    return Response.json({ error: { http_code: 400, message: "Brak wymaganych pól" } }, { status: 400 });
  }
  if (!SUPABASE_URL) {
    return Response.json({ error: { http_code: 500, message: "Brak NEXT_PUBLIC_SUPABASE_URL" } }, { status: 500 });
  }

  const tpl = templateFor(data.email_action_type);
  const confirmUrl = buildConfirmationUrl(data);
  const html = renderHtml(tpl, confirmUrl, data.token);

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: tpl.subject,
    html,
  });

  if (error) {
    return Response.json({ error: { http_code: 502, message: error.message } }, { status: 502 });
  }

  return Response.json({});
}
