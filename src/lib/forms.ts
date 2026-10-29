import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "@/api/client";

/** Puts backend errors on the form: field errors on their fields, the rest above the button. */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>) {
  if (error instanceof ApiError) {
    if (error.fieldErrors.length > 0) {
      for (const fieldError of error.fieldErrors) {
        setError(fieldError.field as Path<T>, { message: fieldError.message });
      }
      return;
    }
    setError("root.server", { message: error.message });
    return;
  }
  setError("root.server", { message: "Something went wrong. Please try again." });
}