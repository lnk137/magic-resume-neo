# Resume text colors

The style panel offers six defaults: body, name, section headings, item titles, subtitles, and dates. Each plain-text editor field and each module heading also has a small paintbrush control. A field override takes precedence over its default; Restore default removes the override. Rich-text toolbar colors apply to selected words and retain priority over the body default. Imported text colors on bold, links or paragraphs are displayed in the editor and preserved when editing.

The shared palette supports keyboard-operable saturation/hue controls, curated swatches, exact six-digit HEX, eight recent colors, reset, and a contrast preview against white paper. Partial or invalid HEX input stays local and never enters resume data. Recent colors are stored locally and are optional if browser storage is unavailable. The presentation follows Adobe Spectrum's color-area/field pattern and Radix's text contrast guidance:

- https://spectrum.adobe.com/page/color-area/
- https://opensource.adobe.com/spectrum-web-components/components/color-field/
- https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale

## Data and integrations

Colors live in optional `globalSettings.textColors` and `globalSettings.fieldColors`; old resumes retain their template's original colors. Accepted values are `#RRGGBB`. Invalid values fall back to the default/template style.

`textColors` keys: `body`, `name`, `section`, `title`, `subtitle`, `date`.

Field overrides use stable IDs rather than array positions:

| Content | Field key |
| --- | --- |
| Basic name/title/contact fields | `basic.<field>` |
| Basic custom field | `basic.customFields.<fieldId>` |
| Module heading | `sections.<sectionId>.title` |
| Education | `education.<id>.school`, `.major`, `.degree`, `.gpa`, `.date`, `.description` |
| Experience | `experience.<id>.company`, `.position`, `.date`, `.details` |
| Project | `projects.<id>.name`, `.role`, `.date`, `.linkLabel`, `.description` |
| Publication | `publications.<id>.title`, `.authors`, `.venue`, `.date`, `.status`, `.link`, `.description` |
| Custom entry | `customData.<sectionId>.<id>.title`, `.subtitle`, `.dateRange`, `.description` |
| Single rich-text sections | `skillContent`, `selfEvaluationContent` |

Education dates share the rendered date-range color. Rich-text HTML retains selected-word colors. Module duplication remaps custom-entry and heading override IDs. Switching a custom entry between original and free layouts retains its field color paths.

All nine templates use the same `ResumeText` resolver. PDF/image/print export clones the styled resume DOM; JSON export/import retains the optional color maps. Normal resume history and local persistence apply to color edits.

## Validation

Run `pnpm exec tsx --test tests/text-colors.test.ts` for fallback, validation, and contrast tests. With the Vite server running, run `PREVIEW_TEST_URL=http://127.0.0.1:3211 node --test tests/text-colors.browser.mjs`. Set `BROWSER_CHANNEL` if Chrome is unavailable. Browser coverage checks all nine templates, plain-field precedence, description bodies, selected rich-text marks, print/PDF clone styling, JSON download, invalid HEX, undo, reload, and the palette at 390px viewport width. Set `COLOR_SCREENSHOT_DIR` to an existing scratch directory to save review screenshots.
