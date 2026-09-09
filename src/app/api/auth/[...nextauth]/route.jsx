import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import oauth from "@/lib/conceptninjas/oauth";

const handler = NextAuth({
    session: {
        strategy: 'jwt',
        maxAge: 1 * 24 * 60 * 60,
    },
    pages: {
        signIn: "/signin",
        error: '/signin'
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email"
                },
                password: {
                    label: "Password",
                    type: "password"
                },
                first_name: {
                    label: "First Name",
                    type: "text"
                },
                last_name: {
                    label: "Last Name",
                    type: "text"
                }
            },
            
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const response = await oauth({
                    email: credentials.email,
                    password: credentials.password,
                    first_name: credentials.first_name ?? '',
                    last_name: credentials.last_name ?? '',
                    auth_provider: 'EMAIL'
                });

                if (response.error) {
                    throw new Error(JSON.stringify(response));
                }

                return { ...response, auth_provider: 'Email' };
            }
        })
    ],
    secret: process.env.JWT_SECRET,
    callbacks: {

        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.uuid = user.uuid;
                token.name = user.name;
                token.email = user.email;
                token.image = user.image;
                token.api_token = user.api_token;
                token.auth_provider = user.auth_provider;
            }
            return token;
        },

        async session({ session, token }) {
            session.user._id = token.id;
            session.user.uuid = token.uuid;
            session.user.name = token.name;
            session.user.email = token.email;
            session.user.image = token.image;
            session.user.cn_token = token.api_token;
            session.user.auth_provider = token.auth_provider;

            return session;
        },

        async signIn({ user, account, credentials, profile }) {

            if (account.provider === "credentials") {
                return true;
            }

            if (account.provider === "google" && profile.email_verified) {

                const response = await oauth({
                    email: profile.email,
                    uuid: profile.sub,
                    first_name: profile.given_name,
                    last_name: profile.family_name,
                    image: profile.picture,
                    auth_provider: 'GOOGLE'
                });

                if (response.error) {
                    throw new Error(JSON.stringify(response));
                }

                Object.assign(user, response, { auth_provider: 'Google' });
                return true;
            }

            if (account.provider === 'facebook') {
                let name_array = profile.name.split(' ');
                let f_name = name_array[0];
                name_array.shift();
                let l_name = name_array.join(' ');

                const response = await oauth({
                    email: profile.email,
                    uuid: profile.id,
                    first_name: f_name,
                    last_name: l_name,
                    image: profile.picture?.data?.url ?? '',
                    auth_provider: 'FACEBOOK'
                });

                if (response.error) {
                    throw new Error(JSON.stringify(response));
                }

                Object.assign(user, response, {
                    image: profile.picture?.data?.url ?? '',
                    auth_provider: 'Facebook'
                });
                return true;
            }

            return false;
        }

    }
});

export { handler as GET, handler as POST }