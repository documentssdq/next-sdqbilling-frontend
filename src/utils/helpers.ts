export const generateInitials = (name = ""): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export const toPascalCase = (value: string) =>
  value
    .replace(/[-_ ]+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const toTitleCase = (value?: string) => {
  if (!value) return "";
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const formatBytes = (bytes: number, decimals: number = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export function getColor(v: string, a: number = 1): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "";
  }
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(`--theme-${v}`)
    .trim();
  return v.includes("-rgb") ? `rgba(${val}, ${a})` : val;
}

export const getFont = () => {
  if (typeof window === "undefined") {
    return;
  }
  return getComputedStyle(document.body).fontFamily.trim();
};

export const generateRandomEChartData = (dataName: string[]) => {
  const randomData = dataName.map((name) => ({
    name: name,
    value: Math.floor(Math.random() * 100) + 1,
  }));
  const total = randomData.reduce((sum, item) => sum + item.value, 0);
  randomData.forEach((item) => {
    item.value = (item.value / total) * 100;
  });
  return randomData;
};

export const abbreviatedNumber = (val: number) => {
  const s = ["", "k", "m", "b", "t"];
  if (val === 0) return 0;
  const sNum = Math.floor(Math.log10(val) / 3);
  let sVal = parseFloat(
    (sNum != 0 ? val / Math.pow(1000, sNum) : val).toPrecision(2),
  );
  if (sVal % 1 != 0) {
    sVal = Number.parseInt(sVal.toFixed(1));
  }
  return sVal + s[sNum];
};

/**
 * Formats a service reference as "Service Name - Category Name - Subcategory Name".
 * Safely omits missing category or subcategory parts without leaving stray hyphens.
 */
export const formatServiceDisplayLabel = (
  serviceOrId: any,
  serviceList: any[] = [],
  categoryList: any[] = [],
  subcategoryList: any[] = [],
  fallbackLabel = "",
): string => {
  if (!serviceOrId && serviceOrId !== 0) return fallbackLabel;

  const isObj = typeof serviceOrId === "object" && serviceOrId !== null;
  const serviceId = isObj
    ? String(serviceOrId.id || serviceOrId._id || "")
    : String(serviceOrId || "");

  const matchedFromList = serviceId
    ? serviceList.find(
        (s: any) => String(s?.id || s?._id || "") === serviceId,
      )
    : undefined;

  const serviceObj = isObj
    ? { ...(matchedFromList || {}), ...serviceOrId }
    : matchedFromList;

  if (!serviceObj) return fallbackLabel;

  const serviceName = String(serviceObj.name || "").trim();

  const resolveRelatedName = (
    primaryRef: any,
    secondaryRef: any,
    directName: any,
    list: any[],
  ): string => {
    if (typeof directName === "string" && directName.trim()) {
      return directName.trim();
    }
    const chosenRef =
      primaryRef && typeof primaryRef === "object" && primaryRef.name
        ? primaryRef
        : secondaryRef && typeof secondaryRef === "object" && secondaryRef.name
          ? secondaryRef
          : primaryRef ?? secondaryRef;

    if (chosenRef && typeof chosenRef === "object" && chosenRef.name) {
      return String(chosenRef.name).trim();
    }
    const refId =
      chosenRef && typeof chosenRef === "object"
        ? String(chosenRef.id || chosenRef._id || "")
        : String(chosenRef || "");
    if (!refId) return "";
    const match = list.find(
      (item: any) => String(item?.id || item?._id || "") === refId,
    );
    return match?.name ? String(match.name).trim() : "";
  };

  const categoryName = resolveRelatedName(
    serviceObj.category_id,
    matchedFromList?.category_id,
    serviceObj.category_name ||
      serviceObj.categoryName ||
      matchedFromList?.category_name,
    categoryList,
  );

  const subcategoryName = resolveRelatedName(
    serviceObj.subcategory_id,
    matchedFromList?.subcategory_id,
    serviceObj.subcategory_name ||
      serviceObj.subcategoryName ||
      matchedFromList?.subcategory_name,
    subcategoryList,
  );

  const parts = [serviceName, categoryName, subcategoryName].filter(Boolean);
  return parts.length > 0 ? parts.join(" - ") : fallbackLabel;
};
