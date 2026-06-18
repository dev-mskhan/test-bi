import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { logger } from "../services/logger";

export function validateRequest(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      logger.info({ body: req.body }, "Request body received");
      schema.parse({
        body:   req.body,
        query:  req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        logger.warn({ body: req.body, validationError: message }, "Request validation failed");
        throw new ApiError(422, message);
      }
      throw err;
    }
  };
}