import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { ValidationResult, ValidationError, ValidationSeverity } from "./types.ts";

// ─── Schema Cache ────────────────────────────────────────────────

const SCHEMA_URL = "https://opencode.ai/config.json";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedSchema: object | null = null;
let cachedAt = 0;

async function fetchSchema(): Promise<object | null> {
  if (cachedSchema && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedSchema;
  }

  try {
    const response = await fetch(SCHEMA_URL);
    if (!response.ok) return cachedSchema;
    cachedSchema = (await response.json()) as object;
    cachedAt = Date.now();
    return cachedSchema;
  } catch {
    return cachedSchema;
  }
}

export function invalidateSchemaCache(): void {
  cachedSchema = null;
  cachedAt = 0;
}

// ─── Ajv Instance with remote schema loading ─────────────────────

function createAjv(): Ajv2020 {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    loadSchema: async (uri: string) => {
      const res = await fetch(uri);
      if (!res.ok) throw new Error(`Failed to fetch schema: ${uri}`);
      return (await res.json()) as object;
    },
  });
  addFormats(ajv);
  return ajv;
}

// ─── Suggestion Generator ────────────────────────────────────────

function generateSuggestion(error: {
  keyword: string;
  instancePath: string;
  params: Record<string, unknown>;
  message?: string;
}): string | undefined {
  switch (error.keyword) {
    case "additionalProperties":
      return `Remove unknown property "${error.params["additionalProperty"]}"`;
    case "required":
      return `Add required property "${error.params["missingProperty"]}"`;
    case "type":
      return `Change value at ${error.instancePath || "root"} to type ${error.params["type"]}`;
    case "enum":
      return `Use one of: ${JSON.stringify(error.params["allowedValues"])}`;
    default:
      return undefined;
  }
}

// ─── Validate Config ─────────────────────────────────────────────

export async function validateConfig(
  config: unknown,
): Promise<ValidationResult> {
  const schema = await fetchSchema();

  if (!schema) {
    return {
      valid: true,
      errors: [
        {
          path: "",
          message: "Could not fetch schema for validation — skipping",
          severity: "warning" as ValidationSeverity,
        },
      ],
    };
  }

  try {
    const ajv = createAjv();
    // compileAsync resolves remote $ref schemas automatically
    const validate = await ajv.compileAsync(schema);
    const valid = validate(config) as boolean;

    if (valid) {
      return { valid: true, errors: [] };
    }

    const errors: ValidationError[] = (validate.errors ?? []).map((err) => ({
      path: err.instancePath || "/",
      message: err.message ?? "Unknown validation error",
      severity: "error" as ValidationSeverity,
      suggestion: generateSuggestion({
        keyword: err.keyword,
        instancePath: err.instancePath,
        params: (err.params ?? {}) as Record<string, unknown>,
        message: err.message ?? undefined,
      }),
    }));

    return { valid: false, errors };
  } catch (err) {
    return {
      valid: true,
      errors: [
        {
          path: "",
          message: `Schema compilation failed: ${err instanceof Error ? err.message : String(err)}`,
          severity: "warning" as ValidationSeverity,
        },
      ],
    };
  }
}
