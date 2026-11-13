import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamilies, fontSizes } from '../../theme';

export interface LineMarker {
  line: number; // 1-based line number
  type: 'error' | 'warning' | 'info';
  message?: string;
}

export interface LineNumbersProps {
  totalLines: number;
  currentLine?: number;
  lineHeight: number;
  markers?: LineMarker[] | Record<number, LineMarker>;
  onMarkerPress?: (marker: LineMarker) => void;
  onLinePress?: (line: number) => void;
  style?: StyleProp<ViewStyle>;
  paddingTop?: number;
  paddingBottom?: number;
}

export const LineNumbers: React.FC<LineNumbersProps> = ({
  totalLines,
  currentLine,
  lineHeight,
  markers = [],
  onMarkerPress,
  onLinePress,
  style,
  paddingTop = 8,
  paddingBottom = 8,
}) => {
  // Normalize markers to a lookup map for fast O(1) access
  const markersMap = useMemo(() => {
    const map = new Map<number, LineMarker>();
    if (Array.isArray(markers)) {
      markers.forEach((m) => {
        if (m && typeof m.line === 'number') {
          map.set(m.line, m);
        }
      });
    } else if (markers && typeof markers === 'object') {
      Object.entries(markers).forEach(([key, val]) => {
        const line = parseInt(key, 10);
        if (!isNaN(line) && val && typeof val === 'object') {
          map.set(line, { ...(val as any), line });
        }
      });
    }
    return map;
  }, [markers]);

  // Determine gutter width dynamically based on total line count
  const gutterWidth = useMemo(() => {
    if (totalLines >= 1000) return 56;
    if (totalLines >= 100) return 46;
    return 38;
  }, [totalLines]);

  const lines = useMemo(() => {
    const count = Math.max(1, totalLines);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [totalLines]);

  return (
    <View
      style={[
        styles.gutter,
        {
          width: gutterWidth,
          paddingTop,
          paddingBottom,
        },
        style,
      ]}
      pointerEvents="box-none"
    >
      {lines.map((lineNum) => {
        const isCurrent = lineNum === currentLine;
        const marker = markersMap.get(lineNum);

        const handlePress = () => {
          if (marker && onMarkerPress) {
            onMarkerPress(marker);
          } else if (onLinePress) {
            onLinePress(lineNum);
          }
        };

        return (
          <TouchableOpacity
            key={`line-${lineNum}`}
            activeOpacity={marker || onLinePress ? 0.6 : 1}
            onPress={handlePress}
            style={[
              styles.lineRow,
              { height: lineHeight },
              isCurrent && styles.activeLineRow,
            ]}
          >
            {/* Marker Indicator (Error / Warning / Info) */}
            <View style={styles.markerContainer}>
              {marker && marker.type === 'error' && (
                <Ionicons
                  name="alert-circle"
                  size={10}
                  color={colors.error}
                  style={styles.markerIcon}
                />
              )}
              {marker && marker.type === 'warning' && (
                <Ionicons
                  name="warning"
                  size={10}
                  color={colors.warning}
                  style={styles.markerIcon}
                />
              )}
              {marker && marker.type === 'info' && (
                <Ionicons
                  name="information-circle"
                  size={10}
                  color={colors.info}
                  style={styles.markerIcon}
                />
              )}
            </View>

            {/* Line Number Text */}
            <Text
              style={[
                styles.lineNumberText,
                isCurrent && styles.lineNumberActive,
                marker?.type === 'error' && styles.lineNumberError,
                marker?.type === 'warning' && styles.lineNumberWarning,
              ]}
              numberOfLines={1}
            >
              {lineNum}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gutter: {
    backgroundColor: '#12151b',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: 'stretch',
    userSelect: 'none',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 6,
    paddingLeft: 2,
  },
  activeLineRow: {
    backgroundColor: 'rgba(56, 139, 253, 0.08)',
  },
  markerContainer: {
    width: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  markerIcon: {
    marginRight: 1,
  },
  lineNumberText: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
  },
  lineNumberActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  lineNumberError: {
    color: colors.error,
    fontWeight: '600',
  },
  lineNumberWarning: {
    color: colors.warning,
    fontWeight: '600',
  },
});

export default LineNumbers;
