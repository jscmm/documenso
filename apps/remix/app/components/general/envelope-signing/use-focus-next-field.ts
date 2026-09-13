import { useCurrentEnvelopeRender } from '@documenso/lib/client-only/providers/envelope-render-provider';
import { PDF_VIEWER_CONTENT_SELECTOR } from '@documenso/lib/constants/pdf-viewer';
import { useCallback, useEffect, useRef } from 'react';

import { useRequiredEnvelopeSigningContext } from '../document-signing/envelope-signing-provider';

export type FocusNextFieldOptions = {
  /**
   * A field to skip when picking the next one, typically the field that was
   * just signed but whose local state has not re-rendered yet.
   */
  excludeFieldId?: number;
};

/**
 * Returns a function that moves the signer to the next remaining required
 * field: switches envelope item when needed, shows the pending field tooltip
 * and scrolls it into view. When nothing remains the tooltip is hidden.
 *
 * Safe to call from long-lived closures such as canvas event handlers since
 * it reads the latest state through refs.
 */
export const useFocusNextField = () => {
  const { recipientFieldsRemaining, setShowPendingFieldTooltip } = useRequiredEnvelopeSigningContext();
  const { currentEnvelopeItem, setCurrentEnvelopeItem } = useCurrentEnvelopeRender();

  const latest = useRef({ recipientFieldsRemaining, currentEnvelopeItemId: currentEnvelopeItem?.id });

  useEffect(() => {
    latest.current = { recipientFieldsRemaining, currentEnvelopeItemId: currentEnvelopeItem?.id };
  }, [recipientFieldsRemaining, currentEnvelopeItem?.id]);

  return useCallback(
    ({ excludeFieldId }: FocusNextFieldOptions = {}) => {
      const { recipientFieldsRemaining, currentEnvelopeItemId } = latest.current;

      const nextField = recipientFieldsRemaining.find((field) => field.id !== excludeFieldId);

      if (!nextField) {
        setShowPendingFieldTooltip(false);
        return;
      }

      const isEnvelopeItemSwitch = nextField.envelopeItemId !== currentEnvelopeItemId;

      if (isEnvelopeItemSwitch) {
        setCurrentEnvelopeItem(nextField.envelopeItemId);
      }

      setShowPendingFieldTooltip(true);

      setTimeout(
        () => {
          const fieldTooltip = document.querySelector(`#field-tooltip`);

          if (fieldTooltip) {
            fieldTooltip.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // Tooltip not in DOM (page virtualized away) — signal the PDF viewer
            // to scroll to the correct page via the data attribute.
            const pdfContent = document.querySelector(PDF_VIEWER_CONTENT_SELECTOR);

            if (pdfContent) {
              pdfContent.setAttribute('data-scroll-to-page', String(nextField.page));
            }
          }
        },
        isEnvelopeItemSwitch ? 150 : 50,
      );
    },
    [setShowPendingFieldTooltip, setCurrentEnvelopeItem],
  );
};
