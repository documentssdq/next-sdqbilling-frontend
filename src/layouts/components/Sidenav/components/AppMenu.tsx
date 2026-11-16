import Icon from "@/components/wrappers/Icon";
import { menuItems } from "@/layouts/components/data";
import type { MenuItemType } from "@/types";
import { scrollToElement } from "@/utils/layout";
import {
  isPathMatching,
  isRuleActive,
  normalizeExactModuleKey,
  normalizeModuleKey,
} from "@/utils/moduleName";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useCallback, useEffect, useState, useMemo } from "react";
import { Collapse } from "react-bootstrap";
import { useAppSelector } from "@/redux/hooks";

export { isPathMatching };

const MODULE_ROUTE_MAP: Record<string, { url: string; icon: string; label?: string }> = {
  dashboard: { url: "/admin/dashboard", icon: "layout-dashboard", label: "Dashboard" },
  users: { url: "/admin/users", icon: "users", label: "Users" },
  user: { url: "/admin/users", icon: "users", label: "Users" },
  groups: { url: "/admin/groups", icon: "shield", label: "Groups" },
  group: { url: "/admin/groups", icon: "shield", label: "Groups" },
  "group access": { url: "/admin/group-access", icon: "lock", label: "Group Access" },
  "group-access": { url: "/admin/group-access", icon: "lock", label: "Group Access" },
  groupaccess: { url: "/admin/group-access", icon: "lock", label: "Group Access" },
  permissions: { url: "/admin/groups/permissions", icon: "key", label: "Permissions" },
  permission: { url: "/admin/groups/permissions", icon: "key", label: "Permissions" },
  activities: { url: "/admin/activities", icon: "activity", label: "Activity Logs" },
  activity: { url: "/admin/activities", icon: "activity", label: "Activity Logs" },
  "activity logs": { url: "/admin/activities", icon: "activity", label: "Activity Logs" },
  "activity log": { url: "/admin/activities", icon: "activity", label: "Activity Logs" },
  settings: { url: "/admin/settings", icon: "settings", label: "Settings" },
  setting: { url: "/admin/settings", icon: "settings", label: "Settings" },
  purchase: { url: "/admin/purchase", icon: "shopping-bag", label: "Purchase" },
  purchases: { url: "/admin/purchase", icon: "shopping-bag", label: "Purchase" },
  purchaseorder: { url: "/admin/purchaseorder", icon: "shopping-cart", label: "Purchase Order" },
  purchaseorders: { url: "/admin/purchaseorder", icon: "shopping-cart", label: "Purchase Order" },
  "purchase order": { url: "/admin/purchaseorder", icon: "shopping-cart", label: "Purchase Order" },
  "purchase orders": { url: "/admin/purchaseorder", icon: "shopping-cart", label: "Purchase Order" },
  "purchase-order": { url: "/admin/purchaseorder", icon: "shopping-cart", label: "Purchase Order" },
  "purchase-orders": { url: "/admin/purchaseorder", icon: "shopping-cart", label: "Purchase Order" },
  saleorder: { url: "/admin/saleorder", icon: "shopping-bag", label: "Sale Order" },
  saleorders: { url: "/admin/saleorder", icon: "shopping-bag", label: "Sale Order" },
  "sale order": { url: "/admin/saleorder", icon: "shopping-bag", label: "Sale Order" },
  "sale orders": { url: "/admin/saleorder", icon: "shopping-bag", label: "Sale Order" },
  "sale-order": { url: "/admin/saleorder", icon: "shopping-bag", label: "Sale Order" },
  "sale-orders": { url: "/admin/saleorder", icon: "shopping-bag", label: "Sale Order" },
  partys: { url: "/admin/party", icon: "users", label: "Party" },
  party: { url: "/admin/party", icon: "users", label: "Party" },
  parties: { url: "/admin/party", icon: "users", label: "Parties" },
  services: { url: "/admin/service", icon: "briefcase", label: "Services" },
  service: { url: "/admin/service", icon: "briefcase", label: "Service" },
  categorys: { url: "/admin/category", icon: "folder", label: "Category" },
  category: { url: "/admin/category", icon: "folder", label: "Category" },
  categories: { url: "/admin/category", icon: "folder", label: "Categories" },
  subcategorys: { url: "/admin/subcategory", icon: "folder-tree", label: "Sub Category" },
  subcategory: { url: "/admin/subcategory", icon: "folder-tree", label: "Sub Category" },
  "sub category": { url: "/admin/subcategory", icon: "folder-tree", label: "Sub Category" },
  "sub-category": { url: "/admin/subcategory", icon: "folder-tree", label: "Sub Category" },
  subcategories: { url: "/admin/subcategory", icon: "folder-tree", label: "Sub Categories" },
  taxrate: { url: "/admin/taxrate", icon: "percent", label: "Tax Rate" },
  taxrates: { url: "/admin/taxrate", icon: "percent", label: "Tax Rate" },
  "tax rate": { url: "/admin/taxrate", icon: "percent", label: "Tax Rate" },
  "tax rates": { url: "/admin/taxrate", icon: "percent", label: "Tax Rate" },
  unit: { url: "/admin/unit", icon: "scale", label: "Unit" },
  units: { url: "/admin/unit", icon: "scale", label: "Units" },
  currency: { url: "/admin/currency", icon: "dollar-sign", label: "Currency" },
  currencies: { url: "/admin/currency", icon: "dollar-sign", label: "Currencies" },
  countries: { url: "/admin/countries", icon: "globe", label: "Countries" },
  country: { url: "/admin/countries", icon: "globe", label: "Countries" },
  city: { url: "/admin/city", icon: "map-pin", label: "City" },
  cities: { url: "/admin/city", icon: "map-pin", label: "Cities" },
  state: { url: "/admin/state", icon: "map", label: "State" },
  states: { url: "/admin/state", icon: "map", label: "States" },
  page: { url: "/admin/page", icon: "file", label: "Page" },
  pages: { url: "/admin/page", icon: "file", label: "Pages" },
  widget: { url: "/admin/widget", icon: "layout-grid", label: "Widget" },
  widgets: { url: "/admin/widget", icon: "layout-grid", label: "Widgets" },
  emailtemplate: { url: "/admin/emailtemplate", icon: "mail", label: "Email Template" },
  "email template": { url: "/admin/emailtemplate", icon: "mail", label: "Email Template" },
  "email templates": { url: "/admin/emailtemplate", icon: "mail", label: "Email Templates" },
  smstemplate: { url: "/admin/smstemplate", icon: "message-square", label: "SMS Template" },
  "sms template": { url: "/admin/smstemplate", icon: "message-square", label: "SMS Template" },
  "sms templates": { url: "/admin/smstemplate", icon: "message-square", label: "SMS Templates" },
};

