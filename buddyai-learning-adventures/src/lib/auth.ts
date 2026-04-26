import {
  initDatabase,
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  type User,
} from "./db";

const AUTH_KEY = "buddyai_auth";
const SESSION_EXPIRY_DAYS = 30;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computed = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === hash;
}

export async function initAuth(): Promise<void> {
  await initDatabase();
}

export async function signup(
  email: string,
  password: string,
  name: string,
  grade: string
): Promise<{ user: User; session: AuthSession }> {
  await initAuth();

  const existing = getUserByEmail(email);
  if (existing) {
    throw new Error("Email already exists");
  }

  const passwordHash = await hashPassword(password);
  const user = createUser(email, passwordHash, name, grade);

  const session = createSession(user);
  return { user, session };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; session: AuthSession }> {
  await initAuth();

  const user = getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordHash = await hashPassword(password);
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  const session = createSession(user);
  return { user, session };
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  grade: string;
  expiresAt: string;
}

export function createSession(user: User): AuthSession {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    grade: user.grade,
    expiresAt: expiresAt.toISOString(),
  };

  saveSession(session);
  return session;
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return null;

  try {
    const session = JSON.parse(data) as AuthSession;
    if (new Date(session.expiresAt) < new Date()) {
      logout();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getCurrentUser(): User | null {
  const session = getSession();
  if (!session) return null;
  return getUserById(session.userId) ?? null;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export async function updateProfile(
  userId: string,
  updates: { name?: string; grade?: string }
): Promise<User> {
  const user = updateUser(userId, updates);
  if (!user) {
    throw new Error("User not found");
  }

  const session = getSession();
  if (session && session.userId === userId) {
    saveSession({
      ...session,
      name: user.name,
      grade: user.grade,
    });
  }

  return user;
}