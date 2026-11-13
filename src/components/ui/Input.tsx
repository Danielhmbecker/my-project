import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';

export type InputVariant = 'default' | 'code' | 'monospace';

export interface InputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  helperText?: string;
  clearable?: boolean;
  onClear?: () => void;
  secure?: boolean;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIconName?: keyof typeof Ionicons.glyphMap;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  readOnly?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  helperStyle?: StyleProp<TextStyle>;
  onFocus?: TextInputProps['onFocus'];
  onBlur?: TextInputProps['onBlur'];
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  clearable = false,
  onClear,
  secure = false,
  variant = 'default',
  leftIcon,
  rightIcon,
  leftIconName,
  rightIconName,
  disabled = false,
  readOnly = false,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  value,
  onChangeText,
  onFocus,
  onBlur,
  multiline,
  numberOfLines,
  placeholderTextColor = colors.textMuted,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  const isCodeVariant = variant === 'code' || variant === 'monospace';
  const hasValue = typeof value === 'string' && value.length > 0;
  const isActuallySecure = secure && !isSecureVisible;

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Resolve left icon
  const resolvedLeftIcon = leftIcon || (leftIconName ? (
    <Ionicons
      name={leftIconName}
      size={18}
      color={isFocused ? colors.accentPrimary : colors.textSecondary}
    />
  ) : null);

  // Resolve custom right icon if not overridden by secure toggle or clear
  const resolvedRightIcon = rightIcon || (rightIconName ? (
    <Ionicons
      name={rightIconName}
      size={18}
      color={colors.textSecondary}
    />
  ) : null);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, labelStyle]}>{label}</Text>
          {isCodeVariant && (
            <Text style={styles.codeBadge}>code</Text>
          )}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isCodeVariant && styles.inputContainerCode,
          isFocused && styles.focused,
          Boolean(error) && styles.hasError,
          disabled && styles.disabled,
          multiline && styles.multilineContainer,
          style,
        ]}
      >
        {resolvedLeftIcon && (
          <View style={styles.leftIconWrapper}>
            {resolvedLeftIcon}
          </View>
        )}

        <TextInput
          editable={!disabled && !readOnly}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={isActuallySecure}
          style={[
            styles.textInput,
            isCodeVariant && styles.textInputCode,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          {...rest}
        />

        {/* Clearable button */}
        {clearable && hasValue && !disabled && !readOnly && (
          <TouchableOpacity
            accessibilityLabel="Clear input"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={handleClear}
            style={styles.actionIconWrapper}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Secure toggle button */}
        {secure && (
          <TouchableOpacity
            accessibilityLabel={isSecureVisible ? 'Hide text' : 'Show text'}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setIsSecureVisible((prev) => !prev)}
            style={styles.actionIconWrapper}
          >
            <Ionicons
              name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Custom right icon (shown when no clear or secure toggle active) */}
        {!secure && !clearable && resolvedRightIcon && (
          <View style={styles.rightIconWrapper}>
            {resolvedRightIcon}
          </View>
        )}
      </View>

      {/* Error message */}
      {error ? (
        <View style={styles.feedbackRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={[styles.errorText, errorStyle]}>{error}</Text>
        </View>
      ) : helperText ? (
        <View style={styles.feedbackRow}>
          <Text style={[styles.helperText, helperStyle]}>{helperText}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  codeBadge: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.accentCyan,
    backgroundColor: 'rgba(57, 197, 207, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  inputContainerCode: {
    backgroundColor: colors.bgCode,
    borderColor: colors.borderLight,
    borderWidth: 1,
  },
  focused: {
    borderColor: colors.borderFocus,
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  hasError: {
    borderColor: colors.error,
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: colors.bgTertiary,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm + 2,
  },
  textInput: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm + 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  textInputCode: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    color: colors.textCode,
    letterSpacing: 0.2,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  leftIconWrapper: {
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconWrapper: {
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapper: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  errorText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.error,
    fontWeight: fontWeights.medium,
  },
  helperText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
});

export default Input;
