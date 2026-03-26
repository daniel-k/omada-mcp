import { z } from 'zod';

/**
 * Boolean schema that coerces string "true"/"false" to actual booleans.
 *
 * MCP clients (especially LLMs) may send boolean values as strings.
 * z.coerce.boolean() can't be used because JavaScript's Boolean("false") === true.
 */
export function coercedBoolean() {
    return z.preprocess((val) => (typeof val === 'string' ? val === 'true' : val), z.boolean());
}

/**
 * Wraps a Zod object/array schema so that a JSON string is parsed first.
 *
 * MCP clients may serialize nested objects as JSON strings instead of
 * passing them as actual objects.
 */
export function coercedObject<T extends z.ZodTypeAny>(schema: T): z.ZodEffects<T, z.output<T>, unknown> {
    return z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            } catch {
                return val;
            }
        }
        return val;
    }, schema);
}
