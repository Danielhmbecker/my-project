import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 80;

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  showHandle?: boolean;
  showCloseButton?: boolean;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: number | string;
  closeOnBackdropPress?: boolean;
  enablePanDownToClose?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  showHandle = true,
  showCloseButton = false,
  headerAction,
  footer,
  maxHeight = SCREEN_HEIGHT * 0.85,
  closeOnBackdropPress = true,
  enablePanDownToClose = true,
  style,
  contentStyle,
  titleStyle,
  testID,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          stiffness: 240,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enablePanDownToClose,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return enablePanDownToClose && gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) {
    return null;
  }

  const hasHeader = Boolean(title || subtitle || showCloseButton || headerAction);

  return (
    <Modal
      hardwareAccelerated
      onRequestClose={handleDismiss}
      statusBarTranslucent
      transparent
      visible={visible}
      testID={testID}
    >
      <View style={styles.overlay}>
        {/* Animated Backdrop */}
        <TouchableWithoutFeedback
          disabled={!closeOnBackdropPress}
          onPress={handleDismiss}
        >
          <Animated.View style={[styles.backdrop, { opacity }]} />
        </TouchableWithoutFeedback>

        {/* Animated Sheet Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
              maxHeight: typeof maxHeight === 'number' ? maxHeight : SCREEN_HEIGHT * 0.85,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
            style,
          ]}
        >
          {/* Drag Handle Area */}
          <View
            {...(enablePanDownToClose ? panResponder.panHandlers : {})}
            style={styles.handleTouchableArea}
          >
            {showHandle && <View style={styles.dragHandle} />}
          </View>

          {/* Header */}
          {hasHeader && (
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
                  <Text numberOfLines={1} style={styles.subtitle}>
                    {subtitle}
                  </Text>
                ) : (
                  subtitle
                )}
              </View>

              <View style={styles.headerActions}>
                {headerAction}
                {showCloseButton && (
                  <TouchableOpacity
                    accessibilityLabel="Close bottom sheet"
                    accessibilityRole="button"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={handleDismiss}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Body */}
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.body, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {/* Optional Footer */}
          {footer && (
            <View style={styles.footer}>
              {footer}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdrop,
  },
  sheetContainer: {
    backgroundColor: colors.bgModal,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomWidth: 0,
    width: '100%',
    ...shadows.bottomSheet,
  },
  handleTouchableArea: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    width: '100%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.lg,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});

export default BottomSheet;
