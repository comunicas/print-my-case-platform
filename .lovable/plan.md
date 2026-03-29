

## Fix: Cross-PDV Deduplication Not Working

### Root Cause

The edge function `process-spreadsheet` was **not redeployed** after the deduplication code was added. Evidence:
- Re-processing the Boulevard spreadsheet targeting Tietê inserted 84 duplicate records
- Edge function logs show NO dedup-related console.log messages, confirming the deployed version lacks the dedup code
- The code in `supabase/functions/process-spreadsheet/index.ts` is correct — it just wasn't deployed

### Fix Steps

**1. Clean up the 84 duplicate records (SQL migration)**
Delete the records that were just re-inserted into Tietê with `device_id = '1001013'`:
```sql
DELETE FROM sales_records
WHERE pdv_id = 'b2c3d4e5-f6a7-8901-bcde-f23456789012'
  AND device_id = '1001013'
  AND source = 'spreadsheet';
```

**2. Redeploy the edge function**
Force redeploy `process-spreadsheet` to ensure the cross-PDV dedup code is live.

**3. Retest**
Call the edge function again with the same Boulevard upload targeting Tietê and verify:
- 0 records inserted (all 84 should be skipped as duplicates)
- Logs show dedup messages
- Total records in Tietê remain at 987 (only device `1001543`)

### No code changes needed
The code is already correct. This is a deployment + data cleanup issue only.

