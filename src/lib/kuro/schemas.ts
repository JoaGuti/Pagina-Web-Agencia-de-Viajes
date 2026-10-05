import { z } from 'zod';

/**
 * Esquemas del contrato PÚBLICO de la Kuro Content API v1 (no del modelo interno de Kuro).
 * No son estrictos: un campo opcional nuevo agregado por una evolución compatible de v1 se ignora.
 */
const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const publicIdSchema = z.string().min(1);
export const publicUrlSchema = z.string().regex(/^https?:\/\/\S+$/);

export const moneySchema = z.object({ currency: z.string().length(3), amount: z.number().finite() });
export type Money = z.infer<typeof moneySchema>;

export const photoSchema = z.object({ url: publicUrlSchema, alt: z.string() });
export type Photo = z.infer<typeof photoSchema>;

const faqSchema = z.object({ question: z.string(), answer: z.string() });

export const siteSchema = z.object({
  siteKey: z.string().min(1),
  name: z.string(),
  vertical: z.enum(['viajes', 'inmobiliaria', 'hotel', 'tienda']),
  timezone: z.string().min(1),
  locale: z.string().min(2),
  currency: z.string().length(3),
  contact: z.object({ email: z.string().nullable(), phone: z.string().nullable(), whatsapp: z.string().nullable(), address: z.string().nullable() }),
  web: z
    .object({
      logo: publicUrlSchema.nullable(),
      announcement: z.object({ text: z.string(), link: z.string().nullable(), until: dia.nullable() }).nullable(),
      seo: z.object({ title: z.string().nullable(), description: z.string().nullable() }),
      faqs: z.array(faqSchema),
      legal: z.object({ businessName: z.string().nullable(), taxId: z.string().nullable(), licenseLabel: z.string().nullable(), license: z.string().nullable(), notes: z.string().nullable() }),
      whatsappMessage: z.string().nullable(),
    })
    .optional(),
});
export type Site = z.infer<typeof siteSchema>;

export const rateSchema = z.object({
  label: z.string(),
  unit: z.enum(['persona_base_doble', 'persona_base_triple', 'persona_single', 'menor', 'grupo', 'habitacion']),
  price: moneySchema,
  validFrom: dia,
  validUntil: dia,
  taxesIncluded: z.boolean(),
  taxesNote: z.string().nullable(),
});
export type Rate = z.infer<typeof rateSchema>;

export const departureSchema = z.object({
  publicId: publicIdSchema.optional(),
  inquiryDeadline: dia.nullable().optional(),
  startDate: dia,
  endDate: dia,
  availability: z.enum(['a_confirmar', 'disponible_informado', 'agotado', 'cerrado']),
  rates: z.array(rateSchema),
});
export type Departure = z.infer<typeof departureSchema>;

const contentSchema = z.object({
  subtitle: z.string().nullable(),
  highlights: z.array(z.string()),
  specs: z.array(z.object({ title: z.string(), rows: z.array(z.object({ label: z.string(), value: z.string() })) })),
  faqs: z.array(faqSchema),
  badges: z.array(z.string()),
  videoUrl: publicUrlSchema.nullable(),
  tourUrl: publicUrlSchema.nullable(),
  documents: z.array(z.object({ label: z.string(), url: publicUrlSchema })),
  cta: z.object({ label: z.string().nullable(), whatsappMessage: z.string().nullable() }),
  seo: z.object({ title: z.string().nullable(), description: z.string().nullable() }),
  priority: z.number().nullable(),
  promotion: z.object({ label: z.string().nullable(), until: dia.nullable(), state: z.enum(['sin_fecha', 'vigente', 'vencida']).nullable().optional() }),
});

