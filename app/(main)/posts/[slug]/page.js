import { getPost, getPosts } from "../../../../sanity/lib/queries";
import { urlForImage } from "../../../../sanity/lib/image";
import { PortableText } from '@portabletext/react';
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { BackToPosts } from "../../../../components/BackToPosts";
import { ReaderControl } from "../../../../components/ReaderControl";
import { PostDate } from "../../../../components/PostDate";
import { PostContent } from "./PostContent";
import { ZoomControl } from "../../../../components/ZoomControl";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function Post({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="animate-in fade-in duration-500">
      <article className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <BackToPosts />
        </div>

        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <PostDate dateString={post.publishedAt} />
          </div>
        </header>

        <ReaderControl />

        {post.videoUrl && (
          <div className="mb-12 aspect-video w-full overflow-hidden rounded-xl border bg-muted">
            <iframe
              src={`https://www.youtube.com/embed/${post.videoUrl.split('v=')[1] || post.videoUrl.split('/').pop()}`}
              title="Video player"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {!post.videoUrl && post.mainImage && (
          <div className="mb-12 relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
             <Image
                src={post.mainImage?.asset?.url ? post.mainImage.asset.url : urlForImage(post.mainImage).url()}
                alt={post.title_en || post.title || post.title_mm || "Post image"}
                fill
                className="object-cover"
                priority
              />
          </div>
        )}

        <PostContent post={post} />
      </article>
      <ZoomControl />
    </div>
  );
}