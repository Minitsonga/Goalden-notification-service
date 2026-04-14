import Joi from "joi";

export type SendEmailPayload = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  meta?: Record<string, unknown>;
};

export type SendSelectionPayload = {
  to: string | string[];
  teamName: string;
  eventName: string;
  eventDate: string;
  selectionSummary?: string;
  meta?: Record<string, unknown>;
};

export const sendEmailSchema = Joi.object<SendEmailPayload>({
  to: Joi.alternatives()
    .try(Joi.string().email(), Joi.array().items(Joi.string().email()).min(1))
    .required(),
  subject: Joi.string().trim().min(3).max(200).required(),
  text: Joi.string().allow("").optional(),
  html: Joi.string().allow("").optional(),
  meta: Joi.object().default({}),
}).custom((value, helpers) => {
  if (!value.text && !value.html) {
    return helpers.error("any.invalid", {
      message: "Either text or html must be provided",
    });
  }
  return value;
});

export const sendSelectionSchema = Joi.object<SendSelectionPayload>({
  to: Joi.alternatives()
    .try(Joi.string().email(), Joi.array().items(Joi.string().email()).min(1))
    .required(),
  teamName: Joi.string().trim().min(2).max(120).required(),
  eventName: Joi.string().trim().min(2).max(200).required(),
  eventDate: Joi.string().trim().min(2).max(100).required(),
  selectionSummary: Joi.string().trim().allow("").default(""),
  meta: Joi.object().default({}),
});

export function validateBody<T>(schema: Joi.ObjectSchema<T>, payload: unknown): T {
  const { value, error } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    throw error;
  }
  return value as T;
}

