"use client";

import EmailAuth from "@/components/EmailAuth";

/*
 * The homepage's email box. Same as signing in: new people get an account,
 * returning students are signed in (see components/EmailAuth.tsx).
 */
export default function SignUpForm({
  next = "/dashboard",
  row = false,
  cta = "Start free",
  autoFocus = false,
  dark = false,
  placeholder = "Your email",
}: {
  next?: string;
  row?: boolean;
  cta?: string;
  autoFocus?: boolean;
  dark?: boolean;
  placeholder?: string;
}) {
  return (
    <EmailAuth
      next={next}
      row={row}
      cta={cta}
      autoFocus={autoFocus}
      dark={dark}
      placeholder={placeholder}
      allowPassword
      hint="Already a student? Same box: we'll email you a sign-in link."
    />
  );
}
