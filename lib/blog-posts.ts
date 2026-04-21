export type Post = {
  slug: string
  category: string
  categoryColor: string
  title: string
  excerpt: string
  date: string
  readTime: string
  featured?: boolean
  content?: string
  iconKey?: string
  /**
   * Скрыта с сайта (не в списке /blog, не в [slug]-странице),
   * но остается в файле как эталон стиля для маркетинг-бота.
   */
  hidden?: boolean
}

export const posts: Post[] = []
