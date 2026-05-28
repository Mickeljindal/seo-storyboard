DELETE FROM public.content_briefs WHERE article_id IN (SELECT id FROM public.articles WHERE cluster_id IS NULL);
DELETE FROM public.articles WHERE cluster_id IS NULL;