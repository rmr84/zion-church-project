import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/staff";
import { isStaffSignedIn } from "@/lib/session";

export const metadata = { title: "Care team sign in" };

export default async function LoginPage({ searchParams }) {
  if (await isStaffSignedIn()) redirect("/staff");

  const params = await searchParams;
  const error = String(params.error || "");

  return (
    <section className="wrap narrow">
      <p className="eyebrow">Care Team</p>
      <h1>Care Team Sign In</h1>
      <p className="lede">
        This password opens the care desk. It is separate from a care requester account.
        The demo password is zion-care-team.
      </p>
      <form className="stack" action={login}>
        {error === "1" ? (
          <p className="banner error" role="alert">
            That password did not match.
          </p>
        ) : null}
        {error === "config" ? (
          <p className="banner error" role="alert">
            Set STAFF_PASSWORD and a STAFF_SESSION_SECRET of at least 16 characters.
          </p>
        ) : null}
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <button className="button" type="submit">
          Sign in
        </button>
      </form>
      <p>
        <Link href="/sign-in">Care requester sign in</Link>
        {" · "}
        <Link href="/">Back to the care desk</Link>
      </p>
    </section>
  );
}
