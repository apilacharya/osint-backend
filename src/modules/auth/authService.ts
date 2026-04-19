import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma.js";
import { createAppError } from "../../middleware/errors.js";
import { ERROR_CODES, ERROR_TYPES } from "../../config/constants.js";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

const toAuthUser = (user: UserRecord): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt.toISOString()
});

export const registerUser = async (input: { name: string; email: string; password: string }): Promise<AuthUser> => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });

  if (existing) {
    throw createAppError({
      message: "A user with this email already exists.",
      status: 409,
      code: ERROR_CODES.VALIDATION_ERROR,
      type: ERROR_TYPES.VALIDATION_ERROR
    });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });

  return toAuthUser(user);
};

export const loginUser = async (input: { email: string; password: string }): Promise<AuthUser> => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      createdAt: true
    }
  });

  if (!user) {
    throw createAppError({
      message: "Invalid email or password.",
      status: 401,
      code: ERROR_CODES.VALIDATION_ERROR,
      type: ERROR_TYPES.VALIDATION_ERROR
    });
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw createAppError({
      message: "Invalid email or password.",
      status: 401,
      code: ERROR_CODES.VALIDATION_ERROR,
      type: ERROR_TYPES.VALIDATION_ERROR
    });
  }

  return toAuthUser(user);
};

export const getAuthUserById = async (id: string): Promise<AuthUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });

  return user ? toAuthUser(user) : null;
};
