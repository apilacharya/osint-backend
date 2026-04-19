import type { Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import { notFoundError } from "../../middleware/errors.js";
import { sendSuccess } from "../../middleware/http.js";

export const getFindingById = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const finding = await prisma.finding.findFirst({
    where: {
        id,
        searchRun: {
          userId: req.authUser!.id
        }
      },
    include: {
      source: true,
      riskAssessment: true,
      entity: true,
      searchRun: {
        select: {
          id: true,
          query: true
        }
      }
    }
  });

  if (!finding) {
    throw notFoundError("Finding not found", { id });
  }

  sendSuccess(res, finding, {}, 200);
};
