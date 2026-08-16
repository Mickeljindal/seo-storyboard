-- PENDING INTERNAL LINKS — the deferred-link ledger.
--
-- Articles link to each other but go live at different times. A link whose
-- target is not published yet is a 404 for readers and a wasted crawl. At
-- publish time we keep links whose target is live, strip the ones whose target
-- is not (leaving the anchor words as plain text), and record a row here. When
-- the target is later published, the healer turns those words into real links
-- inside the already-published source posts.
--
-- Keyed by slug, not post id: a row can exist before either side has a
-- WordPress post, and slugs are the stable identity across the engine, the
-- files on disk, and the live site.
--
-- Idempotent, additive. Safe to re-run.

CREATE TABLE IF NOT EXISTS pending_internal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_slug text NOT NULL,                      -- article the link lives in
  target_slug text NOT NULL,                    -- article it should point at
  anchor_text text NOT NULL,                    -- exact words to turn into a link
  status text NOT NULL DEFAULT 'pending',       -- pending | applied | skipped | stale
  attempts integer DEFAULT 0,                   -- failure guard, stops infinite retries
  last_attempt_at timestamptz,
  applied_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The healer's hot path: "who is waiting for this slug to go live?"
CREATE INDEX IF NOT EXISTS idx_pending_links_target_status
  ON pending_internal_links(target_slug, status);

-- Reporting and cleanup by source article.
CREATE INDEX IF NOT EXISTS idx_pending_links_from
  ON pending_internal_links(from_slug);

CREATE INDEX IF NOT EXISTS idx_pending_links_status
  ON pending_internal_links(status);

-- One pending row per (source, target, anchor). Re-publishing an article must
-- not pile up duplicate work, and the healer must not insert the same link
-- twice. Partial unique index so resolved rows keep their history.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_links_triple
  ON pending_internal_links(from_slug, target_slug, anchor_text)
  WHERE status = 'pending';
