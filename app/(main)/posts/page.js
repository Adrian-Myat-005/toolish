import { getPosts } from "../../../sanity/lib/queries";
import { PostFeed } from "../../../components/PostFeed";
import { HomeHeader } from "../../../components/HomeHeader";
import { NoPosts } from "../../../components/NoPosts";
import { BackToHome } from "../../../components/BackToHome";

export default async function PostsPage() {
  const posts = await getPosts();
  
  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <section className="space-y-8">
        <div className="pt-8">
          <BackToHome />
        </div>
        <HomeHeader title="Latest Stories" description="" />
        
        <PostFeed posts={posts} />
        
        {posts.length === 0 && <NoPosts />}
      </section>
    </div>
  );
}
