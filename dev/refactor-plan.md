# Refactoring Plan

1. ~~Rename op() -> resolve()~~
2. ~~Remove the `async` keyword~~
3. Re-implement the templates plugin
4. ~~Analyze all parse elements for inconsistencies (all should implement `resolve()` if at all possible)~~
5. ~~Remove all stand-alone functions in the project, encapsulating them in classes~~
6. ~~Move all anonymous parse elements to named classes~~
7. ~~Clean up core~~
8. ~~Clean up registration of parse elements by organizing by type~~
9. ~~Standardize extension registration~~
10. ~~Tokenizer cleanup~~
11. ~~Remove all kernel data structure mutations in favor of structured registration~~
12. ~~Rework how assignment works (should defer to the elements themselves)~~
13. ~~Move debug into core~~
14. ~~Check for any IE/ye olde API usages~~
15. ~~Update platform scripts~~
16. ~~Cleanup sweep~~
17. ~~Clean up testing infrastructure~~
18. Clean up dist
17. Update documents/site