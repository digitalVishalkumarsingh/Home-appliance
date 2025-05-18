"use client";

import { useState, useCallback, ChangeEvent, FormEvent } from "react";

interface FormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
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
  });

  // Validate form values
  const validateForm = useCallback(
    (values: T): Partial<Record<keyof T, string>> => {
      if (!validate) return {};
      return validate(values);
    },
    [validate]
  );

  // Handle input change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      // Handle different input types
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
        };
      });
    },
    [validateForm]
  );

  // Set a specific field value programmatically
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
        };
      });
    },
    [validateForm]
  );

  // Set multiple field values at once
  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setFormState((prev) => {
        const updatedValues = { ...prev.values, ...newValues };
        const errors = validateForm(updatedValues);
        
        // Mark all changed fields as touched
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
        };
      });
    },
    [validateForm]
  );

  // Mark a field as touched
  const setFieldTouched = useCallback((name: keyof T, isTouched = true) => {
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [name]: isTouched },
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      
      // Validate all fields
      const errors = validateForm(formState.values);
      const isValid = Object.keys(errors).length === 0;
      
      // Mark all fields as touched
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
      }));
      
      // Only submit if valid
      if (isValid) {
        try {
          await onSubmit(formState.values);
        } catch (error) {
          console.error("Form submission error:", error);
        } finally {
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
          }));
        }
      }
    },
    [formState.values, onSubmit, validateForm]
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
    });
  }, [initialValues]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    handleChange,
    handleSubmit,
    setFieldValue,
    setValues,
    setFieldTouched,
    resetForm,
  };
}

export default useForm;
