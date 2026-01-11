import { groq } from 'next-sanity'
import { client } from './client'

const mockPosts = [
  {
    _id: 'mock-1',
    title_en: 'The Future of Minimalist Design',
    title_mm: 'အနိမ့်ဆုံးဒီဇိုင်း၏ အနာဂတ်',
    slug: 'future-minimalist-design',
    publishedAt: new Date().toISOString(),
    excerpt_en: 'Exploring the intersection of aesthetics and functionality in modern web interfaces.',
    excerpt_mm: 'ခေတ်မီဝဘ်မျက်နှာပြင်များတွင် အလှအပနှင့် လုပ်ဆောင်နိုင်စွမ်းတို့၏ ဆုံမှတ်ကို ရှာဖွေခြင်း။',
    body_en: [{ _type: 'block', children: [{ _type: 'span', text: 'Minimalism is not just about less...' }] }],
    body_mm: [{ _type: 'block', children: [{ _type: 'span', text: 'ရိုးရှင်းမှုဆိုသည်မှာ နည်းပါးခြင်းသက်သက်မဟုတ်ပါ။' }] }],
    videoUrl: null,
    mainImage: {
      asset: {
        url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1000&q=80",
        metadata: {
          palette: {
            dominant: { background: '#5D7C89' }
          }
        }
      }
    }
  },
  {
    _id: 'mock-2',
    title_en: 'Building with Next.js and Sanity',
    title_mm: 'Next.js နှင့် Sanity ဖြင့် တည်ဆောက်ခြင်း',
    slug: 'building-nextjs-sanity',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    excerpt_en: 'A comprehensive guide to setting up a headless CMS with the latest Next.js features.',
    excerpt_mm: 'နောက်ဆုံးပေါ် Next.js လုပ်ဆောင်ချက်များဖြင့် headless CMS ကို စနစ်တကျ ပြင်ဆင်ခြင်း။',
    body_en: [{ _type: 'block', children: [{ _type: 'span', text: 'Start by installing the Next.js CLI...' }] }],
    body_mm: [{ _type: 'block', children: [{ _type: 'span', text: 'Next.js CLI ကို စတင် ထည့်သွင်းပါ။' }] }],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    mainImage: null
  }
];

export async function getPosts() {
  try {
    return await client.fetch(
      groq`*[_type == "post"] | order(publishedAt desc) {
        _id,
        _updatedAt,
        title,
        title_en,
        title_mm,
        "slug": slug.current,
        mainImage {
          ...,
          asset->{
            ...,
            metadata
          }
        },
        publishedAt,
        body,
        body_en,
        body_mm,
        excerpt,
        excerpt_en,
        excerpt_mm,
        videoUrl
      }`,
      {},
      { next: { revalidate: 60 } }
    );
  } catch (error) {
    console.warn("API Fetch Failed (Network Error). Returning mock data for UI development.", error);
    return mockPosts;
  }
}

export async function getPost(slug: string) {
  try {
    return await client.fetch(
      groq`*[_type == "post" && slug.current == $slug][0] {
        _id,
        _updatedAt,
        title,
        title_en,
        title_mm,
        "slug": slug.current,
        mainImage {
          ...,
          asset->{
            ...,
            metadata
          }
        },
        publishedAt,
        body,
        body_en,
        body_mm,
        excerpt,
        excerpt_en,
        excerpt_mm,
        videoUrl
      }`,
      { slug },
      { next: { revalidate: 60 } }
    );
  } catch (error) {
    console.warn("API Fetch Failed (Network Error). Returning mock data for UI development.", error);
    return mockPosts.find(p => p.slug === slug) || mockPosts[0];
  }
}
