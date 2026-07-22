import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE } from "@/lib/auth/admin-auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "thiago123";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const invalidPassword = params?.error === "1";

  async function login(formData: FormData) {
    "use server";

    const password = String(formData.get("password") ?? "");
    if (password !== ADMIN_PASSWORD) {
      redirect("/painel/login?error=1"); // Corrigido para /painel/login
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_AUTH_COOKIE, "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // Aumentado para 30 dias para ele não precisar logar direto!
    });

    redirect("/painel"); // Corrigido para /painel
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-black">
      <div className="industrial-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-bronze">
            Administração
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-brand-fog">
            Login do Thiago
          </h1>
        </div>

        {invalidPassword ? (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            Senha inválida.
          </div>
        ) : null}

        <form action={login} className="space-y-4">
          <label className="block text-sm text-brand-smoke">
            <span className="mb-2 block">Senha</span>
            <input
              type="password"
              name="password"
              placeholder="Digite a senha"
              className="w-full rounded-md border border-brand-steel-light bg-brand-matte px-3 py-2 text-brand-fog outline-none ring-0 transition focus:border-brand-bronze"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-brand-bronze px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-brand-graphite transition hover:brightness-110"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}