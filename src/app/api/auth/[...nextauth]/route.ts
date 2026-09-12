import NextAuth, { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'ten',
      name: 'TEN Account',
      type: 'oauth',
      wellKnown: process.env.TEN_ISSUER
        ? `${process.env.TEN_ISSUER.replace(/\/$/, '')}/.well-known/openid-configuration`
        : undefined,
      authorization: {
        params: {
          scope: 'openid profile email',
          response_type: 'code',
        },
      },
      idToken: true,
      checks: ['pkce', 'state'],
      clientId: process.env.TEN_CLIENT_ID || '',
      clientSecret: process.env.TEN_CLIENT_SECRET || '',
      profile(profile) {
        const rawUsername = profile.username || profile.preferred_username || '';
        const formattedUsername = rawUsername
          ? rawUsername.startsWith('@')
            ? rawUsername
            : `@${rawUsername}`
          : undefined;

        return {
          id: profile.sub || '',
          name: profile.name || profile.username || 'User TEN',
          username: formattedUsername,
          email: profile.email,
          image: profile.picture || profile.avatar || null,
          role: profile.role || 'user',
        };
      },
    },
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role || 'user';
      }
      if (profile) {
        const rawUsername = (profile as any).username || '';
        if (rawUsername) {
          token.username = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;
        }
        if ((profile as any).role) {
          token.role = (profile as any).role;
        }
        if ((profile as any).picture || (profile as any).avatar) {
          token.picture = (profile as any).picture || (profile as any).avatar;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = (token.role as string) || 'user';
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
