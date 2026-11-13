import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { Button, ButtonVariant } from './Button';

export type ModalVariant = 'center' | 'fullscreen' | 'bottom';

export interface ModalAction {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  variant?: ModalVariant;
  children?: React.ReactNode;
  actions?: ModalAction[];
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  animationType?: 'fade' | 'slide' | 'none';
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  maxWidth?: number;
  testID?: string;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  variant = 'center',
  children,
  actions,
  footer,
  showCloseButton = true,
  closeOnBackdropPress = true,
  animationType = 'fade',
  style,
  contentStyle,
  titleStyle,
  maxWidth = 500,
  testID,
}) => {
  const isFullScreen = variant === 'fullscreen';
  const isBottom = variant === 'bottom';

  return (
    <RNModal
      animationType={animationType}
      hardwareAccelerated
      onRequestClose={onClose}
      statusBarTranslucent
      transparent={!isFullScreen}
      visible={visible}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback
          disabled={!closeOnBackdropPress}
          onPress={onClose}
        >
          <View
            style={[
              styles.backdrop,
              isFullScreen && styles.backdropFullScreen,
              isBottom && styles.backdropBottom,
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.card,
                  styles[`card_${variant}`],
                  !isFullScreen && { maxWidth },
                  style,
                ]}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <View style={styles.header}>
                    <View style={styles.titleColumn}>
                      {typeof title === 'string' ? (
                        <Text numberOfLines={1} style={[styles.title, titleStyle]}>
                          {title}
                        </Text>
                      ) : (
                        title
                      )}
                      {typeof subtitle === 'string' ? (
                        <Text numberOfLines={2} style={styles.subtitle}>
                          {subtitle}
                        </Text>
                      ) : (
                        subtitle
                      )}
                    </View>

                    {showCloseButton && (
                      <TouchableOpacity
                        accessibilityLabel="Close dialog"
                        accessibilityRole="button"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={onClose}
                        style={styles.closeButton}
                      >
                        <Ionicons name="close" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Body Content */}
                <ScrollView
                  bounces={false}
                  contentContainerStyle={[styles.body, contentStyle]}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>

                {/* Footer Actions */}
                {actions && actions.length > 0 ? (
                  <View style={styles.footer}>
                    {actions.map((action, index) => (
                      <Button
                        key={`${action.label}-${index}`}
                        disabled={action.disabled}
                        loading={action.loading}
                        onPress={action.onPress}
                        size="md"
                        style={actions.length > 1 ? styles.actionButtonFlex : undefined}
                        title={action.label}
                        variant={action.variant || (index === actions.length - 1 ? 'primary' : 'secondary')}
                      />
                    ))}
                  </View>
                ) : footer ? (
                  <View style={styles.footer}>{footer}</View>
                ) : null}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backdropFullScreen: {
    padding: 0,
    backgroundColor: colors.bgPrimary,
  },
  backdropBottom: {
    justifyContent: 'flex-end',
    padding: 0,
  },

  // CARD VARIANTS
  card: {
    backgroundColor: colors.bgModal,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
    ...shadows.modal,
  },
  card_center: {
    borderRadius: radius.xl,
  },
  card_fullscreen: {
    flex: 1,
    maxHeight: '100%',
    borderRadius: 0,
    borderWidth: 0,
  },
  card_bottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomWidth: 0,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  titleColumn: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // BODY
  body: {
    padding: spacing.lg,
  },

  // FOOTER
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  actionButtonFlex: {
    flex: 1,
  },
});

export default Modal;