const findExactStaticMenuItem = (
  items: MenuItemType[],
  targetNorm: string,
): { url?: string; icon?: string } | null => {
  for (const item of items) {
    const labelNorm = (item.label || "").trim().toLowerCase();
    if (item.url && labelNorm === targetNorm) {
      return { url: item.url, icon: item.icon };
    }
    if (item.children) {
      const childMatch = findExactStaticMenuItem(item.children, targetNorm);
      if (childMatch) return childMatch;
    }
  }
  return null;
};

const MenuItemWithChildren = ({
  item,
  openMenuKey,
  setOpenMenuKey,
  level = 0,
}: {
  item: MenuItemType;
  openMenuKey: string | null;
  setOpenMenuKey: (key: string | null) => void;
  level?: number;
}) => {
  const pathname = usePathname();
  const isTopLevel = level === 0;
  const [localOpen, setLocalOpen] = useState(false);
  const [didAutoOpen, setDidAutoOpen] = useState(false);

  const isChildActive = useCallback(
    (children: MenuItemType[] = []): boolean =>
      children.some(
        (child) =>
          isPathMatching(child.url, pathname) ||
          (child.children && isChildActive(child.children)),
      ),
    [pathname],
  );

  const isActive =
    isPathMatching(item.url, pathname) || isChildActive(item.children);

  const isOpen = isTopLevel ? openMenuKey === item.slug : localOpen;

  useEffect(() => {
    if (isActive && !didAutoOpen) {
      if (isTopLevel) {
        setOpenMenuKey(item.slug);
      } else {
        setLocalOpen(true);
      }
      setDidAutoOpen(true);
    }
  }, [isActive, didAutoOpen, isTopLevel, item.slug, setOpenMenuKey]);

  const toggleOpen = (e: React.MouseEvent) => {
    if (item.children?.length) e.preventDefault();
    if (isTopLevel) {
      setOpenMenuKey(isOpen ? null : item.slug);
    } else {
      setLocalOpen((prev) => !prev);
    }
  };

  return (
    <li
      className={clsx("side-nav-item", {
        active: isActive,
      })}
    >
      <Link
        href={item.url ?? "#"}
        onClick={toggleOpen}
        className={clsx("side-nav-link", isActive && "active")}
        aria-expanded={isOpen}
      >
        {item.icon && isTopLevel && (
          <span className="menu-icon">
            <Icon icon={item.icon} />
          </span>
        )}

        <span className="menu-text">{item.label}</span>
        {item.badge ? (
          <span className={clsx("badge", item.badge.className)}>
            {item.badge.text}
          </span>
        ) : (
          <span className="menu-arrow" />
        )}
      </Link>

      <Collapse in={isOpen}>
        <div>
          <ul className="sub-menu">
            {(item.children || []).map((child) =>
              child.children ? (
                <MenuItemWithChildren
                  key={child.slug}
                  item={child}
                  openMenuKey={openMenuKey}
                  setOpenMenuKey={setOpenMenuKey}
                  level={level + 1}
                />
              ) : (
                <MenuItem key={child.slug} item={child} level={level + 1} />
              ),
            )}
          </ul>
        </div>
      </Collapse>
    </li>
  );
};

