import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getAllTags,
  getMyUserInterests,
  setMyUserInterests,
  type VibeTag,
} from '@/services/api';

export default function EditInterests() {
  const [tags, setTags] = useState<VibeTag[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allTags, myIds] = await Promise.all([getAllTags(), getMyUserInterests()]);
        if (cancelled) return;
        setTags(allTags);
        setSelected(new Set(myIds));
      } catch {
        // silently fail — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await setMyUserInterests(Array.from(selected));
      router.back();
    } catch {
      // keep UI open so user can retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select your interests</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#333" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.tagsContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.tagsWrap}>
              {tags.map(tag => {
                const active = selected.has(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.tag, active && styles.tagActive]}
                    onPress={() => toggle(tag.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1AD' },
  content: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF1AD',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: '#111' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#111' },
  saveBtn: {
    backgroundColor: '#2E4A7A', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  saveBtnDisabled: { backgroundColor: '#bbb' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  tagsContainer: { padding: 20 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: '#e0e8f4',
    borderWidth: 1.5, borderColor: '#c5d5ea',
  },
  tagActive: {
    backgroundColor: '#2E4A7A',
    borderColor: '#2E4A7A',
  },
  tagText: { fontSize: 14, fontWeight: '600', color: '#2E4A7A' },
  tagTextActive: { color: '#fff' },
});
