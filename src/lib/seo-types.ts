export type GeoCode = "sa" | "in" | "ae" | "global";

export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational" | "mixed";

export type KeywordResearch = {
  keyword: string;
  geo_target: string;
  monthly_volume: number | null;
  cpc: number | null;
  difficulty: number | null;
  search_intent: SearchIntent | null;
  intent_probability: number | null;
  serp_features: string[];
  paa_questions: string[];
  top_10_urls: string[];
  serp_titles: string[];
  related_keywords: RelatedKeyword[];
  trend_data: Record<string, unknown>;
  opportunity_score: number;
  /** Semantic cluster from DataForSEO discovery */
  semantic_core_keyword?: string | null;
  supporting_keywords?: string[];
  cluster_total_volume?: number | null;
  traffic_score?: number | null;
  keyword_count_in_cluster?: number | null;
  meta_title: string;
  meta_description: string;
  topic_recommendations: string[];
  content_angle: string;
  last_refreshed_at: string;
};

export type RelatedKeyword = {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  intent: SearchIntent | null;
};

export type ClusterAuthorityReport = {
  cluster_id: number;
  cluster_name: string;
  total_articles: number;
  by_status: Record<string, number>;
  researched: number;
  briefed: number;
  published: number;
  avg_opportunity: number;
  total_addressable_volume: number;
  gaps: string[];
  priority_actions: string[];
  hub_keyword: string | null;
  supporting_topics: string[];
};

export type ArticleOpportunity = {
  id: string;
  title: string;
  target_keyword: string | null;
  cluster_id: number | null;
  status: string;
  priority: string | null;
  opportunity_score: number;
  volume: number | null;
  difficulty: number | null;
  intent: SearchIntent | null;
  recommended_action: string;
  meta_title: string | null;
  meta_description: string | null;
};