const MenuItem = ({
  item,
  level = 0,
}: {
  item: MenuItemType;
  level?: number;
}) => {
  const pathname = usePathname();
  const isTopLevel = level === 0;
  const isActive = isPathMatching(item.url, pathname);

  return (
    <li className={clsx("side-nav-item", isActive && "active")}>
      <Link
        href={item.url ?? "/"}
        className={clsx(
          "side-nav-link",
          isActive && "active",
          item.isDisabled && "disabled",
          item.isSpecial && "special-menu",
        )}
      >
        {item.icon && isTopLevel && (
          <span className="menu-icon">
            <Icon icon={item.icon} />
          </span>
        )}
        <span className="menu-text">{item.label}</span>
        {item.badge && (
          <span className={clsx("badge", item.badge.className)}>
            {item.badge.text}
          </span>
        )}
      </Link>
    </li>
  );
};

interface AccessRuleItem {
  id?: string;
  moduleName?: string;
  category?: string;
  url?: string;
  icon?: string;
  read?: boolean;
  isActive?: boolean;
}

const AppMenu = () => {
  const pathname = usePathname();
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  const scrollToActiveLink = () => {
    const activeItem: HTMLAnchorElement | null = document.querySelector(
      ".side-nav-link.active",
    );
    if (activeItem) {
      const simpleBarContent = document.querySelector(
        "#sidenav .simplebar-content-wrapper",
      );
      if (simpleBarContent) {
        const offset = activeItem.offsetTop - window.innerHeight * 0.4;
        scrollToElement(simpleBarContent, offset, 500);
      }
    }
  };

  useEffect(() => {
    setTimeout(scrollToActiveLink, 150);
  }, [pathname]);

  const { user } = useAppSelector((state) => state.auth);

  const filteredMenuItems = useMemo(() => {
    const accessRules = (user?.accessRules || []) as AccessRuleItem[];

    const categories: Record<string, MenuItemType[]> = {};
    const seenByCat: Record<string, Set<string>> = {};

    accessRules.forEach((rule: AccessRuleItem) => {
      if (rule.read && isRuleActive(rule.isActive)) {
        const moduleName = rule.moduleName || "";
        const cat = rule.category || "Management";
        if (!categories[cat]) {
          categories[cat] = [];
          seenByCat[cat] = new Set<string>();
        }

        const norm = normalizeExactModuleKey(moduleName);
        const canonical = normalizeModuleKey(moduleName);
        const staticMatch =
          findExactStaticMenuItem(menuItems, norm) ||
          (canonical ? findExactStaticMenuItem(menuItems, canonical) : null);
        const exactMapped = MODULE_ROUTE_MAP[norm];
        const canonicalMapped = canonical ? MODULE_ROUTE_MAP[canonical] : undefined;
        const mapped = exactMapped || canonicalMapped;
        const cleanRuleUrl = typeof rule.url === "string" ? rule.url.trim() : "";

        let targetUrl =
          staticMatch?.url ||
          cleanRuleUrl ||
          mapped?.url ||
          `/admin/${norm.replace(/\s+/g, "-")}`;

        if (targetUrl === "/admin/purchase-order" || targetUrl.startsWith("/admin/purchase-order/")) {
          targetUrl = targetUrl.replace("/admin/purchase-order", "/admin/purchaseorder");
        }
        if (targetUrl === "/admin/sale-order" || targetUrl.startsWith("/admin/sale-order/")) {
          targetUrl = targetUrl.replace("/admin/sale-order", "/admin/saleorder");
        }

        const targetLabel =
          exactMapped?.label ||
          (canonical === "purchaseorder"
            ? "Purchase Order"
            : canonical === "saleorder"
              ? "Sale Order"
              : moduleName) ||
          canonicalMapped?.label ||
          moduleName;

        const targetIcon =
          staticMatch?.icon || rule.icon || mapped?.icon || "file-text";

        const dedupeKey = `${targetUrl}|${canonical || norm}`;
        if (!seenByCat[cat].has(dedupeKey)) {
          seenByCat[cat].add(dedupeKey);
          categories[cat].push({
            label: targetLabel,
            slug: rule.id || moduleName || targetUrl,
            url: targetUrl,
            icon: targetIcon,
          });
        }
      }
    });

    const dynamicMenu: MenuItemType[] = [];

    // 1. Ensure 'Main' category is displayed at the very top without duplication
    let mainChildren = categories["Main"] || [];

    const dashboardRule = accessRules.find(
      (r: AccessRuleItem) => normalizeModuleKey(r.moduleName) === "dashboard",
    );
    const isDashboardAllowed = dashboardRule
      ? Boolean(dashboardRule.read) && isRuleActive(dashboardRule.isActive)
      : true;

    const hasDashboard = mainChildren.some(
      (item) => (item.label || "").trim().toLowerCase() === "dashboard",
    );
    if (!hasDashboard && isDashboardAllowed) {
      mainChildren = [
        {
          url: "/admin/dashboard",
          icon: "layout-dashboard",
          slug: "pages:dashboard-admin",
          label: "Dashboard",
        },
        ...mainChildren,
      ];
    }

    if (mainChildren.length > 0) {
      dynamicMenu.push({
        icon: "layout-dashboard",
        slug: "main",
        label: "Main",
        isTitle: true,
        children: mainChildren,
      });
    }

    delete categories["Main"];

    // 2. Append remaining categories in a clean, predictable order
    const remainingCats = Object.keys(categories);

    remainingCats.forEach((cat) => {
      if (categories[cat] && categories[cat].length > 0) {
        dynamicMenu.push({
          isTitle: true,
          label: cat,
          slug: cat.toLowerCase().replace(/\s+/g, "-"),
          children: categories[cat],
        });
      }
    });

    return dynamicMenu;
  }, [user]);

  return (
    <ul className="side-nav">
      {filteredMenuItems.map((item: MenuItemType, idx: number) => (
        <Fragment key={idx}>
          {item.isTitle && (
            <li className="side-nav-title mt-2">{item.label}</li>
          )}
          {(item.children || [item]).map((item, idx) => (
            <Fragment key={idx}>
              {item.children ? (
                <MenuItemWithChildren
                  key={item.slug}
                  item={item}
                  openMenuKey={openMenuKey}
                  setOpenMenuKey={setOpenMenuKey}
                />
              ) : (
                <MenuItem key={item.slug} item={item} />
              )}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </ul>
  );
};

export default AppMenu;
