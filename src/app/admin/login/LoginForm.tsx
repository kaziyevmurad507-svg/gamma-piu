"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn } from "../actions";

export function LoginForm({ notice }: { notice?: string }) {
  const [error, action, pending] = useActionState(signIn, null);
  const message = error ?? notice;
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Пароль" name="password" type="password" autoComplete="current-password" required />
      {message && <p role="alert" className="text-xs text-danger">{message}</p>}
      <Button type="submit" disabled={pending} className="mt-2 w-full">{pending ? "Входим…" : "Войти"}</Button>
    </form>
  );
}