export const travelPackageSchema = z.object({
  publicId: publicIdSchema,
  slug: z.string().optional(),
  title: z.string(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  destinations: z.array(z.string()),
  origin: z.string().nullable(),
  modality: z.enum(['aereo', 'bus', 'crucero', 'terrestre', 'a_medida']),
  durationDays: z.number().int().nullable(),
  durationNights: z.number().int().nullable(),
  photos: z.array(photoSchema),
  itinerary: z.array(z.object({ day: z.number().int().positive(), title: z.string(), description: z.string() })),
  departures: z.array(departureSchema),
  includes: z.array(z.string()),
  excludes: z.array(z.string()),
  conditions: z.string().nullable(),
  label: z.string().nullable().optional(),
  trip: z
    .object({
      hotels: z.array(z.object({ name: z.string(), city: z.string().nullable(), stars: z.number().nullable(), nights: z.number().int().nullable(), board: z.string().nullable() })),
      optionals: z.array(z.object({ name: z.string(), price: moneySchema.nullable() })),
      depositPercent: z.number().nullable(),
      installments: z.number().int().nullable(),
      paymentInfo: z.string().nullable(),
      requirements: z.string().nullable(),
      meetingPoint: z.string().nullable(),
      groupSize: z.string().nullable(),
      tips: z.string().nullable(),
    })
    .optional(),
  content: contentSchema.optional(),
  featured: z.boolean(),
  publishedAt: z.string(),
});
export type TravelPackage = z.infer<typeof travelPackageSchema>;

export const travelOfferSchema = z.object({
  title: z.string(),
  kind: z.string(),
  destination: z.string().nullable(),
  summary: z.string().nullable(),
  includes: z.array(z.string()),
  travelDates: z.string().nullable(),
  price: moneySchema.nullable(),
  previousPrice: moneySchema.nullable(),
  priceNote: z.string().nullable(),
  badge: z.string().nullable(),
  photo: publicUrlSchema.nullable(),
  validFrom: dia.nullable(),
  validUntil: dia.nullable(),
  countdown: z.boolean(),
  seats: z.number().int().nullable(),
  position: z.number().int(),
  package: z.object({ publicId: publicIdSchema, title: z.string() }).optional(),
});
export type TravelOffer = z.infer<typeof travelOfferSchema>;

export const INQUIRY_MESSAGE_MAX = 4000;

export const inquiryInputSchema = z
  .object({
    name: z.string().trim().min(1),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(3).optional(),
    message: z.string().max(INQUIRY_MESSAGE_MAX).optional(),
    item: z.object({ kind: z.enum(['package', 'property', 'room', 'product']), publicId: publicIdSchema }).optional(),
    context: z
      .object({ type: z.literal('travel'), departureId: z.string().optional(), adults: z.number().int().min(1).max(20), minors: z.number().int().min(0).max(10).optional(), originCity: z.string().max(120).optional(), approxDates: z.string().max(120).optional() })
      .optional(),
  })
  .refine(v => Boolean(v.email) || Boolean(v.phone), { message: 'Se requiere email o teléfono', path: ['email'] });
export type InquiryInput = z.input<typeof inquiryInputSchema>;

export const inquiryResultSchema = z.object({ received: z.literal(true), duplicate: z.boolean().optional() });
export type InquiryResult = z.infer<typeof inquiryResultSchema>;

// ---- Sobres ----
export const errorEnvelopeSchema = z.object({
  apiVersion: z.literal('v1'),
  error: z.object({ code: z.string().regex(/^KU\d{3}$/), message: z.string(), issues: z.array(z.object({ field: z.string(), message: z.string() })).optional() }),
});
export const paginationSchema = z.object({ offset: z.number().int().nonnegative(), limit: z.number().int().positive(), total: z.number().int().nonnegative(), hasMore: z.boolean() });
export type Pagination = z.infer<typeof paginationSchema>;
export const itemEnvelope = <T extends z.ZodType>(data: T) => z.object({ apiVersion: z.literal('v1'), data });
export const listEnvelope = <T extends z.ZodType>(item: T) => z.object({ apiVersion: z.literal('v1'), data: z.array(item), pagination: paginationSchema });
