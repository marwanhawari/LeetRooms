export default function CookiesWarning() {
    return (
        <div className="flex h-screen flex-col items-center border-y-8 border-r-8 border-lc-border-light bg-lc-bg-light p-2 text-sm text-lc-text-light dark:border-lc-border dark:bg-lc-bg dark:text-white">
            <div className="text-center text-xl font-semibold text-yellow-400">
                ⚠️ Third-party cookies are disabled
            </div>
            <div className="mt-10 flex grow flex-col gap-2 px-4">
                LeetRooms only works if you enable third-party cookies. To
                enable third-party cookies:
                <ul className="list-inside list-decimal">
                    <li>Go to chrome://settings/cookies</li>
                    <li>
                        Under "General Settings", select "Block third-party
                        cookies in Incognito"
                    </li>
                    <li>Refresh this page</li>
                </ul>
            </div>
            <div className="px-4 text-center text-xs">
                LeetRooms uses cookies to manage your login session.
            </div>
        </div>
    );
}
