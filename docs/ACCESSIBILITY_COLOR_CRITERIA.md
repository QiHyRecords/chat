# Accessibility Color Criteria

Chat uses the WCAG AA thresholds as a release criterion. Normal text, placeholder text, and text on controls must be at least **4.5:1** against their rendered backgrounds. Large text is permitted at **3:1**, but this project targets 4.5:1 wherever practical. Meaningful control boundaries, icons, and state indicators must reach **3:1** against adjacent colors. Disabled controls retain legible text even though inactive controls are technically exempt.

The contrast measurements use the relative-luminance formula from WCAG and are reproduced by `scripts/audit-contrast.mjs`. The audit deliberately checks each semantic text color against background, surface, elevated surface, primary, and soft-accent contexts before release.

## Sources

- [WCAG 2.2 Understanding SC 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [WCAG 2.1 Understanding SC 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
