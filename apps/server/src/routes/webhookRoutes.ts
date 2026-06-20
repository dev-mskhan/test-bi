import { Router, Request, Response } from "express";
import { prisma } from "../services/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Extracts {businessName: "...", email: "...", ...} from Typeform's raw payload
function parseTypeformPayload(body: any): Record<string, any> {
  const { form_response } = body;
  if (!form_response) {
    throw new ApiError(400, "Invalid Typeform payload: missing form_response");
  }

  const { definition, answers } = form_response;

  // Map field.id -> title (e.g. "9GdTX5RSsKg2" -> "businessName")
  const idToTitle: Record<string, string> = {};
  for (const field of definition.fields) {
    idToTitle[field.id] = field.title;
  }

  const data: Record<string, any> = {};

  for (const answer of answers) {
    const title = idToTitle[answer.field.id];
    if (!title) continue;

    switch (answer.type) {
      case "text":
        data[title] = answer.text;
        break;
      case "email":
        data[title] = answer.email;
        break;
      case "number":
        data[title] = answer.number;
        break;
      case "boolean":
        data[title] = answer.boolean;
        break;
      case "choice":
        data[title] = answer.choice?.label ?? null;
        break;
      case "choices":
        data[title] = answer.choices?.labels ?? [];
        break;
      default:
        data[title] = answer[answer.type] ?? null;
    }
  }

  // services comes in as a long_text string ("SEO, Web Design") — normalize to array
  if (typeof data.services === "string") {
    data.services = data.services
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  return data;
}

// ✅ POST /api/webhook/receive/:webhook_id
router.post(
  "/receive/:webhook_id",
  asyncHandler(async (req: Request, res: Response) => {
    const { webhook_id } = req.params as { webhook_id: string };
    const data = parseTypeformPayload(req.body);

    const user = await prisma.users.findFirst({
      where: { webhook_id },
    });

    if (!user) {
      throw new ApiError(404, "Invalid webhook_id");
    }

    const profile = await prisma.business_profiles.upsert({
      where: { user_id: user.id },
      update: {
        business_name:  data.businessName,
        business_type:  data.businessType,
        owner_name:     data.ownerName,
        email:          data.email,
        phone:          data.phone,
        city:           data.city,
        country:        data.country ?? "Pakistan",
        website:        data.website ?? null,
        employee_count: data.employeeCount ?? null,
        annual_revenue: data.annualRevenue ?? null,
        description:    data.description ?? null,
        services:       data.services ?? [],
        updated_at:     new Date(),
      },
      create: {
        user_id:        user.id,
        webhook_id,
        business_name:  data.businessName,
        business_type:  data.businessType,
        owner_name:     data.ownerName,
        email:          data.email,
        phone:          data.phone,
        city:           data.city,
        country:        data.country ?? "Pakistan",
        website:        data.website ?? null,
        employee_count: data.employeeCount ?? null,
        annual_revenue: data.annualRevenue ?? null,
        description:    data.description ?? null,
        services:       data.services ?? [],
      },
    });

    return res.json(
      new ApiResponse(200, { profileId: profile.id }, "Business profile saved"),
    );
  }),
);

router.get(
  "/business-profile/:userId",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const profile = await prisma.business_profiles.findUnique({
      where: { user_id: userId },
    });
    if (!profile) {
      throw new ApiError(404, "Business profile not found");
    }
    return res.json(new ApiResponse(200, profile, "Business profile fetched"));
  }),
);

export default router;