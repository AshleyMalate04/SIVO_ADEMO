import { toast } from "sonner";

const options = {
  duration: 3600,
};

export const notify = {
  success(message, description, extraOptions = {}) {
    toast.success(message, { ...options, description, ...extraOptions });
  },
  error(message, description, extraOptions = {}) {
    toast.error(message, { ...options, description, ...extraOptions });
  },
  warning(message, description, extraOptions = {}) {
    toast.warning(message, { ...options, description, ...extraOptions });
  },
  info(message, description, extraOptions = {}) {
    toast.info(message, { ...options, description, ...extraOptions });
  },
};
