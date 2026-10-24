"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type ResultadoLogin = { error: string } | undefined;

export async function iniciarSesion(
  _prevState: ResultadoLogin,
  formData: FormData
): Promise<ResultadoLogin> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos" };
    }
    throw error;
  }
}
