# Changelog

## 0.1.0 - 2026-02-25
- Move SmartContent/ContentRenderer to core and keep re-exports.
- Add async translation flows for MultilingualString and MultilingualSmartContent (text/markdown translate & cache; SVG/binary no translation).
- SmartContent: auto fetch & format inference for http/https/file/data/ftp; add SVG/Markdown tests.
- Tests: full coverage for SmartContent, MultilingualString, MultilingualSmartContent; optional Google translate integration via `ALLOW_NET_TRANSLATION=1`.
- Docs: English README plus Traditional/Simplified Chinese docs; updated examples with missing-language translation and smart content demos.
