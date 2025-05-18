"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import Swal from "sweetalert2";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface DiscountFormData {
  name: string;
  description: string;
  categoryId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface EditDiscountClientProps {
  id: string;
}

export default function EditDiscountClient({ id }: EditDiscountClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<DiscountFormData>({
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      discountType: "percentage",
      discountValue: 10,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      isActive: true,
    },
  });

  const discountType = watch("discountType");

  useEffect(() => {
    fetchCategories();
    fetchDiscount();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(data.categories || []);
      setLoadingCategories(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoadingCategories(false);
    }
  };

  const fetchDiscount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/admin/discounts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch discount");
      }

      const data = await response.json();
      const discount = data.discount;

      // Format dates for the form
      const formattedDiscount = {
        ...discount,
        startDate: new Date(discount.startDate).toISOString().split("T")[0],
        endDate: new Date(discount.endDate).toISOString().split("T")[0],
      };

      reset(formattedDiscount);
      setInitialLoading(false);
    } catch (error) {
      console.error("Error fetching discount:", error);
      Swal.fire("Error!", "Failed to fetch discount details.", "error");
      router.push("/admin/discounts");
    }
  };

  const onSubmit = async (data: DiscountFormData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update discount");
      }

      Swal.fire({
        title: "Success!",
        text: "Discount updated successfully",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      router.push("/admin/discounts");
    } catch (error) {
      console.error("Error updating discount:", error);
      Swal.fire("Error!", "Failed to update discount.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading discount details...</p>
      </div>
    );
  }
