import "../globals.css";
import Header from "../../components/Header";
import { ThemeProvider } from "../../components/ThemeProvider";
import { LanguageProvider } from "../../components/LanguageContext";
import { UserProvider } from "../../components/UserContext";
import { TranslationStatusOverlay } from "../../components/TranslationStatusOverlay";
import { DatabaseProvider } from "../../components/DatabaseProvider";
import { ApiProvider } from "../../components/ApiContext";

export const metadata = {
  title: "toolish",
  description: "A local-first AI-powered reading experience",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen font-sans antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DatabaseProvider>
            <UserProvider>
              <ApiProvider>
                <LanguageProvider>
                  <Header />
                  <main className="container mx-auto px-4 max-w-5xl pb-24">
                    {children}
                  </main>
                  <TranslationStatusOverlay />
                </LanguageProvider>
              </ApiProvider>
            </UserProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}