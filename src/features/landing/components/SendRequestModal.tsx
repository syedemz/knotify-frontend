/**
 * SendRequestModal — two-step confirmation modal for the Like button on
 * the Marriage-tab deck. Sits centered over the landing page and gates the
 * deck advance behind an ask → confirm → sending sequence.
 *
 * **State machine:**
 * 1. `ask`     — "Do you wish to send {name} a connection request?"
 *                 Lottie sendRequest plays. Buttons: Yes / No.
 * 2. `confirm` — "CONFIRM?" with the same Lottie still playing. Yes / No.
 * 3. `sending` — Lottie swaps to pleasewait for ~1 s; buttons hidden;
 *                 timer fires `onConfirmed()` at the end.
 *
 * Either No at any step calls `onCancel()` (modal dismisses, no state
 * change on the parent). Only the full ask→confirm→sending path calls
 * `onConfirmed()`, at which point the parent triggers the deck advance.
 *
 * **Theme coloring:** Lottie `colorFilters` retint the letter-mask fills
 * and the button background to `theme.colors.accent.primary` so the
 * animation matches the brand rather than the source cyan/teal.
 *
 * @module features/landing/components/SendRequestModal
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';

import { Row, Heading, Text, Button } from '@/components';
import { t } from '@/labels';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';

// ── Lottie sources ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SEND_REQUEST_ANIM = require('@/assets/animations/sendRequest.json');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLEASE_WAIT_ANIM = require('@/assets/animations/pleasewait.json');

// ── Constants ─────────────────────────────────────────────────────────────────

/** Duration to hold on the `sending` step before firing `onConfirmed` (ms). */
const SENDING_HOLD_MS = 1000;

/** Fraction of screen width the modal card fills. Height is content-driven
 *  with a `MAX_HEIGHT_FRACTION` cap so the card never dominates the screen. */
const MODAL_WIDTH_FRACTION = 0.85;
const MODAL_MAX_HEIGHT_FRACTION = 0.6;

/** Fixed pixel size of the Lottie block at the top of the card. */
const LOTTIE_SIZE = 140;

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalStep = 'ask' | 'confirm' | 'sending';

