import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Kind, TimeEntry, WORK_TYPES, projectById } from '../data/catalog';
import { COLORS } from '../theme';
import { formatDayHeading, formatHoursMinutes } from '../utils/time';
import { CalendarContent } from './CalendarPicker';

type Props = {
  entry: TimeEntry;
  onSave: (change: { dayMs: number; kind: Kind }) => void;
  onClose: () => void;
};

export function EditEntryModal({ entry, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [dayMs, setDayMs] = useState(entry.dayMs);
  const [kind, setKind] = useState<Kind>(entry.kind);
  const [pickingDate, setPickingDate] = useState(false);
  const project = projectById(entry.projectId);

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {pickingDate ? (
          <CalendarContent
            mode="single"
            selectedDayMs={dayMs}
            onSelect={(pickedMs) => {
              setDayMs(pickedMs);
              setPickingDate(false);
            }}
            onBack={() => setPickingDate(false)}
          />
        ) : (
          <>
            <View style={styles.header}>
              <Pressable onPress={onClose} hitSlop={8} style={styles.headerButton}>
                <Ionicons name="close" size={22} color={COLORS.ink} />
              </Pressable>
              <Text style={styles.headerTitle}>Edit entry</Text>
              <Pressable onPress={() => onSave({ dayMs, kind })} style={styles.saveButton}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>

            <View style={styles.body}>
              <View style={styles.summary}>
                <Text style={styles.summaryProject}>{project.name}</Text>
                <Text style={styles.summaryDuration}>{formatHoursMinutes(entry.durationMs)}</Text>
              </View>

              <Text style={styles.label}>Date</Text>
              <Pressable onPress={() => setPickingDate(true)} style={styles.selectBox}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.muted} />
                <Text style={styles.selectValue}>{formatDayHeading(dayMs)}</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
              </Pressable>

              <Text style={styles.label}>Work type</Text>
              <View style={styles.options}>
                {WORK_TYPES.map((t) => {
                  const selected = t.kind === kind;
                  return (
                    <Pressable
                      key={t.kind}
                      onPress={() => setKind(t.kind)}
                      style={[styles.option, selected && styles.optionSelected]}
                    >
                      <View style={[styles.typeAvatar, { backgroundColor: t.color }]}>
                        <Text style={styles.typeAvatarText}>{t.label.charAt(0)}</Text>
                      </View>
                      <Text style={styles.optionLabel}>{t.label}</Text>
                      {selected && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E6EAF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 23,
    paddingHorizontal: 20,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryProject: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDuration: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  label: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E6EAF3',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  selectValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  options: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E6EAF3',
    padding: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  optionSelected: {
    backgroundColor: '#F0F4FE',
  },
  typeAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  optionLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
});
