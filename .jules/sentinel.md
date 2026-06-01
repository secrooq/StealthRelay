## 2026-06-01 - Prevent XSS in Script Interpolation
**Vulnerability:** XSS vulnerability through unescaped `JSON.stringify()` interpolation in a `<script>` block and `innerHTML` usage.
**Learning:** Even when interpolating strings into JavaScript using `JSON.stringify()`, HTML tags like `</script>` are not escaped and can break out of the script block to execute arbitrary code. Furthermore, using `innerHTML` to display text is unsafe.
**Prevention:** Always use `textContent` over `innerHTML`. When injecting JSON into HTML script blocks, always escape `<` and `>` (e.g. `.replace(/</g, '\\u003c')`).
