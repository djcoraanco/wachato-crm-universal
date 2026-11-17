export type ModuleCategory =
  | "restaurantes"
  | "clinicas"
  | "ecommerce"
  | "marketing"
  | "inmobiliarias"
  | "servicios"
  | "educacion"
  | "logistica";

export type ModuleTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler?: (params: Record<string, unknown>, context: { organizationId: string; contactId?: string }) => Promise<unknown>;
};

export type ModuleNavigationItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
};

export type ModuleCustomFieldDefinition = {
  code: string;
  name: string;
  type: "text" | "number" | "boolean" | "date" | "select" | "multiselect";
  options?: string[];
  required?: boolean;
};

export type ModulePipelineStageDefinition = {
  name: string;
  kind?: "open" | "won" | "lost";
  capiEvent?: string;
};

export type ModuleManifest = {
  id: string;
  name: string;
  category: ModuleCategory;
  version: string;
  description: string;
  author: string;
  icon: string;
  official: boolean;
  navigationItems: ModuleNavigationItem[];
  tools: ModuleTool[];
  pipelineTemplate?: {
    name: string;
    stages: ModulePipelineStageDefinition[];
  };
  customFields?: ModuleCustomFieldDefinition[];
  systemPromptEnhancement?: string;
};

export type InstalledModuleDto = ModuleManifest & {
  installed: boolean;
  status: "active" | "disabled" | "uninstalled";
  installedAt?: string;
  config?: Record<string, unknown>;
  isAllowedByPlan?: boolean;
  requiredTier?: string;
};
