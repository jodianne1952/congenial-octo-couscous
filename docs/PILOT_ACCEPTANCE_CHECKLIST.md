# Scioto County pilot acceptance checklist

- [x] Identify official clerk records portal: https://sciotoclerk.com/online-records/
- [x] Identify clerk phone: (740) 355-8218
- [x] Add source metadata and explicit integration status
- [x] Link to official record source from app
- [ ] Confirm whether an authorized machine-readable API or feed exists
- [ ] Obtain required permissions and review data-access restrictions
- [ ] Build server-side court adapter with timeouts and rate limiting
- [ ] Verify live responses against official source records
- [ ] Test no-results, downtime, sealed cases, duplicates and stale updates
- [ ] Enable live search UI only after successful integration testing
- [ ] Add authenticated accounts and secure saved-case storage
- [ ] Add opt-in notification service and monitor delivery
- [ ] Run npm install, npm run build and end-to-end checks in a build environment

No live search, scraping, or email alerts are claimed at this stage.
