# Bracket Troubleshooting Guide

## Issue: Quarter Final Matches Not Showing After Assignment

### Step 1: Check Current Tournament State
Visit: `/api/tournament/debug`

Look for:
- `groupStageStatus.allCompleted` should be `true`
- `tournamentStage.knockoutGenerated` should be `true` after assignment
- `knockoutMatches.quarterFinalsCount` should be `4` after assignment

### Step 2: Common Issues & Solutions

#### If Group Stage Not Completed:
```
"groupStageStatus.allCompleted": false
"groupStageStatus.incomplete": X (where X > 0)
```
**Solution**: Complete group stage matches first
- Admin Dashboard → "Fill Group Results" button
- This completes all 18 group stage matches with predefined results

#### If Assignment Failed Silently:
```
"tournamentStage.knockoutGenerated": false
"knockoutMatches.quarterFinalsCount": 0
```
**Solution**: Re-attempt assignment
- Admin Dashboard → Quarter Final Assignment
- Check browser console for error messages
- Ensure exactly 8 teams are selected

#### If Flag Set But No Matches:
```
"tournamentStage.knockoutGenerated": true
"knockoutMatches.quarterFinalsCount": 0
```
**Solution**: Database inconsistency - contact admin

### Step 3: Force Refresh
After any fixes:
1. Click "Refresh Bracket" button on bracket page
2. Or refresh entire browser page
3. Check `/api/tournament/debug` again to verify

### Step 4: Verify Bracket Display
The bracket should show:
- Quarter final placeholder cards if assignment pending
- Actual team matchups if assignment completed
- Tournament progress indicators should show "Generated"

## Manual Database Check (Advanced)
If needed, verify database directly:
```sql
-- Check tournament stage
SELECT * FROM tournament_stages;

-- Check knockout matches  
SELECT * FROM matches WHERE "matchType" = 'KNOCKOUT';

-- Check group stage completion
SELECT COUNT(*) FROM matches 
WHERE "matchType" = 'GROUP_STAGE' AND status != 'COMPLETED';
```
