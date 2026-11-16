const CANONICAL_ALIASES: Record<string, string> = {
  dashboard: "dashboard",
  dashboards: "dashboard",
  user: "users",
  users: "users",
  group: "groups",
  groups: "groups",
  groupaccess: "groupaccess",
  permission: "permissions",
  permissions: "permissions",
  activity: "activities",
  activities: "activities",
  activitylog: "activities",
  activitylogs: "activities",
  setting: "settings",
  settings: "settings",
  purchase: "purchase",
  purchases: "purchase",
  purchaseorder: "purchaseorder",
  purchaseorders: "purchaseorder",
  saleorder: "saleorder",
  saleorders: "saleorder",
  party: "partys",
  partys: "partys",
  parties: "partys",
  service: "services",
  services: "services",
  category: "categorys",
  categorys: "categorys",
  categories: "categorys",
  subcategory: "subcategorys",
  subcategorys: "subcategorys",
  subcategories: "subcategorys",
  taxrate: "taxrate",
  taxrates: "taxrate",
  unit: "unit",
  units: "unit",
  currency: "currency",
  currencys: "currency",
  currencies: "currency",
  country: "countries",
  countries: "countries",
  countriess: "countries",
  city: "city",
  citys: "city",
  cities: "city",
  state: "state",
  states: "state",
  page: "pages",
  pages: "pages",
  widget: "widgets",
  widgets: "widgets",
  emailtemplate: "emailtemplate",
  emailtemplates: "emailtemplate",
  smstemplate: "smstemplate",
  smstemplates: "smstemplate",
};

export const normalizeExactModuleKey = (name?: string | null): string =>
  String(name || "").trim().toLowerCase();

export const normalizeModuleKey = (name?: string | null): string => {
  const compact = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (!compact) return "";
  return CANONICAL_ALIASES[compact] || compact;
};

export const isSameModuleName = (
  left?: string | null,
  right?: string | null,
): boolean => {
  const exactLeft = normalizeExactModuleKey(left);
  const exactRight = normalizeExactModuleKey(right);
  if (!exactLeft || !exactRight) return false;
  if (exactLeft === exactRight) return true;
  return normalizeModuleKey(left) === normalizeModuleKey(right);
};

export const isRuleActive = (val: unknown): boolean =>
  val !== false && val !== "false" && val !== 0 && val !== "0";

/**
 * Checks whether an item's URL matches the current path with boundary check.
 * Prevents "/admin/purchaseorder" from matching "/admin/purchase".
 */
export const isPathMatching = (
  itemUrl?: string,
  currentPath?: string,
): boolean => {
  if (!itemUrl || !currentPath) return false;

  const cleanItemUrl =
    itemUrl.length > 1 ? itemUrl.replace(/\/+$/, "") : itemUrl;
  const cleanPath =
    currentPath.length > 1 ? currentPath.replace(/\/+$/, "") : currentPath;

  if (cleanPath === cleanItemUrl) return true;
  if (cleanItemUrl === "/") return false;

  if (
    (cleanItemUrl === "/admin/purchaseorder" &&
      (cleanPath === "/admin/purchase-order" ||
        cleanPath.startsWith("/admin/purchase-order/"))) ||
    (cleanItemUrl === "/admin/purchase-order" &&
      (cleanPath === "/admin/purchaseorder" ||
        cleanPath.startsWith("/admin/purchaseorder/")))
  ) {
    return true;
  }

  return (
    cleanPath.startsWith(`${cleanItemUrl}/`) ||
    cleanPath.startsWith(`${cleanItemUrl}?`)
  );
};

