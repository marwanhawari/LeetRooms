import { SERVER_URL } from "../../config";
import { AuthProvider } from "../../types/AuthProvider";

async function signIn(authProviderEndpoint: string) {
    window.open(`${SERVER_URL}/${authProviderEndpoint}`);
}

export default function SignInButton({
    authProvider,
}: {
    authProvider: AuthProvider;
}) {
    function handleSignIn() {
        signIn(authProvider.authProviderEndpoint);
    }

    return (
        <button
            className={`rounded-md transition-all ${authProvider.color} ${authProvider.hoverColor} flex w-60 flex-row items-center justify-center gap-x-4 py-2.5 text-white`}
            onClick={handleSignIn}
        >
            <img
                className="h-6 w-6"
                src={authProvider.icon}
                alt={`Sign in with ${authProvider.name}`}
            />
            <div className="font-semibold">
                Sign in with {authProvider.name}
            </div>
        </button>
    );
}
