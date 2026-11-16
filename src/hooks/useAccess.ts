import { useAppSelector } from "@/redux/hooks";
import { isSameModuleName, normalizeExactModuleKey } from "@/utils/moduleName";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Swal from "sweetalert2";

export interface AccessControl {
  read: boolean;
  write: boolean;
  delete: boolean;
  export: boolean;
}

export const useAccess = (moduleName: string): AccessControl => {
  const { user } = useAppSelector((state) => state.auth);

  const accessRules = user?.accessRules || [];
  const targetExact = normalizeExactModuleKey(moduleName);
  const rule =
    accessRules.find(
      (r: any) => normalizeExactModuleKey(r.moduleName) === targetExact,
    ) ||
    accessRules.find((r: any) => isSameModuleName(r.moduleName, moduleName));

  if (rule) {
    return {
      read: Boolean(rule.read),
      write: Boolean(rule.write),
      delete: Boolean(rule.delete),
      export: Boolean(rule.export),
    };
  }

  // Super Admin bypass
  if (user?.groupId === "GRP-1" || user?.groupName === "Super Admin" || (user as any)?.group === "Super Admin") {
    return { read: true, write: true, delete: true, export: true };
  }

  // Default to false if no rule exists
  return { read: false, write: false, delete: false, export: false };
};

export const usePageAccess = (moduleName: string): AccessControl => {
  const access = useAccess(moduleName);
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Only check and redirect if the user is fully loaded and authenticated
    if (isAuthenticated && user && !access.read) {
      Swal.fire({
        title: "Access Denied",
        text: `You do not have permission to access the ${moduleName} module.`,
        icon: "warning",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      }).then(() => {
        router.push("/admin/dashboard");
      });
    }
  }, [access.read, moduleName, router, isAuthenticated, user]);

  return access;
};
