# Neo editor

The content editor keeps a module switcher and **添加模块** button pinned at the top on desktop and mobile. Navigation stays available when the style sidebar is collapsed. Hidden modules remain selectable for editing and are marked 已隐藏.

Basic information fields keep their input, color control and actions aligned on desktop and narrow screens.

The add menu offers missing template modules and unlimited custom modules. Creating one immediately selects its editor.

Custom entries expose **字段与排版** on expansion. Each field can have its editor label renamed or be hidden from the resume without deleting its contents; body alignment is configurable. Visibility and alignment apply across all nine templates and their exports. Use the copy icon to duplicate an entry, including its content and formatting, with an independent ID.

**复制模块** creates a new custom module with independent entry IDs, field settings and colors, and selects it immediately. Entry and module copies preserve their content without sharing mutable data.

Validation: `node --test tests/custom-items.test.ts` checks storage preservation and independent formatting copies. With the development server running on port 3211, `node --test tests/neo-editor.browser.mjs` exercises creation, field customization, copying and desktop/mobile navigation in isolated browser storage. Override `TEST_BASE_URL` or `PLAYWRIGHT_EXECUTABLE_PATH` when needed.

Custom entries have a **头部布局** choice: **原版布局** retains the selected template’s original header structure, while **自由三列** uses three independent free-text slots: **内容－左 / 内容－中 / 内容－右**. The right slot accepts any text and is rendered verbatim, without date parsing. In free layout the middle slot stays centered regardless of the global subtitle setting; original layout follows the template and its subtitle settings. New entries default to free layout. Entries without a mode use original layout, including entries saved during the earlier free-layout release: switch those entries to free layout when desired. No existing data is migrated. Existing `title`, `subtitle`, `dateRange` keys, colors, labels and contents remain compatible. Long content wraps within its slot.

Each free-text slot has an independent **B** button for bold. Left content defaults to bold for compatibility; center/right default to regular. Explicit settings persist in `fieldBold` keyed by the stable `title` / `subtitle` / `dateRange` identifiers, and survive copy, undo, reload, JSON export/import and MCP edits. Rich description text continues to use the rich-text toolbar.

Markdown export also treats the right slot as plain text and preserves slot bold/hidden settings. It joins the visible slots with separators rather than applying date formatting; PDF/image/print use the selected layout from the preview; Markdown preserves content and emphasis but does not reproduce template positioning.

Custom entries can add a separator after the entry through **字段与排版 → 条目后分隔**: choose **淡线** or transparent **留白**, or **无** to remove it. The choice follows the entry when reordered or copied and is reflected in the preview and PDF/image/print output. Markdown exports visible lines as `---`; transparent space cannot be represented reliably in Markdown.

Rich-text toolbars can insert a subtle line or transparent space at the cursor. Transparent spaces are outlined only in the editor; select and delete a divider as an object. These dividers are preserved as HTML in storage and PDF/image/print output; Markdown represents a line as `---` and does not retain exact blank spacing.
