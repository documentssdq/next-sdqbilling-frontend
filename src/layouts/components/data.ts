import { type MenuItemType } from "@/types";

export const menuItems: MenuItemType[] = [
  {
    icon: "layout-dashboard",
    slug: "main",
    label: "Main",
    isTitle: true,
    children: [
      {
        url: "/admin/dashboard",
        icon: "layout-dashboard",
        slug: "pages:dashboard-admin",
        label: "Dashboard",
      },
    ],
  },
  {
    icon: "users",
    slug: "user-access-management",
    label: "Management",
    isTitle: true,
    children: [
      {
        icon: "users",
        slug: "enterprise-user-access",
        label: "User & Access Control",
        children: [
          {
            url: "/admin/users",
            slug: "pages:apps-users-list",
            label: "Users",
          },
          {
            url: "/admin/groups",
            slug: "pages:apps-users-groups",
            label: "Groups",
          },
          {
            url: "/admin/groups/permissions",
            slug: "pages:apps-users-permissions",
            label: "Permissions",
          },
          {
            url: "/admin/group-access",
            slug: "pages:apps-users-group-access",
            label: "Group Access",
          },
          {
            url: "/admin/activities",
            slug: "pages:apps-activities",
            label: "Activity Logs",
          },
        ],
      },
      {
        url: "/admin/settings",
        icon: "settings",
        slug: "pages:apps-settings",
        label: "Settings",
      },
    ],
  },
];
