import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
  Building,
  BarChart3,
  FileText,
  Palette,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/admin/dashboard",
  },
  {
    title: "Empresas",
    icon: Building2,
    url: "/admin/companies",
  },
  {
    title: "Subcuentas",
    icon: Building,
    url: "/admin/subaccounts",
  },
  {
    title: "Facturación",
    icon: CreditCard,
    url: "/admin/billing",
  },
  {
    title: "Reportes",
    icon: BarChart3,
    url: "/admin/reports",
  },
];

const configItems = [
  {
    title: "Marca",
    icon: Palette,
    url: "/admin/branding",
  },
  {
    title: "API Tokens",
    icon: FileText,
    url: "/admin/api",
  },
  {
    title: "Configuración",
    icon: Settings,
    url: "/admin/settings",
  },
];

interface BrandingData {
  brandingEnabled: boolean;
  logo: string | null;
  brandingText: string | null;
  companyName: string;
}

export function AdminSidebar() {
  const [location] = useLocation();

  // Fetch branding data
  const { data: branding } = useQuery<BrandingData>({
    queryKey: ["/api/branding/current"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Helper to check if a menu item is active (handles nested routes)
  const isMenuItemActive = (itemUrl: string) => {
    // Exact match
    if (location === itemUrl) return true;
    // Check if current location starts with item URL (for nested routes)
    // But avoid matching /admin with /admin/dashboard
    if (itemUrl === "/admin") return location === "/admin" || location === "/admin/";
    return location.startsWith(itemUrl + "/") || location.startsWith(itemUrl + "?");
  };

  // Determine what to show in header
  const showCustomBranding = branding?.brandingEnabled && (branding?.logo || branding?.brandingText);
  const displayName = showCustomBranding && branding?.brandingText
    ? branding.brandingText
    : "Admin Panel";

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          {showCustomBranding && branding?.logo ? (
            <img
              src={branding.logo}
              alt="Logo"
              className="h-8 w-8 rounded-lg object-contain bg-white p-0.5"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {showCustomBranding ? "Panel de Control" : "Gestión Empresarial"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = isMenuItemActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`sidebar-${item.title.toLowerCase()}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configuration */}
        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => {
                const isActive = isMenuItemActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`sidebar-${item.title.toLowerCase()}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          v1.0.0 • WhatsApp Platform
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
