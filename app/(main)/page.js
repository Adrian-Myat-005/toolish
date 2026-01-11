import { HomeContent } from "../../components/HomeContent";
import { getPosts } from "../../sanity/lib/queries";

export default async function Home() {
  const posts = await getPosts();
  return <HomeContent posts={posts} />;
}