export interface SendRequestModalProps {
  /** Whether the modal is currently visible. */
  readonly visible: boolean;
  /** Full name of the target friend — interpolated into the ask question. */
  readonly targetName: string;
  /**
   * Called when the user cancels (No at any step) OR after `onConfirmed` has
   * fired and the modal should dismiss. The parent uses this to flip its
   * `visible` prop back to `false`.
   */
  readonly onCancel: () => void;
  /**
   * Called at the end of the `sending` step, after the pleasewait animation
   * has played for `SENDING_HOLD_MS`. The parent uses this to trigger the
   * deck advance + friend-request-sent snackbar. `onCancel` will also fire
   * immediately after so the modal dismisses in the same frame.
   */
  readonly onConfirmed: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SendRequestModal({
  visible,
  targetName,
  onCancel,
  onConfirmed,
}: SendRequestModalProps): React.ReactElement {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const styles = useMemo(
    () => createStyles(theme, screenWidth, screenHeight),
    [theme, screenWidth, screenHeight],
  );

  const [step, setStep] = useState<ModalStep>('ask');

  // Reset to the first step whenever `visible` changes — on open (so a
  // re-open starts fresh) AND on close (so a lingering `step === 'sending'`
  // can't re-fire the send-timer effect when parent-provided callbacks
  // change identity). Without the on-close reset, the sending useEffect
  // below would re-fire every time `onConfirmed` gets a new identity
  // (which happens whenever the parent's deck index changes during the
  // slide-out animation), scheduling another setTimeout that then fires
  // another `onConfirmed()` — an infinite advance loop.
  useEffect(() => {
    setStep('ask');
  }, [visible]);

  // On the sending step, hold for SENDING_HOLD_MS then fire onConfirmed + onCancel.
  useEffect(() => {
    if (step !== 'sending') return;
    const timer = setTimeout(() => {
      onConfirmed();
      onCancel();
    }, SENDING_HOLD_MS);
    return () => clearTimeout(timer);
  }, [step, onConfirmed, onCancel]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleYesAsk = useCallback(() => setStep('confirm'), []);
  const handleYesConfirm = useCallback(() => setStep('sending'), []);
  const handleNo = useCallback(() => onCancel(), [onCancel]);

  // ── Retint the Lottie layers to brand-primary. Layer keypaths were derived
  //    by inspecting the JSON (letter masks + Button). Colors in the source
  //    JSON are cyan/teal; overriding with theme.colors.accent.primary makes
  //    the animation read as brand pink regardless of theme mode.
  const brandColor = theme.colors.accent.primary;
  const sendRequestColorFilters = useMemo(
    () => [
      { keypath: 'Mask D', color: brandColor },
      { keypath: 'Mask N', color: brandColor },
      { keypath: 'Mask E', color: brandColor },
      { keypath: 'Mask S', color: brandColor },
      { keypath: 'Mask Arrow In', color: brandColor },
      { keypath: 'Mask Arrow Out', color: brandColor },
      { keypath: 'Button', color: brandColor },
    ],
    [brandColor],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  const questionText =
    step === 'confirm'
      ? t('landing.request.confirmDouble')
      : t('landing.request.confirmQuestion').replace('{name}', targetName);
  const showButtons = step !== 'sending';
  const lottieSource = step === 'sending' ? PLEASE_WAIT_ANIM : SEND_REQUEST_ANIM;
  const lottieFilters = step === 'sending' ? undefined : sendRequestColorFilters;

  // Runtime text override for the pleasewait animation — the JSON ships
  // with "Please wait..." baked in; swap to "Sending Request" via Lottie's
  // per-platform text filter APIs. Only applied during the sending step.
  const sendingText = t('landing.request.sending');
  const sendingTextFiltersAndroid = useMemo(
    () => [{ find: 'Please wait...', replace: sendingText }],
    [sendingText],
  );
  const sendingTextFiltersIOS = useMemo(
    () => [{ keypath: 'Please wait..', text: sendingText }],
    [sendingText],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleNo}
      statusBarTranslucent
    >
      {/* Backdrop — dims the underlying screen. Tapping it dismisses the
          modal (same as No). */}
      <Pressable
        style={styles.backdrop}
        onPress={handleNo}
        testID="send-request-backdrop"
      >
        {/* Card — swallow presses so tapping inside doesn't dismiss. */}
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation?.()}
          testID="send-request-card"
        >
          {/* Lottie at the top, compact fixed size */}
          <View style={styles.lottieWrapper}>
            <LottieView
              key={step === 'sending' ? 'sending' : 'ask'}
              source={lottieSource}
              autoPlay
              loop
              style={styles.lottie}
              colorFilters={lottieFilters}
              textFiltersAndroid={
                step === 'sending' ? sendingTextFiltersAndroid : undefined
              }
              textFiltersIOS={
                step === 'sending' ? sendingTextFiltersIOS : undefined
              }
              testID={
                step === 'sending' ? 'send-request-lottie-wait' : 'send-request-lottie-send'
              }
            />
          </View>

          {/* Question text — larger + bolder now that the card is compact */}
          <View style={styles.textBlock}>
            {step === 'confirm' ? (
              <Heading variant="heading.lg" color="primary" align="center">
                {questionText}
              </Heading>
            ) : (
              <Heading variant="heading.md" color="primary" align="center">
                {questionText}
              </Heading>
            )}
          </View>

          {showButtons && (
            <View style={styles.buttonRow}>
              <Row gap="lg" justify="center">
                <Button
                  label={t('landing.request.yes')}
                  variant="primary"
                  size="md"
                  fullWidth={false}
                  onPress={step === 'confirm' ? handleYesConfirm : handleYesAsk}
                  testID={
                    step === 'confirm'
                      ? 'send-request-yes-confirm'
                      : 'send-request-yes-ask'
                  }
                />
                <Button
                  label={t('landing.request.no')}
                  variant="ghost"
                  size="md"
                  fullWidth={false}
                  onPress={handleNo}
                  testID={
                    step === 'confirm'
                      ? 'send-request-no-confirm'
                      : 'send-request-no-ask'
                  }
                />
              </Row>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme, screenWidth: number, screenHeight: number) {
  const cardWidth = screenWidth * MODAL_WIDTH_FRACTION;
  const cardMaxHeight = screenHeight * MODAL_MAX_HEIGHT_FRACTION;
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      width: cardWidth,
      maxHeight: cardMaxHeight,
      // Height is driven by content — Lottie + text + buttons stack tight
      // rather than spreading across a fixed-height card.
      backgroundColor: theme.colors.bg.primary,
      borderRadius: theme.radii.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      alignItems: 'center',
      ...theme.shadows.lg,
    },
    lottieWrapper: {
      width: LOTTIE_SIZE,
      height: LOTTIE_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    lottie: {
      width: LOTTIE_SIZE,
      height: LOTTIE_SIZE,
    },
    textBlock: {
      width: '100%',
      paddingHorizontal: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    buttonRow: {
      width: '100%',
    },
  });
}
