-- The search funnel's daily rollup (TASKS §20 `search-funnel`): every fetch
-- tick's counters summed per UTC day, kept after the runs are pruned at 90
-- days. The keys are src/funnel.ts:FUNNEL_KEYS (funnel.test.ts holds the list
-- below to it).
CREATE TABLE "funnel_day" (
    "day" DATE NOT NULL,
    "counts" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_day_pkey" PRIMARY KEY ("day")
);

-- The days the stored runs still cover. A run's startedAt is UTC. The reason
-- counters (rejected*, dismissed*) start with this release, so a backfilled
-- day carries the totals only; `matched` is derived as what was scored and
-- not dismissed, which is what it counts from now on. A run cut short (paused
-- mid-run, every search blank) adds only what it delivered, as
-- src/funnel.ts:runCounts does for the runs to come.
WITH "runs" AS MATERIALIZED (
    SELECT "startedAt"::date AS "day", "stats",
        ("stats" ->> 'reason' IS NOT DISTINCT FROM 'paused-mid-run'
         OR "stats" ->> 'abortedMidRun' IS NOT DISTINCT FROM '1'
         OR "stats" ->> 'skippedBlankProfile' IS NOT DISTINCT FROM '1') AS "cutShort"
    FROM "cron_run"
    WHERE "name" IN ('fetch', 'fetch-now', 'hn-hiring')
      AND "status" = 'OK'
      AND jsonb_typeof("stats") = 'object'
), "counts" AS (
    SELECT r."day", kv."key", CASE WHEN jsonb_typeof(kv."value") = 'number' THEN (kv."value" #>> '{}')::numeric ELSE 0 END AS "value"
    FROM "runs" r, jsonb_each(r."stats") kv
    WHERE kv."key" IN ('fetched', 'filterRejected', 'rejectedTitle', 'rejectedExcluded', 'rejectedWorkplace', 'rejectedPlace', 'duplicate', 'preFiltered', 'classified', 'classifyFailed', 'dismissed', 'dismissedLowFit', 'dismissedLocation', 'dismissedSalary', 'matched', 'alerted', 'heldDelivered', 'alertHeld', 'alertsOffHeld', 'alertFailed')
      AND (NOT r."cutShort" OR kv."key" IN ('alerted', 'heldDelivered'))
    UNION ALL
    SELECT r."day", 'matched', greatest(
        CASE WHEN jsonb_typeof(r."stats" -> 'classified') = 'number' THEN (r."stats" ->> 'classified')::numeric ELSE 0 END
        - CASE WHEN jsonb_typeof(r."stats" -> 'dismissed') = 'number' THEN (r."stats" ->> 'dismissed')::numeric ELSE 0 END,
        0)
    FROM "runs" r
    WHERE NOT (r."stats" ? 'matched') AND NOT r."cutShort"
)
INSERT INTO "funnel_day" ("day", "counts", "updatedAt")
SELECT t."day", jsonb_object_agg(t."key", t."total"), now()
FROM (
    SELECT "day", "key", sum("value") AS "total"
    FROM "counts"
    GROUP BY 1, 2
    HAVING sum("value") > 0
) t
GROUP BY t."day";
