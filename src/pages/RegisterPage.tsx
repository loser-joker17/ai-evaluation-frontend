import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";

import { authApi } from "@/api/auth";
import { startSession } from "@/auth/session";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";

// Same limits as RegisterRequest on the backend.
const schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100, "Name must be at most 100 characters"),
  email: z.string().trim().email("Enter a valid email").max(254, "Email is too long"),
  password: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
});

type RegisterValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: RegisterValues) {
    try {
      startSession(await authApi.register(values));
      navigate("/new", { replace: true });
    } catch (error) {
      applyServerErrors(error, setError);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Practise answers and get examiner-style feedback.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="grid gap-4">
          <FormField id="name" label="Name" error={errors.name?.message}>
            <Input id="name" autoComplete="name" autoFocus
                   aria-invalid={!!errors.name} {...register("name")} />
          </FormField>
          <FormField id="email" label="Email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email"
                   aria-invalid={!!errors.email} {...register("email")} />
          </FormField>
          <FormField id="password" label="Password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password"
                   aria-invalid={!!errors.password} {...register("password")} />
          </FormField>
          {errors.root?.server && (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.root.server.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}