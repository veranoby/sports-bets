import { useState } from "react";
import { userAPI } from "../services/api";
import { useToast } from "../hooks/useToast";
import type { User } from "../types";

type UserRole = "operator" | "venue" | "gallera" | "user";
type FormMode = "create" | "edit";

interface UserFormData {
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  approved: boolean;
  profileInfo: {
    fullName: string;
    phoneNumber: string;
    images?: string[];
    verificationLevel: "none" | "basic" | "full";
    // Venue fields
    venueName?: string;
    venueLocation?: string;
    venueDescription?: string;
    venueEmail?: string;
    venueWebsite?: string;
    // Gallera fields
    galleraName?: string;
    galleraLocation?: string;
    galleraDescription?: string;
    galleraEmail?: string;
    galleraWebsite?: string;
    galleraSpecialties?: string[];
    galleraActiveRoosters?: string[];
  };
}

export const useUserForm = (
  mode: FormMode,
  role: UserRole,
  initialUser?: User,
) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<UserFormData>(() => {
    if (mode === "edit" && initialUser) {
      return {
        username: initialUser.username,
        email: initialUser.email,
        password: undefined,
        role: initialUser.role as UserRole,
        isActive: initialUser.isActive,
        approved: initialUser.approved || true,
        profileInfo: {
          fullName: initialUser.profileInfo?.fullName || "",
          phoneNumber: initialUser.profileInfo?.phoneNumber || "",
          images: initialUser.profileInfo?.images || [],
          verificationLevel:
            initialUser.profileInfo?.verificationLevel || "none",
          venueName: initialUser.profileInfo?.venueName || "",
          venueLocation: initialUser.profileInfo?.venueLocation || "",
          venueDescription: initialUser.profileInfo?.venueDescription || "",
          venueEmail: initialUser.profileInfo?.venueEmail || "",
          venueWebsite: initialUser.profileInfo?.venueWebsite || "",
          galleraName: initialUser.profileInfo?.galleraName || "",
          galleraLocation: initialUser.profileInfo?.galleraLocation || "",
          galleraDescription: initialUser.profileInfo?.galleraDescription || "",
          galleraEmail: initialUser.profileInfo?.galleraEmail || "",
          galleraWebsite: initialUser.profileInfo?.galleraWebsite || "",
          galleraSpecialties: initialUser.profileInfo?.galleraSpecialties || [],
          galleraActiveRoosters:
            initialUser.profileInfo?.galleraActiveRoosters || [],
        },
      };
    } else {
      return {
        username: "",
        email: "",
        password: "",
        role: role,
        isActive: true,
        approved: true,
        profileInfo: {
          fullName: "",
          phoneNumber: "",
          images: [],
          verificationLevel: "none",
          venueName: "",
          venueLocation: "",
          venueDescription: "",
          venueEmail: "",
          venueWebsite: "",
          galleraName: "",
          galleraLocation: "",
          galleraDescription: "",
          galleraEmail: "",
          galleraWebsite: "",
          galleraSpecialties: [],
          galleraActiveRoosters: [],
        },
      };
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    // Check if it's a nested field (contains dot notation)
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      if (parent === "profileInfo") {
        // Handle profileInfo nested fields correctly
        setFormData((prev) => ({
          ...prev,
          profileInfo: {
            ...prev.profileInfo,
            [child]: value,
          },
        }));
      } else {
        // Handle other nested fields if any
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }));
      }
    } else {
      // Handle root level fields (checkboxes, username, email, etc.)
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      profileInfo: {
        ...prev.profileInfo,
        [field]: value ? value.split(",").map((s) => s.trim()) : [],
      },
    }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData((prev) => ({
      ...prev,
      profileInfo: {
        ...prev.profileInfo,
        images: images,
      },
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setFieldErrors({});

    try {
      if (mode === "create") {
        // For create mode, we need to include profileInfo and make sure it's properly structured
        const createUserData = {
          username: formData.username,
          email: formData.email,
          password: formData.password || "",
          role: formData.role,
          profileInfo: {
            ...formData.profileInfo,
          },
        };

        const res = await userAPI.create(createUserData);
        if (res.success) {
          addToast({
            type: "success",
            title: "Usuario Creado",
            message: `El usuario ${formData.username} ha sido creado exitosamente.`,
          });
          return res;
        } else {
          const errorMessage =
            res.error || "Ocurrió un error al crear el usuario.";

          // Extract field name from error message
          const errors: Record<string, string> = {};
          const lowerMessage = errorMessage.toLowerCase();

          // Check for specific field errors (backend now sends specific messages)
          if (lowerMessage.includes("password")) {
            errors.password = errorMessage;
          }

          if (
            lowerMessage.includes("email") ||
            lowerMessage.includes("correo")
          ) {
            errors.email = errorMessage;
          }

          if (lowerMessage.includes("username")) {
            errors.username = errorMessage;
          }

          setFieldErrors(errors);
          setError(errorMessage);
          addToast({
            type: "error",
            title: "Error de Validación",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
      } else if (mode === "edit" && initialUser) {
        // For edit mode, update the profile info
        await userAPI.updateProfile({
          profileInfo: formData.profileInfo,
        });

        // Update user role if changed
        if (formData.role !== initialUser.role) {
          await userAPI.updateRole(initialUser.id, formData.role);
        }

        // Update user status if changed
        if (formData.isActive !== initialUser.isActive) {
          await userAPI.updateStatus(initialUser.id, formData.isActive);
        }

        // Update user approval status if changed
        if (formData.approved !== initialUser.approved) {
          await userAPI.update(initialUser.id, {
            approved: formData.approved,
          } as Partial<User>);
        }

        addToast({
          type: "success",
          title: "Usuario Actualizado",
          message: `El usuario ${formData.username} ha sido actualizado exitosamente.`,
        });
        return { success: true, data: { ...initialUser, ...formData } };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al procesar el usuario.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Error",
        message: errorMessage,
      });
      throw err;
    }
  };

  return {
    formData,
    handleChange,
    handleArrayChange,
    handleImagesChange,
    handleSubmit,
    error,
    setError,
    fieldErrors,
    setFieldErrors,
  };
};
