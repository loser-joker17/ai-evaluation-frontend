import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { z } from "zod";

import { authApi } from "@/api/auth";
import { startSession } from "@/auth/session";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/new";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: LoginValues) {
    try {
      startSession(await authApi.login(values));
      navigate(from, { replace: true });
    } catch (error) {
      applyServerErrors(error, setError);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Log in</CardTitle>
        <CardDescription>Get your UPSC Mains answers evaluated.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="grid gap-4">
          <FormField id="email" label="Email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" autoFocus
                   aria-invalid={!!errors.email} {...register("email")} />
          </FormField>
          <FormField id="password" label="Password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password"
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
            {isSubmitting ? "Logging in…" : "Log in"}
          </Button>
          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}