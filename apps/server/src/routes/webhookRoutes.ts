import { Router, Request, Response } from "express";
import { prisma } from "../services/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// ✅ POST /api/webhook/receive/:webhook_id
router.post(
  "/receive/:webhook_id",
  asyncHandler(async (req: Request, res: Response) => {
    const { webhook_id } = req.params as { webhook_id: string };
    const { data } = req.body;

    // User dhundo webhook_id se
    const user = await prisma.users.findFirst({
      where: { webhook_id },
    });

    if (!user) {
      throw new ApiError(404, "Invalid webhook_id");
    }

    // Business profile save karo (upsert — agar pehle se hai to update)
    const profile = await prisma.business_profiles.upsert({
      where: { user_id: user.id },
      update: {
        business_name:   data.businessName,
        business_type:   data.businessType,
        owner_name:      data.ownerName,
        email:           data.email,
        phone:           data.phone,
        city:            data.city,
        country:         data.country ?? "Pakistan",
        website:         data.website ?? null,
        employee_count:  data.employeeCount ?? null,
        annual_revenue:  data.annualRevenue ?? null,
        description:     data.description ?? null,
        services:        data.services ?? [],
        updated_at:      new Date(),
      },
      create: {
        user_id:         user.id,
        webhook_id,
        business_name:   data.businessName,
        business_type:   data.businessType,
        owner_name:      data.ownerName,
        email:           data.email,
        phone:           data.phone,
        city:            data.city,
        country:         data.country ?? "Pakistan",
        website:         data.website ?? null,
        employee_count:  data.employeeCount ?? null,
        annual_revenue:  data.annualRevenue ?? null,
        description:     data.description ?? null,
        services:        data.services ?? [],
      },
    });

    return res.json(
      new ApiResponse(200, { profileId: profile.id }, "Business profile saved"),
    );
  }),
);

router.get('/business-profile/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };
  const profile = await prisma.business_profiles.findUnique({
    where: { user_id: userId },
  });
  if (!profile) {
    throw new ApiError(404, "Business profile not found");
  }
  return res.json(new ApiResponse(200, profile, "Business profile fetched"));
}));
export default router;