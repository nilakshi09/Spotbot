import { db } from '../db/client.js'
import { users, organizations } from '../db/schema/index.js'
import { eq, or } from 'drizzle-orm'
import { businessLogger, logger } from '../utils/logger.js'
import { AppError, NotFoundError } from '../middleware/error-handler.js'

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture: string
  verified_email: boolean
}

export class GoogleOAuthService {
  async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new AppError(
        400,
        'Failed to get user info from Google',
        'GOOGLE_AUTH_FAILED'
      )
    }

    return (await response.json()) as GoogleUserInfo
  }

  async handleCallback(accessToken: string, authService: any) {
    const googleUser = await this.getGoogleUserInfo(accessToken)

    if (!googleUser.verified_email) {
      throw new AppError(
        400,
        'Your Google account email is not verified',
        'GOOGLE_EMAIL_NOT_VERIFIED'
      )
    }

    const existingUser = await db.query.users.findFirst({
      where: or(
        eq(users.googleId, googleUser.id),
        eq(users.email, googleUser.email.toLowerCase())
      ),
    })

    if (existingUser) {
      if (!existingUser.googleId) {
        await db
          .update(users)
          .set({
            googleId: googleUser.id,
            emailVerified: true,
            avatarUrl: existingUser.avatarUrl ?? googleUser.picture,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
      }

      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, existingUser.organizationId),
      })

      if (!org) throw new NotFoundError('Organization')

      const tokens = await authService.generateTokenPair(existingUser, org)

      logger.info(
        { userId: existingUser.id, googleId: googleUser.id },
        'Existing user logged in via Google'
      )

      return {
        ...tokens,
        isNewUser: false,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
        },
      }
    }

    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: `${googleUser.name}'s Workspace`,
        plan: 'free',
        scanLimit: 5,
        scansUsed: 0,
      })
      .returning()

    const [newUser] = await db
      .insert(users)
      .values({
        email: googleUser.email.toLowerCase(),
        passwordHash: '',
        name: googleUser.name,
        organizationId: newOrg.id,
        role: 'admin',
        googleId: googleUser.id,
        avatarUrl: googleUser.picture,
        emailVerified: true,
      })
      .returning()

    const tokens = await authService.generateTokenPair(newUser, newOrg)

    logger.info(
      { userId: newUser.id, googleId: googleUser.id },
      'New user created via Google OAuth'
    )

    return {
      ...tokens,
      isNewUser: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    }
  }
}

export const googleOAuthService = new GoogleOAuthService()
