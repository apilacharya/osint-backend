import { EntityType } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
const normalizeName = (name) => name.trim().toLowerCase();
export const upsertEntity = async (input) => {
    const normalizedName = normalizeName(input.name);
    return prisma.entity.upsert({
        where: { normalizedName },
        update: {
            type: input.type ?? EntityType.UNKNOWN,
            aliases: input.context?.aliases ?? [],
            location: input.context?.location ?? null,
            industry: input.context?.industry ?? null
        },
        create: {
            name: input.name,
            normalizedName,
            type: input.type ?? EntityType.UNKNOWN,
            aliases: input.context?.aliases ?? [],
            location: input.context?.location ?? null,
            industry: input.context?.industry ?? null
        }
    });
};
