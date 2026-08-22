# M4 Verification Audit Checklist

**Status (2026-08-23): this checklist has not been carried out.** Every box below is unticked. This is the
M4 gate ("Manual audit: 50 problems checked against the site UI. Must be 100%.") and it must be done by a
human, manually, against the live Codeforces and AtCoder UIs — it cannot be ticked from tool output alone.
It currently holds **40 rows**, where the milestone calls for **50**. Until this is run and passes with
zero disagreements, `cp_verify_solved_codeforces` / `cp_verify_solved_atcoder` are implemented and working
on spot checks, but not audited.

Please manually verify the following against the respective site UIs to ensure 100% accuracy.

## Codeforces

- [ ] 1. **tourist** on `cf:1A` -> Status: **solved**, Attempts: **1**, First AC: **2011-07-14T11:28** (Verdicts: OK)
- [ ] 2. **tourist** on `cf:4A` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 3. **tourist** on `cf:158A` -> Status: **solved**, Attempts: **1**, First AC: **2012-03-04T09:20** (Verdicts: OK)
- [ ] 4. **tourist** on `cf:71A` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 5. **tourist** on `cf:123D` -> Status: **solved**, Attempts: **1**, First AC: **2011-11-03T16:02** (Verdicts: OK)
- [ ] 6. **tourist** on `cf:9999Z` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 7. **Benq** on `cf:1A` -> Status: **solved**, Attempts: **8**, First AC: **2016-01-31T02:31** (Verdicts: OK, RUNTIME_ERROR, WRONG_ANSWER, COMPILATION_ERROR)
- [ ] 8. **Benq** on `cf:4A` -> Status: **solved**, Attempts: **11**, First AC: **2016-01-31T02:34** (Verdicts: RUNTIME_ERROR, OK, COMPILATION_ERROR, WRONG_ANSWER)
- [ ] 9. **Benq** on `cf:158A` -> Status: **solved**, Attempts: **4**, First AC: **2016-04-22T15:50** (Verdicts: OK, RUNTIME_ERROR)
- [ ] 10. **Benq** on `cf:71A` -> Status: **solved**, Attempts: **1**, First AC: **2016-02-11T15:53** (Verdicts: OK)
- [ ] 11. **Benq** on `cf:300A` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 12. **Benq** on `cf:300B` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 13. **Benq** on `cf:300C` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 14. **Benq** on `cf:300D` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 15. **jiangly** on `cf:1A` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 16. **jiangly** on `cf:4A` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 17. **jiangly** on `cf:158A` -> Status: **solved**, Attempts: **1**, First AC: **2023-04-26T16:38** (Verdicts: OK)
- [ ] 18. **jiangly** on `cf:71A` -> Status: **solved**, Attempts: **1**, First AC: **2023-04-26T08:57** (Verdicts: OK)
- [ ] 19. **jiangly** on `cf:1500A` -> Status: **solved**, Attempts: **1**, First AC: **2021-03-13T09:15** (Verdicts: OK)
- [ ] 20. **jiangly** on `cf:1500B` -> Status: **solved**, Attempts: **1**, First AC: **2021-03-13T09:34** (Verdicts: OK)
- [ ] 21. **jiangly** on `cf:1500C` -> Status: **solved**, Attempts: **1**, First AC: **2021-03-13T09:50** (Verdicts: OK)
- [ ] 22. **jiangly** on `cf:1500D` -> Status: **solved**, Attempts: **3**, First AC: **2021-03-13T10:18** (Verdicts: OK, MEMORY_LIMIT_EXCEEDED, WRONG_ANSWER)

## AtCoder

- [ ] 23. **tourist** on `ac:abc001_1` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 24. **tourist** on `ac:abc001_2` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 25. **tourist** on `ac:abc001_3` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 26. **tourist** on `ac:abc001_4` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 27. **tourist** on `ac:agc001_a` -> Status: **solved**, Attempts: **1**, First AC: **2020-01-25T17:26** (Verdicts: AC)
- [ ] 28. **tourist** on `ac:agc001_b` -> Status: **solved**, Attempts: **1**, First AC: **2020-01-25T17:41** (Verdicts: AC)
- [ ] 29. **ksn** on `ac:abc001_1` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 30. **ksn** on `ac:abc001_2` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 31. **ksn** on `ac:abc001_3` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 32. **ksn** on `ac:abc001_4` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 33. **ksn** on `ac:agc001_a` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 34. **ksn** on `ac:agc001_b` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 35. **chokudai** on `ac:abc001_1` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 36. **chokudai** on `ac:abc001_2` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 37. **chokudai** on `ac:abc001_3` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 38. **chokudai** on `ac:abc001_4` -> Status: **untouched**, Attempts: **0**, First AC: **None** (Verdicts: )
- [ ] 39. **chokudai** on `ac:agc001_a` -> Status: **solved**, Attempts: **2**, First AC: **2018-01-01T04:33** (Verdicts: WA, AC)
- [ ] 40. **chokudai** on `ac:agc001_b` -> Status: **solved**, Attempts: **1**, First AC: **2018-01-01T06:59** (Verdicts: AC)
