import { Router, Request, Response } from "express";
import axios, { AxiosError } from "axios";
import { BusinessFormPayload, MainServerPayload } from "../types";

const router = Router();

// ✅ POST /api/form/submit
router.post("/submit", async (req: Request, res: Response) => {
  try {
    const {
      businessName,
      businessType,
      ownerName,
      email,
      phone,
      city,
      country,
      website,
      employeeCount,    
      annualRevenue,
      description,
      services,
      webhook_url,
    } = req.body as BusinessFormPayload;

    // Required fields check
    if (
      !webhook_url ||
      !businessName ||
      !businessType ||
      !ownerName ||
      !email ||
      !phone ||
      !city
    ) {
      res.status(400).json({
        success: false,
        message: "webhook_url and other fields are required",
      });
      return;
    }

    const payload: MainServerPayload = {
      data: {
        businessName,
        businessType,
        ownerName,
        email,
        phone,
        city,
        country: country || "Pakistan",
        website: website || null,
        employeeCount: employeeCount ? parseInt(employeeCount, 10) : null,
        annualRevenue: annualRevenue || null,
        description: description || null,
        services: services
          ? services
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      },
    };

    // ✅ Main server pe bhejo
    const response = await axios.post(
      `${webhook_url}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    res.json({
      success: true,
      message: "Business profile successfully save ho gaya!",
      data: response.data,
    });
  } catch (error) {
    const axiosErr = error as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;
    const msg =
      axiosErr.response?.data?.message || axiosErr.message || "Unknown error";

    res.status(400).json({
      success: false,
      message: `Main server error: ${msg}`,
      webhookStatus: status ?? "no response",
    });
  }
});

export default router;