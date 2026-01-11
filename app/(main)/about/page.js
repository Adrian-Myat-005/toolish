import AboutContent from "../../../components/AboutContent";
import { BackToHome } from "../../../components/BackToHome";

export const revalidate = 3600;

export default async function About() {
  // We've moved to Sanity/Translations for content
  // Passing null for settings to use the default bio in AboutContent
  return (
    <div className="container mx-auto px-4 max-w-5xl space-y-8">
      <div className="pt-8">
        <BackToHome />
      </div>
      <AboutContent settings={null} />
    </div>
  );
}
