
"use client";

import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { logger } from "../config/logger";
import  useApi  from "./useApi";

interface FormOptions<T> {
  initialValues: T;
  onSubmit: (values: T, api: ReturnType<typeof useApi>) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  apiError: "network" | "auth" | null;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: FormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    apiError: null,
  });

  const api = useApi({
    url: "", // URL set dynamically in onSubmit
    method: "POST",
    withAuth: true,
    showSuccessToast: false,
    showErrorToast: false,
    errorMessage: "Form submission failed",
  });

  const validateForm = useCallback(
    (values: T): Partial<Record<keyof T, string>> => {
      if (!validate) return {};
      try {
        return validate(values);
      } catch (error) {
        logger.error("Validation error", { error });
        return {};
      }
    },
    [validate]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      let processedValue: any = value;
      if (type === "number") {
        processedValue = value === "" ? "" : Number(value);
      } else if (type === "checkbox") {
        processedValue = (e.target as HTMLInputElement).checked;
      }

      setFormState((prev) => {
        const newValues = { ...prev.values, [name]: processedValue };
        const errors = validateForm(newValues);
        return {
          ...prev,
          values: newValues,
          errors,
          touched: { ...prev.touched, [name]: true },
          isValid: Object.keys(errors).length === 0,
          apiError: null,
        };
      });
    },
    [validateForm]
  );

  const setFieldValue = useCallback(
    (name: keyof T, value: any) => {
      setFormState((prev) => {
        const newValues = { ...prev.values, [name]: value };
        const errors = validateForm(newValues);
        return {
          ...prev,
          values: newValues,
          errors,
          touched: { ...prev.touched, [name]: true },
          isValid: Object.keys(errors).length === 0,
          apiError: null,
        };
      });
    },
    [validateForm]
  );

  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setFormState((prev) => {
        const updatedValues = { ...prev.values, ...newValues };
        const errors = validateForm(updatedValues);
        const newTouched = { ...prev.touched };
        Object.keys(newValues).forEach((key) => {
          newTouched[key as keyof T] = true;
        });
        return {
          ...prev,
          values: updatedValues,
          errors,
          touched: newTouched,
          isValid: Object.keys(errors).length === 0,
          apiError: null,
        };
      });
    },
    [validateForm]
  );

  const setFieldTouched = useCallback((name: keyof T, isTouched = true) => {
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [name]: isTouched },
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const errors = validateForm(formState.values);
      const isValid = Object.keys(errors).length === 0;
      const touched: Partial<Record<keyof T, boolean>> = {};
      Object.keys(formState.values).forEach((key) => {
        touched[key as keyof T] = true;
      });

      setFormState((prev) => ({
        ...prev,
        errors,
        touched,
        isValid,
        isSubmitting: isValid,
        apiError: null,
      }));

      if (isValid) {
        try {
          await onSubmit(formState.values, api);
          toast.success("Form submitted successfully");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown submission error";
          logger.error("Form submission error", { error: errorMessage });
          setFormState((prev) => ({
            ...prev,
            apiError: errorMessage.includes("token") || errorMessage.includes("401") ? "auth" : "network",
          }));
        } finally {
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
          }));
        }
      }
    },
    [formState.values, onSubmit, validateForm, api]
  );

  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
      apiError: null,
    });
  }, [initialValues, api]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    apiError: formState.apiError,
    handleChange,
    handleSubmit,
    setFieldValue,
    setValues,
    setFieldTouched,
    resetForm,
  };
}

export default useForm;
