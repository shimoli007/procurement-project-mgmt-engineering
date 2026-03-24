/**
 * Request validation middleware factory.
 *
 * @param {object} schema - { body: { fieldName: { required, type, min, max, pattern } } }
 * @returns Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = {};

    if (schema.body) {
      const body = req.body || {};

      for (const [field, rules] of Object.entries(schema.body)) {
        const value = body[field];

        // Required check
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors[field] = `${field} is required`;
          continue;
        }

        // Skip further checks if value is not present and not required
        if (value === undefined || value === null) continue;

        // Type check
        if (rules.type === 'string' && typeof value !== 'string') {
          errors[field] = `${field} must be a string`;
          continue;
        }
        if (rules.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
          errors[field] = `${field} must be a number`;
          continue;
        }

        // Min / Max for numbers
        if (rules.type === 'number' && typeof value === 'number') {
          if (rules.min !== undefined && value < rules.min) {
            errors[field] = `${field} must be at least ${rules.min}`;
            continue;
          }
          if (rules.max !== undefined && value > rules.max) {
            errors[field] = `${field} must be at most ${rules.max}`;
            continue;
          }
        }

        // Min / Max for string length
        if (rules.type === 'string' && typeof value === 'string') {
          if (rules.min !== undefined && value.length < rules.min) {
            errors[field] = `${field} must be at least ${rules.min} characters`;
            continue;
          }
          if (rules.max !== undefined && value.length > rules.max) {
            errors[field] = `${field} must be at most ${rules.max} characters`;
            continue;
          }
        }

        // Pattern check
        if (rules.pattern && typeof value === 'string') {
          const regex = rules.pattern instanceof RegExp ? rules.pattern : new RegExp(rules.pattern);
          if (!regex.test(value)) {
            errors[field] = `${field} has an invalid format`;
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', fields: errors });
    }

    next();
  };
}

module.exports = { validate };
